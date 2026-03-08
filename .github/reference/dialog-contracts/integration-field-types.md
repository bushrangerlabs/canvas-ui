# Field Type → Dialog Mapping

Which inspector field type opens which dialog:

| Field Type               | Dialog                                                  | Example Property               |
| ------------------------ | ------------------------------------------------------- | ------------------------------ |
| `border`                 | [BorderEditorDialog](../border-editor.md)               | `border`, `borderTop`, etc.    |
| `shadow`                 | [ShadowEditorDialog](../shadow-editor.md)               | `boxShadow`, `textShadow`      |
| `font`                   | [FontPickerDialog](../font-picker.md)                   | `fontFamily`                   |
| `icon`                   | [IconPickerSimpleDialog](../icon-picker-simple.md)      | `icon`                         |
| `entity`                 | [EntityPickerDialog](../entity-picker.md)               | `entity`, `entityId`           |
| `text` + `binding: true` | [BindingEditorDialog](../binding-editor.md)             | `text`, `value` with {} button |
| `visibility`             | [VisibilityConditionDialog](../visibility-condition.md) | `visibilityCondition`          |

## Future Field Types

- `file` → FileBrowserDialog (file picker)
- `color` → ColorPickerDialog
- `animation` → AnimationEditorDialog

---

## Navigate

↑ **Integration**: [inspector-integration.md](inspector-integration.md)
⟲ **Dialogs**: [../INDEX.md](../INDEX.md) - All dialog contracts
