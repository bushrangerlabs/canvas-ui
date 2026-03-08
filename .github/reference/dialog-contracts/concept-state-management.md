# Dialog State Management

How dialogs manage internal state:

## Constructor State

```javascript
constructor(currentValue, callback) {
  this.currentValue = currentValue;  // Store params
  this.callback = callback;
  this.state = this._parse(currentValue); // Parse into state
}
```

## UI State (During Interaction)

- Form values (sliders, inputs, dropdowns)
- Preview state (live rendering)
- Validation errors
- Mode switches (simple ↔ advanced)

## No Persistent State

- Dialogs destroyed on close
- No state saved between uses
- Each open = fresh instance
- Prevents state bugs

## State Flow

```
Constructor → Parse → Store state
     ↓
show() → Render from state
     ↓
User interaction → Update state → Re-render preview
     ↓
Apply → Build output from state → Callback
     ↓
close() → Destroy state
```

---

## Navigate

↑ **Lifecycle**: [../lifecycle.md](../lifecycle.md)
⟲ **Flow**: [../flow-parse-render-interact.md](../flow-parse-render-interact.md)
