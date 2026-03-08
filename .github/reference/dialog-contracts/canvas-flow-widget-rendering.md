# Canvas Flow: Widget Rendering

How widgets get rendered to the canvas and updated when configuration changes.

## Initial Render Flow

```
ViewRenderer.renderWidget()
          ↓
    Load widget class
          ↓
    Create instance
          ↓
    Create wrapper element
          ↓
    instance.mount(element)
          ↓
    Apply styling
          ↓
    Add to canvas DOM
          ↓
    Enable editor features
          ↓
    Setup entity bindings
```

## Widget Wrapper Element

Every widget gets a wrapper `<div>` with:

```javascript
const element = createElement("div", {
  className: `widget widget-${type}`,
  id: `widget-${id}`,
  style: {
    position: "absolute", // Positioned on canvas
    left: `${config.x}px`, // X position
    top: `${config.y}px`, // Y position
    width: `${config.w}px`, // Width
    height: `${config.h}px`, // Height
    zIndex: config.z, // Stacking order
    boxSizing: "border-box", // Include padding/border in size
  },
});
```

## Widget Mount Pattern

```javascript
class ButtonWidget {
  async mount(element) {
    this.element = element;

    // 1. Render content
    this.render();

    // 2. Setup event listeners
    this.setupEventListeners();

    // 3. Setup entity bindings
    this.setupBindings();

    // 4. Apply styling (from config)
    this.applyUniversalStyling();
  }

  render() {
    // Widget-specific rendering
    this.element.innerHTML = `
      <i class="${this.config.config.icon}"></i>
      <span>${this.config.config.text}</span>
    `;
  }

  applyUniversalStyling() {
    // Styling section (from Widget API)
    const cfg = this.config.config;

    // Background
    if (cfg.backgroundColor) {
      this.element.style.backgroundColor = cfg.backgroundColor;
    }

    // Border
    if (cfg.border) {
      this.element.style.border = cfg.border;
      if (cfg.borderRadius) {
        this.element.style.borderRadius = cfg.borderRadius;
      }
    }

    // Shadow
    if (cfg.boxShadow) {
      this.element.style.boxShadow = cfg.boxShadow;
    }

    // Padding
    if (cfg.paddingTop) this.element.style.paddingTop = `${cfg.paddingTop}px`;
    if (cfg.paddingRight)
      this.element.style.paddingRight = `${cfg.paddingRight}px`;
    if (cfg.paddingBottom)
      this.element.style.paddingBottom = `${cfg.paddingBottom}px`;
    if (cfg.paddingLeft)
      this.element.style.paddingLeft = `${cfg.paddingLeft}px`;

    // Background Image
    if (cfg.backgroundImage) {
      this.element.style.backgroundImage = `url(${cfg.backgroundImage})`;
      this.element.style.backgroundSize = cfg.backgroundSize || "cover";
      this.element.style.backgroundPosition =
        cfg.backgroundPosition || "center";
      this.element.style.backgroundRepeat = cfg.backgroundRepeat || "no-repeat";
    }
  }
}
```

## Update/Re-render Flow

When widget configuration changes (from inspector):

```
Inspector change
      ↓
updateWidget(widgetId, changes)
      ↓
Update config in activeWidgets Map
      ↓
Update wrapper element position/size
      ↓
instance.update(changes)
      ↓
Widget re-renders itself
      ↓
Emit 'widgetUpdated' event
```

### ViewRenderer Update Method

```javascript
updateWidget(widgetId, changes) {
  const widget = activeWidgets.get(widgetId);
  if (!widget) return;

  // 1. Update stored config
  Object.assign(widget.config, changes);

  // 2. Update wrapper element (position/size)
  if ('x' in changes) {
    widget.element.style.left = `${changes.x}px`;
  }
  if ('y' in changes) {
    widget.element.style.top = `${changes.y}px`;
  }
  if ('w' in changes) {
    widget.element.style.width = `${changes.w}px`;
  }
  if ('h' in changes) {
    widget.element.style.height = `${changes.h}px`;
  }
  if ('z' in changes) {
    widget.element.style.zIndex = changes.z;
  }

  // 3. Widget updates itself (config changes)
  if (widget.instance.update) {
    widget.instance.update(changes);
  } else {
    // Fallback: full re-render
    widget.instance.render();
  }

  // 4. Rebind if entity changed
  if (changes.config?.entity) {
    bindingBinder.rebindWidget(widgetId, widget.config);
  }

  // 5. Emit event
  canvasCore.emit('widgetUpdated', { widgetId, changes });
}
```

## Widget Update Pattern (Granular)

```javascript
class ButtonWidget {
  update(changes) {
    // Only update what changed (efficient)

    if (changes.config?.text) {
      this.element.querySelector("span").textContent = changes.config.text;
    }

    if (changes.config?.icon) {
      this.element.querySelector("i").className = changes.config.icon;
    }

    if (changes.config?.backgroundColor) {
      this.element.style.backgroundColor = changes.config.backgroundColor;
    }

    // Re-apply universal styling if styling fields changed
    if (
      changes.config?.border ||
      changes.config?.boxShadow ||
      changes.config?.padding
    ) {
      this.applyUniversalStyling();
    }

    // Re-setup bindings if entity changed
    if (changes.config?.entity) {
      this.cleanupBindings();
      this.setupBindings();
    }
  }
}
```

## Bi-Directional Position Sync

Position updates can come from:

1. **Inspector** → User types X/Y in inspector
2. **Canvas** → User drags widget

Both trigger the same update flow:

```javascript
// From inspector
inspector.onPositionChange(field, value) {
  const changes = { [field]: value };
  viewRenderer.updateWidget(widgetId, changes);  // Updates canvas
  viewManager.updateWidget(viewId, widgetId, changes);  // Saves
}

// From drag handler
dragHandler.onDragEnd(widgetId, x, y) {
  const changes = { x, y };
  viewRenderer.updateWidget(widgetId, changes);  // Updates DOM
  viewManager.updateWidget(viewId, widgetId, changes);  // Saves
  inspector.updatePositionFields(widgetId);  // Updates inspector
}
```

See: [widget-api-position-bidirectional-sync.md](widget-api-position-bidirectional-sync.md)

## Visibility Handling

Widgets can be hidden based on visibility conditions:

```javascript
setupVisibility() {
  if (!this.config.config.visibilityCondition) {
    this.element.style.display = '';  // Always visible
    return;
  }

  // Evaluate condition
  this.evaluateVisibility();

  // Subscribe to entities in condition
  const entities = extractEntitiesFromExpression(this.config.config.visibilityCondition);
  entities.forEach(entityId => {
    const sub = this.canvasCore.entityManager.subscribe(entityId, () => {
      this.evaluateVisibility();
    });
    this.subscriptions.push(sub);
  });
}

evaluateVisibility() {
  const result = evaluateExpression(this.config.config.visibilityCondition);
  this.element.style.display = result ? '' : 'none';
}
```

See: [widget-api-visibility-conditions.md](widget-api-visibility-conditions.md)

---

## Navigate

↑ **Previous**: [canvas-flow-widget-creation.md](canvas-flow-widget-creation.md) - Widget creation
→ **Next**: [canvas-flow-widget-updates.md](canvas-flow-widget-updates.md) - Update mechanisms
⟲ **Widget API**: [widget-api-universal-inspector-structure.md](widget-api-universal-inspector-structure.md) - Inspector structure
⟲ **Widget Dev**: [widget-dev-rendering.md](widget-dev-rendering.md) - Implement render() and updateDisplay()
