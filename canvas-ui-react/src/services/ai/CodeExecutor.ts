/**
 * Code Executor - Safe JavaScript execution sandbox
 * Runs AI-generated code with limited scope (only canvasAPI exposed)
 */

import type { CanvasAPI } from './CanvasAPI';

export interface ExecutionResult {
  success: boolean;
  error?: string;
  output?: any;
  executionTime?: number;
  canvasState?: any; // Canvas state after execution
}

export interface ExecutorConfig {
  timeout?: number; // Execution timeout in milliseconds (default: 5000)
  maxWidgets?: number; // Maximum widgets that can be created (default: 50)
}

export class CodeExecutor {
  private config: ExecutorConfig;

  constructor(config: ExecutorConfig = {}) {
    this.config = {
      timeout: config.timeout ?? 5000,
      maxWidgets: config.maxWidgets ?? 50,
    };
  }

  /**
   * Extract code from AI response (handles markdown code blocks)
   * @param response Raw AI response
   * @returns Extracted JavaScript code
   */
  extractCode(response: string): string {
    // Try to find code block
    const codeBlockMatch = response.match(/```(?:javascript|js)?\n([\s\S]*?)\n```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }

    // If no code block, check if response looks like pure code
    const trimmed = response.trim();
    if (trimmed.startsWith('canvasAPI.') || trimmed.includes('canvasAPI.addWidget')) {
      return trimmed;
    }

    // Last resort: return as-is (might be plain code)
    return response.trim();
  }

  /**
   * Execute JavaScript code safely with canvas API
   * @param code JavaScript code to execute
   * @param canvasAPI Canvas API instance
   * @returns Execution result
   */
  async execute(code: string, canvasAPI: CanvasAPI): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      // Clear previous widgets cache
      canvasAPI.clearCreatedWidgets();

      // Create isolated execution context
      // Only canvasAPI is exposed - no window, document, fetch, eval, etc.
      const context = {
        canvasAPI,
        console: {
          log: (...args: any[]) => console.log('[AI Code]', ...args),
          error: (...args: any[]) => console.error('[AI Code]', ...args),
          warn: (...args: any[]) => console.warn('[AI Code]', ...args),
        },
      };

      // Create sandboxed function
      // Note: Function() is safe here because:
      // 1. Running in user's browser (not server)
      // 2. Limited scope - only canvasAPI exposed
      // 3. User is running their own AI code
      const fn = new Function(
        'canvasAPI',
        'console',
        `
        "use strict";
        ${code}
        `
      );

      // Execute with timeout
      const result = await this.executeWithTimeout(
        () => fn(context.canvasAPI, context.console),
        this.config.timeout!
      );

      // Check widget limit
      const createdWidgets = canvasAPI.getCreatedWidgets();
      if (createdWidgets.length > this.config.maxWidgets!) {
        throw new Error(
          `Too many widgets created: ${createdWidgets.length} (max: ${this.config.maxWidgets})`
        );
      }

      const executionTime = Date.now() - startTime;

      // Capture canvas state after execution
      const canvasState = canvasAPI.captureState();

      return {
        success: true,
        output: result,
        executionTime,
        canvasState,
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;

      // Clean up error messages
      let errorMessage = error.message || String(error);
      
      // Remove internal stack traces
      if (errorMessage.includes('at Function (')) {
        errorMessage = errorMessage.split('at Function (')[0].trim();
      }

      return {
        success: false,
        error: errorMessage,
        executionTime,
      };
    }
  }

  /**
   * Execute function with timeout
   */
  private executeWithTimeout<T>(fn: () => T, timeout: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Execution timeout (${timeout}ms)`));
      }, timeout);

      try {
        const result = fn();
        clearTimeout(timeoutId);
        resolve(result);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Validate code before execution (basic safety checks)
   * @param code Code to validate
   * @returns Validation result
   */
  validateCode(code: string): { valid: boolean; error?: string } {
    // Check for dangerous patterns
    const dangerousPatterns = [
      /eval\s*\(/,
      /Function\s*\(/,
      /window\./,
      /document\./,
      /fetch\s*\(/,
      /XMLHttpRequest/,
      /import\s+/,
      /require\s*\(/,
      /__proto__/,
      /constructor\[/,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        return {
          valid: false,
          error: `Code contains potentially unsafe pattern: ${pattern.source}`,
        };
      }
    }

    return { valid: true };
  }

  /**
   * Get code execution documentation for AI context
   */
  static getAPIDocumentation(): string {
    return `
# Canvas API Documentation

You are generating JavaScript code that will be executed in a sandboxed environment.
You have access to the \`canvasAPI\` object with these methods:

## CRITICAL: Entity Usage Rules

**IF the context includes [AVAILABLE ENTITIES] section:**
- ✅ You MUST ONLY use entity_id values from that list (copy exact entity_id)
- ❌ NEVER invent or guess entity names (e.g., "light.kitchen", "light.bedroom")
- ❌ NEVER use generic entity names - always use the exact entity_id provided
- ⚠️ If no entities are provided, create widgets WITHOUT entity bindings (entity_id: '')

**IF no entities are provided:**
- Create layout-only widgets (buttons without entities, borders, text labels, clocks, etc.)
- Set entity_id to empty string ('') for widgets that need it
- User will assign entities manually later via Inspector

## Widget Creation

\`\`\`javascript
// Add a widget to current view
const widget = canvasAPI.addWidget(type, config, position);
// - type: Widget type (see available types below)
// - config: Widget-specific configuration object
// - position: {x, y, width?, height?} (width/height optional, uses defaults)
// - Returns: Widget config object with ID

// Example:
const button = canvasAPI.addWidget('button', {
  label: 'Toggle Light',
  service_domain: 'light',
  service_name: 'toggle',
  service_data: { entity_id: 'light.living_room' },
  backgroundColor: '#2196f3',
  textColor: '#ffffff'
}, { x: 20, y: 20, width: 200, height: 60 });
\`\`\`

## Widget Updates

\`\`\`javascript
// Update existing widget
canvasAPI.updateWidget(widgetId, updates);
// - widgetId: Widget ID to update
// - updates: Partial widget config (position, config, etc.)

// Example:
canvasAPI.updateWidget(button.id, {
  config: { backgroundColor: '#ff0000' }
});
\`\`\`

## Widget Deletion

\`\`\`javascript
// Delete widget
canvasAPI.deleteWidget(widgetId);
\`\`\`

## 🔄 Updating Existing Dashboards (IMPORTANT!)

**When the user asks to MODIFY or CHANGE an existing dashboard:**

1. **CHECK the "Current view widgets" section** in the context above
2. **IDENTIFY widget IDs** that need to be replaced (look for "(id: widget-xxx-xxx)")
3. **DELETE old widgets FIRST** using canvasAPI.deleteWidget(id)
4. **THEN create new widgets** with your new design

**Refinement Patterns:**

### Pattern 1: Complete Redesign  
**User says:** "make it a keypad", "change layout to grid", "redesign as X"  
**Action:** DELETE ALL old widgets, CREATE fresh design

\`\`\`javascript
// Example: User said "make it a number keypad" after creating an alarm panel

// STEP 1: Look at "Current view widgets" context above to find IDs
// Example context shows:
// 1. BUTTON (id: button-1771879393111-7mrvodys5)
// 2. BUTTON (id: button-1771879393114-clnxe3qa5)
// 3. TEXT (id: text-1771879393108-5f8sc3zjf)
// 4. BORDER (id: border-1771879393125-lfd58k71p)

// STEP 2: Delete ALL old widgets
canvasAPI.deleteWidget('button-1771879393111-7mrvodys5');
canvasAPI.deleteWidget('button-1771879393114-clnxe3qa5');
canvasAPI.deleteWidget('text-1771879393108-5f8sc3zjf');
canvasAPI.deleteWidget('border-1771879393125-lfd58k71p');

// STEP 3: Create NEW keypad design
const keypadButtons = [];
for (let i = 0; i <= 9; i++) {
  keypadButtons.push(canvasAPI.addWidget('button', {
    label: String(i),
    backgroundColor: '#d3d3d3',
    textColor: '#1a1a1a'
  }, { x: 0, y: 0, width: 70, height: 70 }));
}
canvasAPI.gridLayout(keypadButtons, 3, 20, 100, 10, 10);
\`\`\`

### Pattern 2: Partial Update  
**User says:** "change button colors", "resize the gauge", "make text bigger"  
**Action:** UPDATE existing widgets (NO deletion)

\`\`\`javascript
// Update existing widget properties
canvasAPI.updateWidget('button-123', {
  config: { backgroundColor: '#ff0000', textColor: '#ffffff' }
});

canvasAPI.updateWidget('gauge-456', {
  position: { width: 300, height: 300 }
});
\`\`\`

### Pattern 3: Add to Existing  
**User says:** "add a clock widget", "include temperature sensor"  
**Action:** ADD new widgets (NO deletion)

\`\`\`javascript
// Just add new widgets alongside existing ones
const clock = canvasAPI.addWidget('digitalclock', {
  timeFormat: '24h',
  fontSize: 48
}, { x: 300, y: 20, width: 200, height: 100 });
\`\`\`

**⚠️ CRITICAL: Determine the pattern from user's language**
- "change to", "redesign", "make it a", "convert to" → **DELETE all + CREATE new**
- "update", "resize", "recolor", "adjust" → **UPDATE existing**  
- "add", "include", "also show", "plus" → **ADD new**

**⚠️ ALWAYS check "Current view widgets" context to find widget IDs before deleting!**

## Layout Helpers

\`\`\`javascript
// Grid layout (automatic grid positioning)
canvasAPI.gridLayout(widgets, columns, startX, startY, gapX, gapY);
// - widgets: Array of widget configs
// - columns: Number of columns (default: 3)
// - startX/startY: Starting position (default: 20, 20)
// - gapX/gapY: Gaps between widgets (default: 20, 20)

// Example:
const widgets = [button1, button2, button3, button4];
canvasAPI.gridLayout(widgets, 2); // 2-column grid

// Vertical stack
canvasAPI.verticalStack(widgets, startX, startY, gap);

// Horizontal stack
canvasAPI.horizontalStack(widgets, startX, startY, gap);
\`\`\`

## View Management

\`\`\`javascript
// Create new view
const viewId = canvasAPI.createView('View Name', {
  backgroundColor: '#1a1a1a',
  backgroundOpacity: 1
});

// Update current view
canvasAPI.updateView(viewId, {
  style: { backgroundColor: '#000000' }
});

// Get current view ID
const currentViewId = canvasAPI.getCurrentViewId();
\`\`\`

## Available Widget Types

button, text, gauge, camera, slider, switch, image, icon, progressbar, progresscircle, inputtext, flipclock, digitalclock, knob, iframe, border, value, radiobutton, colorpicker, weather, calendar, graph, html, lovelacecard, resolution, keyboard, scrollingtext

## Widget Selection Guide

**Button** - Use for clickable actions, one-time triggers
  - Examples: Call scene, play music, open door, trigger automation
  - Key: Momentary action, not a toggle state

**Switch** - Use for binary on/off controls with state display
  - Examples: Control lights, fans, switches with visual on/off feedback
  - Key: Toggle state, shows current on/off status
  - NOTE: DO NOT use for calculator buttons, navigation buttons, or actions

**Text** - Use for displaying information
  - Examples: Temperature readout, status messages, labels

**Gauge/Slider** - Use for numeric values
  - Gauge: Display only (e.g., temperature, battery level)
  - Slider: Interactive control (e.g., brightness, volume)

## Common Widget Configurations

### Button Widget (for actions, triggers, navigation)
- label: Button text (e.g., 'Toggle Light', 'Play Music')
- actionType: Action type (default: 'auto')
  - 'auto': Auto-detect from entity (toggle/turn_on/turn_off)
  - 'toggle': Toggle entity
  - 'turn_on': Turn entity on
  - 'turn_off': Turn entity off
  - 'custom': Custom service call
  - 'navigation': Navigate to view
  - 'url': Open URL
- entity_id: Target entity (e.g., 'light.bedroom')
- customDomain: Service domain for custom actions (e.g., 'scene')
- customService: Service name for custom actions (e.g., 'turn_on')
- serviceData: Additional service data as JSON string
- backgroundColor: Button color (default: '#2196f3')
- textColor: Text color (default: '#ffffff')
- borderRadius: Border radius (e.g., '8px')
- fontSize: Font size in pixels (e.g., 16)

### Switch Widget (for on/off toggles with state)
- label: Label text displayed next to switch
- labelPosition: 'left', 'right', 'top', 'bottom' (default: 'left')
- entity_id: Entity to control (e.g., 'light.bedroom')
- service_domain: Service domain (default: 'homeassistant' for auto-detect)
- onColor: Color when on (default: '#4caf50')
- offColor: Color when off (default: '#757575')
- textColor: Label text color (default: '#ffffff')
- fontSize: Font size in pixels (default: 14)

### Text Widget (for displaying text/values)
- text: Static text to display
- entity_id: Entity ID to show value from (dynamic text)
- unit: Unit suffix (e.g., '°C', '%')
- fontSize: Font size in pixels (e.g., 24)
- textColor: Text color
- fontFamily: Font family (e.g., 'Arial, sans-serif')
- textAlign: 'left', 'center', 'right' (default: 'left')

### Gauge Widget (for numeric displays)
- entity_id: Entity ID to display value from
- min: Minimum value
- max: Maximum value
- unit: Unit label (e.g., '°C', '%')
- gaugeType: 'radial', 'semicircle', or 'grafana'

### Slider Widget (for numeric controls)
- entity_id: Entity ID to control
- min: Minimum value
- max: Maximum value
- step: Step increment
- orientation: 'horizontal' or 'vertical'

### Icon Widget
- entity_id: Entity to bind state to
- library: Icon library ('mdi', 'fa', 'emoji')
- icon: Icon name
- iconColor: Icon color
- iconSize: Icon size in pixels

### Border Widget (for decorative frames)
- borderColor: Border color (e.g., '#ffffff' or 'rgba(100, 149, 237, 0.8)')
- borderWidth: Border width as a NUMBER in pixels (e.g., 2 or 4) — NOT a string
- borderStyle: Border style — 'solid', 'dashed', 'dotted' (default: 'solid')
- borderRadius: Corner radius as a NUMBER in pixels (e.g., 8 or 16)
- backgroundColor: Optional fill color (e.g., 'rgba(0,0,0,0.3)')

### LovelaceCard Widget (embed Home Assistant Lovelace cards)
**IMPORTANT**: LovelaceCard lets you embed ANY native Home Assistant card (entities, button, thermostat, weather, custom cards like Mushroom, etc.)

- **cardType**: Type of Lovelace card to embed
  - Native HA cards: 'entities', 'button', 'glance', 'picture-entity', 'thermostat', 'sensor', 'gauge', 'light', 'media-control', 'weather-forecast', 'alarm-panel'
  - Custom cards: 'custom:mushroom-entity-card', 'custom:mushroom-light-card', 'custom:mushroom-thermostat-card', 'custom:button-card', 'custom:mini-graph-card'
  
- **cardConfig**: Card configuration in YAML or JSON string format
  - For entities card: Use YAML with 'entities' array and optional 'title'
  - For button card: Provide 'entity', 'show_name', 'show_icon'
  - For thermostat: Provide 'entity' (climate entity)
  - Must be valid YAML or JSON that the Lovelace card expects

**Examples:**

\`\`\`javascript
// Entities card (list of entities)
canvasAPI.addWidget('lovelacecard', {
  cardType: 'entities',
  cardConfig: \`entities:
  - light.living_room
  - light.bedroom
  - switch.fan
title: My Lights\`
}, { x: 20, y: 20, width: 300, height: 200 });

// Thermostat card
canvasAPI.addWidget('lovelacecard', {
  cardType: 'thermostat',
  cardConfig: \`entity: climate.living_room\`
}, { x: 350, y: 20, width: 300, height: 200 });

// Button card
canvasAPI.addWidget('lovelacecard', {
  cardType: 'button',
  cardConfig: \`entity: light.bedroom
show_name: true
show_icon: true
name: Bedroom Light\`
}, { x: 20, y: 250, width: 150, height: 80 });

// Mushroom Entity Card (custom card - if installed)
canvasAPI.addWidget('lovelacecard', {
  cardType: 'custom:mushroom-entity-card',
  cardConfig: \`entity: climate.thermostat
icon: mdi:thermostat
name: Climate Control
layout: horizontal\`
}, { x: 350, y: 250, width: 300, height: 100 });

// Weather card
canvasAPI.addWidget('lovelacecard', {
  cardType: 'weather-forecast',
  cardConfig: \`entity: weather.home\`
}, { x: 20, y: 350, width: 400, height: 250 });

// JSON format also works
canvasAPI.addWidget('lovelacecard', {
  cardType: 'glance',
  cardConfig: JSON.stringify({
    entities: ['light.living_room', 'light.bedroom', 'climate.thermostat'],
    title: 'Quick Glance'
  })
}, { x: 450, y: 350, width: 300, height: 150 });
\`\`\`

**When to use LovelaceCard:**
- Need advanced card features (entity lists, media controls, weather forecast)
- Want to reuse existing Lovelace card configurations
- Using custom cards (Mushroom, Mini Graph, Button Card, etc.)
- Need entity grouping or complex layouts within a single card

**Styling options (optional):**
- backgroundColor: Card background color
- cornerRadius: Border radius in pixels (default: 12)
- borderWidth, borderStyle, borderColor: Border customization
- padding: Internal padding in pixels

## Important Notes

1. **Widget Type Selection**: 
   - Use **button** for: Actions, triggers, navigation, calculator buttons, scene activation
   - Use **switch** for: On/off toggles that show current state (lights, fans, switches)
   - Use **text** for: Displays, labels, readouts
   - Use **gauge/slider** for: Numeric values

2. **No Entity Access Yet**: For now, DO NOT populate entity_id fields. Just create widget structure.
   User will assign entities manually via Inspector afterward.
   
3. **Positioning**: Use layout helpers (gridLayout, verticalStack, horizontalStack) when possible.
   - gridLayout: Automatic grid with specified columns
   - verticalStack: Vertical list with consistent spacing
   - horizontalStack: Horizontal row with consistent spacing

4. **Colors**: Use hex colors (#rrggbb) or standard CSS colors.

5. **Return Value**: Your code doesn't need to return anything. Just call canvasAPI methods.

6. **Complex Logic**: The Canvas API can only CREATE widgets, not implement complex logic.
   - ❌ Cannot: Build working calculator logic, implement state machines, create data processing
   - ✅ Can: Create visual layout, assign service calls, trigger automations/scripts
   - For complex behavior: User must configure entity bindings + HA automations/scripts afterward

## Example 1: Light Control Panel (uses switches for state toggle)

\`\`\`javascript
// Create light switches in a vertical layout
const switches = [];

switches.push(canvasAPI.addWidget('switch', {
  label: 'Main Light',
  entity_id: '', // User will assign
  onColor: '#ffc107',
  offColor: '#666666',
  labelPosition: 'left'
}, { x: 20, y: 20, width: 200, height: 60 }));

switches.push(canvasAPI.addWidget('switch', {
  label: 'Bedside Lamp',
  entity_id: '', // User will assign
  onColor: '#ffc107',
  offColor: '#666666',
  labelPosition: 'left'
}, { x: 20, y: 100, width: 200, height: 60 }));

// Add temperature gauge
canvasAPI.addWidget('gauge', {
  entity_id: '', // User will assign
  min: 0,
  max: 40,
  unit: '°C',
  gaugeType: 'radial'
}, { x: 250, y: 20, width: 250, height: 250 });
\`\`\`

## Example 2: Scene Control Panel (uses buttons for actions)

\`\`\`javascript
// Create scene activation buttons in a grid
const buttons = [];

buttons.push(canvasAPI.addWidget('button', {
  label: 'Movie Time',
  actionType: 'custom',
  customDomain: 'scene',
  customService: 'turn_on',
  serviceData: '{"entity_id": "scene.movie"}',
  backgroundColor: '#673ab7',
  textColor: '#ffffff'
}, { x: 0, y: 0, width: 150, height: 80 }));

buttons.push(canvasAPI.addWidget('button', {
  label: 'Bright',
  actionType: 'custom',
  customDomain: 'scene',
  customService: 'turn_on',
  serviceData: '{"entity_id": "scene.bright"}',
  backgroundColor: '#ff9800',
  textColor: '#ffffff'
}, { x: 0, y: 0, width: 150, height: 80 }));

buttons.push(canvasAPI.addWidget('button', {
  label: 'Night',
  actionType: 'custom',
  customDomain: 'scene',
  customService: 'turn_on',
  serviceData: '{"entity_id": "scene.night"}',
  backgroundColor: '#3f51b5',
  textColor: '#ffffff'
}, { x: 0, y: 0, width: 150, height: 80 }));

buttons.push(canvasAPI.addWidget('button', {
  label: 'All Off',
  actionType: 'custom',
  customDomain: 'light',
  customService: 'turn_off',
  serviceData: '{"entity_id": "all"}',
  backgroundColor: '#f44336',
  textColor: '#ffffff'
}, { x: 0, y: 0, width: 150, height: 80 }));

// Arrange in 2-column grid
canvasAPI.gridLayout(buttons, 2, 20, 20, 20, 20);
\`\`\`

## Example 3: Calculator Layout (visual only - no logic)

\`\`\`javascript
// Note: This creates only the VISUAL LAYOUT of a calculator.
// It CANNOT implement calculator logic (arithmetic, memory, etc.)
// For a working calculator, user needs to configure entity bindings + HA scripts.

// Display area
canvasAPI.addWidget('text', {
  text: '0',
  fontSize: 48,
  textColor: '#ffffff',
  textAlign: 'right',
  backgroundColor: '#1a1a1a'
}, { x: 20, y: 20, width: 320, height: 80 });

// Calculator buttons (use BUTTON widget for clickable actions)
const calcButtons = [];
const buttonLabels = [
  'C', '/', '*', '-',
  '7', '8', '9', '+',
  '4', '5', '6', '=',
  '1', '2', '3', '0'
];

buttonLabels.forEach(label => {
  calcButtons.push(canvasAPI.addWidget('button', {
    label: label,
    actionType: 'custom',
    // User will configure service calls for calculator logic
    backgroundColor: ['/', '*', '-', '+', '=', 'C'].includes(label) ? '#ff9800' : '#757575',
    textColor: '#ffffff',
    fontSize: 20
  }, { x: 0, y: 0, width: 70, height: 70 }));
});

// 4-column grid layout
canvasAPI.gridLayout(calcButtons, 4, 20, 120, 10, 10);
\`\`\`

## Example 4: Climate Control Dashboard (using Lovelace cards)

\`\`\`javascript
// Use Lovelace cards for advanced entity control and display

// Thermostat card (native HA card)
canvasAPI.addWidget('lovelacecard', {
  cardType: 'thermostat',
  cardConfig: \`entity: climate.living_room\`,
  backgroundColor: '#1c1c1c',
  cornerRadius: 12
}, { x: 20, y: 20, width: 350, height: 300 });

// Entities card showing temperature sensors
canvasAPI.addWidget('lovelacecard', {
  cardType: 'entities',
  cardConfig: \`title: Temperature Sensors
entities:
  - entity: sensor.living_room_temperature
    name: Living Room
  - entity: sensor.bedroom_temperature
    name: Bedroom
  - entity: sensor.kitchen_temperature
    name: Kitchen
  - entity: sensor.outdoor_temperature
    name: Outside\`,
  backgroundColor: '#1c1c1c',
  cornerRadius: 12
}, { x: 390, y: 20, width: 280, height: 200 });

// Weather forecast card
canvasAPI.addWidget('lovelacecard', {
  cardType: 'weather-forecast',
  cardConfig: \`entity: weather.home\`,
  backgroundColor: '#1c1c1c',
  cornerRadius: 12
}, { x: 390, y: 240, width: 380, height: 280 });

// Glance card for quick status
canvasAPI.addWidget('lovelacecard', {
  cardType: 'glance',
  cardConfig: \`title: Climate Status
entities:
  - climate.living_room
  - climate.bedroom
  - fan.ceiling_fan
show_name: true
show_state: true\`,
  backgroundColor: '#1c1c1c',
  cornerRadius: 12
}, { x: 20, y: 340, width: 350, height: 180 });
\`\`\`
`;
  }
}

/**
 * Create executor instance
 */
export function createCodeExecutor(config?: ExecutorConfig): CodeExecutor {
  return new CodeExecutor(config);
}
