# Padding Controls

Space between widget border and inner content.

## What is Padding?

Padding creates space inside the widget border:

- Pushes content away from edges
- Exposes background color/image
- Makes widgets look less cramped
- Useful for buttons, cards, text widgets

## Four Values

**Top, Right, Bottom, Left** (T/R/B/L)

- Individual control for each side
- Measured in pixels
- Default: 0 (no padding)

## Implementation

**Inspector Fields:**

```javascript
<div class="field-group padding-controls">
  <label>Padding</label>
  <div class="four-value-input">
    <input type="number" placeholder="Top" value="${config.paddingTop || 0}">
    <input type="number" placeholder="Right" value="${config.paddingRight || 0}">
    <input type="number" placeholder="Bottom" value="${config.paddingBottom || 0}">
    <input type="number" placeholder="Left" value="${config.paddingLeft || 0}">
  </div>
</div>
```

## Unified vs Individual

Could add:

- **Unified mode** - One value for all sides
- **Individual mode** - Separate controls (default)
- **Link button** - Lock values together

## Widget Application

```javascript
render() {
  this.element.style.paddingTop = `${this.config.paddingTop || 0}px`;
  this.element.style.paddingRight = `${this.config.paddingRight || 0}px`;
  this.element.style.paddingBottom = `${this.config.paddingBottom || 0}px`;
  this.element.style.paddingLeft = `${this.config.paddingLeft || 0}px`;
}
```

---

## Navigate

↑ **Shadow**: [widget-api-styling-shadow.md](widget-api-styling-shadow.md)
→ **Background Image**: [widget-api-styling-background-image.md](widget-api-styling-background-image.md)
