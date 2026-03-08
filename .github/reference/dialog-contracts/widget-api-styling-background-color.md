# Background Color

Widget background color with color picker.

## Field

**Background Color** (optional)

- Default: transparent
- Supports: hex, rgb, rgba
- Uses ColorPickerDialog (to be created)

## Implementation

**Inspector Field:**

```javascript
{
  name: 'backgroundColor',
  type: 'color',
  label: 'Background',
  default: 'transparent'
}
```

**Color Picker Button:**

```javascript
<div class="field-group">
  <label>Background</label>
  <div class="color-field">
    <input type="text" value="${widget.config.backgroundColor || 'transparent'}">
    <button class="color-swatch" style="background: ${widget.config.backgroundColor}"
            onclick="openColorPicker()"></button>
  </div>
</div>
```

## ColorPickerDialog (Future)

```javascript
const dialog = new ColorPickerDialog(widget.config.backgroundColor, (color) => {
  widget.config.backgroundColor = color;
  inspector.updateWidget(widget);
});
dialog.show();
```

## Widget Application

```javascript
render() {
  this.element.style.backgroundColor = this.config.backgroundColor || 'transparent';
}
```

---

## Navigate

↑ **Section**: [widget-api-universal-inspector-structure.md](widget-api-universal-inspector-structure.md)
→ **Border**: [widget-api-styling-border.md](widget-api-styling-border.md)
⟲ **Dialog**: Future ColorPickerDialog contract
