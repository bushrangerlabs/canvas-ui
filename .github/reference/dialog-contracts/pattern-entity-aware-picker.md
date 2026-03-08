# Pattern 3: Entity-Aware Picker

**Constructor**: `(entityManager, callback)`

## Characteristics

- Requires EntityManager dependency
- No current value (no pre-selection by design)
- Returns entity ID string
- Real-time entity data

## Example: EntityPickerDialog

```javascript
const dialog = new EntityPickerDialog(canvasCore.entityManager, (entityId) => {
  widget.config.entity = entityId; // "light.living_room"
  inspector.updateWidget(widget);
});
dialog.show();
```

## Flow

```
Constructor(entityManager, callback)
  ↓
show() → getAllEntities() from EntityManager
  ↓
Render list (grouped by domain)
  ↓
User searches & selects
  ↓
callback(entityId)
```

---

## Navigate

↑ **Pattern List**: [../patterns.md](../patterns.md)
← **Simpler**: [editor-current-value.md](editor-current-value.md)
→ **Most Complex**: [entity-aware-editor.md](entity-aware-editor.md)
⟲ **Example**: [../entity-picker.md](../entity-picker.md)
