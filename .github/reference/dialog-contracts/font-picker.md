# FontPickerDialog Contract

## Constructor

```javascript
constructor(currentValue, callback);
```

## Parameters

- **currentValue** (String) - Current font name or family (e.g., `"Arial"`, `"Roboto"`, `"inherit"`)
- **callback** (Function) - Called with selected font CSS family: `(fontFamily) => void`

## Data Flow

**Input**: Current font name string

- Simple name: `"Arial"`, `"Georgia"`, `"Roboto"`
- Special: `"inherit"` (inherit from parent)
- Default: `"inherit"`

**Output**: Calls `callback(fontFamily)` with complete CSS font-family string:

```javascript
"Arial, sans-serif";
"'Roboto', sans-serif";
"'Times New Roman', Times, serif";
"inherit";
```

## Features

- ✅ Two font categories:
  1. **Web-Safe Fonts** - System fonts, no loading required
  2. **Google Fonts** - Popular fonts, auto-loaded
- ✅ Live preview of each font
- ✅ Search/filter by font name
- ✅ Preview text customization
- ✅ Font preview with sample text ("The quick brown fox...")
- ✅ Category tabs (Web-Safe / Google Fonts)
- ✅ Inherit option (use parent font)
- ✅ Automatic Google Font loading on selection

## Font Categories

### Web-Safe Fonts (No loading)

- inherit - Inherit from parent
- Arial - Arial, sans-serif
- Helvetica - Helvetica, Arial, sans-serif
- Times New Roman - 'Times New Roman', Times, serif
- Georgia - Georgia, serif
- Courier New - 'Courier New', Courier, monospace
- Verdana - Verdana, Geneva, sans-serif
- Trebuchet MS - 'Trebuchet MS', sans-serif
- Comic Sans MS - 'Comic Sans MS', cursive

### Google Fonts (Auto-loaded)

- Roboto - 'Roboto', sans-serif
- Open Sans - 'Open Sans', sans-serif
- Lato - 'Lato', sans-serif
- Montserrat - 'Montserrat', sans-serif
- Poppins - 'Poppins', sans-serif
- Raleway - 'Raleway', sans-serif
- Inter - 'Inter', sans-serif
- Nunito - 'Nunito', sans-serif
- ... (20+ popular fonts)

## Assessment

✅ **Already well-standardized**

- Clean 2-param constructor (currentValue, callback)
- Pre-selects current font
- Returns complete CSS font-family string
- Handles Google Font loading automatically
- No changes needed

## Potential Improvements

⚠️ **Consider for future**:

- Add font weight selector (300, 400, 700, etc.)
- Add font style (italic, oblique)
- Add "upload custom font" feature
- Add font pairing suggestions

## Example Usage

```javascript
const dialog = new FontPickerDialog(
  widget.config.fontFamily, // e.g., "Roboto" or "inherit"
  (fontFamily) => {
    widget.config.fontFamily = fontFamily; // e.g., "'Roboto', sans-serif"
    inspector.updateWidget(widget);
  },
);
dialog.show();
```

## Output Format

Returns complete CSS font-family string with fallbacks:

- Web-safe: `"Arial, sans-serif"`
- Google Font: `"'Roboto', sans-serif"`
- Inherit: `"inherit"`
- Always includes appropriate fallback fonts (sans-serif, serif, monospace, etc.)

## Google Font Loading

When Google Font selected:

1. Dialog automatically injects font into document
2. Uses Google Fonts API: `https://fonts.googleapis.com/css2?family=FontName`
3. Font becomes available immediately
4. Cached by browser for future use

## Integration

Used in inspector for font property fields:

```javascript
{
  fontFamily: {
    type: "font",           // Triggers font picker
    label: "Font",
    default: "inherit",
    category: "Typography"
  }
}
```

## Notes

- Pre-selects current font in dialog
- Live preview shows actual font rendering
- Search supports partial matching
- Fonts organized by category for easy browsing
- Google Fonts loaded on demand (performance optimized)

## Conclusion

FontPickerDialog is production-ready with excellent font selection UX. The automatic Google Font loading and fallback system makes it both powerful and user-friendly. No changes needed.

---
## Navigate
↑ **Pattern**: [pattern-editor-current-value.md](pattern-editor-current-value.md) - Pattern 2 (editor with pre-fill)
→ **Compare**: [icon-picker-simple.md](icon-picker-simple.md) - Simpler picker (no currentValue)
⟲ **Integration**: [integration-field-types.md](integration-field-types.md) - How inspector uses this
