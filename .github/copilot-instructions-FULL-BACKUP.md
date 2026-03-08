# Canvas UI - Home Assistant Dashboard Editor

**Project Type:** Home Assistant Custom Integration (Python backend + Vanilla JS frontend)

A dual-mode drag-and-drop dashboard system inspired by ioBroker VIS, optimized for Home Assistant.

**Status:** ✅ Phases 5-9 COMPLETE (~12,500 lines across 38+ files)  
**Latest:** ✅ Entity Picker & Binding Editor dialogs implemented (Jan 2026)

- **Phase 13: Universal Widget Visibility System** (Jan 2026)
  - VisibilityConditionDialog (~950 lines) with dual-mode interface
  - BaseWidget visibility infrastructure (5 methods)
  - Inspector integration with property prefix handling
  - All 5 widgets support conditional visibility
  - Binding enhancements (contains, startsWith, endsWith)
  - Post-deployment bug fixes (import path, dialog routing)

## 📘 CRITICAL REFERENCE DOCUMENTS

**ALWAYS consult BUILD_FOUNDATION.md for:**

- Complete dialog/popup design system specifications
- Inspector integration patterns
- Property persistence workflows
- Focus loss prevention patterns
- Color palette & spacing standards
- All implemented feature patterns

**When implementing new features:**

1. ✅ Read BUILD_FOUNDATION.md dialog section first
2. ✅ Follow established color palette (`#03a9f4` primary, `#1e1e1e` dark bg)
3. ✅ Use standard spacing (8px gaps, 16px padding, 4px border-radius)
4. ✅ Add ESC key handlers and auto-focus
5. ✅ Use `blur` events (NOT `input`) for text fields
6. ✅ Implement proper cleanup in `close()` method
7. ✅ Follow callback pattern for dialog results

**When modifying inspector properties:**

- Check existing entity picker pattern (`.../` button)
- Check existing binding editor pattern (`{}` button)
- Use container + input + button layout
- Prevent focus loss with blur events only

## Architecture Overview

### Three-Mode System

Canvas UI operates in three distinct modes:

1. **Edit Mode** (`?edit=true`)
   - Full editor with toolbar, inspector, drag/drop, undo/redo
   - All widgets are draggable, resizable, and editable
   - Inspector panel visible on right (320px wide)
   - Toolbar visible at top with widget library, alignment tools, save status
   - Grid and snap features enabled
   - Keyboard shortcuts active

2. **View Mode** (default)
   - Runtime viewer with toolbar for navigation
   - Widgets display entity states but are not editable
   - Toolbar visible at top (view switching, edit mode toggle)
   - No inspector, no drag/drop, no resize handles
   - 70% less code loaded (no editor systems)
   - Read-only dashboard display

3. **Kiosk Mode** (`?kiosk=viewname`)
   - Full-screen view-only mode
   - NO toolbar, NO navigation UI
   - Specified view displayed without any chrome
   - Designed for wall-mounted tablets, kiosks, dedicated displays
   - Maximum screen real estate for dashboard content
   - Auto-loads specified view by name from URL parameter

### Toolbar Visibility

**CRITICAL**: Toolbar is visible in BOTH edit and view modes, but NOT in kiosk mode:

- ✅ Edit mode: Full toolbar (widgets, tools, alignment, save, mode toggle)
- ✅ View mode: Minimal toolbar (view navigation, mode toggle to enter edit)
- ❌ Kiosk mode: No toolbar (full-screen content only)

Pattern from ioBroker VIS v1/v2:

```javascript
// Toolbar visibility logic
const showToolbar = !kioskMode; // Hide only in kiosk
const editToolsVisible = editMode; // Edit tools only in edit mode
const viewNavVisible = !kioskMode; // View nav visible unless kiosk
```

### Core System Boundaries

Canvas UI uses a **modular system architecture** where each major feature is isolated:

- **Core Systems** (`www/canvas-ui/core/`): Connection, EntityManager, StateManager, WidgetRegistry, CanvasRenderer
- **Editor Systems** (`www/canvas-ui/editor/`): Only loaded in edit mode - Toolbar (edit tools), WidgetFactory, EditorCore
- **Inspector** (`www/canvas-ui/inspector/`): Only exists in edit mode - property editing, validation
- **Specialized Systems**: Alignment, Grid, Selection, Undo, Save, Views - each in own directory
- **Toolbar**: Conditionally rendered based on mode - full in edit, minimal in view, hidden in kiosk

**Critical**: Inspector, EditorCore, and edit-mode toolbar features are **conditionally initialized** only when `isEditMode === true`. Toolbar container exists in all modes except kiosk, but edit-specific tools are mode-dependent.

**Mode Detection Pattern**:

```javascript
const urlParams = new URLSearchParams(window.location.search);
const editMode = urlParams.get("edit") === "true";
const kioskViewName = urlParams.get("kiosk"); // e.g., ?kiosk=main
const kioskMode = kioskViewName !== null;

// Initialization logic
if (!kioskMode) {
  initializeToolbar(); // Toolbar in edit and view modes
}
if (editMode) {
  initializeEditorSystems(); // Inspector, alignment, etc.
}
if (kioskMode) {
  loadViewFullscreen(kioskViewName); // Direct view load
}
```

### State Management Pattern

Simple reactive system (inspired by Can.js, NOT React/Redux):

```javascript
// Subscribe to entity changes
canvasState.subscribe(entityId, (newState, oldState) => {
  widget.onStateUpdate(newState);
});

// Trigger updates
canvasState.set(entityId, state); // Auto-notifies all subscribers
```

### Widget System

Widgets extend `BaseWidget` class with state-based rendering:

- **Location**: `www/canvas-ui/widgets/basic/` for core widgets
- **Registration**: Auto-registered via `WidgetRegistry.loadWidget(type)`
- **Manifest-driven**: Widget schemas define inspector properties as strings (VIS-style)
- **Example**: `"fontSize[14]/slider,8,64,1/Font Size (px)"` generates slider field automatically

### Widget Registry Access Pattern (CRITICAL)

**ALWAYS use centralized registry methods for widget metadata:**

```javascript
// ✅ CORRECT - Centralized registry methods
const icon = widgetRegistry.getIcon(type); // Returns "mdi:button-cursor"
const name = widgetRegistry.getName(type); // Returns "Button"
const metadata = widgetRegistry.getMetadata(type); // Returns full metadata object

// ❌ WRONG - Direct class access (inconsistent, error-prone)
const widgetClass = widgetRegistry.get(type);
const metadata = widgetClass.getMetadata();
const icon = metadata.icon;
```

**Why This Matters:**

- ✅ **Guaranteed Consistency**: All UI components (popup, inspector, etc.) get identical icons
- ✅ **Single Source of Truth**: Icon defined once in widget JS file, used everywhere
- ✅ **Null Safety**: Registry methods provide fallback values ("mdi:cog" for icons)
- ✅ **Future-Proof**: New UI features automatically use correct icons
- ✅ **Simpler Code**: No need to check if class/method exists

**Async Loading Requirement:**

Widgets must be loaded before accessing metadata:

```javascript
// ✅ CORRECT - Load first, then access
async function getWidgetInfo(type) {
  await widgetRegistry.loadWidget(type);
  const icon = widgetRegistry.getIcon(type); // Now guaranteed to exist
  return icon;
}

// ❌ WRONG - Access before loading (may return fallback)
function getWidgetInfo(type) {
  const icon = widgetRegistry.getIcon(type); // Widget may not be loaded yet
  return icon;
}
```

**Common Usage Patterns:**

```javascript
// Inspector widgets tab
async renderWidgetsTab(widgets) {
  // 1. Load all widget types first
  const types = [...new Set(widgets.map(w => w.type))];
  await Promise.all(types.map(type => widgetRegistry.loadWidget(type)));

  // 2. Access icons safely
  widgets.forEach(widget => {
    const icon = widgetRegistry.getIcon(widget.type);
    const name = widgetRegistry.getName(widget.type);
    // Render with icon...
  });
}

// Widget library popup
async getWidgetLibrary() {
  const widgetTypes = ["text", "button", "image", "switch", "value"];

  // 1. Load all widgets
  await Promise.all(widgetTypes.map(type => widgetRegistry.loadWidget(type)));

  // 2. Get metadata
  return widgetTypes.map(type => ({
    type: type,
    name: widgetRegistry.getName(type),
    icon: widgetRegistry.getIcon(type),
    category: widgetRegistry.getMetadata(type)?.category || "basic"
  }));
}
```

**Icon Format Conversion:**

```javascript
// Widget metadata stores with colon separator
icon: "mdi:button-cursor";

// Convert to MDI font class for rendering
const iconClass = iconName.replace("mdi:", "mdi-");
// Result: "mdi-button-cursor"

// Render as MDI font icon (NOT SVG)
<i class="mdi mdi-button-cursor" style="font-size: 18px; color: #03a9f4;"></i>;
```

## Development Workflows

### Deployment to Home Assistant

```bash
# Deploy frontend changes (most common)
sshpass -p 'AWpoP6Rx@wQ7jK' scp www/canvas-ui/FILE.js root@192.168.1.103:/config/www/canvas-ui/

# Deploy entire frontend
sshpass -p 'AWpoP6Rx@wQ7jK' scp -r www/canvas-ui/* root@192.168.1.103:/config/www/canvas-ui/

# Deploy backend (requires HA restart)
sshpass -p 'AWpoP6Rx@wQ7jK' scp -r custom_components/canvas_ui/* root@192.168.1.103:/config/custom_components/canvas_ui/
sshpass -p 'AWpoP6Rx@wQ7jK' ssh root@192.168.1.103 "ha core restart"
```

**After deployment**: Hard refresh browser (Ctrl+Shift+R) to clear cache.

### Testing Pattern

- **Local testing**: Open `test.html`, `test-core.html`, `test-inspector.html` in browser
- **HA testing**:
  - View mode: `/canvas-ui` (toolbar visible, read-only)
  - Edit mode: `/canvas-ui?edit=true` (full editor)
  - Kiosk mode: `/canvas-ui?kiosk=main` (full-screen, no toolbar)
- **Console debugging**: All systems log with prefixes: `[Connection]`, `[WidgetFactory]`, `[Inspector]`
- **Mode testing**: Always test toolbar visibility in all three modes

## Project-Specific Conventions

### File Naming & Structure

- **kebab-case** for files: `widget-factory.js`, `selection-manager.js`
- **PascalCase** for classes: `class WidgetFactory`, `class SelectionManager`
- **ES6 modules**: All files use `import`/`export` (no bundler, deploy source)
- **File size limit**: ~500 lines max per file - split when larger

### String-Based Attribute System

Inspector properties use VIS-style string definitions (NOT TypeScript interfaces):

```javascript
// Format: name[default]/type,param1,param2/label/onChangeCallback
"bgColor[#fff]/color/Background Color";
"fontSize[14]/slider,8,64,1/Font Size";
"entity[]/id/Target Entity/onEntityChange";
"group.appearance/Appearance;padding[10]/number/Padding"; // Grouped properties
```

**Why**: Flexible, proven pattern from ioBroker VIS; easier than verbose object schemas.

### Conditional System Access

**ALWAYS check system existence before use** (especially inspector in view mode):

```javascript
// ✅ Correct
if (this.systems.inspector) {
  this.systems.inspector.setSelection(selected);
}

// ❌ Wrong - crashes in view mode
this.systems.inspector.setSelection(selected);
```

### Widget Overflow Pattern

All widgets use this CSS pattern for proper selection/resize:

```javascript
container.style.overflow = "visible"; // Allow resize handles outside
clipWrapper.style.overflow = "hidden"; // Clip content inside
```

**Why**: Resize handles (12x12px blue squares) extend outside widget bounds; content must stay inside.

### Widget Update Pattern (CRITICAL)

**Two separate update paths** - DO NOT confuse them:

```javascript
// 1. USER/INSPECTOR CHANGES → Updates config AND display
this.viewRenderer.updateWidget(widgetId, { text: "New Value" });
// Result: widget.config.text = 'New Value', display shows 'New Value', saves to file

// 2. BINDING EVALUATIONS → Updates display ONLY
this.viewRenderer.updateWidgetDisplay(widgetId, { text: "Evaluated Value" });
// Result: config unchanged (binding preserved), display shows 'Evaluated Value', no save
```

**Rule**: When evaluating bindings, ALWAYS use `updateWidgetDisplay()` to preserve the original binding expression in config.

**Bad Example** (loses binding):

```javascript
// User saves: {sensor.temp;value > 20 ? 'Hot' : 'Cold'}
// Evaluates to: 'Hot'
this.viewRenderer.updateWidget(widgetId, { text: "Hot" });
// Config now: 'Hot' ❌ Binding lost forever!
```

**Good Example** (preserves binding):

```javascript
// User saves: {sensor.temp;value > 20 ? 'Hot' : 'Cold'}
// Evaluates to: 'Hot'
this.viewRenderer.updateWidgetDisplay(widgetId, { text: "Hot" });
// Config still: {sensor.temp;value > 20 ? 'Hot' : 'Cold'} ✅
// Display shows: 'Hot' ✅
```

## Key Integration Points

### Home Assistant WebSocket

- **Connection**: Managed by `core/connection.js` - auto-reconnect, auth, message routing
- **Services**: Call via `connection.callService('canvas_ui', 'write_file', data)`
- **Entity Updates**: Subscribe via `entityManager.subscribe(entityId, callback)`

### Python Backend Services

Located in `custom_components/canvas_ui/services.py`:

- `canvas_ui.write_file` - Save dashboard JSON
- `canvas_ui.read_file` - Load dashboard JSON
- `canvas_ui.delete_file` - Delete dashboard
- `canvas_ui.list_files` - List all dashboards

### Binding System

Multi-variable eval expressions with 45+ operations:

```javascript
// Simple binding
{sensor.temperature}

// With operations
{sensor.temperature;* 1.8;+ 32;round(1)}

// Ternary conditionals (NEW Jan 25, 2026)
{sensor.temperature;value > 20 ? '🔥 Hot' : '❄️ Cool'}
{binary_sensor.door;value == 'on' ? '🔓 Open' : '🔒 Closed'}
{sensor.battery;value < 20 ? '⚠️ Low' : '✓ OK'}

// Multi-variable eval
{temp:sensor.temp;hum:sensor.humidity;temp > 20 && hum < 60 ? 'OK' : 'Bad'}
```

**Operations Available:**

- **Math**: `*`, `/`, `+`, `-`, `%`, `round`, `pow`, `sqrt`, `floor`, `ceil`, `abs`, `min`, `max`
- **Format**: `value`, `hex`, `HEX`, `hex2`, `HEX2`, `date`, `ago`, `timestamp`
  - **NEW**: `HEX`, `HEX2` - Uppercase hex formatting (Jan 25, 2026)
  - **NEW**: `date(hh:mm A)` - 12-hour time format with AM/PM (Jan 25, 2026)
- **Conditional**: `gt`, `lt`, `gte`, `lte`, `eq`, `ne`, `between`
  - **NEW**: Ternary conditionals `condition ? true : false` (Jan 25, 2026)
- **JSON**: `json(path.to.prop)` - Extract nested properties
- **String**: `replace`, `substring`, `split`, `concat`, `toLowerCase`, `toUpperCase`, `trim`
- **Type**: `number`, `string`, `bool`
- **Array**: `array[index]`

Parser: `binding/parser.js` | Evaluator: `binding/evaluator.js` | Editor: `dialogs/binding-editor.js`

### MDI Icon System

**Status:** ✅ COMPLETE (Jan 2026) - **Expanded to 150+ icons with category filtering**

Inline Material Design Icons with custom colors in binding outputs.

**Syntax:** `mdi:icon-name:color Text`

**Files:**

- `utils/icon-parser.js` (220 lines) - Parser and SVG generator
- `utils/mdi-icon-library.js` (400 lines) - **NEW:** Comprehensive icon library with 9 categories
- `dialogs/icon-picker-dialog.js` (850 lines) - Full icon + color picker with category dropdown
- `dialogs/icon-picker-simple-dialog.js` (460 lines) - **NEW:** Icon-only picker for inspector
- `dialogs/binding-editor.js` - Integration (palette buttons)

**Icon Library (150+ icons in 9 categories):**

- **Common** (16): check, close, plus, minus, pencil, delete, refresh, cog, information, alert, help, star, heart, eye, magnify, dots-vertical
- **Navigation** (16): arrow-up/down/left/right, chevron-up/down/left/right, menu, menu-open, dots-horizontal, home, navigation, compass, map-marker
- **Device** (12): cellphone, tablet, laptop, monitor, television, speaker, keyboard, mouse, camera, printer, headphones, gamepad
- **Home & IoT** (12): lightbulb, fan, door-open/closed, window-open/closed, blinds, thermometer, air-conditioner, lock, lock-open, shield-home, alarm-light
- **Media** (15): play, pause, stop, skip-next, skip-previous, fast-forward, rewind, volume-high/medium/low/mute, shuffle, repeat, music, video, microphone
- **Weather** (7): weather-sunny, weather-cloudy, weather-rainy, weather-snowy, fire, snowflake, water
- **Status** (13): power, battery, battery-charging, wifi, bluetooth, signal, cloud, cloud-upload, cloud-download, sync, check-network, alert-circle
- **Time & Date** (6): clock, clock-outline, calendar, timer, alarm, hourglass
- **Data & Charts** (8): chart-line, chart-bar, chart-pie, chart-arc, gauge, speedometer, poll, table
- **Files** (8): file, folder, folder-open, download, upload, save, content-copy, content-paste

**Examples:**

```javascript
// Icon with color
"mdi:fire:#ff5500";

// Icon with color and text
"mdi:fire:#ff5500 Hot";

// In ternary conditional
{
  sensor.temperature;
  value > 20 ? "mdi:fire:#ff5500 Hot" : "mdi:snowflake:#03a9f4 Cold";
}

// Multiple icons
("mdi:thermometer:#03a9f4 23.5°C mdi:check:#4caf50 OK");
```

**Dual Icon Picker System:**

**1. Full Icon Picker (Binding Editor)** - `icon-picker-dialog.js`

- Category dropdown (9 categories: Common, Navigation, Device, Home, Media, Weather, Status, Time, Data, Files)
- Visual grid showing only selected category's icons (4 columns)
- Hex color input + HTML5 color picker
- 6 quick color presets (blue, green, orange, red, purple, gray)
- Live preview with selected icon and color
- Integration in binding editor:
  - Simple mode: Palette button (🎨) next to each operation input
  - Multi-variable mode: Palette button below textarea
- Output format: `mdi:icon-name:color ` (with trailing space)

**2. Simple Icon Picker (Inspector)** - `icon-picker-simple-dialog.js`

- Category dropdown (same 9 categories)
- Icon-only selection (NO color picker)
- Visual grid showing only selected category's icons (4 columns)
- Integration in inspector:
  - Button: `...` (three dots) next to icon fields
- Output format: `mdi-icon-name` (name only, no prefix or color)

**Category Filtering:**

- Default category: "common" (most frequently used)
- Grid dynamically updates when category changes
- Prevents UI overload by showing max ~16 icons at once (instead of all 150+)
- Selection highlighting persists across category changes

**Widget Support:**
All text-displaying widgets (text, button, switch, value) use:

```javascript
import { parseIcons } from "../../utils/icon-parser.js";
const parsedContent = parseIcons(widget.config.text, element);
```

**Icon/Color Property Separation (Inspector vs Binding):**

- **Inspector fields**: Icon name and color stored separately
  - `config.icon` = `"mdi-fire"` (icon name only)
  - `config.iconColor` = `"#ff5500"` (color separately)
  - Simple picker returns icon name only
- **Binding expressions**: Icon and color combined in output
  - Binding: `{sensor.temp;value > 20 ? 'mdi:fire:#ff5500' : 'mdi:snowflake:#03a9f4'}`
  - Parser handles both formats (`:` separator for binding, `-` separator for icon names)
  - Full picker returns combined format `mdi:icon-name:color `

**Parser Pattern:**

```javascript
/mdi:([a-z0-9-]+)(?::([#a-z0-9(),.]+))?/gi;
```

- Stops at first space (preserves text after icon)
- Supports hex, RGB, RGBA, CSS color names
- Dynamic size scaling (matches element font-size)

**Quote-Aware Ternary Fix:**
Evaluator uses character-by-character parsing respecting quote boundaries to handle:

```javascript
{
  sensor.temp;
  value > 20 ? "mdi:fire:#ff5500 Hot" : "mdi:snowflake:#03a9f4 Cold";
}
```

(Colons in `mdi:fire:color` don't break ternary parsing)

**CRITICAL: Display vs Config Separation** (Jan 25, 2026)

When binding evaluation updates widgets, use **`updateWidgetDisplay()`** NOT `updateWidget()`:

```javascript
// ❌ BAD - Overwrites config with evaluated result
this.viewRenderer.updateWidget(widgetId, { text: evaluatedValue });
// After: widget.config.text = 'Hot' (binding lost!)

// ✅ GOOD - Updates display only, preserves binding in config
this.viewRenderer.updateWidgetDisplay(widgetId, { text: evaluatedValue });
// Config still: {sensor.temp;value > 20 ? 'Hot' : 'Cold'}
// Display shows: 'Hot' or 'Cold' based on current value
```

**Why This Matters:**

- User enters: `{sensor.temperature;value > 20 ? 'Hot' : 'Cold'}`
- System evaluates: `'Hot'`
- **Without separation**: Config becomes `'Hot'`, binding lost forever
- **With separation**: Config stays as binding, display updates to `'Hot'`
- On reload: Binding still works, Binding Editor displays correctly

Files implementing this pattern:

- `binding/binder.js` - Calls `updateWidgetDisplay()` for evaluated results
- `core/view-renderer.js` - Has both `updateWidget()` (config) and `updateWidgetDisplay()` (display only)
- `widgets/basic/text-widget.js` - Has `updateConfig()` and `updateDisplay()` methods

## Widget Development Patterns

### BaseWidget Lifecycle & State-Based Rendering

Canvas UI uses **state-driven architecture** where widgets declare visual states and the system renders them:

**State Structure Example** (each widget can have 1-4 states):

```javascript
{
  background: { color: "#ff0000", opacity: 1.0, pattern: null },
  border: { width: 2, color: "#000", style: "solid", radius: [8,8,8,8] },
  text: { content: "Label", color: "#fff", size: 16, align: "center" },
  icon: { name: "mdi-icon", color: "#fff", size: 24, position: "left" }
}
```

**Widget Implementation Pattern**:

```javascript
export class MyWidget extends BaseWidget {
  constructor(config) {
    super(config);
    // NO DOM creation - behavior only
  }

  getStateCount() {
    return 2; // OFF (0) and ON (1)
  }

  getDefaultStates() {
    return [
      {
        /* OFF state visual config */
      },
      {
        /* ON state visual config */
      },
    ];
  }

  // Optional: Custom behavior
  onClick() {
    // Toggle state, call services, etc.
  }

  // Optional: Lifecycle hooks
  onMount() {
    this.setupBindings(); // Auto-called by BaseWidget
  }

  onStateUpdate(entityId, newState, oldState) {
    // Called when subscribed entity changes
  }

  onDestroy() {
    // Cleanup (bindings auto-cleaned by BaseWidget)
  }
}
```

**State Count Patterns**:

- **1 state**: Static display (labels, images, borders)
- **2 states**: Binary toggle (switch, button ON/OFF)
- **3 states**: On/Off/Unavailable (lights with unknown state)
- **4 states**: Multi-mode (thermostat modes, media player states)

### Widget Schema Definition

**Two supported formats** (string-based from VIS, object-based for type safety):

```javascript
// VIS-style string format (simpler)
static getAttributeString() {
  return `
    group.content/Content Settings;
    text[Button]/text/Button Text;
    entity[]/id/Target Entity;
    bgColor[#03a9f4]/color/Background Color;
    fontSize[14]/slider,8,24,1/Font Size (px);
  `;
}

// Object format (current system)
static getConfigSchema() {
  return {
    text: {
      type: 'text',
      label: 'Text',
      default: 'Click Me',
      category: 'Button Appearance',
      tab: 'custom'
    },
    entity: {
      type: 'entity',
      label: 'Entity ID',
      default: '',
      category: 'Entity',
      tab: 'custom'
    }
  };
}
```

**Property Storage Locations**:

- `widget.config.*` - Custom properties (`tab: "custom"`)
- `widget.styles.*` - CSS properties (`tab: "common"`)
- `widget.position.*` - Position (x, y)
- `widget.size.*` - Size (w, h)

### Binding System Integration

Widgets automatically support bindings in any string property:

```javascript
// Simple entity binding
config.text = "{sensor.temperature}";

// With operations
config.text = "{sensor.temperature;* 1.8;+ 32;round(1)} °F";

// Multi-variable eval
config.backgroundColor = "{temp:sensor.temp;temp > 25 ? '#ff0000' : '#00ff00'}";
```

**BaseWidget auto-handles**:

- Parsing bindings from config
- Subscribing to bound entities
- Re-evaluating on entity state changes
- Cleaning up subscriptions on destroy

### Inspector Table-Based Layout

Inspector uses table layout (VIS v1 pattern) for consistent alignment:

```html
<table class="inspector-table">
  <tbody>
    <!-- Group Header -->
    <tr class="group-header" data-group="general">
      <td colspan="3">
        <button class="group-toggle">▼</button>
        <span class="group-title">General</span>
      </td>
    </tr>

    <!-- Property Row -->
    <tr class="group-general property-row">
      <td class="property-label">Entity ID</td>
      <td class="property-input">
        <input type="text" data-property="entity" />
      </td>
      <td class="property-button">
        <button class="entity-picker-btn">...</button>
      </td>
    </tr>
  </tbody>
</table>
```

**CSS Grid Pattern** (40% label, 50% input, 10% button):

```css
.property-label {
  width: 40%;
  font-weight: 500;
}
.property-input {
  width: 50%;
}
.property-button {
  width: 10%;
  text-align: right;
}
```

### Save System (3-Tier Pattern from VIS)

```javascript
// Tier 1: Debounced save trigger
save() {
  if (this.saveTimer) clearTimeout(this.saveTimer);
  this.saveTimer = setTimeout(() => this._saveToServer(), 2000);
}

// Tier 2: Add to undo history
_saveToServer() {
  // Add to 50-step undo stack
  if (this.undoHistory.length >= 50) this.undoHistory.shift();
  this.undoHistory.push(JSON.parse(JSON.stringify(this.views)));
  this.saveRemote();
}

// Tier 3: Write to HA service
async saveRemote() {
  const data = JSON.stringify(this.views, null, 2);
  await window.hass.callService("canvas_ui", "write_file", {
    filename: "canvas-ui-views.json",
    data: data
  });
}
```

## Critical Reference Files

- **BUILD_FOUNDATION.md** (5,752 lines): Complete architecture, VIS analysis, implementation specs for Phases 5-9
- **canvas-ui.js**: Main initialization, system coordination, dependency injection
- **canvas-ui-panel.js**: HA panel registration, mode detection, iframe setup
- **widgets/basic/**: Example widget implementations (Text, Image, Button, Switch, Value)
- **editor/toolbar.js**: Mode toggle implementation, edit/view switching
- **inspector/inspector.js**: Table-based property editor with field generators
- **binding/**: Parser (40+ operations) and Evaluator (multi-variable eval)

---

## VIS-Inspired Patterns

Canvas UI draws from **ioBroker VIS v1** (battle-tested dashboard system):

### What We Adopted

1. **Three-Mode System**: Edit (full editor), View (toolbar + read-only), Kiosk (full-screen, no UI)
2. **Dual-Entry Architecture**: Separate edit.html/index.html for 70% runtime size reduction
3. **String-Based Attributes**: `"fontSize[14]/slider,8,64,1/Font Size"` - flexible, declarative
4. **Reactive State**: Can.js-inspired subscribe/notify pattern - simple, no framework overhead
5. **Grid Snapping**: 3 modes (off, grid, elements) with visual alignment guides
6. **50-Step Undo/Redo**: JSON serialization with debounced auto-save (2s)
7. **Multi-Variable Bindings**: `{var:entity;formula}` eval expressions with 40+ operations
8. **Toolbar in Runtime**: VIS shows toolbar in view mode for navigation - we replicate this

### What We Improved

1. **BaseWidget System**: State-based rendering vs VIS's EJS templates
2. **ES6 Modules**: Dynamic imports vs script tag loading
3. **Native HA Integration**: Direct WebSocket vs Socket.io adapter
4. **Modular Architecture**: ~500 line files vs 7,000+ line monoliths

### Key Differences from VIS v2

- VIS v2 uses React+TypeScript - we use Vanilla JS (lighter, HA-optimized)
- VIS v2 uses Redux - we use simple reactive state (sufficient for use case)
- VIS v2 targets 50,000+ lines - we target <20,000 (achieved ~11,332)

## Archived Projects

- **archive/vis-canvas-deprecated/**: Old VIS Canvas project - NOT MAINTAINED, reference only

---

## Implementation Status (Phases 5-9 Complete)

### Completed Systems

**Phase 5: Widget Library**

- 5 widgets: Text, Image, Button, Switch, Value (~2,117 lines)
- Selection system (2px blue outline)
- 8-point resize handles (12x12 blue squares at z-index 9999)
- Drag-and-drop positioning
- Overflow pattern: container `visible`, clip wrapper `hidden`

**Phase 6: Core Systems**

- Widget Registry: Dynamic loading, manifest-based definitions, lazy imports
- Advanced Bindings: 40+ operations (math, format, conditional, JSON, string, type conversion)
- Editor Features: 50-step undo/redo, alignment guides (red/green lines), snap modes (none/grid/elements)
- Inspector Enhancement: Table-based layout, rich field types, validation, tabs (Common/Custom/Action)

**Phase 7: Application Systems**

- Dual-Mode: Edit mode (full features) vs View mode (70% less code)
- Save/Load: Debounced auto-save (2s delay), HA service integration
- View Management: Multi-view CRUD, view switching, widget operations per view
- Import/Export: JSON export/import with validation, clipboard support

**Phase 8: Backend & Editor Integration**

- Python Services: `write_file`, `read_file`, `delete_file`, `list_files`
- WebSocket: Auto-reconnect, auth, message routing, entity subscriptions
- Widget Factory: Creation dialogs, toolbar drag, drop position calculation
- Toolbar & EditorCore: Widget library panel, alignment tools, keyboard shortcuts

**Phase 9: Rendering & Application**

- Widget Renderer: Live state updates, entity binding
- Canvas Renderer: View display engine
- Theme Manager: HA theme integration
- Main Application: System coordination, dependency injection

### Keyboard Shortcuts

- `Ctrl+Z` / `Ctrl+Y` - Undo/Redo
- `Ctrl+C` / `Ctrl+X` / `Ctrl+V` - Copy/Cut/Paste
- `Ctrl+D` - Duplicate
- `Ctrl+A` - Select All
- `Ctrl+S` - Save
- `Delete` / `Backspace` - Delete selected
- `Escape` - Deselect all

### Editor Operations (14 batch operations)

- **Align**: Left, Center Horizontal, Right, Top, Center Vertical, Bottom
- **Distribute**: Horizontal, Vertical (requires 3+ widgets)
- **Sizing**: Same Width, Same Height, Same Size
- **Z-Index**: Bring to Front, Send to Back
- **Delete**: Remove selected widgets

---

## VIS Implementation Patterns (Detailed Reference)

### Inspector Attribute String Parser

VIS uses declarative string format for inspector properties:

```
Format: name[default]/type,param1,param2,.../label/onChange
```

**Parser Rules**:

1. **Group declaration**: `group.groupname/Label;` starts a collapsible group
2. **Property format**: `propName[defaultVal]/type,params/Label/callback`
3. **Type handlers**: text, number, slider, color, checkbox, select, id (entity), icon, image
4. **Slider format**: `slider,min,max,step` (e.g., `fontSize[14]/slider,8,64,1/Font Size`)
5. **Select format**: `select,opt1,opt2,opt3` (e.g., `align[left]/select,left,center,right/Alignment`)

**Example Attribute String**:

```javascript
static getAttributeString() {
  return `
    group.content/Content;
    text[Click Me]/text/Button Text;
    entity[]/id/Target Entity/onEntityChange;

    group.appearance/Appearance;
    bgColor[#03a9f4]/color/Background Color;
    fontSize[14]/slider,8,64,1/Font Size (px);
    borderWidth[2]/slider,0,10,1/Border Width;

    group.action/Action;
    service[]/text/Service to Call;
    serviceData[{}]/text/Service Data (JSON);
  `;
}
```

### Binding Operations (40+ Operations)

**Math Operations** (12):

- Arithmetic: `*`, `/`, `+`, `-`, `%`
- Functions: `round(decimals)`, `pow(exp)`, `sqrt`, `floor`, `ceil`, `abs`, `min(val)`, `max(val)`
- Example: `{sensor.temp;* 1.8;+ 32;round(1)}` → Convert C to F

**Format Operations** (6):

- `value` - Extract numeric value from string
- `hex` - Convert to lowercase hex
- `HEX` - Convert to uppercase hex
- `date(format)` - Format timestamp as date
- `ago` - Time ago ("2 hours ago")
- `timestamp` - Convert to Unix timestamp
- Example: `{sensor.last_changed;ago}` → "5 minutes ago"

**Conditional Operations** (7):

- Comparisons: `gt(val)`, `lt(val)`, `gte(val)`, `lte(val)`, `eq(val)`, `ne(val)`
- Range: `between(min,max)`
- Example: `{sensor.temp;gt(25)}` → true/false

**JSON Operations** (1):

- `json(path.to.property)` - Extract nested JSON property
- Example: `{sensor.attributes;json(battery_level)}` → Extract battery level from attributes

**String Operations** (9):

- `replace(find,replace)` - String replacement
- `substring(start,end)` - Extract substring
- `split(delimiter)` - Split string
- `concat(str)` - Concatenate strings
- `toLowerCase` - Convert to lowercase
- `toUpperCase` - Convert to uppercase
- `trim` - Remove whitespace
- Example: `{sensor.state;toUpperCase;replace(ON,ACTIVE)}`

**Type Conversion** (3):

- `number` - Convert to number
- `string` - Convert to string
- `bool` - Convert to boolean
- Example: `{sensor.state;number;gt(50)}` → Compare numeric value

**Array Operations** (1):

- `array[index]` - Access array element
- Example: `{sensor.forecast;json(temperature);array[0]}` → First forecast temperature

**Multi-Variable Eval** (VIS v2 pattern):

```javascript
{var1:entity1;var2:entity2;expression}
{temp:sensor.temperature;hum:sensor.humidity;temp > 20 && hum < 60 ? 'Comfortable' : 'Adjust'}
{light:light.living;switch:switch.fan;light.state === 'on' || switch.state === 'on'}
```

### Grid Snapping System

**Three Snap Modes** (VIS pattern):

1. **None** - Free positioning, no snapping
2. **Grid** - Snap to grid points (configurable size, default 10px)
3. **Elements** - Snap to other widget edges (alignment guides appear)

**Alignment Guide Colors**:

- **Red lines**: Vertical alignment (left/center/right edges)
- **Green lines**: Horizontal alignment (top/center/bottom edges)
- **Snap threshold**: 5px proximity triggers snap
- **Visual feedback**: Guide appears during drag, disappears after drop

**Implementation Pattern**:

```javascript
class GridSystem {
  snapToGrid(x, y) {
    const gridSize = this.gridSize || 10;
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize,
    };
  }

  snapToElements(x, y, w, h, widgets) {
    const threshold = 5;
    const guides = [];

    widgets.forEach((widget) => {
      // Check vertical alignment
      if (Math.abs(widget.x - x) < threshold) {
        guides.push({ type: "vertical", pos: widget.x, color: "red" });
        x = widget.x;
      }
      // Check horizontal alignment
      if (Math.abs(widget.y - y) < threshold) {
        guides.push({ type: "horizontal", pos: widget.y, color: "green" });
        y = widget.y;
      }
    });

    return { x, y, guides };
  }
}
```

### Undo/Redo System (50-Step History)

**VIS Pattern** (JSON Serialization):

```javascript
class UndoManager {
  constructor(maxHistory = 50) {
    this.history = [];
    this.currentIndex = -1;
    this.maxHistory = maxHistory;
  }

  // Add state to history
  addState(state) {
    // Remove any redo history
    this.history = this.history.slice(0, this.currentIndex + 1);

    // Deep clone state
    this.history.push(JSON.parse(JSON.stringify(state)));

    // Limit history size
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    } else {
      this.currentIndex++;
    }
  }

  // Undo to previous state
  undo() {
    if (this.currentIndex <= 0) return null;
    this.currentIndex--;
    return JSON.parse(JSON.stringify(this.history[this.currentIndex]));
  }

  // Redo to next state
  redo() {
    if (this.currentIndex >= this.history.length - 1) return null;
    this.currentIndex++;
    return JSON.parse(JSON.stringify(this.history[this.currentIndex]));
  }

  // Check if undo/redo available
  canUndo() {
    return this.currentIndex > 0;
  }
  canRedo() {
    return this.currentIndex < this.history.length - 1;
  }
}
```

**Why JSON Serialization**:

- ✅ Complete deep clone (no reference issues)
- ✅ Simple implementation (no custom clone logic)
- ✅ Works with complex nested objects
- ✅ Debuggable (can inspect history in console)
- ⚠️ Performance acceptable for dashboard editing (not real-time)

### Debounced Auto-Save Pattern

**Three-Tier Save** (from VIS visEdit.js):

```javascript
class SaveSystem {
  constructor(debounceMs = 2000) {
    this.saveTimer = null;
    this.debounceMs = debounceMs;
  }

  // Tier 1: User triggers save (debounced)
  save() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this._saveToServer(), this.debounceMs);
  }

  // Tier 2: Add to undo history, trigger remote save
  async _saveToServer() {
    // Add to undo history (if undo system integrated)
    if (this.undoManager) {
      this.undoManager.addState(this.views);
    }

    // Trigger actual save
    await this.saveRemote();
  }

  // Tier 3: Write to backend
  async saveRemote() {
    const data = JSON.stringify(this.views, null, 2);
    await window.hass.callService("canvas_ui", "write_file", {
      filename: "canvas-ui-views.json",
      data: data,
    });
  }
}
```

**Why 2-Second Debounce**:

- Prevents save spam during rapid edits (drag, resize)
- Balances responsiveness vs server load
- User can continue editing without waiting
- VIS v1 uses 2s, VIS v2 uses 1s - we use 2s (more conservative)

### View Management (VIS Multi-View Pattern)

**View Data Structure**:

```javascript
{
  "viewId": "main_view",
  "name": "Main Dashboard",
  "background": "#1a1a1a",
  "gridSize": 10,
  "snapMode": "grid",
  "widgets": [
    { id: "w1", type: "button", position: {x: 10, y: 20}, ... },
    { id: "w2", type: "text", position: {x: 100, y: 50}, ... }
  ],
  "settings": {
    "showGrid": true,
    "lockWidgets": false
  }
}
```

**View Operations**:

- **Create**: Generate unique ID, initialize empty widget array
- **Switch**: Save current view state, load target view state
- **Delete**: Remove from views array, switch to first available view
- **Duplicate**: Deep clone view, generate new ID
- **Import/Export**: JSON serialization with validation

---

## Modular File Structure

Canvas UI uses a **directory-per-feature** approach with small, focused files (~300-500 lines):

```
www/canvas-ui/
├── core/           Connection, EntityManager, StateManager, WidgetRegistry, ThemeManager
├── editor/         Toolbar, WidgetFactory, EditorCore (edit mode only)
├── inspector/      Inspector, fields/ (edit mode only)
├── alignment/      AlignmentManager, alignment tools
├── grid/           GridSystem, snap modes
├── selection/      SelectionManager, resize handles
├── undo/           UndoManager (50-step history)
├── save/           SaveSystem, HAStorage
├── views/          ViewManager, ViewNavigationUI
├── import-export/  ImportExport system
├── rendering/      CanvasRenderer
├── binding/        Parser, Evaluator (40+ operations)
├── dialogs/        DialogManager
├── widgets/basic/  Text, Image, Button, Switch, Value widgets
├── index.html      View mode entry (runtime only)
├── edit.html       Edit mode entry (full editor)
└── canvas-ui.js    Main application
```

### File Naming Conventions

- **Files**: kebab-case (`widget-factory.js`, `selection-manager.js`)
- **Classes**: PascalCase (`class WidgetFactory`, `class SelectionManager`)
- **Modules**: ES6 imports/exports (no bundler - deploy source directly)
- **File Size**: Max ~500 lines - split when larger

---

## Dialog & Popup Design System

**CRITICAL**: All dialogs/popups follow a consistent design pattern. See BUILD_FOUNDATION.md for complete dialog implementation guide.

### Standard Dialog Pattern

All dialogs (EntityPickerDialog, BindingEditorDialog, etc.) follow this structure:

```javascript
export class MyDialog {
  constructor(dependencies, currentValue, callback) {
    this.dependencies = dependencies;
    this.currentValue = currentValue;
    this.callback = callback;
  }

  show() {
    this._createDialog();
  }

  _createDialog() {
    // 1. Create overlay with blur backdrop
    this.overlay = document.createElement("div");
    this.overlay.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    // 2. Create dialog container
    this.dialog = document.createElement("div");
    this.dialog.style.cssText = `
      background: var(--card-background-color, #1e1e1e);
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      width: 700px;
      max-width: 90vw;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    `;

    // 3. Header with title and close button
    // 4. Content area (scrollable)
    // 5. Footer with preview/actions

    // 6. ESC key handler
    this.keyHandler = (e) => {
      if (e.key === "Escape") this.close();
    };
    document.addEventListener("keydown", this.keyHandler);

    // 7. Auto-focus first input
    setTimeout(() => {
      const firstInput = this.dialog.querySelector("input");
      if (firstInput) firstInput.focus();
    }, 100);
  }

  close() {
    if (this.keyHandler) {
      document.removeEventListener("keydown", this.keyHandler);
    }
    if (this.overlay && this.overlay.parentNode) {
      document.body.removeChild(this.overlay);
    }
  }
}
```

### Dialog Styling Standards

**Colors:**

- Background: `var(--card-background-color, #1e1e1e)`
- Borders: `var(--divider-color, #333)`
- Text: `var(--primary-text-color, #fff)`
- Secondary text: `var(--secondary-text-color, #aaa)`
- Accent: `#03a9f4` (blue)
- Success: `#4caf50` (green)
- Error: `#d32f2f` (red)

**Layout:**

- Overlay: `z-index: 10000`
- Nested dialogs: `z-index: 10001`
- Border radius: `8px` (dialogs), `4px` (buttons/inputs)
- Padding: `16px 20px` (header/footer), `20px` (content)
- Gap: `8px` (small), `12px` (medium), `16px` (large)

**Buttons:**

- Primary: `background: #03a9f4`, hover: `#0288d1`
- Secondary: `background: #444`, hover: `#555`
- Danger: `background: #d32f2f`, hover: `#c62828`
- Transition: `all 0.2s`

### Inspector Integration Pattern

When adding dialog buttons to inspector fields:

```javascript
// In inspector.js createXXXInput() method:
const container = document.createElement("div");
container.style.cssText = `
  display: flex;
  gap: 4px;
  align-items: center;
`;

const input = document.createElement("input");
input.style.cssText = `
  flex: 1;
  padding: 6px 8px;
  background: var(--secondary-background-color, #2a2a2a);
  border: 1px solid var(--divider-color, #333);
  border-radius: 4px;
  color: var(--primary-text-color, #fff);
  font-size: 14px;
`;

const button = document.createElement("button");
button.textContent = "..."; // or "{}" for binding editor
button.style.cssText = `
  padding: 6px 12px;
  background: #2c2c2c;
  color: #fff;
  border: 1px solid #555;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
  flex-shrink: 0;
`;

button.onmouseenter = () => {
  button.style.background = "#03a9f4";
  button.style.borderColor = "#03a9f4";
};
button.onmouseleave = () => {
  button.style.background = "#2c2c2c";
  button.style.borderColor = "#555";
};

button.onclick = () => {
  const dialog = new MyDialog(dependencies, input.value, (result) => {
    input.value = result;
    this.handlePropertyChange(prop.name, result);
  });
  dialog.show();
};

container.appendChild(input);
container.appendChild(button);
return container;
```

### Focus Loss Prevention

**CRITICAL**: Text inputs must use `blur` events, NOT `input` events:

```javascript
// ❌ WRONG - causes focus loss on every keystroke
input.addEventListener("input", () => {
  this.handlePropertyChange(prop.name, input.value);
});

// ✅ CORRECT - only saves when leaving field
input.addEventListener("blur", () => {
  this.handlePropertyChange(prop.name, input.value);
});
```

**Why:** `handlePropertyChange` triggers widget updates and potential re-renders. Using `input` event causes the inspector to refresh while typing, kicking the user out of the text field.

### Property Persistence Pattern

When property changes from inspector:

1. **Update widget config** - `updateWidget(widgetId, changes)`
2. **Emit widgetUpdated event** - Triggers save systems
3. **Save to undo/redo** - `undoRedoSystem.saveState()`
4. **Save to storage** - `saveConfiguration()` (debounced 2s)

**Example from canvas-core.js:**

```javascript
this.inspector.onPropertyChanged((widget, property, value) => {
  const widgetId = widget.config?.id;
  const propName = property.split(".").pop();
  const changes = { [propName]: parseFloat(value) || value };

  // Update widget (triggers widgetUpdated event)
  this.viewRenderer.updateWidget(widgetId, changes);
});

this.on("widgetUpdated", (data) => {
  // Save to undo/redo
  if (this.undoRedoSystem && !this.undoRedoSystem.isApplying) {
    this.undoRedoSystem.saveState("Widget modified");
  }

  // Save to localStorage + HA file (debounced)
  this.saveConfiguration();
});
```

---

## 🔄 WIDGET VISIBILITY SYSTEM (Phase 13 - Jan 2026)

### Overview

Universal conditional visibility system for all widgets. Widgets can show/hide based on entity states using:

- **Simple Builder Mode**: Visual condition creator (beginner-friendly)
- **Advanced Expression Mode**: Manual binding editor (power users)

### VisibilityConditionDialog Usage

**CRITICAL**: Special handling required - do NOT use BindingEditorDialog for visibility conditions.

**Inspector Integration Pattern:**

```javascript
// In inspector.js - Special property handling
if (
  prop.name === "visibilityCondition" ||
  prop.path === "visibilityCondition" ||
  prop.name === "config.visibilityCondition" ||
  (prop.name && prop.name.endsWith(".visibilityCondition"))
) {
  const dialog = new VisibilityConditionDialog(
    canvasCore.entityManager,
    input.value,
    (binding) => {
      input.value = binding;
      this.handlePropertyChange(prop.path || prop.name, binding, target, type);
    },
  );
  dialog.show();
  return; // Don't open BindingEditorDialog
}
```

**Why Multiple Checks?** Inspector adds parent object prefix to nested properties:

- Widget defines: `visibilityCondition`
- Inspector receives: `config.visibilityCondition`
- Must check both variations + pattern match

### Property Name Prefix Convention (CRITICAL)

**Pattern Discovered (Phase 13):**

When Inspector processes nested properties, it adds the parent object name as a prefix.

```javascript
// Widget configSchema definition:
configSchema = {
  visibilityCondition: {
    type: "text",
    label: "Visibility Condition",
    // ...
  }
}

// What Inspector receives at runtime:
{
  name: 'config.visibilityCondition',  // ← Prefixed with parent object!
  path: undefined,                      // ← Not reliably populated
  label: 'Visibility Condition'
}
```

**Solution Pattern:** Always check multiple variations:

```javascript
// Check direct name (legacy/fallback)
if (
  prop.name === "propertyName" ||
  // Check path (if populated)
  prop.path === "propertyName" ||
  // Check with known prefix
  prop.name === "config.propertyName" ||
  // Check with pattern matching (future-proof)
  (prop.name && prop.name.endsWith(".propertyName"))
) {
  // Special handling
}
```

**Apply this pattern for ANY special property handling in Inspector** (visibility, actions, custom dialogs, etc.).

### Widget Visibility Integration

**All widgets should support visibilityCondition property.**

**3 Steps for Integration:**

```javascript
// 1. Add to configSchema
configSchema = {
  visibilityCondition: {
    type: "text",
    label: "Visibility Condition",
    default: "",
    category: "Behavior",
    binding: true,  // Triggers {} button → VisibilityConditionDialog
    placeholder: "Leave blank to always show",
    description: "Widget shows when expression evaluates to true",
  }
}

// 2. Call setupVisibilityCondition in constructor (after super)
constructor(config, canvasCore) {
  super(config, canvasCore);
  this.setupVisibilityCondition();  // Inherited from BaseWidget
}

// 3. Check in updateConfig (re-evaluate on change)
updateConfig(newConfig) {
  super.updateConfig(newConfig);

  if (newConfig.visibilityCondition !== undefined) {
    this.evaluateVisibility();  // Inherited from BaseWidget
  }

  // ... other config handling
}
```

**BaseWidget handles all visibility logic** - no widget-specific code needed beyond the 3 steps above.

### Visibility Condition Syntax

**9 Operators Supported:**

- Comparison: `==`, `!=`, `>`, `<`, `>=`, `<=`
- String: `contains`, `startsWith`, `endsWith`

**Simple Comparison:**

```javascript
{sensor.temperature;> 20}           // Show when temp > 20
{sensor.humidity;<= 60}             // Show when humidity ≤ 60
{light.kitchen;== 'on'}             // Show when light is on
{switch.alarm;!= 'armed'}           // Show when alarm not armed
```

**String Operations:**

```javascript
{sensor.state;contains(alarm)}      // State contains "alarm"
{entity_id;startswith(light.)}      // Entity ID starts with "light."
{sensor.status;endswith(ing)}       // Status ends with "ing"
```

**Complex AND Logic:**

```javascript
{
  t: sensor.temp;
  h: sensor.humidity;
  t > 20 && h < 60;
}
// Show when temp > 20 AND humidity < 60
```

**Complex OR Logic:**

```javascript
{
  a: sensor.alarm;
  m: sensor.motion;
  a == "on" || m == "on";
}
// Show when alarm OR motion detected
```

### BaseWidget Visibility Methods

**5 Methods (Inherited by all widgets):**

```javascript
// 1. setupVisibilityCondition()
//    Call in constructor to initialize visibility system
//    Subscribes to entities, evaluates initial visibility

// 2. evaluateVisibility()
//    Evaluates binding expression to boolean
//    Updates widget display (show/hide)
//    Call when config changes

// 3. updateVisibility()
//    Applies visibility state to DOM (display: none/block)
//    Called automatically by evaluateVisibility()

// 4. subscribeVisibilityEntities()
//    Extracts entity IDs from binding
//    Subscribes to state changes
//    Triggers re-evaluation on updates

// 5. destroy() enhancement
//    Cleans up visibility subscriptions
//    Prevents memory leaks
```

**Usage Pattern:**

```javascript
// Widgets DON'T implement visibility logic
// Just call inherited methods at appropriate times:

constructor(config, canvasCore) {
  super(config, canvasCore);
  this.setupVisibilityCondition();  // Init visibility
}

updateConfig(newConfig) {
  super.updateConfig(newConfig);
  if (newConfig.visibilityCondition !== undefined) {
    this.evaluateVisibility();  // Re-evaluate
  }
}
```

### Debugging Methodology

**Console Logging Pattern** (Data-driven debugging):

When routing doesn't work or values seem wrong:

```javascript
// 1. Add temporary debug logging
console.log("[Component] Event triggered:", {
  propertyName: prop.name,
  propertyPath: prop.path,
  value: prop.value,
  // ... other relevant data
});

// 2. Deploy to production (or test locally)
// 3. User tests and provides console output
// 4. Analyze ACTUAL runtime values (not assumptions)
// 5. Fix based on observed behavior
// 6. Remove debug logging in final version
```

**Lesson from Phase 13:** Assumptions about property names/values were wrong. Console logging revealed actual runtime structure (config. prefix), leading to immediate fix.

**Use this approach for:**

- Inspector routing issues
- Property value mismatches
- Event handler debugging
- Dialog open/close issues
- Any "it should work but doesn't" scenario

**Why It Works:**

- Real runtime data beats assumptions
- Quick deployment cycle (scp, hard refresh)
- User provides actual console output
- Direct observation of system behavior

### Import Dependency Checking

**Lesson from Phase 13 Bug Fix:**

When deploying features with file dependencies:

1. ✅ Identify all import statements in deployed files
2. ✅ Verify imported files exist with correct names
3. ✅ Deploy entire dependency tree (not just changed files)
4. ✅ Test import errors in browser console (404s)

**Example Issue:**

```javascript
// visibility-condition-dialog.js
import { EntityPickerDialog } from "./entity-picker-dialog.js"; // ❌ Wrong name

// Actual file:
www / canvas - ui / dialogs / entity - picker.js; // ✅ Correct name (no -dialog suffix)
```

**Prevention:**

- Use `file_search` tool before deployment to verify filenames
- Check import statements match actual file structure
- Deploy dependencies even if they weren't modified
- Test in browser after deployment (check Network tab for 404s)

**Deployment Pattern:**

```bash
# 1. Find all imports in file
grep -E "^import.*from" www/canvas-ui/dialogs/visibility-condition-dialog.js

# 2. Verify each imported file exists
ls -la www/canvas-ui/dialogs/entity-picker.js

# 3. Deploy main file + all dependencies
sshpass -p 'PASSWORD' scp \
  www/canvas-ui/dialogs/visibility-condition-dialog.js \
  www/canvas-ui/dialogs/entity-picker.js \
  root@192.168.1.103:/config/www/canvas-ui/dialogs/
```

---

## Complete Implementation Reference

**For detailed dialog implementation patterns, widget schemas, binding system, and complete code examples, see:**

📘 **[BUILD_FOUNDATION.md](../BUILD_FOUNDATION.md)** - Complete architecture reference with VIS analysis and implementation specs

**Key sections:**

- Dialog System Design (Entity Picker, Binding Editor)
- Inspector Property Types & Validation
- Binding Parser & Evaluator (40+ operations)
- Widget Manifest System
- State Management Patterns
