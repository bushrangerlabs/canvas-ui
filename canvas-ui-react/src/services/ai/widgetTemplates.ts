/**
 * Widget Templates - Transform AI JSON to ExportedView Format
 * 
 * Stage 3 of the 4-stage pipeline (TypeScript transformation, instant)
 * Converts simple intermediate JSON from Stage 2 into Canvas UI ExportedView format
 * 
 * GUARANTEED VALID: TypeScript enforces structure, impossible to generate invalid output
 */

import type { WidgetConfig } from '../../shared/types';
import { calculatePosition, type GridLayout } from './gridCalculator';

/**
 * Simple widget definition from AI (Stage 2 output)
 */
export interface SimplifiedWidget {
  type: string;
  purpose?: string;
  label?: string;
  entity?: string;
  color?: string;
  existingWidgetId?: string; // Preserve existing widget ID when updating
  grid: {
    row: number;
    col: number;
    colSpan?: number;
    rowSpan?: number;
  };
  // Widget-specific properties
  min?: number;
  max?: number;
  step?: number;
  attribute?: string;
  icon?: string;
  url?: string;
  // Custom properties (AI-planned extensions)
  iconSize?: number;
  fontSize?: number;
  borderWidth?: number;
  borderRadius?: number;
  borderColor?: string;
  borderStyle?: string;
  thickness?: number; // Natural language alias for borderWidth
  customConfig?: Record<string, unknown>; // Passthrough for arbitrary AI-planned properties
  content?: string;
  style?: string;
  mode?: string;
  cardType?: string;
  cardConfig?: string;
  options?: Array<{ value: string; label: string }>; // For radiobutton, select widgets
}

/**
 * Layout configuration from AI (Stage 2 output)
 * Re-exported from gridCalculator for convenience
 */
export type LayoutConfig = GridLayout;

/**
 * Stage 2 output format (AI generates this)
 */
export interface Stage2Plan {
  understanding: string;
  widgets: SimplifiedWidget[];
  layout: LayoutConfig;
  // Edit mode fields (only present when modifying existing dashboard)
  editMode?: 'update' | 'add' | 'replace';
  targetWidgetIds?: string[];  // For editMode='update'
  updates?: Record<string, unknown>;  // For editMode='update'
}

/**
 * Generate widget ID - use existing ID if updating, generate new if creating
 */
function generateWidgetId(widget: SimplifiedWidget, index: number): string {
  return widget.existingWidgetId || `ai-widget-${Date.now()}-${index}`;
}

/**
 * Widget template functions - transform simple JSON to ExportedView format
 * Each function returns a fully-formed widget config ready for import
 */
export const widgetTemplates: Record<
  string,
  (widget: SimplifiedWidget, index: number, layout: LayoutConfig) => WidgetConfig
> = {
  // Button widget - toggle switches for lights/devices
  button: (widget, index, layout) => ({
    id: generateWidgetId(widget, index),
    type: 'button',
    config: {
      label: widget.label || 'Button',
      entity_id: widget.entity || '',
      backgroundColor: widget.color || '#3b82f6',
      textColor: '#ffffff',
      action: 'toggle',
      showIcon: widget.icon !== null && widget.icon !== undefined,
      iconName: widget.icon || 'PowerSettingsNew',
      // Support AI-planned custom properties
      ...(widget.iconSize && { iconSize: widget.iconSize }),
      ...(widget.fontSize && { fontSize: widget.fontSize }),
      ...(widget.borderWidth && { borderWidth: widget.borderWidth }),
      ...(widget.borderRadius && { borderRadius: widget.borderRadius }),
      ...(widget.customConfig || {})
    },
    position: calculatePosition(widget.grid, layout)
  }),

  // Slider widget - value controls (brightness, volume, temperature)
  slider: (widget, index, layout) => {
    // Detect domain and use appropriate defaults
    const domain = widget.entity?.split('.')[0];
    let min = widget.min;
    let max = widget.max;
    let step = widget.step;
    
    // If AI didn't specify ranges, use smart defaults based on domain/attribute
    if (min === undefined || max === undefined || step === undefined) {
      if (domain === 'climate' || widget.attribute === 'temperature') {
        // Temperature control (°C)
        min = min ?? 15;
        max = max ?? 35;
        step = step ?? 0.5;
      } else {
        // Brightness/volume/generic control
        min = min ?? 0;
        max = max ?? 255;
        step = step ?? 1;
      }
    }
    
    return {
      id: generateWidgetId(widget, index),
      type: 'slider',
      config: {
        entity_id: widget.entity || '',
        attribute: widget.attribute || 'brightness',
        min,
        max,
        step,
        orientation: 'horizontal',
        showValue: true,
        color: widget.color || '#3b82f6'
      },
      position: calculatePosition(widget.grid, layout)
    };
  },

  // Value widget - display sensor readings
  value: (widget, index, layout) => ({
    id: generateWidgetId(widget, index),
    type: 'value',
    config: {
      entity_id: widget.entity || '',
      label: widget.label || 'Value',
      fontSize: widget.fontSize || 24,
      fontColor: widget.color || '#ffffff',
      showUnit: true,
      decimals: 1,
      // Support AI-planned icons (e.g., Thermostat, WaterDrop, etc.)
      ...(widget.icon && { icon: widget.icon }),
      // Support additional AI-planned properties
      ...(widget.customConfig || {})
    },
    position: calculatePosition(widget.grid, layout)
  }),

  // Gauge widget - visual meters for percentages
  gauge: (widget, index, layout) => ({
    id: generateWidgetId(widget, index),
    type: 'gauge',
    config: {
      entity_id: widget.entity || '',
      label: widget.label || 'Gauge',
      min: widget.min ?? 0,
      max: widget.max ?? 100,
      type: 'radial',
      needleColor: widget.color || '#3b82f6',
      showValue: true
    },
    position: calculatePosition(widget.grid, layout)
  }),

  // Switch widget - toggle switches with labels
  switch: (widget, index, layout) => ({
    id: generateWidgetId(widget, index),
    type: 'switch',
    config: {
      entity_id: widget.entity || '',
      label: widget.label || 'Switch',
      onColor: widget.color || '#4caf50',
      offColor: '#757575',
      labelPosition: 'right'
    },
    position: calculatePosition(widget.grid, layout)
  }),

  // Text widget - static or dynamic text display
  text: (widget, index, layout) => ({
    id: generateWidgetId(widget, index),
    type: 'text',
    config: {
      text: widget.content || widget.label || 'Text',
      entity_id: widget.entity || '',
      fontSize: widget.fontSize || 16,
      fontColor: widget.color || '#ffffff',
      textAlign: 'left',
      fontFamily: 'Roboto',
      // Support AI-planned custom properties
      ...(widget.borderWidth && { borderWidth: widget.borderWidth }),
      ...(widget.borderRadius && { borderRadius: widget.borderRadius }),
      ...(widget.customConfig || {})
    },
    position: calculatePosition(widget.grid, layout)
  }),

  // Image widget - static or entity-bound images
  image: (widget, index, layout) => ({
    id: generateWidgetId(widget, index),
    type: 'image',
    config: {
      entity_id: widget.entity || '',
      url: widget.url || '',
      objectFit: 'cover',
      borderRadius: 4
    },
    position: calculatePosition(widget.grid, layout)
  }),

  // Icon widget - Material Design icons
  icon: (widget, index, layout) => ({
    id: generateWidgetId(widget, index),
    type: 'icon',
    config: {
      icon: widget.icon || 'mdi:help',
      entity_id: widget.entity || '',
      color: widget.color || '#ffffff',
      size: widget.iconSize || 48,
      library: widget.icon?.startsWith('mdi:') ? 'mdi' : 'mui',
      // Support AI-planned custom properties
      ...(widget.borderWidth && { borderWidth: widget.borderWidth }),
      ...(widget.borderRadius && { borderRadius: widget.borderRadius }),
      ...(widget.customConfig || {})
    },
    position: calculatePosition(widget.grid, layout)
  }),

  // Progress Bar widget - linear progress indicators
  progressbar: (widget, index, layout) => ({
    id: generateWidgetId(widget, index),
    type: 'progressbar',
    config: {
      entity_id: widget.entity || '',
      min: widget.min ?? 0,
      max: widget.max ?? 100,
      color: widget.color || '#3b82f6',
      showValue: true,
      height: 10,
      // Support AI-planned custom properties
      ...(widget.customConfig || {})
    },
    position: calculatePosition(widget.grid, layout)
  }),

  // Progress Circle widget - circular progress
  progresscircle: (widget, index, layout) => ({
    id: generateWidgetId(widget, index),
    type: 'progresscircle',
    config: {
      entity_id: widget.entity || '',
      min: widget.min ?? 0,
      max: widget.max ?? 100,
      color: widget.color || '#3b82f6',
      showValue: true,
      mode: widget.mode || 'circular'
    },
    position: calculatePosition(widget.grid, layout)
  }),

  // Input Text widget - text input fields
  inputtext: (widget, index, layout) => ({
    id: generateWidgetId(widget, index),
    type: 'inputtext',
    config: {
      entity_id: widget.entity || '',
      label: widget.label || 'Input',
      placeholder: 'Enter text...',
      fontSize: 14
    },
    position: calculatePosition(widget.grid, layout)
  }),

  // Flip Clock widget - animated flip clock
  flipclock: (widget, index, layout) => ({
    id: generateWidgetId(widget, index),
    type: 'flipclock',
    config: {
      format: '24',
      showDate: false,
      color: widget.color || '#ffffff'
    },
    position: calculatePosition(widget.grid, layout)
  }),

  // Digital Clock widget - LED-style clock
  digitalclock: (widget, index, layout) => ({
    id: generateWidgetId(widget, index),
    type: 'digitalclock',
    config: {
      format: '24',
      showSeconds: true,
      font: 'DSEG7',
      color: widget.color || '#00ff00'
    },
    position: calculatePosition(widget.grid, layout)
  }),

  // Knob widget - rotary control knobs
  knob: (widget, index, layout) => ({
    id: generateWidgetId(widget, index),
    type: 'knob',
    config: {
      entity_id: widget.entity || '',
      min: widget.min ?? 0,
      max: widget.max ?? 100,
      step: widget.step ?? 1,
      skin: 'dial',
      color: widget.color || '#3b82f6'
    },
    position: calculatePosition(widget.grid, layout)
  }),

  // IFrame widget - embed external content
  iframe: (widget, index, layout) => ({
    id: generateWidgetId(widget, index),
    type: 'iframe',
    config: {
      url: widget.url || 'about:blank',
      entity_id: widget.entity || ''
    },
    position: calculatePosition(widget.grid, layout)
  }),

  // Border widget - decorative borders
  border: (widget, index, layout) => ({
    id: generateWidgetId(widget, index),
    type: 'border',
    config: {
      borderWidth: widget.borderWidth || widget.thickness || 2,
      borderColor: widget.borderColor || widget.color || '#ffffff',
      borderStyle: widget.borderStyle || widget.style || 'solid',
      borderRadius: widget.borderRadius ?? 0
    },
    position: calculatePosition(widget.grid, layout)
  }),

  // Radio Button widget - radio button groups
  radiobutton: (widget, index, layout) => ({
    id: generateWidgetId(widget, index),
    type: 'radiobutton',
    config: {
      entity_id: widget.entity || '',
      label: widget.label || 'Radio',
      color: widget.color || '#3b82f6',
      // Pass through options array from AI's plan (critical for radio buttons!)
      ...(widget.options && widget.options.length > 0 && { options: widget.options })
    },
    position: calculatePosition(widget.grid, layout)
  }),

  // Color Picker widget - RGB/HSV color selection
  colorpicker: (widget, index, layout) => ({
    id: generateWidgetId(widget, index),
    type: 'colorpicker',
    config: {
      entity_id: widget.entity || '',
      mode: widget.mode || 'rgb',
      showPreview: true
    },
    position: calculatePosition(widget.grid, layout)
  }),

  // Weather widget - weather display + forecast
  weather: (widget, index, layout) => {
    const position = calculatePosition(widget.grid, layout);
    // Weather widgets need minimum 120px height for proper rendering
    const minHeight = 120;
    if (position.height < minHeight) {
      position.height = minHeight;
    }
    
    return {
      id: generateWidgetId(widget, index),
      type: 'weather',
      config: {
        entity_id: widget.entity || '',
        mode: widget.mode || 'compact',
        showForecast: true,
        iconStyle: 'emoji'
      },
      position
    };
  },

  // Graph widget - line/bar/area charts for sensor history
  graph: (widget, index, layout) => {
    const position = calculatePosition(widget.grid, layout);
    // Graph widgets need minimum 200px height for proper MUI X Charts rendering
    const minHeight = 200;
    if (position.height < minHeight) {
      position.height = minHeight;
    }
    
    return {
      id: generateWidgetId(widget, index),
      type: 'graph',
      config: {
        entity_id: widget.entity || '',
        chartType: widget.mode || 'line',
        dataPoints: 50,
        lineColor: widget.color || '#2196f3',
        backgroundColor: '#ffffff',
        showLegend: true,
        showGrid: true,
        smooth: true,
        borderRadius: 4
      },
      position
    };
  },

  // Lovelace Card widget - embed any HA Lovelace card
  lovelacecard: (widget, index, layout) => {
    // Generate default cardConfig using widget.entity if not explicitly provided
    let defaultCardConfig = 'entities:\n  - sun.sun';
    if (widget.entity) {
      defaultCardConfig = `entities:\n  - ${widget.entity}`;
    }
    
    const cardConfig = widget.cardConfig || defaultCardConfig;
    
    // Extract card type from cardConfig if present (e.g., "type: thermostat")
    // This handles AI providing type inside the YAML config
    let cardType = widget.cardType || 'entities';
    const typeMatch = cardConfig.match(/^type:\s*(\w+)/m);
    if (typeMatch) {
      cardType = typeMatch[1];
    }
    
    return {
      id: generateWidgetId(widget, index),
      type: 'lovelacecard',
      config: {
        cardType: cardType,
        cardConfig: cardConfig,
        cornerRadius: 12
      },
      position: calculatePosition(widget.grid, layout)
    };
  },

  // Camera widget - live camera streams
  camera: (widget, index, layout) => ({
    id: generateWidgetId(widget, index),
    type: 'camera',
    config: {
      entity_id: widget.entity || '',
      streamMode: widget.mode || 'auto',
      objectFit: 'cover',
      showControls: true,
      muted: true,
      autoplay: true
    },
    position: calculatePosition(widget.grid, layout)
  }),

  // HTML widget - custom HTML content
  html: (widget, index, layout) => ({
    id: generateWidgetId(widget, index),
    type: 'html',
    config: {
      html: widget.content || '<div>HTML content</div>',
      useEntityHtml: false,
      backgroundColor: 'transparent',
      padding: 8
    },
    position: calculatePosition(widget.grid, layout)
  }),

  // Calendar widget - upcoming events display
  calendar: (widget, index, layout) => ({
    id: generateWidgetId(widget, index),
    type: 'calendar',
    config: {
      entity_id: widget.entity || '',
      maxEvents: 5,
      daysAhead: 7,
      showDate: true,
      showTime: true,
      compactMode: false,
      backgroundColor: '#ffffff',
      headerColor: '#2196f3'
    },
    position: calculatePosition(widget.grid, layout)
  }),

  // Scrolling Text widget - right-to-left ticker
  scrollingtext: (widget, index, layout) => ({
    id: generateWidgetId(widget, index),
    type: 'scrollingtext',
    config: {
      text: widget.content || widget.label || 'Scrolling text...',
      entity_id: widget.entity || '',
      speed: 50,
      fontSize: 24,
      textColor: '#ffffff',
      backgroundColor: '#000000'
    },
    position: calculatePosition(widget.grid, layout)
  }),

  // Keyboard widget - virtual keyboard
  keyboard: (widget, index, layout) => ({
    id: generateWidgetId(widget, index),
    type: 'keyboard',
    config: {
      layout: widget.mode || 'default',
      target_entity: widget.entity || '',
      showDisplay: true,
      draggable: true
    },
    position: calculatePosition(widget.grid, layout)
  }),

  // Resolution widget - dashboard boundaries (design tool)
  resolution: (widget, index, layout) => ({
    id: generateWidgetId(widget, index),
    type: 'resolution',
    config: {
      resolutionWidth: 1920,
      resolutionHeight: 1080,
      showGrid: true,
      lineColor: '#2196f3',
      lineOpacity: 0.3
    },
    position: calculatePosition(widget.grid, layout)
  })
};

/**
 * Transform Stage 2 plan to ExportedView format
 * This is Stage 3 of the pipeline - instant TypeScript transformation
 * 
 * Supports three modes:
 * 1. editMode='update': Returns widget updates for partial modification
 * 2. editMode='add': Returns new widgets to add to existing canvas
 * 3. editMode='replace' or undefined: Returns complete new view (default)
 */
export function transformPlanToView(plan: Stage2Plan): {
  version: string;
  exportedAt: string;
  view: {
    id: string;
    name: string;
    style: {
      backgroundColor: string;
      backgroundOpacity: number;
    };
    widgets: WidgetConfig[];
  };
  metadata: {
    widgetCount: number;
    exportedFrom: string;
    generatedAt: string;
    editMode?: 'update' | 'add' | 'replace';
    targetWidgetIds?: string[];
    widgetUpdates?: Record<string, Partial<WidgetConfig>>;
  };
} {
  const timestamp = new Date().toISOString();

  // Handle PARTIAL UPDATE mode
  if (plan.editMode === 'update' && plan.targetWidgetIds && plan.updates) {
    console.log(`[Stage 3] Edit mode: UPDATE - modifying ${plan.targetWidgetIds.length} widget(s)`);
    
    // Create widget updates map
    const widgetUpdates: Record<string, Partial<WidgetConfig>> = {};
    for (const widgetId of plan.targetWidgetIds) {
      widgetUpdates[widgetId] = {
        config: plan.updates as Record<string, unknown>
      };
    }

    return {
      version: '2.0.0',
      exportedAt: timestamp,
      view: {
        id: `ai-update-${Date.now()}`,
        name: 'AI Widget Updates',
        style: {
          backgroundColor: '#1a1a2e',
          backgroundOpacity: 1
        },
        widgets: []  // No new widgets, just updates
      },
      metadata: {
        widgetCount: 0,
        exportedFrom: 'ai-builder',
        generatedAt: timestamp,
        editMode: 'update',
        targetWidgetIds: plan.targetWidgetIds,
        widgetUpdates
      }
    };
  }

  // Handle ADD NEW or REPLACE mode (generate widgets)
  const widgets = plan.widgets.map((widget, index) => {
    const template = widgetTemplates[widget.type];
    if (!template) {
      throw new Error(`Unknown widget type: ${widget.type}`);
    }
    return template(widget, index, plan.layout);
  });

  console.log(`[Stage 3] Edit mode: ${plan.editMode || 'replace'} - generated ${widgets.length} widget(s)`);

  return {
    version: '2.0.0',
    exportedAt: timestamp,
    view: {
      id: `ai-view-${Date.now()}`,
      name: plan.editMode === 'add' ? 'AI Added Widgets' : 'AI Generated View',
      style: {
        backgroundColor: '#1a1a2e',
        backgroundOpacity: 1
      },
      widgets
    },
    metadata: {
      widgetCount: widgets.length,
      exportedFrom: 'ai-builder',
      generatedAt: timestamp,
      editMode: plan.editMode || 'replace'
    }
  };
}

/**
 * Get list of all supported widget types
 * For inclusion in Stage 2 prompts
 */
export function getSupportedWidgetTypes(): string[] {
  return Object.keys(widgetTemplates);
}
