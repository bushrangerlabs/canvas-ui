# Widget Rendering: updateDisplay() Method

Applying granular visual updates without full re-render.

**Purpose:** Apply visual updates without full re-render

## updateDisplay() Flow

```
updateDisplay({ text: "New", color: "#ff0000" }) called
     ↓
Check if text changed
     ├─→ YES → Update textEl.textContent
     └─→ NO → Skip
     ↓
Check if color changed
     ├─→ YES → Update element.style.color
     └─→ NO → Skip
     ↓
Done (only 2 DOM updates, no reflow)
```

## updateDisplay() Pattern

```javascript
updateDisplay(changes) {
  // ===========================================================
  // TEXT UPDATE
  // ===========================================================
  if (changes.text !== undefined && this.textEl) {
    this.textEl.textContent = changes.text;
  }

  // ===========================================================
  // ICON UPDATE
  // ===========================================================
  if (changes.icon !== undefined && this.iconEl) {
    // Remove old icon class, add new
    this.iconEl.className = `button-icon ${changes.icon}`;
  }

  // ===========================================================
  // COLOR UPDATE
  // ===========================================================
  if (changes.textColor !== undefined) {
    this.element.style.color = changes.textColor;
  }

  // ===========================================================
  // SIZE UPDATE
  // ===========================================================
  if (changes.fontSize !== undefined) {
    this.element.style.fontSize = changes.fontSize + 'px';
  }

  // ===========================================================
  // VISIBILITY UPDATE
  // ===========================================================
  if (changes.visible !== undefined) {
    this.element.style.display = changes.visible ? 'block' : 'none';
  }
}
```

## updateDisplay() Best Practices

**✓ DO:**

- Check if element exists before updating
- Use cached DOM references
- Only update what changed
- Batch style changes

**✗ DON'T:**

- Don't query DOM repeatedly
- Don't change innerHTML
- Don't trigger unnecessary reflows
- Don't update if value unchanged

## Binding Expression Rendering

When using BindingBinder, handle evaluated values:

```javascript
static getMetadata() {
  return {
    customFields: [
      {
        name: "text",
        type: "text",
        label: "Text",
        default: "Hello",
        binding: true  // ← Allows {entity;.state}
      }
    ]
  };
}

mount(container) {
  this.element = document.createElement('div');
  this.element.className = 'text-widget';

  // Initial render (shows binding expression OR static text)
  this.render();

  // BindingBinder will evaluate and call updateDisplay
  this.setupBindings();

  container.appendChild(this.element);
}

render() {
  // Show current value (expression or static)
  this.element.textContent = this.config.text || '';
}

updateDisplay(changes) {
  // BindingBinder calls this with EVALUATED value
  if (changes.text !== undefined) {
    // changes.text is "72.5" (evaluated)
    // NOT "{sensor.temp;.state}" (expression)
    this.element.textContent = changes.text;
  }
}
```

**Binding Rendering Flow:**

```
Inspector: text = "{sensor.temp;.state}°F"
     ↓
render() shows: "{sensor.temp;.state}°F" (expression as-is)
     ↓
BindingBinder evaluates
     ↓
updateDisplay({ text: "72.5°F" }) called
     ↓
Widget shows: "72.5°F" (evaluated value)
```

## Complete updateDisplay Examples

### Simple Widget

```javascript
updateDisplay(changes) {
  if (changes.text !== undefined) {
    this.element.textContent = changes.text;
  }
}
```

### Multi-Field Widget

```javascript
updateDisplay(changes) {
  // Text updates
  if (changes.text !== undefined && this.textEl) {
    this.textEl.textContent = changes.text;
  }

  if (changes.title !== undefined && this.titleEl) {
    this.titleEl.textContent = changes.title;
  }

  // Style updates
  if (changes.textColor !== undefined) {
    this.element.style.color = changes.textColor;
  }

  if (changes.fontSize !== undefined) {
    this.element.style.fontSize = changes.fontSize + 'px';
  }

  // Icon update
  if (changes.icon !== undefined && this.iconEl) {
    this.iconEl.className = `icon ${changes.icon}`;
  }
}
```

### Batched Updates

```javascript
updateDisplay(changes) {
  // Batch style changes
  const styleChanges = {};

  if (changes.textColor !== undefined) {
    styleChanges.color = changes.textColor;
  }

  if (changes.fontSize !== undefined) {
    styleChanges.fontSize = changes.fontSize + 'px';
  }

  if (changes.backgroundColor !== undefined) {
    styleChanges.backgroundColor = changes.backgroundColor;
  }

  // Apply all at once (single reflow)
  if (Object.keys(styleChanges).length > 0) {
    Object.assign(this.element.style, styleChanges);
  }

  // Text updates (separate from styles)
  if (changes.text !== undefined && this.textEl) {
    this.textEl.textContent = changes.text;
  }
}
```

## Performance Comparison

| Update Type     | Method          | DOM Impact       | Speed       |
| --------------- | --------------- | ---------------- | ----------- |
| Full re-render  | render()        | Complete rebuild | ⭐ Slow     |
| Text update     | updateDisplay() | Single property  | ⭐⭐⭐ Fast |
| Style update    | updateDisplay() | Style only       | ⭐⭐⭐ Fast |
| Multiple styles | Batched updates | Single reflow    | ⭐⭐ Medium |

## Navigate

↑ **Overview**: [widget-dev-rendering.md](widget-dev-rendering.md) - Rendering method comparison
← **Previous**: [widget-dev-rendering-render-method.md](widget-dev-rendering-render-method.md) - render() method
→ **Next**: [widget-dev-rendering-optimization.md](widget-dev-rendering-optimization.md) - Performance techniques
⟲ **Bindings**: [widget-dev-bindings-expressions.md](widget-dev-bindings-expressions.md) - BindingBinder calls updateDisplay()
⟲ **Lifecycle**: [widget-dev-lifecycle-updateConfig.md](widget-dev-lifecycle-updateConfig.md) - Granular updates strategy
