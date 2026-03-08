# React Inspector Integration Guide

## Overview

The React Inspector can control existing vanilla JS widgets through the Widget Bridge communication layer. This allows incremental migration - we don't have to rewrite all widgets at once.

## Integration Steps

### 1. Embed React Inspector in Home Assistant

Add the React inspector to your Home Assistant dashboard:

```html
<!-- In your dashboard or panel -->
<iframe
  src="/local/canvas-ui-react/index.html"
  style="width: 400px; height: 100vh; border: none; position: fixed; right: 0; top: 0; z-index: 1000;"
></iframe>
```

Or use it side-by-side with the canvas.

### 2. Add Bridge Communication to Vanilla Widgets

In your vanilla widget files (e.g., `progress-gauge-widget.js`), add this code:

```javascript
// Listen for config updates from React Inspector
window.addEventListener("react-inspector-message", (event) => {
  const message = event.detail;

  if (message.type === "config-updated" && message.widgetId === this.id) {
    // Update this widget's configuration
    this.config[message.property] = message.value;

    // Trigger update
    this.updateConfig(this.config);

    console.log(
      `[Widget ${this.id}] Config updated from React:`,
      message.property,
      message.value,
    );
  }
});

// Notify React Inspector when this widget is selected
this.element.addEventListener("click", () => {
  window.dispatchEvent(
    new CustomEvent("vanilla-widget-message", {
      detail: {
        type: "widget-selected",
        widgetId: this.id,
        widgetType: this.type,
        config: this.config,
      },
    }),
  );
});

// Notify React Inspector when config changes internally
this.on("config-changed", () => {
  window.dispatchEvent(
    new CustomEvent("vanilla-widget-message", {
      detail: {
        type: "widget-updated",
        widgetId: this.id,
        config: this.config,
      },
    }),
  );
});
```

### 3. Test the Integration

1. **Open React Inspector** at http://192.168.1.103:8123/local/canvas-ui-react/
2. **Click a widget** on the vanilla canvas
3. **Widget should appear** in React Inspector with its current config
4. **Change a value** in React Inspector (e.g., toggle "Segmented Style")
5. **Widget should update** immediately on the canvas
6. **Check console** for bridge messages confirming communication

### 4. Widget Bridge API Reference

**From Vanilla Widget → React Inspector:**

```javascript
// Widget selected
window.dispatchEvent(new CustomEvent('vanilla-widget-message', {
  detail: {
    type: 'widget-selected',
    widgetId: 'widget-123',
    widgetType: 'progress-gauge',
    config: { value: 65, segmented: true, ... }
  }
}));

// Widget updated internally
window.dispatchEvent(new CustomEvent('vanilla-widget-message', {
  detail: {
    type: 'widget-updated',
    widgetId: 'widget-123',
    config: { value: 70, ... }
  }
}));
```

**From React Inspector → Vanilla Widget:**

```javascript
// Listen for config updates
window.addEventListener("react-inspector-message", (event) => {
  const { type, widgetId, property, value } = event.detail;

  if (type === "config-updated" && widgetId === this.id) {
    this.config[property] = value;
    this.updateConfig(this.config);
  }
});
```

### 5. Benefits

✅ **Works with existing widgets** - no need to rewrite everything  
✅ **Incremental migration** - migrate widgets one at a time  
✅ **Better inspector UX** - Material-UI, proper checkboxes, color pickers  
✅ **Type safety** - TypeScript in React inspector  
✅ **Easy debugging** - React DevTools, clear console messages

### 6. Next Steps

Once the bridge is working:

1. **Add metadata support** - widgets expose their field definitions
2. **Dynamic inspector** - generates fields from widget metadata
3. **Migrate high-value widgets** - start with progress-gauge (1312 → 50 lines!)
4. **Phase out vanilla inspector** - eventually replace completely

## Testing Checklist

- [ ] React inspector loads in Home Assistant
- [ ] Click vanilla widget → appears in React inspector
- [ ] Change checkbox in React → vanilla widget updates
- [ ] Change color in React → vanilla widget updates
- [ ] Change vanilla widget → React inspector syncs
- [ ] Console shows bridge messages (no errors)
- [ ] Multiple widgets can be selected/edited

## Troubleshooting

**Inspector shows "No widget selected":**

- Check vanilla widget dispatches 'widget-selected' event on click
- Check console for bridge messages
- Verify widgetId, widgetType, config are present

**Changes in React don't update widget:**

- Check vanilla widget listens for 'react-inspector-message'
- Verify widgetId matches between messages
- Check widget has `updateConfig()` method

**Changes in widget don't update React:**

- Check widget dispatches 'widget-updated' event when config changes
- Verify config object is complete and serializable
- Check browser console for errors

## Example Integration (progress-gauge-widget.js)

```javascript
class ProgressGaugeWidget extends BaseWidget {
  constructor(config) {
    super(config);
    this.setupBridge();
  }

  setupBridge() {
    // Listen for React Inspector updates
    window.addEventListener("react-inspector-message", (event) => {
      const { type, widgetId, property, value } = event.detail;
      if (type === "config-updated" && widgetId === this.id) {
        this.config[property] = value;
        this.updateConfig(this.config);
      }
    });

    // Notify when clicked
    this.element.addEventListener("click", (e) => {
      if (e.target.closest(".widget-controls")) return; // Skip toolbar clicks

      window.dispatchEvent(
        new CustomEvent("vanilla-widget-message", {
          detail: {
            type: "widget-selected",
            widgetId: this.id,
            widgetType: "progress-gauge",
            config: this.config,
          },
        }),
      );
    });
  }

  updateConfig(newConfig) {
    super.updateConfig(newConfig);

    // Notify React Inspector
    window.dispatchEvent(
      new CustomEvent("vanilla-widget-message", {
        detail: {
          type: "widget-updated",
          widgetId: this.id,
          config: this.config,
        },
      }),
    );
  }
}
```
