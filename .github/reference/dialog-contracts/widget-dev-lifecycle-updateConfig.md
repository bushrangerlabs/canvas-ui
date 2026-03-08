# Widget Lifecycle: updateConfig() Method

Strategies for handling inspector configuration changes efficiently.

## updateConfig() Decision Tree

```
updateConfig(newConfig) called
        ↓
Update this.config
        ↓
What changed?
        │
        ├── Entity changed?
        │   └── Re-bind (cleanupBindings + setupBindings)
        │
        ├── Layout/structure changed?
        │   └── Full re-render
        │
        ├── Simple text/color changed?
        │   └── Granular update (updateDisplay)
        │
        └── Styling changed?
            └── Re-apply styling (applyUniversalStyling)
```

## Strategy 1: Simple (Always Re-render)

```javascript
updateConfig(newConfig) {
  Object.assign(this.config, newConfig);
  this.render();
}
```

**Pros:** Simple, always works  
**Cons:** Slow, destroys DOM state (loses focus, animations)

**Use for:** Simple widgets with minimal re-render cost

## Strategy 2: Granular Updates

```javascript
updateConfig(newConfig) {
  Object.assign(this.config, newConfig);

  // Simple updates: use updateDisplay
  const simpleChanges = {};
  if (newConfig.text !== undefined) simpleChanges.text = newConfig.text;
  if (newConfig.textColor !== undefined) simpleChanges.textColor = newConfig.textColor;

  if (Object.keys(simpleChanges).length > 0) {
    this.updateDisplay(simpleChanges);
  }

  // Complex updates: full render
  if (newConfig.showIcon !== undefined || newConfig.layout !== undefined) {
    this.render();
  }
}
```

**Pros:** Fast, preserves DOM state  
**Cons:** More complex, must handle all cases

**Use for:** Widgets with frequently-changed simple properties

## Strategy 3: Smart (Hybrid)

```javascript
updateConfig(newConfig) {
  // ============================================================
  // STEP 1: UPDATE CONFIG
  // ============================================================
  Object.assign(this.config, newConfig);

  // ============================================================
  // STEP 2: HANDLE ENTITY CHANGE
  // ============================================================
  if (newConfig.entity !== undefined) {
    this.cleanupBindings();
    this.setupBindings();
  }

  // ============================================================
  // STEP 3: HANDLE LAYOUT CHANGES (full render)
  // ============================================================
  if (
    newConfig.showIcon !== undefined ||
    newConfig.iconPosition !== undefined ||
    newConfig.layout !== undefined
  ) {
    this.render();
    return;  // Exit early, render does everything
  }

  // ============================================================
  // STEP 4: HANDLE SIMPLE CHANGES (granular update)
  // ============================================================
  const changes = {};
  if (newConfig.text !== undefined) changes.text = newConfig.text;
  if (newConfig.icon !== undefined) changes.icon = newConfig.icon;

  if (Object.keys(changes).length > 0) {
    this.updateDisplay(changes);
  }

  // ============================================================
  // STEP 5: HANDLE STYLING CHANGES
  // ============================================================
  if (
    newConfig.backgroundColor !== undefined ||
    newConfig.border !== undefined ||
    newConfig.boxShadow !== undefined
  ) {
    this.applyUniversalStyling();
  }

  // ============================================================
  // STEP 6: HANDLE CUSTOM STYLING
  // ============================================================
  if (newConfig.fontSize !== undefined) {
    this.element.style.fontSize = newConfig.fontSize + "px";
  }

  if (newConfig.textColor !== undefined) {
    this.element.style.color = newConfig.textColor;
  }
}
```

**Pros:** Optimal performance, precise control  
**Cons:** Most complex, requires careful testing

**Use for:** Complex widgets with many configurable properties

## Common Update Strategies Comparison

| Change Type       | Strategy  | Method            | Speed | Complexity |
| ----------------- | --------- | ----------------- | ----- | ---------- |
| Text content      | Granular  | updateDisplay()   | Fast  | Low        |
| Color/style       | Granular  | updateDisplay()   | Fast  | Low        |
| Icon show/hide    | Re-render | render()          | Slow  | Low        |
| Layout change     | Re-render | render()          | Slow  | Low        |
| Entity change     | Re-bind   | setup/cleanupBind | Med   | Medium     |
| Universal styling | Re-apply  | applyUniversal    | Fast  | Low        |
| Multiple changes  | Re-render | render()          | Slow  | Low        |

## Update Best Practices

### ✅ DO

- [ ] Update `this.config` first
- [ ] Use granular updates when possible
- [ ] Re-bind when entity changes
- [ ] Re-render for structural changes
- [ ] Exit early after re-render (avoid duplicate work)
- [ ] Batch multiple simple changes
- [ ] Test all update paths

### ❌ DON'T

- [ ] Don't modify `this.config` directly outside updateConfig
- [ ] Don't re-render on every config change
- [ ] Don't forget to handle entity changes
- [ ] Don't update if value hasn't changed
- [ ] Don't apply styling that hasn't changed
- [ ] Don't forget to re-apply universal styling after re-render

## Update Examples

### Minimal Widget

```javascript
updateConfig(newConfig) {
  Object.assign(this.config, newConfig);

  if (newConfig.text !== undefined) {
    this.element.textContent = newConfig.text;
  }
}
```

### Entity Widget

```javascript
updateConfig(newConfig) {
  Object.assign(this.config, newConfig);

  // Re-bind if entity changed
  if (newConfig.entity !== undefined) {
    this.cleanupBindings();
    this.setupBindings();
  }

  // Update text
  if (newConfig.text !== undefined) {
    this.updateDisplay({ text: newConfig.text });
  }
}
```

### Advanced Widget

```javascript
updateConfig(newConfig) {
  Object.assign(this.config, newConfig);

  // Entity change: re-bind
  if (newConfig.entity !== undefined) {
    this.cleanupBindings();
    this.setupBindings();
  }

  // Structural change: full re-render
  if (
    newConfig.showIcon !== undefined ||
    newConfig.iconPosition !== undefined
  ) {
    this.render();
    this.applyUniversalStyling();
    return;
  }

  // Simple changes: granular update
  const updates = {};
  if (newConfig.text !== undefined) updates.text = newConfig.text;
  if (newConfig.icon !== undefined) updates.icon = newConfig.icon;

  if (Object.keys(updates).length > 0) {
    this.updateDisplay(updates);
  }

  // Universal styling changes
  if (
    newConfig.backgroundColor !== undefined ||
    newConfig.border !== undefined
  ) {
    this.applyUniversalStyling();
  }

  // Custom styling
  if (newConfig.fontSize !== undefined) {
    this.element.style.fontSize = newConfig.fontSize + "px";
  }
}
```

## Update Flow Diagrams

### Re-render Flow

```
updateConfig({ showIcon: true })
     ↓
Detect structural change
     ↓
Call render()
     ↓
Rebuild complete DOM
     ↓
Re-apply universal styling
     ↓
Done
```

### Granular Update Flow

```
updateConfig({ text: "New Text" })
     ↓
Detect simple change
     ↓
Call updateDisplay({ text: "New Text" })
     ↓
Update specific element only
     ↓
Done (fast, no DOM rebuild)
```

### Re-bind Flow

```
updateConfig({ entity: "sensor.new" })
     ↓
Detect entity change
     ↓
Call cleanupBindings()
     ↓
Unsubscribe from old entity
     ↓
Call setupBindings()
     ↓
Subscribe to new entity
     ↓
Get initial state
     ↓
Update display
```

## Navigate

↑ **Overview**: [widget-dev-lifecycle.md](widget-dev-lifecycle.md) - Lifecycle state machine and timing
← **Previous**: [widget-dev-lifecycle-unmount.md](widget-dev-lifecycle-unmount.md) - Widget cleanup
← **Mount**: [widget-dev-lifecycle-mount.md](widget-dev-lifecycle-mount.md) - Widget initialization
⟲ **Rendering**: [widget-dev-rendering.md](widget-dev-rendering.md) - render() vs updateDisplay()
⟲ **Bindings**: [widget-dev-entity-bindings.md](widget-dev-entity-bindings.md) - Re-binding on entity change
⟲ **Class Structure**: [widget-dev-class-structure.md](widget-dev-class-structure.md) - Where updateConfig() fits
