# Shadow Styling

Widget box shadow using ShadowEditorDialog.

## Field

**Shadow** (optional)

- Opens ShadowEditorDialog
- Returns CSS box-shadow string
- Supports multiple shadow layers

## Dialog Integration

```javascript
const dialog = new ShadowEditorDialog(
  widget.config.boxShadow, // Current CSS shadow string
  (shadowString) => {
    widget.config.boxShadow = shadowString;
    inspector.updateWidget(widget);
  },
);
dialog.show();
```

## Returned Value

ShadowEditorDialog returns complete CSS string:

```javascript
"0 2px 4px rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.1)";
```

Supports:

- Multiple shadow layers (comma-separated)
- Inset shadows
- X/Y offset, blur, spread, color

## Widget Application

```javascript
render() {
  if (this.config.boxShadow) {
    this.element.style.boxShadow = this.config.boxShadow;
  }
}
```

## Common Presets

ShadowEditorDialog includes presets:

- None
- Subtle (small shadow)
- Medium (standard elevation)
- Strong (high elevation)
- Material Design elevation levels

---

## Navigate

↑ **Border**: [widget-api-styling-border.md](widget-api-styling-border.md)
→ **Padding**: [widget-api-styling-padding.md](widget-api-styling-padding.md)
⟲ **Dialog**: [shadow-editor.md](shadow-editor.md)
