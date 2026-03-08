# Widget Bindings: Method 2 - Binding Expressions (BindingBinder)

Automatic expression evaluation using BindingBinder for fields with `binding: true`.

**Use for:** Widgets with binding-enabled fields (text, color, icon with `binding: true`)

## BindingBinder Flow

```
Widget Created
     ↓
mount() → setupBindings()
     ↓
BindingBinder.bindWidget(widgetId, config)
     ↓
BindingBinder scans config for {entity;...} expressions
     ↓
Extracts entity IDs from expressions
     ↓
Subscribes to all referenced entities
     ↓
On entity update:
     ├─→ Evaluates expression
     ├─→ Calls widget.updateDisplay({ field: evaluatedValue })
     └─→ Widget updates display
     ↓
unmount() → cleanupBindings()
     ↓
BindingBinder.unbindWidget(widgetId)
     ↓
Unsubscribes from all entities
```

## Binding Expression Formats

```javascript
// Simple state binding
"{sensor.temperature;.state}"; // → "72.5"

// Math operations
"{sensor.humidity;.state;*100;round}"; // → "65"

// Attribute access
"{light.kitchen;.attributes.rgb_color}"; // → [255, 120, 0]

// String concatenation
"{sensor.temp;.state;+' °F'}"; // → "72.5 °F"

// Multi-variable expressions
"{t:sensor.temp;h:sensor.humidity;t+' @ '+h+'%'}"; // → "72 @ 65%"
```

## Expression Evaluation Steps

```
Expression: "{sensor.temp;.state;*1.8;+32;round}"
     ↓
Extract entity: "sensor.temp"
     ↓
Subscribe to entity
     ↓
Get entity state: { state: "20", ... }
     ↓
Evaluate expression:
     20 → *1.8 → 36 → +32 → 68 → round → 68
     ↓
Return evaluated value: 68
     ↓
Call widget.updateDisplay({ fieldName: 68 })
```

## Step 1: Define Binding-Enabled Fields

```javascript
static getMetadata() {
  return {
    name: "Advanced Text",
    icon: "mdi-text",
    category: "advanced",
    defaultSize: { w: 300, h: 100 },

    customFields: [
      {
        name: "text",
        type: "text",
        label: "Text",
        default: "Hello",
        binding: true        // ← ENABLES BINDING EXPRESSIONS
      },
      {
        name: "textColor",
        type: "color",
        label: "Text Color",
        default: "#ffffff",
        binding: true        // ← ALLOWS COLOR BINDINGS
      }
    ]
  };
}
```

## Step 2: Setup BindingBinder

```javascript
setupBindings() {
  if (!this.canvasCore?.bindingBinder) {
    console.warn("BindingBinder not available");
    return;
  }

  // BindingBinder automatically:
  // 1. Scans config for {entity;...} expressions
  // 2. Extracts entity IDs
  // 3. Subscribes to all entities
  // 4. Evaluates expressions on state changes
  // 5. Calls updateDisplay() with results

  this.canvasCore.bindingBinder.bindWidget(this.config.id, this.config);
}
```

**Why it's easy:**

- No manual entity extraction
- No manual subscription
- No manual evaluation
- Automatic multi-entity handling

## Step 3: Handle Evaluated Values

```javascript
/**
 * Called by BindingBinder when bindings update
 * @param {Object} evaluatedValues - { field: evaluatedValue, ... }
 */
updateDisplay(evaluatedValues) {
  // Evaluated values (NOT expressions)
  // text: "72.5°F" (not "{sensor.temp;.state}°F")
  // textColor: "#ff7800" (not "{light.kitchen;.attributes.rgb_color}")

  if (evaluatedValues.text !== undefined) {
    this.element.textContent = evaluatedValues.text;
  }

  if (evaluatedValues.textColor !== undefined) {
    this.element.style.color = evaluatedValues.textColor;
  }
}
```

**Critical Difference:**

- Direct Subscription: Receives full state object
- BindingBinder: Receives evaluated final values

## Step 4: Cleanup

```javascript
cleanupBindings() {
  if (this.canvasCore?.bindingBinder) {
    this.canvasCore.bindingBinder.unbindWidget(this.config.id);
  }
}
```

**What unbindWidget() does:**

- Unsubscribes from ALL entities referenced in expressions
- Clears evaluation cache
- Removes widget from binding registry

## Complete BindingBinder Example

```javascript
class AdvancedTextWidget extends BaseWidget {
  static getMetadata() {
    return {
      name: "Advanced Text",
      icon: "mdi-text-box",
      category: "advanced",
      defaultSize: { w: 300, h: 100 },

      customFields: [
        {
          name: "text",
          type: "text",
          label: "Text",
          default: "Hello",
          binding: true,
        },
        {
          name: "textColor",
          type: "color",
          label: "Text Color",
          default: "#ffffff",
          binding: true,
        },
        {
          name: "fontSize",
          type: "number",
          label: "Font Size",
          default: 16,
          min: 8,
          max: 72,
        },
      ],
    };
  }

  mount(container) {
    this.element = document.createElement("div");
    this.element.className = "advanced-text";

    // Initial render (shows expression OR static value)
    this.render();

    // Setup BindingBinder
    this.setupBindings();

    container.appendChild(this.element);
    this.mounted = true;
  }

  render() {
    // Show current value (expression or static)
    this.element.textContent = this.config.text || "";
    this.element.style.fontSize = (this.config.fontSize || 16) + "px";
    this.element.style.color = this.config.textColor || "#ffffff";
  }

  setupBindings() {
    if (!this.canvasCore?.bindingBinder) return;
    this.canvasCore.bindingBinder.bindWidget(this.config.id, this.config);
  }

  cleanupBindings() {
    if (this.canvasCore?.bindingBinder) {
      this.canvasCore.bindingBinder.unbindWidget(this.config.id);
    }
  }

  updateDisplay(evaluatedValues) {
    // BindingBinder sends evaluated values (not expressions)
    if (evaluatedValues.text !== undefined) {
      this.element.textContent = evaluatedValues.text;
    }

    if (evaluatedValues.textColor !== undefined) {
      this.element.style.color = evaluatedValues.textColor;
    }
  }

  updateConfig(newConfig) {
    Object.assign(this.config, newConfig);

    // Re-bind if binding fields changed
    if (newConfig.text !== undefined || newConfig.textColor !== undefined) {
      this.setupBindings();
    }

    // Direct update for non-binding fields
    if (newConfig.fontSize !== undefined) {
      this.element.style.fontSize = newConfig.fontSize + "px";
    }
  }

  unmount() {
    this.cleanupBindings();
    this.element.remove();
    this.mounted = false;
  }
}
```

## BindingBinder API Reference

```javascript
// Bind widget (auto-detect and subscribe)
bindingBinder.bindWidget(widgetId, config);

// Unbind widget (cleanup all subscriptions)
bindingBinder.unbindWidget(widgetId);

// Manually evaluate expression
const result = bindingBinder.evaluate("{sensor.temp;.state;*1.8;+32}");

// Extract entities from expression
const entities = bindingBinder.extractEntities(
  "{t:sensor.temp;h:sensor.humidity;t+h}",
);
// → ["sensor.temp", "sensor.humidity"]

// Check if string contains binding expression
const hasBinding = bindingBinder.hasBinding("{entity;.state}"); // → true
const hasBinding2 = bindingBinder.hasBinding("static text"); // → false
```

## Binding Expression Examples

### Simple Value Binding

```javascript
// Display sensor state
text: "{sensor.temperature;.state}";
// Result: "72.5"
```

### Math Operations

```javascript
// Convert Celsius to Fahrenheit
text: "{sensor.temp;.state;*1.8;+32;round}";
// Result: "163" (72.5°C → 163°F)
```

### String Concatenation

```javascript
// Add units
text: "{sensor.temp;.state;+' °F'}";
// Result: "72.5 °F"
```

### Multi-Variable Expressions

```javascript
// Combine multiple sensors
text: "{t:sensor.temp;h:sensor.humidity;t+' @ '+h+'%'}";
// Result: "72.5 @ 65%"
```

### Color Binding

```javascript
// Use light's color
textColor: "{light.kitchen;.attributes.rgb_color}";
// Result: "#ff7800" (auto-converted from [255, 120, 0])
```

### Icon Binding

```javascript
// Use entity's icon
icon: "{sensor.temperature;.attributes.icon}";
// Result: "mdi-thermometer"
```

## Navigate

↑ **Overview**: [widget-dev-entity-bindings.md](widget-dev-entity-bindings.md) - Binding method comparison
← **Previous**: [widget-dev-bindings-direct-entity.md](widget-dev-bindings-direct-entity.md) - Direct subscription method
→ **Next**: [widget-dev-bindings-multi-entity.md](widget-dev-bindings-multi-entity.md) - Multiple entity pattern
⟲ **Metadata**: [widget-dev-metadata.md](widget-dev-metadata.md) - Enable binding with `binding: true`
⟲ **Rendering**: [widget-dev-rendering.md](widget-dev-rendering.md) - updateDisplay() handles evaluated values
⟲ **Class Structure**: [widget-dev-class-structure.md](widget-dev-class-structure.md) - Where bindings fit
