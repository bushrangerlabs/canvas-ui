# Widget Development: Rendering & Display

How widgets create DOM elements and update visual state.

## Render vs UpdateDisplay Decision Tree

```
Need to change widget display?
│
├── STRUCTURAL CHANGE (layout, add/remove elements)
│   └── Use render()
│       ├── Icon show/hide toggle
│       ├── Layout direction change
│       ├── Add/remove UI sections
│       └── Complete rebuild needed
│           → Slow but complete
│
├── SIMPLE CHANGE (text, color, style)
│   └── Use updateDisplay()
│       ├── Text content change
│       ├── Color change
│       ├── Font size change
│       └── Simple style updates
│           → Fast and efficient
│
└── INITIAL DISPLAY
    └── Use render() in mount()
        → Build complete structure once
```

## Rendering Methods Overview

| Method            | Speed       | DOM Impact      | Use Case                    |
| ----------------- | ----------- | --------------- | --------------------------- |
| `render()`        | ⭐ Slow     | Full rebuild    | Initial mount, structure    |
| `updateDisplay()` | ⭐⭐⭐ Fast | Granular update | Text, colors, simple styles |

## Three Rendering Topics

### [render() Method](widget-dev-rendering-render-method.md) - Build DOM Structure

Creating and rebuilding widget's complete DOM structure.

**Template Strategies:**
1. Inline HTML (Simple)
2. Helper Methods (Readable)
3. DOM API (Maximum Control)
4. DocumentFragment (Performance)

**Best for:** Initial mount, layout changes, structural updates

**[Read render() method guide →](widget-dev-rendering-render-method.md)**

### [updateDisplay() Method](widget-dev-rendering-update-display.md) - Granular Updates

Applying visual updates without full re-render.

**Update Types:**
- Text content changes
- Icon updates
- Color changes
- Font size changes
- Visibility toggles

**Best for:** Frequent updates, binding evaluations, simple changes

**[Read updateDisplay() method guide →](widget-dev-rendering-update-display.md)**

### [Performance Optimization](widget-dev-rendering-optimization.md) - Techniques

Advanced techniques for efficient rendering and updates.

**Optimization Techniques:**
1. Cache DOM references
2. Batch DOM updates
3. Debounce rapid updates
4. Use DocumentFragment
5. Minimize reflows
6. Responsive rendering

**[Read optimization guide →](widget-dev-rendering-optimization.md)**

## Rendering Checklist

**For new widgets:**

- [ ] Implement render() for initial structure
- [ ] Cache frequently-updated DOM references
- [ ] Implement updateDisplay() for simple changes
- [ ] Use appropriate template strategy
- [ ] Apply universal styling in mount()
- [ ] Test with binding expressions (if supported)
- [ ] Verify no memory leaks (cleanup observers)
- [ ] Optimize for frequent updates

**For performance:**

- [ ] Minimize full re-renders
- [ ] Batch style changes
- [ ] Use cached references
- [ ] Debounce rapid updates (if needed)
- [ ] Use DocumentFragment for lists
- [ ] Avoid layout thrashing (read/write separation)

## Navigate

↑ **INDEX**: [widget-dev-INDEX.md](widget-dev-INDEX.md) - Widget development entry point
→ **Render Method**: [widget-dev-rendering-render-method.md](widget-dev-rendering-render-method.md) - DOM construction
→ **UpdateDisplay**: [widget-dev-rendering-update-display.md](widget-dev-rendering-update-display.md) - Granular updates
→ **Optimization**: [widget-dev-rendering-optimization.md](widget-dev-rendering-optimization.md) - Performance techniques
→ **Lifecycle**: [widget-dev-lifecycle.md](widget-dev-lifecycle.md) - Called from mount() and updateConfig()
→ **Bindings**: [widget-dev-entity-bindings.md](widget-dev-entity-bindings.md) - Trigger renders on state changes
→ **Example**: [widget-dev-complete-example.md](widget-dev-complete-example.md) - See rendering strategies
⟲ **Class Structure**: [widget-dev-class-structure.md](widget-dev-class-structure.md) - Display methods section
⟲ **Canvas**: [canvas-flow-widget-rendering.md](canvas-flow-widget-rendering.md) - Canvas rendering coordination
