# VisibilityConditionDialog Contract

## Constructor

```javascript
constructor(entityManager, currentValue, callback);
```

## Parameters

- **entityManager** (Object) - EntityManager instance for entity picker
- **currentValue** (String) - Current visibility condition (binding expression that evaluates to true/false)
- **callback** (Function) - Called with new binding expression: `(expression) => void`

## Data Flow

**Input**: Current visibility binding expression (boolean expression)

- Simple: `"{light.living_room;==('on')}"`
- Complex: `"{sensor.temperature;>(25)} && {binary_sensor.motion;==('on')}"`
- Empty: `""` (widget always visible)

**Output**: Calls `callback(expression)` with complete boolean binding expression:

```javascript
"{light.living_room;==('on')}";
"{sensor.temperature;>(20)} && {sensor.humidity;<(80)}";
```

## Features

- ✅ Dual modes:
  1. **Simple Builder** - Point-and-click condition builder
  2. **Advanced Expression** - Manual JavaScript expression editor
- ✅ Simple mode features:
  - Entity picker integration
  - Operator dropdown (==, !=, >, <, >=, <=, contains, etc.)
  - Value input
  - Multiple conditions (AND / OR logic)
  - Add/remove conditions
- ✅ Advanced mode features:
  - Free-form JavaScript expression
  - Multiple entity bindings
  - Complex logic (&&, ||, !)
  - Syntax highlighting
- ✅ Live preview (shows current evaluation result)
- ✅ Mode switching (simple ↔ advanced)
- ✅ Parses existing expressions (attempts simple mode, falls back to advanced)

## Modes

### 1. Simple Builder Mode

Visual condition builder:

- Select entity (via EntityPickerDialog)
- Choose operator: `==`, `!=`, `>`, `<`, `>=`, `<=`, `contains`, `startsWith`, `endsWith`
- Enter value to compare
- Add multiple conditions with AND/OR logic

Example output: `"{light.living_room;==('on')}"`

### 2. Advanced Expression Mode

Manual JavaScript expression:

- Direct binding expression input
- Supports multiple entities
- Complex boolean logic
- Full JavaScript eval support

Example output: `"{sensor.temp;>(25)} && {binary_sensor.motion;==('on')}"`

## Operators (Simple Mode)

- `==` - Equal to
- `!=` - Not equal to
- `>` - Greater than
- `<` - Less than
- `>=` - Greater than or equal
- `<=` - Less than or equal
- `contains` - String contains
- `startsWith` - String starts with
- `endsWith` - String ends with

## Logic Combinators

- **AND** - All conditions must be true
- **OR** - Any condition must be true

## Assessment

✅ **Already well-standardized**

- Clean 3-param constructor (entityManager, currentValue, callback)
- Parses existing expressions
- Dual-mode design (simple + advanced)
- Returns binding expression string
- No changes needed

## Potential Improvements

⚠️ **Consider for future**:

- Add "test/preview" button to evaluate condition live
- Add condition templates (common patterns)
- Add visual expression tree for complex conditions
- Better parsing of advanced expressions back to simple mode

## Example Usage

```javascript
const dialog = new VisibilityConditionDialog(
  canvasCore.entityManager,
  widget.config.visibilityCondition, // e.g., "{light.living_room;==('on')}"
  (expression) => {
    widget.config.visibilityCondition = expression;
    widget.setupVisibilityCondition(); // Re-evaluate visibility
    inspector.updateWidget(widget);
  },
);
dialog.show();
```

## Output Format

Returns binding expression that evaluates to boolean:

- Single condition: `"{entity_id;operation(value)}"`
- Multiple AND: `"{entity1;op(val)} && {entity2;op(val)}"`
- Multiple OR: `"{entity1;op(val)} || {entity2;op(val)}"`
- Complex: `"({entity1;op(val)} && {entity2;op(val)}) || {entity3;op(val)}"`

## Widget Integration

All widgets support `visibilityCondition` property:

```javascript
configSchema = {
  visibilityCondition: {
    type: "text",
    label: "Visibility Condition",
    default: "",
    category: "Behavior",
    binding: true, // Triggers {} button → VisibilityConditionDialog
    placeholder: "Leave blank to always show",
    description: "Widget shows when expression evaluates to true",
  },
};
```

When expression evaluates to false:

- Widget container gets `display: none`
- Widget hidden but not removed from DOM
- Re-evaluated on entity state changes

## Notes

- Similar to BindingEditorDialog but outputs boolean expressions
- Integrates EntityPickerDialog for entity selection
- Supports complex multi-entity conditions
- Mode switching preserves data when possible
- Falls back to advanced mode if simple parsing fails

## Conclusion

VisibilityConditionDialog is production-ready with an excellent dual-mode design. The simple builder + advanced expression editor provides the perfect balance of usability and power. No changes needed.

---
## Navigate
↑ **Pattern**: [pattern-entity-aware-editor.md](pattern-entity-aware-editor.md) - Pattern 4 (most complex)
→ **Similar**: [binding-editor.md](binding-editor.md) - Also entity-aware editor with dual modes
↓ **Opens**: [entity-picker.md](entity-picker.md) - Nested dialog for entity selection
⟲ **Flow**: [flow-nested-dialogs.md](flow-nested-dialogs.md) - How nesting works
