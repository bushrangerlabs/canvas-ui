# Z-Index (Layer Control)

Controls widget stacking order (which appears on top).

## What is Z-Index?

CSS property that controls layering:

- Higher z-index = appears on top
- Lower z-index = appears below
- Default: Auto-assigned based on creation order

## Implementation

**Number Input:**

```javascript
<input type="number" value="${widget.config.zIndex || 'auto'}"
       onchange="updateZIndex(this.value)">
```

**Auto-Assignment:**

- New widgets get `zIndex = Date.now()` (timestamp)
- Ensures newer widgets appear on top
- Prevents conflicts

## Common Operations

**Bring to Front:**

```javascript
widget.config.zIndex = Math.max(...allWidgets.map((w) => w.config.zIndex)) + 1;
```

**Send to Back:**

```javascript
widget.config.zIndex = Math.min(...allWidgets.map((w) => w.config.zIndex)) - 1;
```

**Move Up One Layer:**

```javascript
const above = findWidgetAbove(widget);
widget.config.zIndex = above.config.zIndex + 1;
```

## Inspector UI

Could add helper buttons:

- [↑ Bring to Front]
- [↓ Send to Back]
- [+ Move Up]
- [- Move Down]

---

## Navigate

↑ **Position**: [widget-api-position-coordinate-fields.md](widget-api-position-coordinate-fields.md)
→ **Next Section**: [widget-api-custom-section-overview.md](widget-api-custom-section-overview.md)
