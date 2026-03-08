# IconPickerSimpleDialog Contract

## Constructor

```javascript
constructor(callback);
```

## Parameters

- **callback** (Function) - Called with selected icon name: `(iconName) => void`

## Data Flow

**Input**: None (no current value pre-selection)

**Output**: Calls `callback(iconName)` with icon name string:

```javascript
"mdi-fire"; // Icon name only, NO color
```

## Features

- ✅ Category dropdown (20+ categories: common, weather, devices, etc.)
- ✅ Icon grid (4 columns, visual preview)
- ✅ Search/filter by icon name
- ✅ 8000+ MDI icons organized by category
- ✅ Icon preview with hover states
- ✅ Keyboard navigation support
- ✅ No color picker (simple version)

## Difference from IconPickerDialog

**IconPickerSimpleDialog** (Inspector):

- No color picker
- Returns: `"mdi-fire"`
- Used in widget property fields
- Simpler, faster UI

**IconPickerDialog** (Bindings):

- WITH color picker
- Returns: `"mdi:fire:#ff5500 "` (formatted with color)
- Used in binding expressions
- Full-featured UI

## Assessment

✅ **Already well-standardized**

- Clean 1-param constructor (callback only)
- Simple callback pattern
- Returns icon name string (no color)
- No changes needed

## Potential Improvements

⚠️ **Consider for future**:

- Add `currentValue` parameter for pre-selection
- Add "recently used" icons section
- Add icon favorites/bookmarks

## Example Usage

```javascript
const dialog = new IconPickerSimpleDialog((iconName) => {
  widget.config.icon = iconName; // e.g., "mdi-fire"
  inspector.updateWidget(widget);
});
dialog.show();
```

## Output Format

Returns simple icon name string:

- Format: `"mdi-iconname"`
- Example: `"mdi-fire"`, `"mdi-lightbulb"`, `"mdi-thermometer"`
- No color information
- No formatting (plain string)

## Categories

- common - Most frequently used icons
- weather - Weather conditions
- devices - Electronics, hardware
- home - Home automation, rooms
- media - Playback, controls
- navigation - Arrows, directions
- notification - Alerts, badges
- social - Social media, communication
- file - File types, folders
- editor - Text editing, formatting
- ... (20+ total categories)

## Integration

Used in inspector for icon property fields:

```javascript
{
  icon: {
    type: "icon",           // Triggers icon picker
    label: "Icon",
    default: "mdi-home",
    category: "Appearance"
  }
}
```

Inspector creates `...` button that opens IconPickerSimpleDialog.

## Notes

- Lightweight version for quick icon selection
- No current value support (always starts fresh)
- Category-based organization for easy browsing
- Search supports partial matching

## Conclusion

IconPickerSimpleDialog is production-ready with a well-focused feature set. The simplified interface (no color picker) makes it perfect for inspector field use. Potential improvement would be adding `currentValue` parameter support for pre-selection, but this is optional.

---
## Navigate
↑ **Pattern**: [pattern-simple-picker.md](pattern-simple-picker.md) - Pattern 1 (simplest: callback only)
→ **Compare**: [font-picker.md](font-picker.md) - Also a picker but with currentValue
⟲ **Integration**: [integration-field-types.md](integration-field-types.md) - How inspector uses this
