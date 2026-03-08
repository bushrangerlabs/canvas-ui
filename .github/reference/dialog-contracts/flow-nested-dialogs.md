# Nested Dialog Flow

How dialogs open other dialogs:

```
┌──────────────────────────┐
│ BindingEditorDialog      │
│ z-index: 10000           │
│                          │
│ [Entity: ___________]    │
│        [📋 Pick Entity]◀─┼─── User clicks
│                          │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│ EntityPickerDialog       │
│ z-index: 10002 (higher)  │
│                          │
│ 🔍 Search: living        │
│                          │
│ ☑ light.living_room      │◀─── User selects
│ ☐ light.bedroom          │
└────────────┬─────────────┘
             │
             │ onSelect(entityId)
             ▼
┌──────────────────────────┐
│ BindingEditorDialog      │
│                          │
│ [Entity: light.living_room]
│        [📋 Pick Entity]  │
│                          │
│ [Operations...]          │
└──────────────────────────┘
```

**Key**: Nested dialog gets higher z-index, parent remains open below

---

## Navigate

↑ **Dialogs**: [../binding-editor.md](../binding-editor.md), [../visibility-condition.md](../visibility-condition.md)
⟲ **z-index**: [../concept-z-index-stacking.md](../concept-z-index-stacking.md)
