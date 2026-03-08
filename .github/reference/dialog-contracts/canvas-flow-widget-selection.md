# Canvas Flow: Widget Selection

How widgets are selected in edit mode (click, multi-select, box select).

## Selection Overview

```
Selection Methods:
1. Click - Select single widget
2. Shift+Click - Add to selection
3. Ctrl+Click - Toggle selection
4. Box Drag - Select multiple in area
5. Ctrl+A - Select all
```

## Selection State

```javascript
class SelectionManager {
  constructor() {
    this.selectedWidgets = new Set(); // Set of widget IDs
    this.isBoxSelecting = false;
    this.selectionBox = null; // Visual selection box element
  }
}
```

## Single Selection (Click)

```
User clicks widget       SelectionManager         Visual Feedback
       ↓                        ↓                         ↓
Click event       →    selectWidget(id)    →    Add selection border
(mousedown)            clear previous           add resize handles
       ↓                        ↓                         ↓
Not Shift/Ctrl    →    selectedWidgets        →    Blue border
                       = new Set([id])            8 resize handles
                            ↓                         ↓
                       Emit event            →    Inspector shows
                       'selectionChanged'          widget properties
```

### Implementation

```javascript
// Make widget selectable (on render in edit mode)
selectionManager.makeSelectable(widgetElement, widgetId);

makeSelectable(widgetElement, widgetId) {
  widgetElement.addEventListener('mousedown', (e) => {
    // Don't select if clicking resize handle
    if (e.target.classList.contains('resize-handle')) return;

    e.stopPropagation();  // Prevent canvas deselect

    if (e.shiftKey) {
      // Add to selection
      this.selectWidget(widgetId, true);
    } else if (e.ctrlKey || e.metaKey) {
      // Toggle selection
      this.toggleSelection(widgetId);
    } else {
      // Replace selection
      this.selectWidget(widgetId, false);
    }
  });
}

selectWidget(widgetId, addToSelection = false) {
  if (!this.canvasCore.editMode) return;

  if (!addToSelection) {
    // Clear previous selection
    this.clearSelection();
  }

  if (this.selectedWidgets.has(widgetId)) {
    return;  // Already selected
  }

  // Add to selection
  this.selectedWidgets.add(widgetId);

  // Visual feedback
  this.updateVisualSelection(widgetId, true);
  this.addResizeHandles(widgetId);

  // Emit event
  this.canvasCore.emit('selectionChanged', {
    selected: Array.from(this.selectedWidgets),
    lastSelected: widgetId
  });
}
```

## Visual Selection

```javascript
updateVisualSelection(widgetId, selected) {
  const widget = viewRenderer.activeWidgets.get(widgetId);
  if (!widget) return;

  if (selected) {
    // Add selection border
    widget.element.classList.add('widget-selected');
    widget.element.style.outline = '2px solid #03a9f4';
    widget.element.style.outlineOffset = '-2px';
  } else {
    // Remove selection border
    widget.element.classList.remove('widget-selected');
    widget.element.style.outline = '';
  }
}

addResizeHandles(widgetId) {
  const widget = viewRenderer.activeWidgets.get(widgetId);
  resizeHandler.addResizeHandles(widget.element, widgetId);
}

removeResizeHandles(widgetId) {
  const widget = viewRenderer.activeWidgets.get(widgetId);
  resizeHandler.removeResizeHandles(widget.element);
}
```

## Multi-Selection

### Shift+Click (Additive)

```javascript
// User holds Shift and clicks another widget
// Previous selection kept, new widget added

selectWidget(widgetId, (addToSelection = true));
// selectedWidgets = Set([widget1, widget2, widget3])
```

### Ctrl+Click (Toggle)

```javascript
toggleSelection(widgetId) {
  if (this.selectedWidgets.has(widgetId)) {
    this.deselectWidget(widgetId);
  } else {
    this.selectWidget(widgetId, true);
  }
}

deselectWidget(widgetId) {
  if (!this.selectedWidgets.has(widgetId)) return;

  this.selectedWidgets.delete(widgetId);
  this.updateVisualSelection(widgetId, false);
  this.removeResizeHandles(widgetId);

  this.canvasCore.emit('selectionChanged', {
    selected: Array.from(this.selectedWidgets),
    lastDeselected: widgetId
  });
}
```

## Box Selection (Marquee)

```
User drags on canvas      SelectionManager        Visual Feedback
       ↓                         ↓                       ↓
MouseDown on         →    Start box select   →    Create selection
canvas (no widget)        store start pos          box element
       ↓                         ↓                       ↓
MouseMove            →    Update box size    →    Resize box,
(dragging)                calculate bounds         show rectangle
       ↓                         ↓                       ↓
Find widgets         →    Test intersection  →    Highlight widgets
in box area              with each widget         inside box
       ↓                         ↓                       ↓
MouseUp              →    Finalize selection →    Select all in box,
                         remove box element        remove box element
```

### Implementation

```javascript
// Canvas click (start box select if no widget clicked)
canvas.addEventListener('mousedown', (e) => {
  if (e.target === canvas || e.target.classList.contains('canvas-view')) {
    // Click on empty canvas
    if (!e.shiftKey) {
      this.clearSelection();  // Clear if not adding
    }

    // Start box selection
    this.startBoxSelection(e);
  }
});

startBoxSelection(event) {
  const rect = canvas.getBoundingClientRect();
  this.boxStartPos = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };

  // Create selection box element
  this.selectionBox = createElement('div', {
    className: 'selection-box',
    style: {
      position: 'absolute',
      border: '2px dashed #03a9f4',
      backgroundColor: 'rgba(3, 169, 244, 0.1)',
      pointerEvents: 'none',
      zIndex: 10000,
      left: `${this.boxStartPos.x}px`,
      top: `${this.boxStartPos.y}px`,
      width: '0',
      height: '0'
    }
  });

  canvas.appendChild(this.selectionBox);
  this.isBoxSelecting = true;

  document.addEventListener('mousemove', this.handleBoxMove);
  document.addEventListener('mouseup', this.handleBoxEnd);
}

handleBoxMove(event) {
  if (!this.isBoxSelecting) return;

  const rect = canvas.getBoundingClientRect();
  this.boxCurrentPos = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };

  // Update box visual
  const left = Math.min(this.boxStartPos.x, this.boxCurrentPos.x);
  const top = Math.min(this.boxStartPos.y, this.boxCurrentPos.y);
  const width = Math.abs(this.boxCurrentPos.x - this.boxStartPos.x);
  const height = Math.abs(this.boxCurrentPos.y - this.boxStartPos.y);

  this.selectionBox.style.left = `${left}px`;
  this.selectionBox.style.top = `${top}px`;
  this.selectionBox.style.width = `${width}px`;
  this.selectionBox.style.height = `${height}px`;

  // Find widgets in box
  const boxBounds = { left, top, right: left + width, bottom: top + height };
  this.highlightWidgetsInBox(boxBounds);
}

highlightWidgetsInBox(boxBounds) {
  for (const [widgetId, widget] of viewRenderer.activeWidgets) {
    const widgetBounds = {
      left: widget.config.x,
      top: widget.config.y,
      right: widget.config.x + widget.config.w,
      bottom: widget.config.y + widget.config.h
    };

    // Check intersection
    const intersects = !(
      boxBounds.right < widgetBounds.left ||
      boxBounds.left > widgetBounds.right ||
      boxBounds.bottom < widgetBounds.top ||
      boxBounds.top > widgetBounds.bottom
    );

    if (intersects) {
      widget.element.classList.add('box-select-highlight');
    } else {
      widget.element.classList.remove('box-select-highlight');
    }
  }
}

handleBoxEnd(event) {
  if (!this.isBoxSelecting) return;

  // Select all highlighted widgets
  const toSelect = [];
  for (const [widgetId, widget] of viewRenderer.activeWidgets) {
    if (widget.element.classList.contains('box-select-highlight')) {
      toSelect.push(widgetId);
      widget.element.classList.remove('box-select-highlight');
    }
  }

  // Apply selection
  toSelect.forEach(id => this.selectWidget(id, true));

  // Cleanup
  this.selectionBox.remove();
  this.selectionBox = null;
  this.isBoxSelecting = false;

  document.removeEventListener('mousemove', this.handleBoxMove);
  document.removeEventListener('mouseup', this.handleBoxEnd);
}
```

## Select All (Ctrl+A)

```javascript
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'a' && canvasCore.editMode) {
    e.preventDefault();
    selectionManager.selectAll();
  }
});

selectAll() {
  this.clearSelection();

  for (const widgetId of viewRenderer.activeWidgets.keys()) {
    this.selectWidget(widgetId, true);
  }
}
```

## Selection Events

```javascript
// Listen for selection changes
canvasCore.on("selectionChanged", ({ selected, lastSelected }) => {
  // Update inspector
  if (selected.length === 1) {
    inspector.showWidget(selected[0]);
  } else if (selected.length > 1) {
    inspector.showMultipleWidgets(selected);
  } else {
    inspector.showEmpty();
  }

  // Update toolbar
  toolbar.updateButtons({ hasSelection: selected.length > 0 });
});
```

## Deselection

```javascript
// Click on empty canvas
canvas.addEventListener('mousedown', (e) => {
  if (e.target === canvas) {
    selectionManager.clearSelection();
  }
});

clearSelection() {
  for (const widgetId of this.selectedWidgets) {
    this.updateVisualSelection(widgetId, false);
    this.removeResizeHandles(widgetId);
  }

  this.selectedWidgets.clear();

  this.canvasCore.emit('selectionChanged', {
    selected: [],
    previouslySelected: Array.from(this.selectedWidgets)
  });
}
```

---

## Navigate

↑ **Resize**: [canvas-flow-widget-resizing.md](canvas-flow-widget-resizing.md) - Resize handles
→ **Deletion**: [canvas-flow-widget-deletion.md](canvas-flow-widget-deletion.md) - Delete widgets
⟲ **Code**: `www/canvas-ui/editor/selection-manager.js`
