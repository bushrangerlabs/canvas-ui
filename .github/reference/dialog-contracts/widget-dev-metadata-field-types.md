# Widget Metadata: Field Type Reference

Complete reference for all available inspector field types.

## Complete Field Type Reference

| Type         | Dialog           | Input           | Binding Support             | Value Type    |
| ------------ | ---------------- | --------------- | --------------------------- | ------------- |
| `text`       | None             | Text input      | ✓ Yes                       | String        |
| `number`     | None             | Number input    | ✓ Yes                       | Number        |
| `checkbox`   | None             | Checkbox        | ✗ No                        | Boolean       |
| `select`     | None             | Dropdown        | ✗ No                        | String        |
| `entity`     | EntityPicker     | Button → Dialog | ✗ No (returns entity ID)    | String        |
| `icon`       | IconPicker       | Button → Dialog | ✓ Yes ({entity;.icon})      | String        |
| `color`      | ColorPicker      | Button → Dialog | ✓ Yes ({entity;.rgb_color}) | String (hex)  |
| `font`       | FontPicker       | Button → Dialog | ✗ No                        | String        |
| `border`     | BorderEditor     | Button → Dialog | Partial (individual props)  | String (CSS)  |
| `shadow`     | ShadowEditor     | Button → Dialog | Partial (individual props)  | String (CSS)  |
| `tapAction`  | TapActionEditor  | Button → Dialog | ✗ No (action object)        | Object        |
| `visibility` | VisibilityEditor | Button → Dialog | ✗ No (condition string)     | String        |
| `binding`    | BindingEditor    | Button → Dialog | N/A (creates binding)       | String (expr) |

## Field Type Decision Tree

```
What kind of data?
│
├── TEXT INPUT
│   ├── Simple text? → type: "text"
│   ├── With entity binding? → type: "text", binding: true
│   └── Multiline? → type: "text" (add textarea class)
│
├── NUMBER INPUT
│   ├── Integer? → type: "number", step: 1
│   ├── Float? → type: "number", step: 0.1
│   └── Range? → Add min, max constraints
│
├── CHOICE
│   ├── Yes/No? → type: "checkbox"
│   └── Multiple options? → type: "select", options: [...]
│
├── HOME ASSISTANT
│   ├── Entity? → type: "entity"
│   ├── Icon? → type: "icon"
│   └── Color? → type: "color"
│
├── STYLING
│   ├── Font? → type: "font"
│   ├── Border? → type: "border"
│   └── Shadow? → type: "shadow"
│
├── INTERACTION
│   ├── Click action? → type: "tapAction"
│   └── Visibility rule? → type: "visibility"
│
└── ADVANCED
    └── Binding expression? → type: "binding"
```

## Field Definitions

### Field 1: Text Input

```javascript
{
  name: "text",               // Becomes this.config.text
  type: "text",               // Text input field
  label: "Button Text",       // Inspector label
  default: "Click Me",        // Default value

  // OPTIONAL:
  placeholder: "Enter text...",  // Input hint
  binding: true               // Enable {entity;.state} expressions
}
```

**When to Use:**

- Display labels
- Button text
- Widget titles
- Any string data

### Field 2: Entity Picker

```javascript
{
  name: "entity",
  type: "entity",
  label: "Entity",
  default: "",

  // OPTIONAL:
  required: false             // Make field mandatory
}
```

**What Happens:**

```
User clicks "Select Entity" button
     ↓
EntityPicker dialog opens
     ↓
User browses/searches entities
     ↓
User selects entity
     ↓
this.config.entity = "light.kitchen"
```

### Field 3: Icon Picker

```javascript
{
  name: "icon",
  type: "icon",
  label: "Icon",
  default: "mdi-help",

  // OPTIONAL:
  binding: true               // Allow {entity;.attributes.icon}
}
```

**Icon Binding Example:**

```javascript
// Static icon
icon: "mdi-lightbulb";

// Dynamic icon from entity attribute
icon: "{light.kitchen;.attributes.icon}";
// Evaluates to entity's icon value
```

### Field 4: Number Input

```javascript
{
  name: "fontSize",
  type: "number",
  label: "Font Size",
  default: 16,

  // OPTIONAL:
  min: 8,                     // Minimum value
  max: 72,                    // Maximum value
  step: 1                     // Increment step
}
```

**Number Constraints:**

```
Font sizes: min: 8, max: 72, step: 1
Opacity: min: 0, max: 1, step: 0.1
Rotation: min: 0, max: 360, step: 15
```

### Field 5: Dropdown Select

```javascript
{
  name: "alignment",
  type: "select",
  label: "Text Alignment",
  default: "center",
  options: [
    { value: "left", label: "Left" },
    { value: "center", label: "Center" },
    { value: "right", label: "Right" }
  ]
}
```

**Options Structure:**

- `value`: Stored in config
- `label`: Shown to user

### Field 6: Checkbox

```javascript
{
  name: "showIcon",
  type: "checkbox",
  label: "Show Icon",
  default: true
}
```

**Checkbox Values:**

- `true` or `false` only
- No binding support

### Field 7: Color Picker

```javascript
{
  name: "textColor",
  type: "color",
  label: "Text Color",
  default: "#ffffff",

  // OPTIONAL:
  binding: true               // Allow {entity;.attributes.rgb_color}
}
```

**Color Binding Example:**

```javascript
// Static color
textColor: "#ff0000";

// Dynamic from entity
textColor: "{light.kitchen;.attributes.rgb_color}";
// Evaluates to [255, 120, 0] → converts to hex
```

### Field 8: Tap Action

```javascript
{
  name: "tapAction",
  type: "tapAction",
  label: "Tap Action",
  default: {
    action: "none",           // none, toggle, call-service, navigate
    entity: "",
    service: "",
    data: {}
  }
}
```

**Tap Action Types:**

```
none        → No action
toggle      → Toggle entity state
call-service → Call HA service (e.g., light.turn_on)
navigate    → Navigate to view/URL
```

### Field 9: Border Editor

```javascript
{
  name: "border",
  type: "border",
  label: "Border",
  default: "none"
}
```

**Border Values:**

```
"none"
"1px solid #ffffff"
"2px dashed #ff0000"
```

### Field 10: Shadow Editor

```javascript
{
  name: "shadow",
  type: "shadow",
  label: "Shadow",
  default: "none"
}
```

**Shadow Values:**

```
"none"
"0 2px 4px rgba(0,0,0,0.2)"
"0 4px 8px rgba(0,0,0,0.3)"
```

### Field 11: Font Picker

```javascript
{
  name: "fontFamily",
  type: "font",
  label: "Font",
  default: "Arial, sans-serif"
}
```

### Field 12: Visibility Condition

```javascript
{
  name: "visibilityCondition",
  type: "visibility",
  label: "Visibility",
  default: ""                 // Empty = always visible
}
```

**Visibility Expressions:**

```
{sensor.temp;.state;>70}        → Show if temp > 70
{light.kitchen;.state;==on}     → Show if light is on
{binary_sensor.door;.state;==off} → Show if door closed
```

## Binding Expression Support

### Fields with `binding: true`

```javascript
{
  name: "text",
  type: "text",
  label: "Text",
  default: "Hello",
  binding: true           // ← Enables binding expressions
}
```

**Evaluation Flow:**

```
Inspector: text = "{sensor.temp;.state}°F"
     ↓
Saved to config.text
     ↓
Widget calls setupBindings()
     ↓
BindingBinder.bindWidget(id, config)
     ↓
BindingBinder detects {sensor.temp;.state}
     ↓
Subscribes to sensor.temp
     ↓
On state change: evaluates expression
     ↓
Calls widget.updateDisplay({ text: "72.5°F" })
     ↓
Widget updates display
```

## Navigate

↑ **Overview**: [widget-dev-metadata.md](widget-dev-metadata.md) - Metadata building flow
→ **Examples**: [widget-dev-metadata-examples.md](widget-dev-metadata-examples.md) - Progressive complexity examples
⟲ **Bindings**: [widget-dev-bindings-expressions.md](widget-dev-bindings-expressions.md) - How binding expressions work
⟲ **Widget API**: [widget-api-custom-section-overview.md](widget-api-custom-section-overview.md) - How inspector uses customFields
