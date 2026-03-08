# Dialog Dependencies

What each dialog needs to function:

## Standalone Dialogs (No Dependencies)

- [border-editor.md](border-editor.md) - Pure UI, CSS parsing
- [shadow-editor.md](shadow-editor.md) - Pure UI, CSS parsing
- [font-picker.md](font-picker.md) - Pure UI, font loading
- [icon-picker-simple.md](icon-picker-simple.md) - Pure UI, icon library

## Entity-Aware Dialogs (Need EntityManager)

- [entity-picker.md](entity-picker.md) - EntityManager only
- [binding-editor.md](binding-editor.md) - EntityManager (uses EntityPickerDialog internally)
- [visibility-condition.md](visibility-condition.md) - EntityManager (uses EntityPickerDialog internally)

## Utility Dialogs (Other Dependencies)

- [file-manager.md](file-manager.md) - FileService (not a picker)

## Nested Dependencies

- BindingEditorDialog → Opens EntityPickerDialog
- VisibilityConditionDialog → Opens EntityPickerDialog

---

## Navigate

↑ **Broader**: [patterns.md](patterns.md) - Pattern overview
↓ **Details**: [flow-nested-dialogs.md](flow-nested-dialogs.md) - Nested dialog flow
→ **How to access**: [integration-canvas-ui-dependencies.md](integration-canvas-ui-dependencies.md) - Get EntityManager, FileService
