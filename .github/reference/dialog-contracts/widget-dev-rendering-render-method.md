# Widget Rendering: render() Method

Creating and rebuilding widget's complete DOM structure.

**Purpose:** Create or rebuild widget's complete DOM structure

## render() Flow

```
render() called
     ↓
Build HTML structure
     ├─→ Template literals (simple)
     ├─→ DOM API (complex)
     └─→ DocumentFragment (performance)
     ↓
Set this.element.innerHTML
     ↓
Cache DOM references (optional)
     ├─→ this.textEl = querySelector('.text')
     ├─→ this.iconEl = querySelector('.icon')
     └─→ this.stateEl = querySelector('.state')
     ↓
Widget structure updated
```

## When to Call render()

```
✓ Initial mount (in mount() method)
✓ Layout changes (icon position, orientation)
✓ Show/hide major sections
✓ Complete structure change

✗ Text content updates (use updateDisplay)
✗ Color changes (use updateDisplay)
✗ Simple style changes (use updateDisplay)
```

## Template Strategy 1: Inline HTML (Simple)

```javascript
render() {
  if (!this.element) return;

  // SIMPLE: Template literal
  this.element.innerHTML = `
    <div class="widget-content">
      <h1>${this.config.title || "Title"}</h1>
      <p>${this.config.text || ""}</p>
    </div>
  `;
}
```

**Pros:**

- Very simple and readable
- Good for static-ish templates
- Easy to understand

**Cons:**

- Can't escape HTML (XSS risk)
- Destroys event listeners
- Rebuilds entire DOM

**Use for:** Simple widgets with minimal dynamic content

## Template Strategy 2: Helper Methods (Readable)

```javascript
render() {
  if (!this.element) return;

  const { showIcon, iconPosition, showState } = this.config;

  // READABLE: Break into helpers
  this.element.innerHTML = `
    <div class="button" style="flex-direction: ${this.getFlexDirection()}">
      ${showIcon ? this.renderIcon() : ''}
      <div class="button-content">
        ${this.renderText()}
        ${showState ? this.renderState() : ''}
      </div>
    </div>
  `;

  // Cache references for updateDisplay
  this.iconEl = this.element.querySelector('.button-icon');
  this.textEl = this.element.querySelector('.button-text');
  this.stateEl = this.element.querySelector('.button-state');
}

getFlexDirection() {
  const { iconPosition } = this.config;
  if (iconPosition === 'top') return 'column';
  if (iconPosition === 'bottom') return 'column-reverse';
  if (iconPosition === 'right') return 'row-reverse';
  return 'row';  // default left
}

renderIcon() {
  const icon = this.config.icon || 'mdi-help';
  const size = this.config.iconSize || 24;
  return `<i class="button-icon ${icon}" style="font-size: ${size}px;"></i>`;
}

renderText() {
  const text = this.config.text || 'Button';
  const fontSize = this.config.fontSize || 16;
  return `<span class="button-text" style="font-size: ${fontSize}px;">${text}</span>`;
}

renderState() {
  const state = this.currentState?.state || '—';
  const fontSize = (this.config.fontSize || 16) * 0.8;
  return `<span class="button-state" style="font-size: ${fontSize}px;">${state}</span>`;
}
```

**Pros:**

- Very readable
- Reusable helper methods
- Easy to test individual sections
- Good for complex widgets

**Cons:**

- More code
- Still rebuilds DOM

**Use for:** Complex widgets with conditional sections

## Template Strategy 3: DOM API (Maximum Control)

```javascript
render() {
  // CONTROL: DOM API methods
  this.element.innerHTML = '';  // Clear existing

  const container = document.createElement('div');
  container.className = 'widget-content';

  const title = document.createElement('h1');
  title.textContent = this.config.title || 'Title';

  const text = document.createElement('p');
  text.textContent = this.config.text || '';

  container.appendChild(title);
  container.appendChild(text);
  this.element.appendChild(container);

  // Cache references
  this.titleEl = title;
  this.textEl = text;
}
```

**Pros:**

- No HTML injection risk
- Fine-grained control
- Can attach event listeners immediately

**Cons:**

- More verbose
- Harder to visualize structure

**Use for:** Widgets needing security or fine control

## Template Strategy 4: DocumentFragment (Performance)

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

**Use for:** Widgets with many child elements (lists, tables)

## Caching DOM References

**Why Cache:**

```javascript
// ❌ BAD: Query DOM every update (slow)
updateDisplay(changes) {
  const textEl = this.element.querySelector('.text');
  if (textEl) textEl.textContent = changes.text;
}

// ✓ GOOD: Cache once in render() (fast)
render() {
  this.element.innerHTML = `<span class="text">Text</span>`;
  this.textEl = this.element.querySelector('.text');  // ← Cache
}

updateDisplay(changes) {
  if (this.textEl) this.textEl.textContent = changes.text;  // ← Use cache
}
```

**Best Practice:**

```javascript
render() {
  // Build structure
  this.element.innerHTML = `
    <div class="widget">
      <div class="icon"></div>
      <div class="text"></div>
      <div class="state"></div>
    </div>
  `;

  // Cache frequently-updated elements
  this.iconEl = this.element.querySelector('.icon');
  this.textEl = this.element.querySelector('.text');
  this.stateEl = this.element.querySelector('.state');
}
```

## Navigate

↑ **Overview**: [widget-dev-rendering.md](widget-dev-rendering.md) - Rendering method comparison
→ **Next**: [widget-dev-rendering-update-display.md](widget-dev-rendering-update-display.md) - Granular updates
→ **Optimization**: [widget-dev-rendering-optimization.md](widget-dev-rendering-optimization.md) - Performance techniques
⟲ **Lifecycle**: [widget-dev-lifecycle-mount.md](widget-dev-lifecycle-mount.md) - Called from mount()
⟲ **Class Structure**: [widget-dev-class-structure.md](widget-dev-class-structure.md) - Display methods section
