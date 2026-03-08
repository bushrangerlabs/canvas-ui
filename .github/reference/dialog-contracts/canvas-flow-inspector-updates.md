# Canvas Flow: Inspector Updates

How inspector changes update widgets and vice versa (bi-directional sync).

## Bi-Directional Sync

```
Inspector ⇄ Canvas

Inspector Field Change:
Inspector input → updateWidget() → Canvas DOM update → ViewManager save

Canvas Operation:
Drag/resize widget → Update config → Inspector field refresh
```

## Inspector → Canvas Flow

When user changes a field in the inspector:

```
User types in field    Inspector           ViewRenderer         ViewManager
       ↓                   ↓                     ↓                   ↓
onChange event   →   updateWidget()    →   Update DOM       →   Save config
(input/dialog)       with changes          element.style        to view data
       ↓                   ↓                     ↓                   ↓
Debounce?        →   widget.update()   →   Re-render        →   Auto-save
(text inputs)        if available          if needed            (debounced)
```

### Inspector Field Change Handler

```javascript
class Inspector {
  onFieldChange(fieldName, value) {
    if (!this.currentWidget) return;

    // Snapshot for undo (debounced for text inputs)
    this.debouncedSnapshot();

    // Build changes object
    const changes = this.buildChanges(fieldName, value);

    // Update ViewRenderer (visual update)
    this.canvasCore.viewRenderer.updateWidget(this.currentWidget.id, changes);

    // Update ViewManager (persist)
    const activeView = this.canvasCore.viewManager.getActiveView();
    this.canvasCore.viewManager.updateWidget(
      activeView.id,
      this.currentWidget.id,
      changes,
    );

    // Update local widget reference
    Object.assign(this.currentWidget, changes);
  }

  buildChanges(fieldName, value) {
    // Determine if it's a universal field or custom field
    const universalFields = ["x", "y", "w", "h", "z", "name"];

    if (universalFields.includes(fieldName)) {
      // Position/identity field
      return { [fieldName]: value };
    } else {
      // Custom field (nested in config)
      return {
        config: {
          ...this.currentWidget.config,
          [fieldName]: value,
        },
      };
    }
  }
}
```

## Canvas → Inspector Flow

When widget is moved/resized on canvas:

```
Drag/Resize End       DragHandler          ViewRenderer         Inspector
       ↓                   ↓                     ↓                   ↓
Update position  →   Update config     →   DOM already      →   Refresh fields
(drag end)           x, y, w, h            updated during      if widget selected
       ↓                   ↓                  drag/resize             ↓
ViewManager      →   Save state        →                    →   Show new values
save()               to storage                                 in input fields
```

### Inspector Position Update

```javascript
// Called after drag or resize
updatePositionFields(widgetId) {
  // Only update if this widget is currently shown
  if (!this.currentWidget || this.currentWidget.id !== widgetId) {
    return;
  }

  const widget = this.canvasCore.viewRenderer.activeWidgets.get(widgetId);
  if (!widget) return;

  // Update input fields without triggering onChange
  this.setFieldValue('x', widget.config.x);
  this.setFieldValue('y', widget.config.y);
  this.setFieldValue('w', widget.config.w);
  this.setFieldValue('h', widget.config.h);

  // Update local reference
  this.currentWidget.x = widget.config.x;
  this.currentWidget.y = widget.config.y;
  this.currentWidget.w = widget.config.w;
  this.currentWidget.h = widget.config.h;
}

setFieldValue(fieldName, value) {
  const input = this.container.querySelector(`[name="${fieldName}"]`);
  if (input) {
    // Set value without triggering onChange
    const oldHandler = input.onchange;
    input.onchange = null;
    input.value = value;
    input.onchange = oldHandler;
  }
}
```

## Universal Inspector Sections

### 1. Identity Section

```javascript
renderIdentitySection() {
  return `
    <div class="inspector-section">
      <h3>Widget Name/ID</h3>

      <label>Name</label>
      <input type="text"
             name="name"
             value="${this.currentWidget.config?.name || ''}"
             onchange="inspector.onFieldChange('name', this.value)">

      <label>ID</label>
      <input type="text"
             value="${this.currentWidget.id}"
             disabled>
    </div>
  `;
}
```

### 2. Position Section (Bi-directional)

```javascript
renderPositionSection() {
  return `
    <div class="inspector-section">
      <h3>Position</h3>

      <div class="field-row">
        <label>X</label>
        <input type="number"
               name="x"
               value="${this.currentWidget.x || 0}"
               onchange="inspector.onPositionChange('x', parseInt(this.value))">

        <label>Y</label>
        <input type="number"
               name="y"
               value="${this.currentWidget.y || 0}"
               onchange="inspector.onPositionChange('y', parseInt(this.value))">
      </div>

      <div class="field-row">
        <label>Width</label>
        <input type="number"
               name="w"
               value="${this.currentWidget.w || 100}"
               onchange="inspector.onPositionChange('w', parseInt(this.value))">

        <label>Height</label>
        <input type="number"
               name="h"
               value="${this.currentWidget.h || 100}"
               onchange="inspector.onPositionChange('h', parseInt(this.value))">
      </div>

      <label>Z-Index</label>
      <input type="number"
             name="z"
             value="${this.currentWidget.z || 1}"
             onchange="inspector.onPositionChange('z', parseInt(this.value))">
    </div>
  `;
}

onPositionChange(field, value) {
  // Update canvas immediately
  this.onFieldChange(field, value);

  // Widget position/size will update in DOM
  // (ViewRenderer.updateWidget handles this)
}
```

### 3. Custom Section (Widget-Specific)

```javascript
renderCustomSection() {
  const metadata = this.canvasCore.widgetRegistry.getMetadata(
    this.currentWidget.type
  );

  if (!metadata?.customFields) {
    return '';
  }

  return `
    <div class="inspector-section">
      <h3>Custom</h3>
      ${metadata.customFields.map(field =>
        this.renderField(field)
      ).join('')}
    </div>
  `;
}

renderField(field) {
  const value = this.currentWidget.config[field.name];

  switch (field.type) {
    case 'text':
      return `
        <label>${field.label}</label>
        <input type="text"
               name="${field.name}"
               value="${value || ''}"
               onchange="inspector.onFieldChange('${field.name}', this.value)">
      `;

    case 'entity':
      return `
        <label>${field.label}</label>
        <button onclick="inspector.openEntityPicker('${field.name}')">
          ${value || 'Select Entity...'}
        </button>
      `;

    case 'icon':
      return `
        <label>${field.label}</label>
        <button onclick="inspector.openIconPicker('${field.name}')">
          <i class="${value || 'mdi-help'}"></i>
        </button>
      `;

    // More field types...
  }
}
```

### 4. Styling Section

```javascript
renderStylingSection() {
  const cfg = this.currentWidget.config || {};

  return `
    <div class="inspector-section">
      <h3>Styling</h3>

      <label>Background</label>
      <button onclick="inspector.openColorPicker('backgroundColor')">
        <span class="color-swatch"
              style="background: ${cfg.backgroundColor || 'transparent'}"></span>
        ${cfg.backgroundColor || 'None'}
      </button>

      <label>Border</label>
      <button onclick="inspector.openBorderEditor()">
        ${cfg.border || 'None'}
      </button>

      <label>Shadow</label>
      <button onclick="inspector.openShadowEditor()">
        ${cfg.boxShadow || 'None'}
      </button>

      <label>Padding</label>
      <div class="padding-inputs">
        <input type="number" placeholder="Top"
               value="${cfg.paddingTop || 0}"
               onchange="inspector.onFieldChange('paddingTop', this.value)">
        <input type="number" placeholder="Right"
               value="${cfg.paddingRight || 0}"
               onchange="inspector.onFieldChange('paddingRight', this.value)">
        <input type="number" placeholder="Bottom"
               value="${cfg.paddingBottom || 0}"
               onchange="inspector.onFieldChange('paddingBottom', this.value)">
        <input type="number" placeholder="Left"
               value="${cfg.paddingLeft || 0}"
               onchange="inspector.onFieldChange('paddingLeft', this.value)">
      </div>

      <label>Background Image</label>
      <button onclick="inspector.openFileBrowser()">
        ${cfg.backgroundImage || 'None'}
      </button>
    </div>
  `;
}
```

### 5. Visibility Section

```javascript
renderVisibilitySection() {
  return `
    <div class="inspector-section">
      <h3>Visibility</h3>

      <label>Conditions</label>
      <button onclick="inspector.openVisibilityEditor()">
        ${this.currentWidget.config?.visibilityCondition || 'Always Visible'}
      </button>
    </div>
  `;
}
```

## Dialog Integration

When inspector button opens a dialog:

```javascript
openBorderEditor() {
  const dialog = new BorderEditorDialog(
    this.currentWidget.config.border,
    (borderObject) => {
      // Dialog returns atomic border properties
      // Update all border fields at once
      const changes = {
        config: {
          ...this.currentWidget.config,
          ...borderObject  // border, borderRadius, borderTop, etc.
        }
      };

      // Update widget
      this.canvasCore.viewRenderer.updateWidget(
        this.currentWidget.id,
        changes
      );

      // Save
      const activeView = this.canvasCore.viewManager.getActiveView();
      this.canvasCore.viewManager.updateWidget(
        activeView.id,
        this.currentWidget.id,
        changes
      );

      // Refresh inspector
      this.refresh();
    }
  );

  dialog.show();
}
```

See dialog contracts: [border-editor.md](border-editor.md)

## Inspector Refresh

When widget changes externally (drag, resize, undo):

```javascript
refresh() {
  if (!this.currentWidget) return;

  // Re-fetch widget data
  const widget = this.canvasCore.viewRenderer.activeWidgets.get(
    this.currentWidget.id
  );

  if (!widget) {
    // Widget deleted
    this.showEmpty();
    return;
  }

  // Update reference
  this.currentWidget = widget.config;

  // Re-render inspector
  this.render();
}

// Called on events
canvasCore.on('widgetUpdated', () => inspector.refresh());
canvasCore.on('selectionChanged', ({ selected }) => {
  if (selected.length === 1) {
    inspector.showWidget(selected[0]);
  } else {
    inspector.showEmpty();
  }
});
```

## Multi-Widget Selection

When multiple widgets selected:

```javascript
showMultipleWidgets(widgetIds) {
  this.currentWidgets = widgetIds;

  // Show only common properties
  const commonFields = this.getCommonFields(widgetIds);

  this.container.innerHTML = `
    <div class="inspector-multi">
      <h2>${widgetIds.length} widgets selected</h2>

      <div class="inspector-section">
        <h3>Bulk Edit</h3>
        ${this.renderCommonFields(commonFields)}
      </div>
    </div>
  `;
}

onBulkFieldChange(fieldName, value) {
  // Update all selected widgets
  for (const widgetId of this.currentWidgets) {
    this.canvasCore.viewRenderer.updateWidget(widgetId, {
      config: { [fieldName]: value }
    });
  }

  // Save all
  const activeView = this.canvasCore.viewManager.getActiveView();
  for (const widgetId of this.currentWidgets) {
    this.canvasCore.viewManager.updateWidget(
      activeView.id,
      widgetId,
      { config: { [fieldName]: value } }
    );
  }
}
```

---

## Navigate

↑ **Undo**: [canvas-flow-undo-redo.md](canvas-flow-undo-redo.md) - Undo/redo system
⟲ **Widget API**: [widget-api-universal-inspector-structure.md](widget-api-universal-inspector-structure.md) - 5 sections
⟲ **Dialogs**: [INDEX.md](INDEX.md) - All dialog contracts
