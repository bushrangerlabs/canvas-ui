# Position Coordinate Fields

X, Y, Width, Height implementation in inspector.

## Four Core Fields

**X (Horizontal Position)**

- Distance from left edge of canvas
- Pixels (px)
- Updates during drag

**Y (Vertical Position)**

- Distance from top edge of canvas
- Pixels (px)
- Updates during drag

**Width**

- Widget width
- Pixels (px)
- Updates during resize

**Height**

- Widget height
- Pixels (px)
- Updates during resize

## Input Field Behavior

**Number Inputs:**

- Type: `<input type="number">`
- Min: 0 (no negative positions/sizes)
- Step: 1 (whole pixels)
- Bi-directional sync with canvas

**Live Update:**

```javascript
<input type="number" value="${widget.config.x}"
       onchange="updatePosition('x', this.value)">
```

## Validation

- Width/Height minimum: 10px (prevent invisible widgets)
- X/Y no maximum (allow off-canvas positioning)
- Round to whole pixels (no sub-pixel positioning)

## Grid Snapping

When grid snap is enabled:

```javascript
function snapToGrid(value) {
  return Math.round(value / gridSize) * gridSize;
}
```

---

## Navigate

↑ **Sync**: [widget-api-position-bidirectional-sync.md](widget-api-position-bidirectional-sync.md)
→ **Layers**: [widget-api-position-z-index.md](widget-api-position-z-index.md)
