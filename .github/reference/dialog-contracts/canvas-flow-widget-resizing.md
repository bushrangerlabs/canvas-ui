# Canvas Flow: Widget Resizing

How widgets are resized using drag handles in edit mode.

## Resize Flow Overview

```
Widget Selected       ResizeHandler         Widget Element        ViewManager
      ↓                     ↓                       ↓                   ↓
Add 8 resize     →    MouseDown on      →    Update width/     →    Save size
handles              handle starts          height in DOM          to config
(corners+edges)      resize tracking        element.style
      ↓                     ↓                       ↓                   ↓
User drags       →    Calculate new     →    Apply new size    →    Auto-save
handle               size from delta        position may          (debounced)
      ↓                     ↓                  also change            ↓
Handle released  →    Finalize resize   →    Final size        →    Undo snapshot
                     emit event             inspector sync          save state
```

## 8-Point Resize Handles

```
nw ─── n ─── ne      Handles:
│             │      - nw, ne, sw, se (corners)
w             e      - n, s (top/bottom edges)
│             │      - w, e (left/right edges)
sw ─── s ─── se
```

Each handle allows different resize directions:

- **nw** (northwest): Resize top-left corner
- **n** (north): Resize top edge only
- **ne** (northeast): Resize top-right corner
- **e** (east): Resize right edge only
- **se** (southeast): Resize bottom-right corner
- **s** (south): Resize bottom edge only
- **sw** (southwest): Resize bottom-left corner
- **w** (west): Resize left edge only

## Handle Addition (On Selection)

```javascript
// In SelectionManager when widget is selected
selectionManager.selectWidget(widgetId);
  ↓
resizeHandler.addResizeHandles(widgetElement, widgetId);

// Creates 8 handles
handles.forEach(handle => {
  const handleEl = createElement('div', {
    className: `resize-handle resize-handle-${handle.position}`,
    style: {
      position: 'absolute',
      width: '12px',
      height: '12px',
      backgroundColor: '#03a9f4',
      border: '1px solid #fff',
      cursor: `${handle.cursor}`,  // nwse-resize, ns-resize, etc.
      zIndex: 9999,
      ...getHandlePosition(handle.position)
    }
  });

  handleEl.addEventListener('mousedown', (e) => {
    e.stopPropagation();  // Don't trigger drag
    handleResizeStart(e, widgetId, handle.position);
  });

  widgetElement.appendChild(handleEl);
});
```

## Resize Start

```javascript
handleResizeStart(event, widgetId, handlePosition) {
  event.preventDefault();

  const widget = viewRenderer.activeWidgets.get(widgetId);

  // Store initial state
  this.isResizing = true;
  this.resizingWidgetId = widgetId;
  this.resizeHandle = handlePosition;
  this.startPos = { x: event.clientX, y: event.clientY };
  this.startSize = {
    w: widget.config.w,
    h: widget.config.h
  };
  this.startPosition = {
    x: widget.config.x,
    y: widget.config.y
  };

  // Calculate aspect ratio (for Shift key locking)
  this.aspectRatio = this.startSize.w / this.startSize.h;

  // Save undo state
  undoRedoSystem.snapshot('resizeStart');

  // Add global listeners
  document.addEventListener('mousemove', this.handleResizeMove);
  document.addEventListener('mouseup', this.handleResizeEnd);
  document.addEventListener('keydown', this.handleKeyDown);  // For Shift
  document.addEventListener('keyup', this.handleKeyUp);
}
```

## Resize Move (Per Handle)

```javascript
handleResizeMove(event) {
  if (!this.isResizing) return;
  event.preventDefault();

  // Calculate delta
  const deltaX = event.clientX - this.startPos.x;
  const deltaY = event.clientY - this.startPos.y;

  let newWidth = this.startSize.w;
  let newHeight = this.startSize.h;
  let newX = this.startPosition.x;
  let newY = this.startPosition.y;

  // Apply delta based on handle
  switch (this.resizeHandle) {
    case 'se':  // Southeast - resize from bottom-right
      newWidth = this.startSize.w + deltaX;
      newHeight = this.startSize.h + deltaY;
      break;

    case 'nw':  // Northwest - resize from top-left
      newWidth = this.startSize.w - deltaX;
      newHeight = this.startSize.h - deltaY;
      newX = this.startPosition.x + deltaX;  // Position changes!
      newY = this.startPosition.y + deltaY;
      break;

    case 'ne':  // Northeast - resize from top-right
      newWidth = this.startSize.w + deltaX;
      newHeight = this.startSize.h - deltaY;
      newY = this.startPosition.y + deltaY;
      break;

    case 'sw':  // Southwest - resize from bottom-left
      newWidth = this.startSize.w - deltaX;
      newHeight = this.startSize.h + deltaY;
      newX = this.startPosition.x + deltaX;
      break;

    case 'e':   // East - resize width only
      newWidth = this.startSize.w + deltaX;
      break;

    case 'w':   // West - resize width, change x
      newWidth = this.startSize.w - deltaX;
      newX = this.startPosition.x + deltaX;
      break;

    case 'n':   // North - resize height, change y
      newHeight = this.startSize.h - deltaY;
      newY = this.startPosition.y + deltaY;
      break;

    case 's':   // South - resize height only
      newHeight = this.startSize.h + deltaY;
      break;
  }

  // Enforce minimum size
  newWidth = Math.max(newWidth, this.minWidth);
  newHeight = Math.max(newHeight, this.minHeight);

  // Lock aspect ratio if Shift key pressed
  if (this.lockAspectRatio && this.aspectRatio) {
    // Adjust height to maintain aspect ratio
    newHeight = newWidth / this.aspectRatio;
  }

  // Update widget element (visual feedback)
  const widget = viewRenderer.activeWidgets.get(this.resizingWidgetId);
  widget.element.style.width = `${newWidth}px`;
  widget.element.style.height = `${newHeight}px`;
  widget.element.style.left = `${newX}px`;
  widget.element.style.top = `${newY}px`;

  // Store temp values
  widget.tempSize = { w: newWidth, h: newHeight };
  widget.tempPosition = { x: newX, y: newY };
}
```

## Resize End

```javascript
handleResizeEnd(event) {
  if (!this.isResizing) return;

  const widget = viewRenderer.activeWidgets.get(this.resizingWidgetId);

  // Finalize changes
  if (widget.tempSize) {
    widget.config.w = widget.tempSize.w;
    widget.config.h = widget.tempSize.h;
    delete widget.tempSize;
  }

  if (widget.tempPosition) {
    widget.config.x = widget.tempPosition.x;
    widget.config.y = widget.tempPosition.y;
    delete widget.tempPosition;
  }

  // Save to ViewManager
  viewManager.updateWidget(viewId, this.resizingWidgetId, {
    w: widget.config.w,
    h: widget.config.h,
    x: widget.config.x,
    y: widget.config.y
  });

  // Update inspector
  inspector.updatePositionFields(this.resizingWidgetId);

  // Notify widget instance (may need to re-render content)
  if (widget.instance.onResize) {
    widget.instance.onResize(widget.config.w, widget.config.h);
  }

  // Emit event
  canvasCore.emit('widgetResized', {
    widgetId: this.resizingWidgetId,
    size: { w: widget.config.w, h: widget.config.h }
  });

  // Cleanup
  this.isResizing = false;
  this.resizingWidgetId = null;

  document.removeEventListener('mousemove', this.handleResizeMove);
  document.removeEventListener('mouseup', this.handleResizeEnd);
  document.removeEventListener('keydown', this.handleKeyDown);
  document.removeEventListener('keyup', this.handleKeyUp);
}
```

## Aspect Ratio Locking

```javascript
// User holds Shift key while resizing
handleKeyDown(event) {
  if (event.key === 'Shift') {
    this.lockAspectRatio = true;
  }
}

handleKeyUp(event) {
  if (event.key === 'Shift') {
    this.lockAspectRatio = false;
  }
}

// In resize move:
if (this.lockAspectRatio) {
  newHeight = newWidth / this.aspectRatio;
}
```

## Widget Response to Resize

Widgets can implement `onResize()` to respond to size changes:

```javascript
class ChartWidget {
  onResize(width, height) {
    // Redraw chart with new dimensions
    this.chart.resize(width, height);
  }
}

class TextWidget {
  onResize(width, height) {
    // Adjust font size or layout
    if (width < 100) {
      this.element.style.fontSize = "12px";
    }
  }
}
```

## Minimum Size Constraints

```javascript
// Global minimums
this.minWidth = 20;
this.minHeight = 20;

// Widget-specific minimums (from metadata)
const metadata = widgetRegistry.getMetadata(widget.type);
const minW = metadata.minSize?.w || this.minWidth;
const minH = metadata.minSize?.h || this.minHeight;

newWidth = Math.max(newWidth, minW);
newHeight = Math.max(newHeight, minH);
```

## Bi-Directional Sync

Like drag, resize syncs canvas ↔ inspector:

```javascript
// Resize updates inspector width/height fields
inspector.updatePositionFields(widgetId);

// Inspector changes trigger resize:
inspector.onSizeChange(field, value) {
  const changes = { [field]: value };
  viewRenderer.updateWidget(widgetId, changes);
  viewManager.updateWidget(viewId, widgetId, changes);
}
```

---

## Navigate

↑ **Drag**: [canvas-flow-widget-dragging.md](canvas-flow-widget-dragging.md) - Widget dragging
→ **Selection**: [canvas-flow-widget-selection.md](canvas-flow-widget-selection.md) - Selection system
⟲ **Position API**: [widget-api-position-coordinate-fields.md](widget-api-position-coordinate-fields.md) - Width/height fields
