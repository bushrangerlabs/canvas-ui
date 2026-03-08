# Z-Index Stacking

How dialogs layer on top of each other:

```
Base Page              z-index: 0
Inspector Panel        z-index: 1000
Dialog Overlay         z-index: 10000
Dialog Container       z-index: 10001
Nested Dialog Overlay  z-index: 10002
Nested Dialog          z-index: 10003
```

## Rules

1. Each dialog gets overlay + container (2 z-index levels)
2. Nested dialogs increment by 2 (10002, 10004, etc.)
3. Overlays are semi-transparent backdrops
4. Clicking overlay closes top dialog only

## Example: BindingEditor → EntityPicker

- BindingEditorDialog overlay: 10000
- BindingEditorDialog: 10001
- EntityPickerDialog overlay: 10002 (blocks BindingEditor)
- EntityPickerDialog: 10003 (on top)

---

## Navigate

↑ **Usage**: [../flow-nested-dialogs.md](../flow-nested-dialogs.md)
