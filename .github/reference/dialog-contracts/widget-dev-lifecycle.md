# Widget Development: Lifecycle Methods

The three required methods every widget must implement: `mount()`, `unmount()`, and `updateConfig()`.

## Lifecycle State Machine

```
┌─────────────┐
│   CREATED   │ (new WidgetClass(core, config))
└──────┬──────┘
       │
       ↓ mount(container) called
       │
┌──────────────┐
│   MOUNTED    │ ← this.mounted = true
│  (Active)    │
└──────┬───────┘
       │
       ├──→ updateConfig() ──┐
       │                     │
       ←─────────────────────┘
       │
       ↓ unmount() called
       │
┌──────────────┐
│  UNMOUNTED   │ ← this.mounted = false
│ (Destroyed)  │
└──────────────┘
```

## Lifecycle Timing Diagram

```
Widget Lifecycle Events:

User Creates Widget
        ↓
    new Widget()
        ↓ (constructor runs)
    mount(container)
        ↓ (widget appears on canvas)
    ┌─────────────────┐
    │                 │
    │  Widget Active  │ ← User interacts
    │                 │
    └─────────────────┘
        ↓ (inspector changes)
    updateConfig(changes)
        ↓ (widget updates)
    ┌─────────────────┐
    │                 │
    │  Widget Active  │
    │                 │
    └─────────────────┘
        ↓ (user deletes or switches view)
    unmount()
        ↓
    Widget Destroyed
```

## Three Lifecycle Methods

### [mount(container)](widget-dev-lifecycle-mount.md) - Initialize Widget

9-step process for displaying widget on canvas:

1. Store container reference
2. Create root element
3. Initial render
4. Setup event listeners
5. Setup entity bindings
6. Apply universal styling
7. Setup visibility system
8. Append to container
9. Mark as mounted

**[Read detailed mount() guide →](widget-dev-lifecycle-mount.md)**

### [unmount()](widget-dev-lifecycle-unmount.md) - Cleanup Widget

Complete cleanup checklist:

1. Check if mounted
2. Cleanup bindings
3. Remove event listeners
4. Cancel timers/animations
5. Remove from DOM
6. Clear references
7. Mark as unmounted

**[Read detailed unmount() guide →](widget-dev-lifecycle-unmount.md)**

### [updateConfig(newConfig)](widget-dev-lifecycle-updateConfig.md) - Handle Changes

Three update strategies:

- **Simple:** Always re-render (easy, slow)
- **Granular:** Update only changed elements (fast, complex)
- **Smart:** Hybrid approach (optimal, moderate complexity)

**[Read detailed updateConfig() guide →](widget-dev-lifecycle-updateConfig.md)**

## Lifecycle Best Practices

### ✅ DO

- [ ] Always call `super()` in constructor
- [ ] Bind event handlers in constructor
- [ ] Check `this.mounted` in unmount()
- [ ] Clean up ALL subscriptions in unmount()
- [ ] Remove ALL event listeners in unmount()
- [ ] Clear timers/intervals in unmount()
- [ ] Set `this.mounted = true` at end of mount()
- [ ] Set `this.mounted = false` in unmount()
- [ ] Use granular updates when possible
- [ ] Log mount/unmount for debugging

### ❌ DON'T

- [ ] Don't forget to bind event handlers
- [ ] Don't subscribe without cleanup
- [ ] Don't add listeners without removal
- [ ] Don't access DOM before mount()
- [ ] Don't modify config directly (use updateConfig)
- [ ] Don't re-render on every config change
- [ ] Don't forget to handle entity changes
- [ ] Don't leave timers running after unmount

## Navigate

↑ **INDEX**: [widget-dev-INDEX.md](widget-dev-INDEX.md) - Widget development entry point
→ **Mount Details**: [widget-dev-lifecycle-mount.md](widget-dev-lifecycle-mount.md) - 9-step initialization
→ **Unmount Details**: [widget-dev-lifecycle-unmount.md](widget-dev-lifecycle-unmount.md) - Cleanup checklist
→ **UpdateConfig Details**: [widget-dev-lifecycle-updateConfig.md](widget-dev-lifecycle-updateConfig.md) - Update strategies
→ **Metadata**: [widget-dev-metadata.md](widget-dev-metadata.md) - getMetadata() defines behavior
→ **Bindings**: [widget-dev-entity-bindings.md](widget-dev-entity-bindings.md) - Setup in mount()
→ **Rendering**: [widget-dev-rendering.md](widget-dev-rendering.md) - Called from mount() and updateConfig()
→ **Example**: [widget-dev-complete-example.md](widget-dev-complete-example.md) - Complete lifecycle implementation
⟲ **Class Structure**: [widget-dev-class-structure.md](widget-dev-class-structure.md) - Where lifecycle fits
⟲ **Canvas**: [canvas-flow-widget-creation.md](canvas-flow-widget-creation.md) - When canvas calls lifecycle methods
