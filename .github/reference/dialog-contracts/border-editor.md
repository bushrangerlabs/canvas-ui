# BorderEditorDialog Contract

## Constructor

```javascript
constructor(currentValue, callback);
```

## Parameters

- **currentValue** (String) - Current border CSS string or object (e.g., `"2px solid #03a9f4"` or `{borderTop: "...", borderRight: "..."}`)
- **callback** (Function) - Called with new border value: `(borderObject) => void`

## Data Flow

**Input**: Current border value (CSS string or object format)

- CSS shorthand: `"2px solid #03a9f4"`
- Object format: `{borderTop: "1px solid #ccc", borderRight: "...", ...}`
- Border radius: Parsed from object if present

**Output**: Calls `callback(borderObject)` with:

```javascript
{
  border: "2px solid rgba(3, 169, 244, 1.0)",  // Unified border (if not individual)
  borderRadius: "8px",                          // Border radius value
  borderTop: "...",                             // Individual borders (if enabled)
  borderRight: "...",
  borderBottom: "...",
  borderLeft: "...",
  borderTopLeftRadius: "...",                   // Individual radii (if enabled)
  borderTopRightRadius: "...",
  // ... etc
}
```

## Features

- ✅ Visual preview of border (live updates)
- ✅ Enable/disable border toggle
- ✅ Unified border mode (all sides same)
- ✅ Individual border mode (each side separate: top, right, bottom, left)
- ✅ Width slider (0-20px)
- ✅ Style dropdown (solid, dashed, dotted, double, groove, ridge, inset, outset)
- ✅ Color picker
- ✅ Opacity slider (0-1.0)
- ✅ Border radius editor (0-50px)
- ✅ Unified radius mode (all corners same)
- ✅ Individual radius mode (each corner separate)
- ✅ Parses existing CSS shorthand and object formats

## Modes

1. **Unified Border**: All sides use same width/style/color/opacity
2. **Individual Borders**: Each side (top/right/bottom/left) has independent settings
3. **Unified Radius**: All corners use same radius
4. **Individual Radius**: Each corner (topLeft/topRight/bottomRight/bottomLeft) independent

## Assessment

✅ **Already well-standardized**

- Clean 2-param constructor (currentValue, callback)
- Parses both CSS and object formats
- Returns comprehensive object with atomic properties
- No changes needed

## Potential Improvements

⚠️ **Consider for future**:

- Add presets (common border styles: "card", "button", "input", etc.)
- Add "none" quick button to clear border
- Add copy/paste between sides

## Example Usage

```javascript
const dialog = new BorderEditorDialog(
  widget.config.border, // e.g., "2px solid #03a9f4" or object
  (borderObject) => {
    // Update widget config with atomic border properties
    Object.assign(widget.config, borderObject);
    inspector.updateWidget(widget);
  },
);
dialog.show();
```

## Output Format

Returns object with atomic properties (follows inspector standards):

- `border` - Shorthand (if unified mode)
- `borderTop`, `borderRight`, `borderBottom`, `borderLeft` - Individual borders (if individual mode)
- `borderRadius` - Shorthand (if unified radius)
- `borderTopLeftRadius`, `borderTopRightRadius`, `borderBottomRightRadius`, `borderBottomLeftRadius` - Individual radii (if individual mode)
- Each border includes opacity (e.g., `rgba(3, 169, 244, 0.5)`)

## Notes

- Handles migration between CSS shorthand and object formats seamlessly
- Automatically updates borderRadius object when parsing
- Outputs atomic properties ready for inspector persistence

## Conclusion

BorderEditorDialog is production-ready with excellent UX and a well-designed contract. The atomic property approach provides flexibility for both simple and complex border configurations. No changes needed.

---
## Navigate
↑ **Pattern**: [pattern-editor-current-value.md](pattern-editor-current-value.md) - Pattern 2 (editor with pre-fill)
→ **Similar**: [shadow-editor.md](shadow-editor.md) - Also CSS editor with atomic output
↓ **Concept**: [concept-atomic-properties.md](concept-atomic-properties.md) - Why atomic properties matter
⟲ **Integration**: [integration-field-types.md](integration-field-types.md) - How inspector uses this
