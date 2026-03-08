# Pattern 2: Editor with Current Value

**Constructor**: `(currentValue, callback)`

## Characteristics

- Pre-fills with current value
- Parses multiple input formats (CSS, objects, strings)
- Returns updated value via callback
- Most common pattern

## Examples

- [../border-editor.md](../border-editor.md)
- [../shadow-editor.md](../shadow-editor.md)
- [../font-picker.md](../font-picker.md)

## Flow

```
Constructor(current, callback)
  ↓
Parse currentValue (CSS/object/string)
  ↓
show() - Pre-fill UI with parsed values
  ↓
User modifies + live preview
  ↓
callback(newValue)
  ↓
close()
```

---

## Navigate

↑ **Pattern List**: [../patterns.md](../patterns.md)
← **Simpler**: [simple-picker.md](simple-picker.md)
→ **More Complex**: [entity-aware-picker.md](entity-aware-picker.md)
↓ **Parsing**: [../flow-parse-render-interact.md](../flow-parse-render-interact.md)
