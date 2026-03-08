# Canvas Flow: Undo/Redo

How the undo/redo system tracks and reverses widget changes.

## Undo/Redo Overview

```
User Actions          UndoRedoSystem        State Management
     ↓                      ↓                       ↓
Make change     →    Snapshot state     →    Store in history
(drag/resize)        before change          stack (30 max)
     ↓                      ↓                       ↓
Press Ctrl+Z    →    Restore previous   →    Apply old state
                     state from stack       re-render widgets
     ↓                      ↓                       ↓
Press Ctrl+Y    →    Restore next       →    Apply forward state
                     state (if undone)      re-render widgets
```

## State Snapshot

```javascript
class UndoRedoSystem {
  constructor(canvasCore) {
    this.canvasCore = canvasCore;
    this.undoStack = []; // Past states
    this.redoStack = []; // Future states (after undo)
    this.maxHistory = 30; // Keep last 30 changes
    this.isRestoring = false; // Prevent snapshot during restore
  }

  snapshot(actionName = "change") {
    if (this.isRestoring) return; // Don't snapshot during undo/redo

    // Get current state
    const state = this.captureState();

    // Add to undo stack
    this.undoStack.push({
      state,
      action: actionName,
      timestamp: Date.now(),
    });

    // Limit stack size
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift(); // Remove oldest
    }

    // Clear redo stack (new action = can't redo anymore)
    this.redoStack = [];

    console.log(
      `[UndoRedo] Snapshot: ${actionName} (${this.undoStack.length} in history)`,
    );
  }

  captureState() {
    const activeView = this.canvasCore.viewManager.getActiveView();

    return {
      viewId: activeView.id,
      widgets: JSON.parse(JSON.stringify(activeView.widgets)), // Deep copy
      selection: Array.from(
        this.canvasCore.selectionManager.getSelectedWidgets(),
      ),
    };
  }
}
```

## Undo Operation

```javascript
async undo() {
  if (this.undoStack.length === 0) {
    console.log('[UndoRedo] Nothing to undo');
    return;
  }

  // Save current state to redo stack BEFORE undoing
  const currentState = this.captureState();
  this.redoStack.push({
    state: currentState,
    action: 'redo point',
    timestamp: Date.now()
  });

  // Get previous state
  const previous = this.undoStack.pop();

  console.log(`[UndoRedo] Undo: ${previous.action}`);

  // Restore state
  await this.restoreState(previous.state);

  // Emit event
  this.canvasCore.emit('undo', { action: previous.action });
}
```

## Redo Operation

```javascript
async redo() {
  if (this.redoStack.length === 0) {
    console.log('[UndoRedo] Nothing to redo');
    return;
  }

  // Save current state to undo stack
  const currentState = this.captureState();
  this.undoStack.push({
    state: currentState,
    action: 'undo point',
    timestamp: Date.now()
  });

  // Get next state
  const next = this.redoStack.pop();

  console.log(`[UndoRedo] Redo: ${next.action}`);

  // Restore state
  await this.restoreState(next.state);

  // Emit event
  this.canvasCore.emit('redo', { action: next.action });
}
```

## Restore State

```javascript
async restoreState(state) {
  this.isRestoring = true;  // Prevent snapshots during restore

  try {
    const view = this.canvasCore.viewManager.getView(state.viewId);

    // 1. Update view data
    view.widgets = JSON.parse(JSON.stringify(state.widgets));  // Deep copy

    // 2. Clear canvas
    this.canvasCore.viewRenderer.clearView();

    // 3. Re-render all widgets
    for (const widgetConfig of state.widgets) {
      await this.canvasCore.viewRenderer.renderWidget(widgetConfig);
    }

    // 4. Restore selection
    this.canvasCore.selectionManager.clearSelection();
    for (const widgetId of state.selection) {
      this.canvasCore.selectionManager.selectWidget(widgetId, true);
    }

    // 5. Save to storage
    await this.canvasCore.viewManager.save();

    console.log('[UndoRedo] State restored');

  } finally {
    this.isRestoring = false;
  }
}
```

## Keyboard Shortcuts

```javascript
document.addEventListener("keydown", (e) => {
  if (!canvasCore.editMode) return;

  // Ctrl+Z or Cmd+Z (Mac)
  if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
    e.preventDefault();
    undoRedoSystem.undo();
  }

  // Ctrl+Y or Ctrl+Shift+Z or Cmd+Shift+Z
  if (
    ((e.ctrlKey || e.metaKey) && e.key === "y") ||
    ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z")
  ) {
    e.preventDefault();
    undoRedoSystem.redo();
  }
});
```

## When to Snapshot

Snapshot **BEFORE** making changes:

```javascript
// Drag start
dragHandler.handleDragStart() {
  if (distance > threshold) {
    undoRedoSystem.snapshot('dragStart');  // ← Before moving
  }
}

// Resize start
resizeHandler.handleResizeStart() {
  undoRedoSystem.snapshot('resizeStart');  // ← Before resizing
}

// Delete
deleteWidgets(widgetIds) {
  undoRedoSystem.snapshot('deleteWidgets');  // ← Before deleting
  // ... delete widgets
}

// Inspector change
inspector.onFieldChange(field, value) {
  undoRedoSystem.snapshot('inspectorChange');  // ← Before updating
  // ... update widget
}

// Widget creation
widgetFactory.createWidget() {
  // Snapshot happens after widget added (can undo creation)
  const widget = await viewManager.addWidget(view.id, config);
  undoRedoSystem.snapshot('createWidget');
}
```

## Debounced Snapshots

For rapid changes (like dragging), snapshot on **start** not every move:

```javascript
// Drag move - NO snapshot
handleDragMove() {
  // Just update position, no snapshot
  widget.element.style.left = `${newX}px`;
}

// Drag end - NO snapshot (already taken at start)
handleDragEnd() {
  // Save final state
  viewManager.save();
  // No snapshot (already taken at dragStart)
}
```

## Inspector Field Changes

For text inputs, debounce snapshots:

```javascript
class Inspector {
  constructor() {
    this.snapshotTimer = null;
  }

  onFieldChange(field, value) {
    // Clear existing timer
    if (this.snapshotTimer) {
      clearTimeout(this.snapshotTimer);
    }

    // Snapshot after 1 second of inactivity
    this.snapshotTimer = setTimeout(() => {
      undoRedoSystem.snapshot("inspectorChange");
      this.snapshotTimer = null;
    }, 1000);

    // Update immediately (visual feedback)
    this.updateWidget(field, value);
  }
}
```

## Undo Stack Limit

Keep only last 30 actions:

```javascript
snapshot(actionName) {
  this.undoStack.push({ state, action, timestamp });

  // Limit stack size
  if (this.undoStack.length > this.maxHistory) {
    this.undoStack.shift();  // Remove oldest
  }
}
```

## Undo UI Indicators

```javascript
// Update toolbar buttons based on undo/redo availability
canvasCore.on('undo', () => updateToolbar());
canvasCore.on('redo', () => updateToolbar());

function updateToolbar() {
  const canUndo = undoRedoSystem.canUndo();
  const canRedo = undoRedoSystem.canRedo();

  undoButton.disabled = !canUndo;
  redoButton.disabled = !canRedo;

  // Show last action in tooltip
  if (canUndo) {
    const lastAction = undoRedoSystem.getLastAction();
    undoButton.title = `Undo ${lastAction}`;
  }
}

canUndo() {
  return this.undoStack.length > 0;
}

canRedo() {
  return this.redoStack.length > 0;
}

getLastAction() {
  if (this.undoStack.length === 0) return null;
  return this.undoStack[this.undoStack.length - 1].action;
}
```

## Undo History Panel (Advanced)

```javascript
showUndoHistory() {
  const history = this.undoStack.map((entry, index) => ({
    index,
    action: entry.action,
    timestamp: new Date(entry.timestamp).toLocaleTimeString()
  }));

  // Render history list
  const historyPanel = createElement('div', {
    className: 'undo-history-panel',
    innerHTML: `
      <h3>Undo History</h3>
      <ul>
        ${history.map(h => `
          <li data-index="${h.index}">
            ${h.action} - ${h.timestamp}
          </li>
        `).join('')}
      </ul>
    `
  });

  // Click to undo to specific point
  historyPanel.querySelectorAll('li').forEach(li => {
    li.addEventListener('click', () => {
      const index = parseInt(li.dataset.index);
      this.undoToIndex(index);
    });
  });

  return historyPanel;
}
```

## Action Names

Descriptive action names for better UX:

```
- 'createWidget' - Widget created
- 'deleteWidgets' - Widget(s) deleted
- 'dragStart' - Widget moved
- 'resizeStart' - Widget resized
- 'inspectorChange' - Property changed
- 'multiSelect' - Multiple widgets selected
- 'importConfig' - Configuration imported
- 'pasteWidgets' - Widget(s) pasted
```

---

## Navigate

↑ **Save**: [canvas-flow-save-load.md](canvas-flow-save-load.md) - Persistence
→ **Inspector**: [canvas-flow-inspector-updates.md](canvas-flow-inspector-updates.md) - Inspector sync
⟲ **Code**: `www/canvas-ui/editor/undo-redo.js`
