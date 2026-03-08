# Pattern 1: Simple Picker

**Constructor**: `(callback)`

## Characteristics

- No current value parameter (no pre-selection)
- No dependencies (standalone)
- Returns single value via callback
- Simplest pattern

## Example: IconPickerSimpleDialog

```javascript
const dialog = new IconPickerSimpleDialog((iconName) => {
  widget.config.icon = iconName; // "mdi-fire"
  inspector.updateWidget(widget);
});
dialog.show();
```

## Flow

```
Constructor(callback) → show() → User selects → callback(value) → close()
```

---

## Navigate

↑ **Pattern List**: [../patterns.md](../patterns.md)
→ **Example**: [../icon-picker-simple.md](../icon-picker-simple.md)
↓ **Compare**: [editor-current-value.md](editor-current-value.md) - Next complexity level
