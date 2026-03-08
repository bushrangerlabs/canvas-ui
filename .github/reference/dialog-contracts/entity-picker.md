# EntityPickerDialog Contract

## Current Implementation

**File:** `www/canvas-ui/dialogs/entity-picker.js`

## Interface

### Constructor

```javascript
constructor(entityManager, onSelect);
```

**Parameters:**

- `entityManager` (Object) - EntityManager instance providing entity list
- `onSelect` (Function) - Callback when entity selected: `(entityId) => void`

### Methods

```javascript
show(); // Opens dialog, focuses search
close(); // Removes dialog from DOM
```

## Data Flow

**Input:**

- EntityManager provides: `getAllEntities()` → Array of entity objects
- No default/current value support currently

**Output:**

- Calls `onSelect(entityId)` when user clicks entity
- Returns: String (e.g., "light.living_room")

## Features

- ✅ Search/filter by entity ID or friendly name
- ✅ Grouped by domain (light, sensor, switch, etc.)
- ✅ Domain icons with colors (40+ domains)
- ✅ State badges (on/off, value)
- ✅ Recent entities section

## Assessment

✅ **Already well-standardized**

- Clean 2-param constructor
- Simple callback pattern
- No unnecessary dependencies

## Potential Improvements

- ⚠️ Add `defaultValue` parameter for pre-selection
- ⚠️ Add domain filter option
- ⚠️ Add multi-select mode (returns array)

## Example Usage

```javascript
const dialog = new EntityPickerDialog(canvasCore.entityManager, (entityId) => {
  widget.config.entity = entityId;
  inspector.updateWidget(widget);
});
dialog.show();
```

## Conclusion

EntityPickerDialog is production-ready with a clean, well-defined contract that perfectly supports the Canvas UI's entity-driven architecture. No changes needed.

---
## Navigate
↑ **Pattern**: [pattern-entity-aware-picker.md](pattern-entity-aware-picker.md) - Pattern 3
→ **Similar**: [binding-editor.md](binding-editor.md) - Also uses EntityManager
⟲ **Used by**: [flow-nested-dialogs.md](flow-nested-dialogs.md) - Opened by BindingEditor/VisibilityCondition
