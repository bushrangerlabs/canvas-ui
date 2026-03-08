# Widget API Reference

## Goal

Widgets define their own inspector fields via `static getMetadata()` instead of hardcoded inspector.js logic.

## Widget Metadata Structure

```javascript
static getMetadata() {
  return {
    type: 'button',
    name: 'Button',
    category: 'basic',
    fields: {
      // String syntax: 'name:type:default:label:category'
      x: 'x:number:0:X Position:Position',
      fontSize: 'fontSize:slider:14:Font Size:8:64:1:Typography',
      borderStyle: 'borderStyle:select:solid:Style:solid,dashed,dotted:Styling',

      // Object syntax for complex fields
      text: {
        name: 'text',
        type: 'text',
        default: 'Click Me',
        label: 'Button Text',
        category: 'Custom',
        entity: true,      // Adds "..." entity picker button
        binding: true,     // Adds "{}" binding editor button
        maxWidth: 140
      },

      // Builder opens dialog
      _borderBuilder: {
        type: 'builder',
        builderType: 'border',  // or 'shadow'
        label: 'Border Builder',
        category: 'Styling'
      }
    }
  };
}
```

## Field Types

- **text, number, color** - Standard input
- **entity** - Entity selector + "..." button
- **icon** - Icon selector + "..." button
- **font** - Font picker + "Select..." button
- **slider** - Range input (requires min, max, step)
- **select** - Dropdown (requires options array/string)
- **checkbox** - Boolean toggle
- **builder** - Opens BorderEditorDialog or ShadowEditorDialog

## Field Properties

- `entity: true` - Adds "..." entity picker button
- `binding: true` - Adds "{}" binding editor button
- `maxWidth: 140` - Limits input width (prevents overflow)

## Implementation Steps

1. Create `www/canvas-ui/inspector/field-renderer.js`
   - `parseField(fieldDef)` - String → object
   - `createField(field, value, onChange)` - Generate UI
   - `createInputForType(field)` - Type-specific inputs
   - `createButtons(field)` - Entity/binding/icon buttons

2. Update `www/canvas-ui/inspector/inspector.js`
   - Import FieldRenderer
   - In `showWidget()`: Get metadata, use FieldRenderer to create fields
   - Group fields by category (Position, Custom, Typography, Styling, Visibility)

3. Migrate widgets (add `static getMetadata()`)
   - button-widget.js
   - text-widget.js
   - image-widget.js
   - switch-widget.js
   - value-widget.js

4. Cleanup
   - Remove old `createTextInput()`, `createNumberInput()`, etc. from inspector.js
   - Delete `www/canvas-ui/styles/inspector.css` (no longer needed)

## Existing Dialogs (unchanged)

All preserved, just invoked generically:

- EntityPickerDialog
- BindingEditorDialog
- IconPickerSimpleDialog
- BorderEditorDialog
- ShadowEditorDialog
- FontPickerDialog
- VisibilityConditionDialog
