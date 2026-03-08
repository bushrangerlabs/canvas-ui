# Canvas Flow: Widget Creation

How a widget gets created from toolbar drop to canvas rendering.

## Complete Creation Flow

```
Toolbar Drop        WidgetFactory         ViewManager        ViewRenderer        Canvas
     ↓                    ↓                     ↓                  ↓                 ↓
Drop event  →   createWidget(type)  →   addWidget()   →   renderWidget()   →   Widget
at position     + default config        to active view     create instance      appears
     ↓                    ↓                     ↓                  ↓                 ↓
Calculate   →   Show config dialog  →   Assign ID      →   Mount widget     →   Enable
 x, y           (if required)           Save to data       to DOM element       editing
```

## Step-by-Step Process

### 1. User Drops Widget

```javascript
// In toolbar drag handler
canvas.addEventListener("drop", async (e) => {
  e.preventDefault();

  const widgetType = widgetFactory.draggedWidgetType;
  const position = {
    x: e.clientX - canvas.getBoundingClientRect().left,
    y: e.clientY - canvas.getBoundingClientRect().top,
  };

  // Trigger creation
  await widgetFactory.createWidget(widgetType, position);
});
```

### 2. WidgetFactory: Create Configuration

```javascript
async createWidget(type, position) {
  // Get metadata
  const metadata = widgetRegistry.getMetadata(type);

  // Build config
  const widgetConfig = {
    type: type,
    x: position.x,
    y: position.y,
    w: metadata.defaultSize?.w || 100,
    h: metadata.defaultSize?.h || 100,
    z: Date.now(),  // Auto z-index
    config: this.getDefaultConfig(type)
  };

  // Show dialog if widget requires setup
  if (metadata.requiresConfig) {
    const userConfig = await this.showConfigDialog(type, widgetConfig);
    if (!userConfig) return null; // User cancelled
    widgetConfig.config = {...widgetConfig.config, ...userConfig};
  }

  // Add to view
  const activeView = viewManager.getActiveView();
  const widget = await viewManager.addWidget(activeView.id, widgetConfig);

  return widget;
}
```

### 3. ViewManager: Persist Widget

```javascript
async addWidget(viewId, widgetConfig) {
  const view = this.getView(viewId);

  // Generate ID if not provided
  const widget = {
    id: widgetConfig.id || this.generateWidgetId(),
    type: widgetConfig.type,
    ...widgetConfig
  };

  // Add to view's widget array
  view.widgets.push(widget);
  view.modified = new Date().toISOString();

  // Save to localStorage/HA
  await this.save();

  // Emit event
  canvasCore.emit('widgetAdded', { viewId, widget });

  return widget;
}

generateWidgetId() {
  return `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
```

### 4. ViewRenderer: Render to DOM

```javascript
async renderWidget(widgetConfig) {
  const type = widgetConfig.type;
  const id = widgetConfig.id;

  // 1. Load widget class (if not loaded)
  if (!widgetRegistry.isLoaded(type)) {
    await widgetRegistry.loadWidget(type);
  }

  // 2. Get widget class
  const WidgetClass = widgetRegistry.get(type);

  // 3. Create instance (NEW API: pass canvasCore)
  const instance = new WidgetClass(canvasCore, widgetConfig);

  // 4. Create wrapper element
  const element = createElement('div', {
    className: `widget widget-${type}`,
    id: `widget-${id}`,
    style: {
      position: 'absolute',
      left: `${widgetConfig.x}px`,
      top: `${widgetConfig.y}px`,
      width: `${widgetConfig.w}px`,
      height: `${widgetConfig.h}px`,
      zIndex: widgetConfig.z
    }
  });

  // 5. Store widget
  activeWidgets.set(id, {
    instance,
    element,
    config: widgetConfig
  });

  // 6. Mount widget (widget renders itself)
  await instance.mount(element);

  // 7. Add to view
  viewElement.appendChild(element);

  // 8. Enable editor features (if edit mode)
  if (canvasCore.editMode) {
    dragHandler.enableDrag(element, id);
    selectionManager.makeSelectable(element, id);
  }

  // 9. Bind to entities (if has bindings)
  bindingBinder.bindWidget(id, widgetConfig);

  return element;
}
```

## Widget Instance Creation (NEW API)

```javascript
class ButtonWidget {
  constructor(canvasCore, config) {
    this.canvasCore = canvasCore; // Access to entities, inspector, etc.
    this.config = config; // Widget configuration
    this.element = null; // Will be set in mount()
    this.subscriptions = []; // Entity subscriptions
  }

  async mount(element) {
    this.element = element;
    this.render();
    this.setupBindings();
  }

  render() {
    // Apply config to element
    this.element.style.backgroundColor = this.config.config.backgroundColor;
    this.element.innerHTML = `
      <i class="${this.config.config.icon}"></i>
      <span>${this.config.config.text}</span>
    `;
  }

  setupBindings() {
    if (this.config.config.entity) {
      // Subscribe to entity updates
      const subscription = this.canvasCore.entityManager.subscribe(
        this.config.config.entity,
        (state) => this.onEntityUpdate(state),
      );
      this.subscriptions.push(subscription);
    }
  }
}
```

## Default Configuration

```javascript
getDefaultConfig(type) {
  const defaults = {
    button: {
      text: "Button",
      icon: "mdi-gesture-tap",
      backgroundColor: "#03a9f4",
      // Universal fields set separately:
      // - name, id (identity section)
      // - x, y, w, h, z (position section)
      // - border, shadow, padding, bgImage (styling section)
      // - visibilityCondition (visibility section)
    },
    text: {
      text: "Text Widget",
      fontSize: 16,
      textAlign: "center",
      color: "#ffffff"
    }
  };

  return defaults[type] || {};
}
```

## Creation Events

```javascript
// Widget added to view
canvasCore.on("widgetAdded", ({ viewId, widget }) => {
  inspector.refresh();
  undoRedoSystem.snapshot();
});

// Widget rendered to canvas
canvasCore.on("widgetRendered", ({ widgetId, element }) => {
  // Enable animations, transitions, etc.
});
```

---

## Navigate

↑ **Previous**: [canvas-flow-toolbar-loading.md](canvas-flow-toolbar-loading.md) - Toolbar drag
→ **Next**: [canvas-flow-widget-rendering.md](canvas-flow-widget-rendering.md) - Render details
↓ **Delete**: [canvas-flow-widget-deletion.md](canvas-flow-widget-deletion.md) - Removing widgets
⟲ **Widget API**: [widget-api-custom-section-overview.md](widget-api-custom-section-overview.md) - Custom config fields
⟲ **Widget Dev**: [widget-dev-lifecycle.md](widget-dev-lifecycle.md) - Implement mount/unmount methods
