# Widget Metadata: Examples

Progressive complexity examples showing metadata evolution from simple to advanced.

## Metadata Examples - Progressive Complexity

### Level 1: Minimal (Static Display)

```javascript
static getMetadata() {
  return {
    name: "Text",
    icon: "mdi-text",
    category: "basic",
    defaultSize: { w: 200, h: 50 },

    customFields: [
      { name: "text", type: "text", label: "Text", default: "Text" }
    ]
  };
}
```

**Use for:** Static text display widget

**Features:**

- Single text field
- No entity binding
- Basic sizing

### Level 2: Entity Integration

```javascript
static getMetadata() {
  return {
    name: "Entity State",
    icon: "mdi-database",
    category: "basic",
    defaultSize: { w: 200, h: 100 },

    customFields: [
      { name: "entity", type: "entity", label: "Entity", default: "" },
      { name: "showIcon", type: "checkbox", label: "Show Icon", default: true }
    ]
  };
}
```

**Use for:** Simple entity display widget

**Features:**

- Entity picker
- Optional icon display
- Checkbox control

### Level 3: Interactive Widget

```javascript
static getMetadata() {
  return {
    name: "Button",
    icon: "mdi-gesture-tap",
    category: "basic",
    defaultSize: { w: 200, h: 100 },

    customFields: [
      { name: "text", type: "text", label: "Text", default: "Button", binding: true },
      { name: "icon", type: "icon", label: "Icon", default: "" },
      { name: "entity", type: "entity", label: "Entity", default: "" },
      { name: "tapAction", type: "tapAction", label: "Tap Action",
        default: { action: "none" } }
    ]
  };
}
```

**Use for:** Interactive button widget

**Features:**

- Binding-enabled text
- Icon picker
- Entity selection
- Tap action configuration

### Level 4: Full-Featured Widget

```javascript
static getMetadata() {
  return {
    name: "Advanced Button",
    icon: "mdi-gesture-tap-button",
    category: "advanced",
    description: "A button with advanced styling and actions",
    version: "2.0.0",

    defaultSize: { w: 200, h: 100 },
    minSize: { w: 50, h: 30 },
    maxSize: { w: 600, h: 300 },

    requiresEntity: false,
    requiresConfig: false,

    customFields: [
      // Text & display
      { name: "text", type: "text", label: "Text", default: "Button", binding: true },
      { name: "icon", type: "icon", label: "Icon", default: "mdi-help" },
      { name: "showIcon", type: "checkbox", label: "Show Icon", default: true },

      // Entity & action
      { name: "entity", type: "entity", label: "Entity", default: "" },
      { name: "tapAction", type: "tapAction", label: "Tap Action",
        default: { action: "none" } },

      // Styling
      { name: "fontSize", type: "number", label: "Font Size", default: 16,
        min: 8, max: 72 },
      { name: "textColor", type: "color", label: "Text Color", default: "#ffffff",
        binding: true },
      { name: "fontFamily", type: "font", label: "Font", default: "Arial, sans-serif" },

      // Layout
      { name: "alignment", type: "select", label: "Alignment", default: "center",
        options: [
          { value: "left", label: "Left" },
          { value: "center", label: "Center" },
          { value: "right", label: "Right" }
        ]
      }
    ]
  };
}
```

**Use for:** Production-ready advanced widget

**Features:**

- Complete identity (name, icon, description, version)
- Size constraints (default, min, max)
- Behavior flags (requiresEntity, requiresConfig)
- Comprehensive custom fields
- Binding support
- Advanced styling
- Layout options

### Level 5: Multi-Entity Widget

```javascript
static getMetadata() {
  return {
    name: "Multi Sensor",
    icon: "mdi-gauge-empty",
    category: "advanced",
    description: "Display multiple sensor values",
    defaultSize: { w: 400, h: 200 },

    customFields: [
      // Multiple entity fields
      { name: "temperature", type: "entity", label: "Temperature", default: "" },
      { name: "humidity", type: "entity", label: "Humidity", default: "" },
      { name: "pressure", type: "entity", label: "Pressure", default: "" },

      // Display options
      { name: "showLabels", type: "checkbox", label: "Show Labels", default: true },
      { name: "showUnits", type: "checkbox", label: "Show Units", default: true },
      { name: "fontSize", type: "number", label: "Font Size", default: 14,
        min: 10, max: 48 }
    ]
  };
}
```

**Use for:** Multi-entity dashboard widget

**Features:**

- Multiple entity pickers
- Display customization
- Size controls

### Level 6: Complex Layout Widget

```javascript
static getMetadata() {
  return {
    name: "Gauge",
    icon: "mdi-gauge",
    category: "gauges",
    description: "Circular gauge with customizable ranges",
    version: "1.5.0",

    defaultSize: { w: 300, h: 300 },
    minSize: { w: 100, h: 100 },
    maxSize: { w: 800, h: 800 },

    customFields: [
      // Data source
      { name: "entity", type: "entity", label: "Entity", default: "" },

      // Gauge configuration
      { name: "min", type: "number", label: "Minimum", default: 0 },
      { name: "max", type: "number", label: "Maximum", default: 100 },
      { name: "unit", type: "text", label: "Unit", default: "" },

      // Visual style
      { name: "gaugeType", type: "select", label: "Type", default: "arc",
        options: [
          { value: "arc", label: "Arc" },
          { value: "circle", label: "Full Circle" },
          { value: "donut", label: "Donut" }
        ]
      },

      // Color ranges
      { name: "lowColor", type: "color", label: "Low Color", default: "#00ff00" },
      { name: "medColor", type: "color", label: "Medium Color", default: "#ffff00" },
      { name: "highColor", type: "color", label: "High Color", default: "#ff0000" },

      // Thresholds
      { name: "lowThreshold", type: "number", label: "Low Threshold", default: 33 },
      { name: "highThreshold", type: "number", label: "High Threshold", default: 66 },

      // Display options
      { name: "showValue", type: "checkbox", label: "Show Value", default: true },
      { name: "showMinMax", type: "checkbox", label: "Show Min/Max", default: true },
      { name: "animate", type: "checkbox", label: "Animate", default: true }
    ]
  };
}
```

**Use for:** Complex visualization widget

**Features:**

- Comprehensive configuration
- Multiple color controls
- Threshold settings
- Layout options
- Animation controls

## Evolution Path

```
Level 1 (Minimal)
  ├── Single field
  └── Basic display
      ↓
Level 2 (Entity)
  ├── Entity integration
  └── Simple options
      ↓
Level 3 (Interactive)
  ├── Actions
  ├── Bindings
  └── User interaction
      ↓
Level 4 (Full-Featured)
  ├── Complete metadata
  ├── Size constraints
  ├── Advanced styling
  └── Multiple features
      ↓
Level 5 (Multi-Entity)
  ├── Multiple data sources
  └── Complex data handling
      ↓
Level 6 (Complex)
  ├── Advanced visualization
  ├── Ranges/thresholds
  └── Animation
```

## Metadata Validation Checklist

**Before deploying a widget:**

- [ ] `name` is descriptive and unique
- [ ] `icon` is valid MDI icon (check pictogrammers.com)
- [ ] `category` matches toolbar categories
- [ ] `defaultSize` is appropriate for widget type
- [ ] `minSize` prevents unreadable sizes (if set)
- [ ] `maxSize` prevents performance issues (if set)
- [ ] `requiresEntity` matches widget functionality
- [ ] `requiresConfig` improves UX (if needed)
- [ ] All `customFields` have:
  - [ ] Unique `name` values
  - [ ] Appropriate `type` for data
  - [ ] Clear `label` text
  - [ ] Sensible `default` values
  - [ ] `binding: true` if expressions supported
- [ ] `select` fields have `options` array
- [ ] `number` fields have `min`, `max`, `step` (if needed)
- [ ] Test all fields in inspector
- [ ] Test binding expressions (if enabled)

## Navigate

↑ **Overview**: [widget-dev-metadata.md](widget-dev-metadata.md) - Metadata building flow
← **Field Types**: [widget-dev-metadata-field-types.md](widget-dev-metadata-field-types.md) - Complete field reference
⟲ **Complete Example**: [widget-dev-complete-example.md](widget-dev-complete-example.md) - See Level 3 in action
⟲ **Class Structure**: [widget-dev-class-structure.md](widget-dev-class-structure.md) - Where metadata fits
