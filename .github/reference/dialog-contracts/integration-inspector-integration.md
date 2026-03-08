# Inspector Integration

How the Inspector uses dialogs:

```
┌─────────────────────┐
│ INSPECTOR           │
│                     │
│ Widget Properties:  │
│                     │
│ Border: [Edit...]◀─┼─── Click opens BorderEditorDialog
│ Shadow: [Edit...]◀─┼─── Click opens ShadowEditorDialog
│ Font:   [Pick...]◀─┼─── Click opens FontPickerDialog
│ Icon:   [Pick...]◀─┼─── Click opens IconPickerSimpleDialog
│                     │
└─────────┬───────────┘
          │
          │ (dialog completes)
          ▼
    ┌──────────────┐
    │ CALLBACK     │
    │              │
    │ (result) => {│
    │   widget.config.property = result;
    │   inspector.updateWidget(widget);
    │ }            │
    └──────────────┘
```

**Pattern**: Inspector creates dialog → passes callback → updates widget on completion

---

## Navigate

↓ **Field Types**: [field-types.md](field-types.md) - Which field opens which dialog
⟲ **Callbacks**: [callback-patterns.md](callback-patterns.md) - Standard callback usage
