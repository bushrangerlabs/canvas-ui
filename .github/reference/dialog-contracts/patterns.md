# Standard Dialog Patterns

All dialogs follow 1 of 4 patterns:

## Pattern 1: Simple Picker

**Constructor**: `(callback)`

- No current value
- No dependencies
- Example: [icon-picker-simple.md](icon-picker-simple.md)

## Pattern 2: Editor with Current Value

**Constructor**: `(currentValue, callback)`

- Pre-fills with current value
- Parses multiple formats
- Examples: [border-editor.md](border-editor.md), [shadow-editor.md](shadow-editor.md), [font-picker.md](font-picker.md)

## Pattern 3: Entity-Aware Picker

**Constructor**: `(entityManager, callback)`

- Needs entity data
- No current value
- Example: [entity-picker.md](entity-picker.md)

## Pattern 4: Entity-Aware Editor

**Constructor**: `(entityManager, currentValue, callback)`

- Needs entity data + current value
- Most complex pattern
- Examples: [binding-editor.md](binding-editor.md), [visibility-condition.md](visibility-condition.md)

---

## Navigate

↓ **Pattern 1**: [pattern-simple-picker.md](pattern-simple-picker.md) - Simple picker pattern
↓ **Pattern 2**: [pattern-editor-current-value.md](pattern-editor-current-value.md) - Editor with current value
↓ **Pattern 3**: [pattern-entity-aware-picker.md](pattern-entity-aware-picker.md) - Entity-aware picker
↓ **Pattern 4**: [pattern-entity-aware-editor.md](pattern-entity-aware-editor.md) - Entity-aware editor
↑ **Broader**: [lifecycle.md](lifecycle.md) - Common lifecycle
⟲ **Uses**: [dependencies.md](dependencies.md) - What each needs
