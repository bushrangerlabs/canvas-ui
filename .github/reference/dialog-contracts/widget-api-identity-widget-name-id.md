# Widget Name/ID Section

First section in every widget's inspector.

## Fields

**Widget Name** (optional)

- User-friendly label
- Shown in widget selector dropdown
- Helps identify widgets in complex dashboards
- Example: "Living Room Temperature"

**Widget ID** (required, auto-generated)

- Unique identifier (e.g., "widget_1234567890")
- Auto-generated on widget creation
- Immutable (cannot be changed)
- Used for internal references

## Implementation

```javascript
// In Inspector
renderIdentitySection() {
  return `
    <div class="inspector-section">
      <h3>Widget Name/ID</h3>
      <label>Name</label>
      <input type="text" value="${widget.config.name || ''}"
             onchange="updateWidgetName(this.value)">
      <label>ID</label>
      <input type="text" value="${widget.id}" disabled>
    </div>
  `;
}
```

## Storage

Stored in widget config:

- `widget.id` - Unique ID (immutable)
- `widget.config.name` - User-defined name (optional)

---

## Navigate

↑ **Overview**: [widget-api-universal-inspector-structure.md](widget-api-universal-inspector-structure.md)
↓ **Next Section**: [widget-api-position-bidirectional-sync.md](widget-api-position-bidirectional-sync.md)
↓ **Next Section**: [position-bidirectional-sync.md](position-bidirectional-sync.md)
