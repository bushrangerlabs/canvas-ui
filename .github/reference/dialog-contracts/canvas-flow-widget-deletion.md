# Canvas Flow: Widget Deletion

How widgets are removed from the canvas and view data.

## Deletion Triggers

```
User Actions:
1. Select widget(s) → Press Delete key
2. Select widget(s) → Click trash button in toolbar
3. Select widget(s) → Right-click → Delete
4. Select widget(s) → Ctrl+X (cut - deletes after copy)
```

## Deletion Flow

```
User Action          SelectionManager     ViewRenderer        ViewManager        Inspector
     ↓                      ↓                   ↓                  ↓                 ↓
Delete key      →    Get selected     →    Remove from     →    Delete from   →    Clear/refresh
pressed              widget IDs           DOM tree            view data          if showing
     ↓                      ↓                   ↓                  ↓                 ↓
Multiple?       →    deleteWidget()   →    Cleanup          →    Save state    →    Undo snapshot
widgets              for each ID          bindings, events    to storage         saved
```

## Delete Key Handler

```javascript
// Global keyboard listener
document.addEventListener("keydown", (e) => {
  if (!canvasCore.editMode) return;

  if (e.key === "Delete" || e.key === "Backspace") {
    e.preventDefault();

    const selected = selectionManager.getSelectedWidgets();
    if (selected.length > 0) {
      deleteWidgets(selected);
    }
  }
});
```

## Delete Function

```javascript
async deleteWidgets(widgetIds) {
  if (widgetIds.length === 0) return;

  // Confirm if deleting multiple
  if (widgetIds.length > 1) {
    const confirmed = await showConfirmDialog(
      `Delete ${widgetIds.length} widgets?`,
      'This cannot be undone.'
    );
    if (!confirmed) return;
  }

  // Save undo state BEFORE deletion
  undoRedoSystem.snapshot('deleteWidgets');

  // Delete each widget
  for (const widgetId of widgetIds) {
    await deleteWidget(widgetId);
  }

  // Clear selection
  selectionManager.clearSelection();

  // Emit event
  canvasCore.emit('widgetsDeleted', { widgetIds });

  console.log(`[Canvas] Deleted ${widgetIds.length} widget(s)`);
}

async deleteWidget(widgetId) {
  // 1. Remove from ViewRenderer (DOM + cleanup)
  await viewRenderer.removeWidget(widgetId);

  // 2. Remove from ViewManager (data)
  const activeView = viewManager.getActiveView();
  await viewManager.deleteWidget(activeView.id, widgetId);

  // 3. Update inspector if showing this widget
  if (inspector.currentWidget?.id === widgetId) {
    inspector.showEmpty();
  }
}
```

## ViewRenderer: Remove from DOM

```javascript
async removeWidget(widgetId) {
  const widget = this.activeWidgets.get(widgetId);
  if (!widget) return;

  // 1. Cleanup widget instance
  if (widget.instance.unmount) {
    await widget.instance.unmount();
  }

  if (widget.instance.cleanup) {
    widget.instance.cleanup();
  }

  // 2. Unbind from entities
  bindingBinder.unbindWidget(widgetId);

  // 3. Remove from DOM
  if (widget.element && widget.element.parentNode) {
    widget.element.remove();
  }

  // 4. Remove from activeWidgets Map
  this.activeWidgets.delete(widgetId);

  console.log(`[ViewRenderer] Widget removed: ${widgetId}`);
}
```

## Widget Cleanup Pattern

```javascript
class ButtonWidget {
  unmount() {
    // Cleanup before removal
    this.cleanupBindings();
    this.removeEventListeners();
  }

  cleanup() {
    // Release resources
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  cleanupBindings() {
    // Unsubscribe from entities
    this.subscriptions.forEach((subscription) => {
      if (subscription && subscription.unsubscribe) {
        subscription.unsubscribe();
      }
    });
    this.subscriptions = [];
  }

  removeEventListeners() {
    // Remove DOM event listeners
    if (this.clickHandler) {
      this.element.removeEventListener("click", this.clickHandler);
    }
  }
}
```

## ViewManager: Delete from Data

```javascript
async deleteWidget(viewId, widgetId) {
  const view = this.getView(viewId);
  if (!view) {
    throw new Error(`View not found: ${viewId}`);
  }

  // Find widget index
  const index = view.widgets.findIndex(w => w.id === widgetId);
  if (index === -1) {
    throw new Error(`Widget not found: ${widgetId}`);
  }

  // Remove from array
  view.widgets.splice(index, 1);
  view.modified = new Date().toISOString();

  // Save immediately (important for delete)
  await this.save();

  console.log(`[ViewManager] Deleted widget: ${widgetId} from view: ${viewId}`);
}
```

## Batch Deletion

When deleting multiple widgets:

```javascript
async deleteMultipleWidgets(widgetIds) {
  // Save undo state once
  undoRedoSystem.snapshot('deleteWidgets');

  // Remove from renderer (DOM cleanup)
  for (const widgetId of widgetIds) {
    await viewRenderer.removeWidget(widgetId);
  }

  // Batch update view data
  const activeView = viewManager.getActiveView();
  const view = activeView;

  // Filter out deleted widgets
  view.widgets = view.widgets.filter(w => !widgetIds.includes(w.id));
  view.modified = new Date().toISOString();

  // Save once
  await viewManager.save();

  // Clear selection
  selectionManager.clearSelection();

  console.log(`[Canvas] Batch deleted ${widgetIds.length} widgets`);
}
```

## Cut Operation (Ctrl+X)

Cut = Copy + Delete:

```javascript
document.addEventListener("keydown", async (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "x" && canvasCore.editMode) {
    e.preventDefault();

    const selected = selectionManager.getSelectedWidgets();
    if (selected.length === 0) return;

    // 1. Copy to clipboard
    await clipboard.copy(selected);

    // 2. Delete widgets
    await deleteWidgets(selected);

    console.log(`[Canvas] Cut ${selected.length} widget(s)`);
  }
});
```

## Undo Deletion

```javascript
// User presses Ctrl+Z after deletion
undoRedoSystem.undo();

// UndoRedo system restores:
// 1. Widget data to view
viewManager.restoreView(previousState);

// 2. Re-render widgets
for (const widgetConfig of restoredWidgets) {
  await viewRenderer.renderWidget(widgetConfig);
}

// 3. Restore selection (optional)
if (previousSelection.length > 0) {
  selectionManager.selectWidgets(previousSelection);
}
```

## Deletion Confirmation Dialog

```javascript
async showConfirmDialog(title, message) {
  return new Promise((resolve) => {
    const dialog = createElement('div', {
      className: 'confirm-dialog-overlay',
      innerHTML: `
        <div class="confirm-dialog">
          <h3>${title}</h3>
          <p>${message}</p>
          <div class="dialog-buttons">
            <button class="btn-cancel">Cancel</button>
            <button class="btn-confirm">Delete</button>
          </div>
        </div>
      `
    });

    dialog.querySelector('.btn-cancel').addEventListener('click', () => {
      dialog.remove();
      resolve(false);
    });

    dialog.querySelector('.btn-confirm').addEventListener('click', () => {
      dialog.remove();
      resolve(true);
    });

    document.body.appendChild(dialog);
  });
}
```

## Safety Features

**Single widget**: No confirmation
**Multiple widgets**: Confirmation dialog
**Undo available**: Ctrl+Z to restore
**Auto-save**: Deletion saved immediately

## Delete vs Hide

**Delete**: Permanently removes widget from view data
**Hide**: Sets `visibilityCondition` to always false (widget still exists)

```javascript
// Hide widget instead of delete
hideWidget(widgetId) {
  const widget = viewRenderer.activeWidgets.get(widgetId);
  widget.element.style.display = 'none';

  // Or set visibility condition
  viewManager.updateWidget(viewId, widgetId, {
    config: {
      ...widget.config.config,
      visibilityCondition: 'false'  // Always hidden
    }
  });
}
```

---

## Navigate

↑ **Selection**: [canvas-flow-widget-selection.md](canvas-flow-widget-selection.md) - How widgets get selected
→ **Save**: [canvas-flow-save-load.md](canvas-flow-save-load.md) - Persistence
⟲ **Undo**: [canvas-flow-undo-redo.md](canvas-flow-undo-redo.md) - Undo deletion
