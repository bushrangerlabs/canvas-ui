# Background Image

Widget background image using FileBrowserDialog.

## Field

**Background Image** (optional)

- Opens FileBrowserDialog (to be created)
- Returns file path
- Supports image formats: jpg, png, gif, svg, webp

## Dialog Integration

```javascript
const dialog = new FileBrowserDialog(
  canvasCore.fileService,
  widget.config.backgroundImage, // Current image path
  (filePath) => {
    widget.config.backgroundImage = filePath;
    inspector.updateWidget(widget);
  },
);
dialog.show();
```

## Additional Properties

**Background Size:**

- `cover` - Fill widget, crop if needed (default)
- `contain` - Fit within widget, no crop
- `auto` - Original size
- Custom: `100px 200px`

**Background Position:**

- `center` - Center image (default)
- `top left`, `top right`, `bottom left`, `bottom right`
- Custom: `50% 50%`

**Background Repeat:**

- `no-repeat` - Single image (default)
- `repeat` - Tile image
- `repeat-x` - Tile horizontally
- `repeat-y` - Tile vertically

## Widget Application

```javascript
render() {
  if (this.config.backgroundImage) {
    this.element.style.backgroundImage = `url(${this.config.backgroundImage})`;
    this.element.style.backgroundSize = this.config.backgroundSize || 'cover';
    this.element.style.backgroundPosition = this.config.backgroundPosition || 'center';
    this.element.style.backgroundRepeat = this.config.backgroundRepeat || 'no-repeat';
  }
}
```

---

## Navigate

↑ **Padding**: [widget-api-styling-padding.md](widget-api-styling-padding.md)
→ **Next Section**: [widget-api-visibility-conditions.md](widget-api-visibility-conditions.md)
⟲ **Dialog**: Future FileBrowserDialog contract
