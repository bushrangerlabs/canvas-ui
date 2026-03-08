# ShadowEditorDialog Contract

## Constructor

```javascript
constructor(currentValue, callback);
```

## Parameters

- **currentValue** (String) - Current CSS box-shadow string (e.g., `"0 4px 8px rgba(0,0,0,0.3)"` or multiple shadows)
- **callback** (Function) - Called with new shadow CSS string: `(shadowString) => void`

## Data Flow

**Input**: Current CSS box-shadow string

- Single shadow: `"0 4px 8px 0 rgba(0, 0, 0, 0.3)"`
- Multiple shadows: `"0 2px 4px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.5)"`
- Empty/none: `""` or `"none"`

**Output**: Calls `callback(shadowString)` with complete CSS box-shadow string:

```javascript
"0 4px 8px 0 rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.5)";
```

## Features

- ✅ Visual preview with live updates
- ✅ Multiple shadow layers (outer + inner)
- ✅ Shadow presets (subtle, medium, strong, etc.)
- ✅ Per-shadow controls:
  - X offset (-50 to +50px)
  - Y offset (-50 to +50px)
  - Blur radius (0-50px)
  - Spread radius (-20 to +20px)
  - Color picker
  - Inset toggle (inner vs outer shadow)
  - Enable/disable toggle
- ✅ Add/remove shadow layers
- ✅ Shadow ordering (layer management)
- ✅ Parses existing CSS box-shadow strings (including multiple shadows)

## Shadow Object Format (Internal)

Each shadow stored as:

```javascript
{
  enabled: true,
  inset: false,
  x: 0,
  y: 4,
  blur: 8,
  spread: 0,
  color: "rgba(0, 0, 0, 0.3)"
}
```

## Presets

- **None**: No shadow
- **Subtle**: `0 1px 3px rgba(0,0,0,0.12)`
- **Medium**: `0 4px 6px rgba(0,0,0,0.16)`
- **Strong**: `0 10px 20px rgba(0,0,0,0.3)`
- **Glow**: `0 0 15px rgba(3,169,244,0.6)`
- **Inset**: `inset 0 2px 4px rgba(0,0,0,0.2)`

## Assessment

✅ **Already well-standardized**

- Clean 2-param constructor (currentValue, callback)
- Parses complex CSS shadow strings (multiple shadows with inset)
- Returns complete CSS string ready for use
- No changes needed

## Potential Improvements

⚠️ **Consider for future**:

- Add more presets (Material Design elevation levels)
- Add "copy shadow" button to duplicate layer
- Add drag-to-reorder for shadow layers

## Example Usage

```javascript
const dialog = new ShadowEditorDialog(
  widget.config.boxShadow, // e.g., "0 4px 8px rgba(0,0,0,0.3)"
  (shadowString) => {
    widget.config.boxShadow = shadowString;
    inspector.updateWidget(widget);
  },
);
dialog.show();
```

## Output Format

Returns complete CSS box-shadow string:

- Single shadow: `"0 4px 8px 0 rgba(0, 0, 0, 0.3)"`
- Multiple shadows: Comma-separated list
- Handles inset shadows: `"inset 0 2px 4px rgba(0,0,0,0.2)"`
- Disabled shadows: Omitted from output
- All shadows disabled: `"none"`

## Notes

- Supports unlimited shadow layers (outer + inner)
- Automatically parses comma-separated shadow strings
- Preserves rgba color format with opacity
- Live preview updates as user adjusts sliders

## Conclusion

ShadowEditorDialog is production-ready with a sophisticated feature set. The multiple shadows support, preset library, and live preview create an excellent user experience. No changes needed.

---
## Navigate
↑ **Pattern**: [pattern-editor-current-value.md](pattern-editor-current-value.md) - Pattern 2 (editor with pre-fill)
→ **Similar**: [border-editor.md](border-editor.md) - Also CSS editor with parsing
↓ **Concept**: [concept-atomic-properties.md](concept-atomic-properties.md) - Shadow layers as atomic values
⟲ **Integration**: [integration-field-types.md](integration-field-types.md) - How inspector uses this
