# Widget Rendering: Performance Optimization

Techniques for efficient widget rendering and updates.

## Performance Optimization Techniques

### Technique 1: Cache DOM References

```javascript
mount(container) {
  this.element = document.createElement('div');
  this.render();
  container.appendChild(this.element);

  // CACHE: Store references to frequently updated elements
  this.stateEl = this.element.querySelector('.state-value');
  this.iconEl = this.element.querySelector('.icon');
  this.textEl = this.element.querySelector('.text');
}

updateDisplay(changes) {
  // FAST: Use cached references (no querySelector)
  if (changes.state !== undefined && this.stateEl) {
    this.stateEl.textContent = changes.state;
  }

  if (changes.text !== undefined && this.textEl) {
    this.textEl.textContent = changes.text;
  }
}
```

**Performance:**

```
Without cache:
  querySelector('.state') → traverses DOM → slow
  querySelector('.text')  → traverses DOM → slow

With cache:
  this.stateEl → direct reference → fast
  this.textEl  → direct reference → fast
```

### Technique 2: Batch DOM Updates

```javascript
updateDisplay(changes) {
  // ❌ BAD: Multiple reflows
  if (changes.textColor) this.element.style.color = changes.textColor;
  if (changes.fontSize) this.element.style.fontSize = changes.fontSize + 'px';
  if (changes.backgroundColor) this.element.style.backgroundColor = changes.backgroundColor;

  // ✓ GOOD: Single reflow
  const styleChanges = {};
  if (changes.textColor) styleChanges.color = changes.textColor;
  if (changes.fontSize) styleChanges.fontSize = changes.fontSize + 'px';
  if (changes.backgroundColor) styleChanges.backgroundColor = changes.backgroundColor;

  Object.assign(this.element.style, styleChanges);
}
```

**Why batching helps:**

```
3 separate changes:
  change color → browser reflows → slow
  change fontSize → browser reflows → slow
  change backgroundColor → browser reflows → slow
  = 3 reflows

Batched changes:
  collect all changes
  apply at once → browser reflows once
  = 1 reflow
```

### Technique 3: Debounce Rapid Updates

```javascript
constructor(canvasCore, config) {
  super(canvasCore, config);

  // DEBOUNCE: Prevent rapid-fire renders
  this.debouncedRender = this.debounce(this.render.bind(this), 100);
}

onEntityUpdate(state) {
  // Entity updates can happen rapidly
  // Use debounced version to prevent excessive renders
  this.debouncedRender();
}

debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
```

**Debounce Flow:**

```
Update 1 → start timer (100ms)
Update 2 (50ms later) → cancel timer, start new timer
Update 3 (50ms later) → cancel timer, start new timer
Update 4 (50ms later) → cancel timer, start new timer
... no more updates for 100ms ...
Timer expires → execute render()

Result: 4 updates → 1 render
```

### Technique 4: Use DocumentFragment

```javascript
render() {
  // PERFORMANCE: DocumentFragment (off-DOM construction)
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < this.config.items.length; i++) {
    const item = document.createElement('div');
    item.className = 'item';
    item.textContent = this.config.items[i];
    fragment.appendChild(item);
  }

  // Single DOM operation
  this.element.innerHTML = '';
  this.element.appendChild(fragment);
}
```

**Why DocumentFragment:**

```
Without Fragment:
  for each item:
    create element → add to DOM (reflow!)
    create element → add to DOM (reflow!)
    create element → add to DOM (reflow!)
  = Many reflows = SLOW

With Fragment:
  create fragment (off-DOM)
  for each item:
    create element → add to fragment (no reflow)
    create element → add to fragment (no reflow)
    create element → add to fragment (no reflow)
  add fragment to DOM (single reflow)
  = One reflow = FAST
```

### Technique 5: Minimize Reflows

```javascript
// ❌ BAD: Forces reflow on each read
updateDisplay(changes) {
  const height = this.element.offsetHeight;  // Read → reflow
  this.element.style.width = height + 'px';  // Write

  const width = this.element.offsetWidth;    // Read → reflow
  this.element.style.height = width + 'px';  // Write
}

// ✓ GOOD: Batch reads, then writes
updateDisplay(changes) {
  // Read phase (all reads together)
  const height = this.element.offsetHeight;
  const width = this.element.offsetWidth;

  // Write phase (all writes together)
  this.element.style.width = height + 'px';
  this.element.style.height = width + 'px';
}
```

**Layout Thrashing:**

```
Read → Write → Read → Write = Multiple reflows (SLOW)

Read → Read → Write → Write = Single reflow (FAST)
```

## Responsive Rendering

Handle widget resize events:

```javascript
mount(container) {
  this.element = document.createElement('div');
  this.render();
  container.appendChild(this.element);

  // Observe size changes
  this.resizeObserver = new ResizeObserver(() => {
    this.onResize();
  });
  this.resizeObserver.observe(this.element);
}

onResize() {
  const { width, height } = this.element.getBoundingClientRect();

  // Adjust font size based on widget size
  const fontSize = Math.max(12, Math.min(width / 10, 24));
  this.element.style.fontSize = fontSize + 'px';

  // Hide icon if too small
  if (width < 100 && this.iconEl) {
    this.iconEl.style.display = 'none';
  } else if (this.iconEl) {
    this.iconEl.style.display = '';
  }
}

unmount() {
  if (this.resizeObserver) {
    this.resizeObserver.disconnect();
  }
  this.element.remove();
  this.mounted = false;
}
```

## Styling Approaches

### Styling Decision Tree

```
How to apply styles?
│
├── STATIC STYLES (don't change)
│   └── External CSS file
│       ├── Clean separation
│       ├── Reusable classes
│       └── Best for shared styles
│
├── DYNAMIC STYLES (from config)
│   ├── Few styles?
│   │   └── Inline styles (element.style.x)
│   └── Many styles?
│       └── Style object (Object.assign)
│
└── WIDGET API STYLES (universal)
    └── applyUniversalStyling()
        └── Background, border, shadow, padding
```

### Approach 1: Inline Styles (Simple)

```javascript
render() {
  this.element.innerHTML = `
    <div style="
      background: ${this.config.backgroundColor || '#333'};
      color: ${this.config.textColor || '#fff'};
      font-size: ${this.config.fontSize || 16}px;
      padding: 10px;
      border-radius: 4px;
    ">
      ${this.config.text}
    </div>
  `;
}
```

**Pros:** Direct, simple  
**Cons:** Verbose, hard to maintain

### Approach 2: CSS Classes (Maintainable)

```javascript
// widget.js
render() {
  const theme = this.config.theme || 'dark';
  this.element.innerHTML = `
    <div class="button-content ${theme}-theme">
      ${this.config.text}
    </div>
  `;
}

// widget.css
.button-content {
  padding: 10px;
  border-radius: 4px;
}

.dark-theme {
  background: #333;
  color: #fff;
}

.light-theme {
  background: #fff;
  color: #333;
}
```

**Pros:** Clean, maintainable, performant  
**Cons:** Requires CSS file

### Approach 3: Style Objects (Programmatic)

```javascript
render() {
  this.element.innerHTML = `<div class="button-content">${this.config.text}</div>`;

  const contentEl = this.element.querySelector('.button-content');

  // Apply styles via object
  Object.assign(contentEl.style, {
    backgroundColor: this.config.backgroundColor || '#333',
    color: this.config.textColor || '#fff',
    fontSize: (this.config.fontSize || 16) + 'px',
    padding: '10px',
    borderRadius: '4px'
  });
}
```

**Pros:** Programmatic, type-safe  
**Cons:** More verbose

### Approach 4: Universal Styling (Widget API)

```javascript
mount(container) {
  this.element = document.createElement('div');
  this.element.className = 'my-widget';

  // Widget-specific render
  this.render();

  // Apply Widget API universal styling
  this.applyUniversalStyling();

  container.appendChild(this.element);
}

applyUniversalStyling() {
  const cfg = this.config;

  // Background
  if (cfg.backgroundColor) {
    this.element.style.backgroundColor = cfg.backgroundColor;
  }

  // Border
  if (cfg.border) this.element.style.border = cfg.border;
  if (cfg.borderRadius) this.element.style.borderRadius = cfg.borderRadius + 'px';
  if (cfg.borderOpacity !== undefined) {
    // Apply opacity to border
  }

  // Shadow
  if (cfg.boxShadow) this.element.style.boxShadow = cfg.boxShadow;

  // Padding
  if (cfg.paddingTop) this.element.style.paddingTop = cfg.paddingTop + 'px';
  if (cfg.paddingRight) this.element.style.paddingRight = cfg.paddingRight + 'px';
  if (cfg.paddingBottom) this.element.style.paddingBottom = cfg.paddingBottom + 'px';
  if (cfg.paddingLeft) this.element.style.paddingLeft = cfg.paddingLeft + 'px';

  // Background Image
  if (cfg.backgroundImage) {
    this.element.style.backgroundImage = `url(${cfg.backgroundImage})`;
    this.element.style.backgroundSize = cfg.backgroundSize || 'cover';
    this.element.style.backgroundPosition = cfg.backgroundPosition || 'center';
    this.element.style.backgroundRepeat = cfg.backgroundRepeat || 'no-repeat';
  }
}
```

**What Universal Styling Provides:**

- Background color & image
- Border (width, style, color, radius, opacity)
- Box shadow
- Padding (top, right, bottom, left)

**All handled automatically by Widget API!**

## Rendering Performance Chart

| Technique              | Render Impact | Update Speed | Complexity |
| ---------------------- | ------------- | ------------ | ---------- |
| Full re-render         | ⭐⭐⭐ High   | ⭐ Slow      | ⭐ Low     |
| Granular updateDisplay | ⭐ Low        | ⭐⭐⭐ Fast  | ⭐⭐ Med   |
| Cached DOM references  | —             | ⭐⭐⭐ Fast  | ⭐ Low     |
| Batched style updates  | —             | ⭐⭐⭐ Fast  | ⭐ Low     |
| Debounced renders      | ⭐ Low        | ⭐⭐ Med     | ⭐⭐ Med   |
| DocumentFragment       | ⭐ Low        | ⭐⭐⭐ Fast  | ⭐⭐ Med   |

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

↑ **Overview**: [widget-dev-rendering.md](widget-dev-rendering.md) - Rendering method comparison
← **Previous**: [widget-dev-rendering-update-display.md](widget-dev-rendering-update-display.md) - updateDisplay() method
← **Render**: [widget-dev-rendering-render-method.md](widget-dev-rendering-render-method.md) - render() method
⟲ **Lifecycle**: [widget-dev-lifecycle-mount.md](widget-dev-lifecycle-mount.md) - Called from mount()
⟲ **Class Structure**: [widget-dev-class-structure.md](widget-dev-class-structure.md) - Display methods section
