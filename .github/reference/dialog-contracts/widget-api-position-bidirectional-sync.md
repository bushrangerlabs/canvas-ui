# Position Bi-Directional Sync

How position values stay in sync between inspector and canvas.

## The Problem

Widget can be moved/resized in two places:

1. **Canvas** - Drag widget, resize handles
2. **Inspector** - Type values in input fields

Both must stay synchronized in real-time.

## Bi-Directional Flow

```
CANVAS DRAG/RESIZE          INSPECTOR INPUT
      ↓                           ↓
   Update widget.config      Update widget.config
      ↓                           ↓
   Trigger event             Trigger event
      ↓                           ↓
      ├───────────→ widget.render() ←───────────┤
      ↓                           ↓
   Update DOM                Update inspector fields
```

## Implementation

**Canvas updates inspector:**

```javascript
// In DragHandler
onDragEnd(widget, x, y) {
  widget.config.x = x;
  widget.config.y = y;
  inspector.updatePositionFields(widget); // ← Update inspector
}
```

**Inspector updates canvas:**

```javascript
// In Inspector
onPositionChange(field, value) {
  widget.config[field] = value;
  widget.render(); // ← Re-render on canvas
}
```

## Key Point

Single source of truth: `widget.config`

- Both canvas and inspector read from it
- Both update it
- Both trigger re-renders

---

## Navigate

↑ **Section**: [widget-api-universal-inspector-structure.md](widget-api-universal-inspector-structure.md)
→ **Fields**: [widget-api-position-coordinate-fields.md](widget-api-position-coordinate-fields.md)
↓ **Z-Index**: [widget-api-position-z-index.md](widget-api-position-z-index.md)
