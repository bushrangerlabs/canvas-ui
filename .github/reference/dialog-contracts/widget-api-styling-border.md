# Border Styling

Widget border configuration using BorderEditorDialog.

## Field

**Border** (optional)

- Opens BorderEditorDialog
- Returns atomic border properties
- Supports unified or individual sides

## Dialog Integration

```javascript
const dialog = new BorderEditorDialog(
  widget.config.border, // Current value (CSS string or object)
  (borderObject) => {
    // Atomic properties returned:
    Object.assign(widget.config, borderObject);
    inspector.updateWidget(widget);
  },
);
dialog.show();
```

## Returned Properties

BorderEditorDialog returns:

```javascript
{
  border: "2px solid #03a9f4",           // Unified shorthand
  borderRadius: "4px",
  borderTop: "2px solid #03a9f4",        // Individual sides
  borderRight: "2px solid #03a9f4",
  borderBottom: "2px solid #03a9f4",
  borderLeft: "2px solid #03a9f4",
  borderOpacity: 1.0
}
```

## Widget Application

```javascript
render() {
  if (this.config.border) {
    this.element.style.border = this.config.border;
  }
  if (this.config.borderRadius) {
    this.element.style.borderRadius = this.config.borderRadius;
  }
  // Apply individual sides if set...
}
```

---

## Navigate

↑ **Background**: [widget-api-styling-background-color.md](widget-api-styling-background-color.md)
→ **Shadow**: [widget-api-styling-shadow.md](widget-api-styling-shadow.md)
⟲ **Dialog**: [border-editor.md](border-editor.md)
