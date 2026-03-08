# Canvas Flow: Widget Dragging

How widgets are moved on the canvas via drag operations.

## Drag Flow Overview

```
MouseDown on Widget       DragHandler           ViewRenderer         ViewManager
        ↓                      ↓                      ↓                    ↓
    Click widget    →    Start drag         →    Update DOM      →    Save position
    (edit mode)          track movement         element.style         to config
        ↓                      ↓                      ↓                    ↓
    MouseMove       →    Calculate delta    →    Move widget     →    Auto-save
    (dragging)           snap to grid           update x, y           (debounced)
        ↓                      ↓                      ↓                    ↓
    MouseUp         →    End drag           →    Final position  →    Undo snapshot
    (release)            emit event              inspector sync        save state
```

## Drag Handler Lifecycle

### 1. Enable Drag

```javascript
// Called when widget is rendered in edit mode
dragHandler.enableDrag(widgetElement, widgetId);

// Sets up event listeners
widgetElement.addEventListener("mousedown", (e) =>
  handleDragStart(e, widgetId),
);
widgetElement.addEventListener("touchstart", (e) =>
  handleDragStart(e, widgetId),
);
widgetElement.style.cursor = "move";
```

### 2. Drag Start

```javascript
handleDragStart(event, widgetId) {
  event.preventDefault();

  // Store start position
  this.startPos = { x: event.clientX, y: event.clientY };

  // Get selected widgets
  const selected = selectionManager.getSelectedWidgets();

  if (selected.includes(widgetId)) {
    // Drag all selected widgets
    this.draggedWidgets = new Set(selected);
  } else {
    // Drag only this widget
    this.draggedWidgets = new Set([widgetId]);
  }

  // Store original positions (for multi-drag)
  this.startWidgetPos.clear();
  for (const id of this.draggedWidgets) {
    const widget = viewRenderer.activeWidgets.get(id);
    this.startWidgetPos.set(id, {
      x: widget.config.x,
      y: widget.config.y
    });
  }

  this.isDragging = true;

  // Add global listeners
  document.addEventListener('mousemove', this.handleDragMove);
  document.addEventListener('mouseup', this.handleDragEnd);
}
```

### 3. Drag Move

```javascript
handleDragMove(event) {
  if (!this.isDragging) return;
  event.preventDefault();

  // Calculate movement delta
  const deltaX = event.clientX - this.startPos.x;
  const deltaY = event.clientY - this.startPos.y;

  // Check drag threshold (prevent accidental drags)
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  if (!this.isDragStarted && distance < this.dragThreshold) {
    return;  // Not enough movement yet
  }

  if (!this.isDragStarted) {
    this.isDragStarted = true;
    // Save undo state BEFORE changes
    undoRedoSystem.snapshot('dragStart');
  }

  // Update all dragged widgets
  for (const widgetId of this.draggedWidgets) {
    const startPos = this.startWidgetPos.get(widgetId);
    let newX = startPos.x + deltaX;
    let newY = startPos.y + deltaY;

    // Snap to grid (if enabled)
    if (gridSystem?.isEnabled()) {
      newX = gridSystem.snapToGrid(newX);
      newY = gridSystem.snapToGrid(newY);
    }

    // Snap to other widgets (if enabled)
    if (this.snapToElements) {
      const snapped = this.snapToNearbyWidgets(widgetId, newX, newY);
      newX = snapped.x;
      newY = snapped.y;
    }

    // Update widget position in DOM (visual feedback)
    const widget = viewRenderer.activeWidgets.get(widgetId);
    widget.element.style.left = `${newX}px`;
    widget.element.style.top = `${newY}px`;

    // Store temp position (not saved yet)
    widget.tempPosition = { x: newX, y: newY };
  }

  // Show alignment guides
  this.showAlignmentGuides();
}
```

### 4. Drag End

```javascript
handleDragEnd(event) {
  if (!this.isDragging) return;

  // Update final positions
  const updates = [];
  for (const widgetId of this.draggedWidgets) {
    const widget = viewRenderer.activeWidgets.get(widgetId);

    if (widget.tempPosition) {
      // Update stored config
      widget.config.x = widget.tempPosition.x;
      widget.config.y = widget.tempPosition.y;
      delete widget.tempPosition;

      updates.push({
        widgetId,
        x: widget.config.x,
        y: widget.config.y
      });
    }
  }

  // Save to ViewManager (batch)
  if (updates.length > 0) {
    viewManager.updateWidgets(updates);

    // Update inspector (if widget is selected)
    inspector.updatePositionFields();

    // Emit event
    canvasCore.emit('widgetsMoved', { widgets: updates });
  }

  // Cleanup
  this.isDragging = false;
  this.isDragStarted = false;
  this.draggedWidgets.clear();
  this.hideAlignmentGuides();

  // Remove global listeners
  document.removeEventListener('mousemove', this.handleDragMove);
  document.removeEventListener('mouseup', this.handleDragEnd);
}
```

## Multi-Widget Drag

When multiple widgets are selected:

```javascript
// All selected widgets move together
const selected = [widget1, widget2, widget3];

// Same delta applied to each
for (const widget of selected) {
  widget.x = startX + deltaX;
  widget.y = startY + deltaY;
}

// Maintains relative positions
```

## Grid Snapping

```javascript
snapToGrid(value) {
  const gridSize = this.gridSystem.getGridSize();  // e.g., 10
  return Math.round(value / gridSize) * gridSize;
}

// Example:
// value = 47, gridSize = 10
// 47 / 10 = 4.7
// round(4.7) = 5
// 5 * 10 = 50  ← Snapped value
```

## Widget Snapping (Alignment)

```javascript
snapToNearbyWidgets(widgetId, x, y) {
  const tolerance = 5;  // Snap within 5px
  const allWidgets = viewRenderer.activeWidgets;

  let snappedX = x;
  let snappedY = y;

  for (const [id, widget] of allWidgets) {
    if (id === widgetId || this.draggedWidgets.has(id)) continue;

    // Check vertical alignment (left edges)
    if (Math.abs(x - widget.config.x) < tolerance) {
      snappedX = widget.config.x;
      this.showVerticalGuide(widget.config.x);
    }

    // Check horizontal alignment (top edges)
    if (Math.abs(y - widget.config.y) < tolerance) {
      snappedY = widget.config.y;
      this.showHorizontalGuide(widget.config.y);
    }

    // Can also check: right edges, centers, etc.
  }

  return { x: snappedX, y: snappedY };
}
```

## Bi-Directional Sync

Drag updates both canvas AND inspector:

```javascript
// Drag updates canvas immediately (visual)
widget.element.style.left = `${newX}px`;

// On drag end:
// 1. Update config
widget.config.x = newX;

// 2. Save to ViewManager
viewManager.updateWidget(viewId, widgetId, { x: newX, y: newY });

// 3. Update inspector
inspector.updatePositionFields(widgetId);
```

Reverse direction (inspector → canvas) in [canvas-flow-inspector-updates.md](canvas-flow-inspector-updates.md)

## Undo/Redo Integration

```javascript
// On drag start: Save state
undoRedoSystem.snapshot("dragStart");

// On drag end: Undo will restore previous position
// User can press Ctrl+Z to undo the drag
```

---

## Navigate

↑ **Position**: [widget-api-position-bidirectional-sync.md](widget-api-position-bidirectional-sync.md) - Bi-directional sync
→ **Resize**: [canvas-flow-widget-resizing.md](canvas-flow-widget-resizing.md) - Resize handles
⟲ **Code**: `www/canvas-ui/editor/drag-handler.js`
