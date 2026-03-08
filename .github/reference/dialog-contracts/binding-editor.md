# BindingEditorDialog Contract

## Current Implementation

**File:** `www/canvas-ui/dialogs/binding-editor.js`

## Interface

### Constructor

```javascript
constructor(entityManager, currentBinding, callback);
```

**Parameters:**

- `entityManager` (Object) - EntityManager instance for entity picker
- `currentBinding` (String) - Current binding expression (e.g., `{sensor.temp;*1.8;+32}`)
- `callback` (Function) - Called with new binding: `(expression) => void`

### Methods

```javascript
show(); // Opens dialog
close(); // Closes dialog
```

## Data Flow

**Input:**

- `currentBinding` - Existing binding expression to edit
- Parses expression to pre-fill entity and operations

**Output:**

- Calls `callback(expression)` with completed binding string
- Returns: String (e.g., `{sensor.temperature;*1.8;+32;round(1)}`)

## Modes

- **Simple Mode**: Single entity + visual operation builder
- **Multi-variable Mode**: JavaScript eval expressions with multiple entities

## Features

- ✅ 45+ operations across 5 categories (Math, Format, String, Array, Conditional)
- ✅ Entity picker integration
- ✅ Operation builder (visual)
- ✅ Live preview with current entity values
- ✅ MDI icon picker with color selector
- ✅ Multi-variable JavaScript eval support

## Assessment

✅ **Already well-standardized**

- Clean 3-param constructor
- Parses current value
- Simple callback pattern

## Potential Improvements

- ⚠️ None needed - already excellent

## Example Usage

```javascript
const dialog = new BindingEditorDialog(
  canvasCore.entityManager,
  widget.config.text, // e.g., "{sensor.temp;*1.8;+32}"
  (expression) => {
    widget.config.text = expression;
    inspector.updateWidget(widget);
  },
);
dialog.show();
```

## Conclusion

BindingEditorDialog represents sophisticated, production-ready code with excellent separation of concerns. The dual-mode approach (simple builder + advanced expression editor) provides flexibility for both novice and power users. No changes needed.

---
## Navigate
↑ **Pattern**: [pattern-entity-aware-editor.md](pattern-entity-aware-editor.md) - Pattern 4 (most complex)
→ **Similar**: [visibility-condition.md](visibility-condition.md) - Also entity-aware editor with dual modes
↓ **Opens**: [entity-picker.md](entity-picker.md) - Nested dialog for entity selection
⟲ **Flow**: [flow-nested-dialogs.md](flow-nested-dialogs.md) - How nesting works
