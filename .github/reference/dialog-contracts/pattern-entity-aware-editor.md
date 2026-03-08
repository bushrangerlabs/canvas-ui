# Pattern 4: Entity-Aware Editor

**Constructor**: `(entityManager, currentValue, callback)`

## Characteristics

- Requires EntityManager dependency
- Pre-fills with current value
- Often opens EntityPickerDialog (nested)
- Returns binding/expression string
- Most complex pattern

## Examples

- [../binding-editor.md](../binding-editor.md) - Binding expressions
- [../visibility-condition.md](../visibility-condition.md) - Visibility conditions

## Flow

```
Constructor(entityManager, current, callback)
  ↓
Parse currentValue (extract entity + operations)
  ↓
show() - Pre-fill UI
  ↓
User clicks entity button → Opens EntityPickerDialog
  ↓
EntityPickerDialog returns entityId
  ↓
User builds expression/condition
  ↓
callback(expression)
```

---

## Navigate

↑ **Pattern List**: [../patterns.md](../patterns.md)
← **Simpler**: [entity-aware-picker.md](entity-aware-picker.md)
↓ **Nesting**: [../flow-nested-dialogs.md](../flow-nested-dialogs.md)
⟲ **Examples**: [../binding-editor.md](../binding-editor.md), [../visibility-condition.md](../visibility-condition.md)
