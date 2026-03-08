# Canvas Flow: Toolbar Loading

How registered widgets appear in the toolbar for users to drag onto canvas.

## Toolbar Population Flow

```
WidgetRegistry          Toolbar UI               User Sees
     ↓                       ↓                        ↓
Get all widgets  →   Create toolbar items  →   Draggable widgets
   metadata          (icon + name)             organized by category
     ↓                       ↓                        ↓
Group by         →   Render categories     →   Basic | Advanced
 category            (buttons/sections)         Gauges | Charts
```

## Detailed Flow

### 1. Toolbar Initialization

```javascript
// In Toolbar constructor
async init() {
  // Get all registered widgets
  const widgets = widgetRegistry.getAllMetadata();

  // Group by category
  const grouped = this.groupByCategory(widgets);

  // Render toolbar
  this.renderToolbar(grouped);
}
```

### 2. Widget Library Structure

```javascript
{
  "basic": [
    { type: "button", name: "Button", icon: "mdi-gesture-tap" },
    { type: "text", name: "Text", icon: "mdi-text" },
    { type: "image", name: "Image", icon: "mdi-image" }
  ],
  "advanced": [
    { type: "switch", name: "Switch", icon: "mdi-toggle-switch" },
    { type: "slider", name: "Slider", icon: "mdi-tune" }
  ],
  "gauges": [
    { type: "gauge", name: "Gauge", icon: "mdi-gauge" },
    { type: "radial", name: "Radial", icon: "mdi-circle-slice-8" }
  ]
}
```

### 3. Toolbar Item Rendering

```javascript
renderToolbarItem(widgetType, metadata) {
  const item = createElement('div', {
    className: 'toolbar-item',
    dataset: { widgetType },
    innerHTML: `
      <i class="${metadata.icon}"></i>
      <span>${metadata.name}</span>
    `
  });

  // Enable drag
  widgetFactory.enableToolbarDrag(item, widgetType);

  return item;
}
```

## Drag-from-Toolbar Setup

```
Toolbar Item Created
       ↓
Set draggable=true
       ↓
Add dragstart listener
   ↓           ↓           ↓
Store type   Set data   Visual feedback
in factory   transfer   (opacity 0.5)
       ↓
Wait for canvas drop
```

### Drag Event Flow

```javascript
// 1. DRAGSTART (on toolbar item)
toolbarItem.addEventListener("dragstart", (e) => {
  widgetFactory.draggedWidgetType = widgetType;
  e.dataTransfer.effectAllowed = "copy";
  e.dataTransfer.setData("text/plain", widgetType);
  toolbarItem.style.opacity = "0.5";
});

// 2. DRAGOVER (on canvas - allow drop)
canvas.addEventListener("dragover", (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = "copy";
});

// 3. DROP (on canvas - create widget)
canvas.addEventListener("drop", async (e) => {
  e.preventDefault();

  // Calculate position
  const rect = canvas.getBoundingClientRect();
  const position = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };

  // Create widget
  const widget = await widgetFactory.createWidget(
    widgetFactory.draggedWidgetType,
    position,
  );

  // Render on canvas
  canvasCore.renderWidget(widget);
});

// 4. DRAGEND (on toolbar item - cleanup)
toolbarItem.addEventListener("dragend", (e) => {
  toolbarItem.style.opacity = "1";
  widgetFactory.draggedWidgetType = null;
});
```

## Toolbar Organization

**Two-Row Layout:**

```
Row 1 (Basic):     [Button] [Text] [Image] [Switch] [Value]
Row 2 (Advanced):  [Gauge] [Chart] [Slider] [Custom Widget]
```

**Categorized Accordion:**

```
▼ Basic Widgets
  [Button] [Text] [Image]
▼ Input Widgets
  [Switch] [Slider] [Input]
▼ Display Widgets
  [Gauge] [Chart] [Graph]
```

## Connection to Creation Flow

When user drops widget on canvas:

1. **Toolbar** → Provides `widgetType` and `position`
2. **WidgetFactory** → Creates widget config
3. **ViewManager** → Adds to active view
4. **ViewRenderer** → Renders on canvas

See: [canvas-flow-widget-creation.md](canvas-flow-widget-creation.md)

---

## Navigate

↑ **Previous**: [canvas-flow-widget-registration.md](canvas-flow-widget-registration.md) - Widget registration
→ **Next**: [canvas-flow-widget-creation.md](canvas-flow-widget-creation.md) - Widget instantiation
⟲ **Code**: `www/canvas-ui/editor/toolbar.js`
