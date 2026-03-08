# Widget Development: Constructor

Complete guide to implementing the widget constructor with proper initialization patterns.

## Constructor Flow

```
new MyWidget(canvasCore, config)
     ↓
Call super(canvasCore, config)
     ↓
this.config populated
this.canvasCore available
this.mounted = false
     ↓
Bind event handlers
     ↓
Initialize widget state
     ↓
Ready for mount()
```

## Constructor Pattern

```javascript
constructor(canvasCore, config) {
  // STEP 1: Call parent constructor
  super(canvasCore, config);

  // STEP 2: Bind event handlers (preserve 'this')
  this.handleClick = this.handleClick.bind(this);
  this.handleMouseOver = this.handleMouseOver.bind(this);
  this.handleMouseLeave = this.handleMouseLeave.bind(this);

  // STEP 3: Initialize state
  this.entityUnsubscribe = null;
  this.isPressed = false;
  this.cachedData = null;
  this.animationFrame = null;
  this.updateInterval = null;
}
```

## Why Bind Event Handlers in Constructor?

### The Problem

```
WITHOUT binding in constructor:
element.addEventListener("click", this.handleClick)
     ↓
Event fires
     ↓
'this' inside handleClick = element ❌
     ↓
Cannot access this.config, this.element, etc.
```

### The Solution

```
WITH binding in constructor:
this.handleClick = this.handleClick.bind(this)
element.addEventListener("click", this.handleClick)
     ↓
Event fires
     ↓
'this' inside handleClick = widget instance ✓
     ↓
Can access this.config, this.element, etc.
```

### Code Example

```javascript
// ❌ WRONG - 'this' will be the DOM element
setupEventListeners() {
  this.element.addEventListener("click", this.handleClick);
}

handleClick(event) {
  console.log(this.config);  // ❌ undefined! 'this' is the element
}
```

```javascript
// ✅ CORRECT - Bind in constructor
constructor(canvasCore, config) {
  super(canvasCore, config);
  this.handleClick = this.handleClick.bind(this);  // ✅ Bind 'this'
}

setupEventListeners() {
  this.element.addEventListener("click", this.handleClick);
}

handleClick(event) {
  console.log(this.config);  // ✅ Works! 'this' is the widget
}
```

## State Initialization Patterns

### Entity Binding State

```javascript
constructor(canvasCore, config) {
  super(canvasCore, config);

  // Entity subscription cleanup function
  this.entityUnsubscribe = null;

  // Multi-entity subscriptions
  this.subscriptions = [];
}
```

### Animation State

```javascript
constructor(canvasCore, config) {
  super(canvasCore, config);

  // Animation frame ID for cleanup
  this.animationFrame = null;

  // Update interval timer
  this.updateInterval = null;
}
```

### Interaction State

```javascript
constructor(canvasCore, config) {
  super(canvasCore, config);

  // Track pressed/hover state
  this.isPressed = false;
  this.isHovered = false;

  // Drag state
  this.isDragging = false;
  this.dragStartX = 0;
  this.dragStartY = 0;
}
```

### Data Caching State

```javascript
constructor(canvasCore, config) {
  super(canvasCore, config);

  // Cache entity state
  this.cachedState = null;

  // Cache computed values
  this.lastComputedValue = null;
  this.computedTimestamp = 0;
}
```

### DOM Reference State

```javascript
constructor(canvasCore, config) {
  super(canvasCore, config);

  // Cache frequently accessed DOM elements
  this.iconEl = null;
  this.textEl = null;
  this.stateEl = null;
  this.container = null;
}
```

## Complete Constructor Examples

### Minimal Widget

```javascript
constructor(canvasCore, config) {
  super(canvasCore, config);
  // No additional initialization needed
}
```

### Interactive Button Widget

```javascript
constructor(canvasCore, config) {
  super(canvasCore, config);

  // Bind event handlers
  this.handleClick = this.handleClick.bind(this);
  this.handleMouseDown = this.handleMouseDown.bind(this);
  this.handleMouseUp = this.handleMouseUp.bind(this);

  // Initialize interaction state
  this.isPressed = false;

  // Initialize entity binding
  this.entityUnsubscribe = null;
}
```

### Data Display Widget

```javascript
constructor(canvasCore, config) {
  super(canvasCore, config);

  // Bind event handlers
  this.handleRefresh = this.handleRefresh.bind(this);
  this.onEntityUpdate = this.onEntityUpdate.bind(this);

  // Initialize data state
  this.currentValue = null;
  this.lastUpdate = null;
  this.isLoading = false;

  // Initialize bindings
  this.entityUnsubscribe = null;

  // Initialize update timer
  this.updateInterval = null;
}
```

### Animated Gauge Widget

```javascript
constructor(canvasCore, config) {
  super(canvasCore, config);

  // Bind event handlers
  this.onEntityUpdate = this.onEntityUpdate.bind(this);
  this.animate = this.animate.bind(this);

  // Initialize animation state
  this.currentValue = 0;
  this.targetValue = 0;
  this.animationFrame = null;

  // Initialize entity binding
  this.entityUnsubscribe = null;

  // Initialize DOM references
  this.needleEl = null;
  this.valueEl = null;
}
```

## Common Patterns

### Pattern: Multi-Event Binding

```javascript
constructor(canvasCore, config) {
  super(canvasCore, config);

  // Bind all event handlers at once
  const handlers = [
    'handleClick',
    'handleMouseDown',
    'handleMouseUp',
    'handleMouseMove',
    'handleTouchStart',
    'handleTouchMove',
    'handleTouchEnd'
  ];

  handlers.forEach(method => {
    this[method] = this[method].bind(this);
  });
}
```

### Pattern: Computed Initial State

```javascript
constructor(canvasCore, config) {
  super(canvasCore, config);

  // Compute initial state from config
  this.minValue = config.minValue || 0;
  this.maxValue = config.maxValue || 100;
  this.range = this.maxValue - this.minValue;
  this.initialValue = (this.minValue + this.maxValue) / 2;
}
```

### Pattern: Feature Flags

```javascript
constructor(canvasCore, config) {
  super(canvasCore, config);

  // Check feature availability
  this.hasEntityManager = !!canvasCore?.entityManager;
  this.hasBindingBinder = !!canvasCore?.bindingBinder;
  this.supportsAnimation = 'requestAnimationFrame' in window;
}
```

## What NOT to Do in Constructor

### ❌ Don't Create DOM Elements

```javascript
// ❌ WRONG - Do this in mount() instead
constructor(canvasCore, config) {
  super(canvasCore, config);
  this.element = document.createElement("div");  // ❌ Too early!
}
```

```javascript
// ✅ CORRECT - Create in mount()
mount(container) {
  this.element = document.createElement("div");  // ✅ Right place
}
```

### ❌ Don't Subscribe to Entities

```javascript
// ❌ WRONG - Do this in mount() or setupBindings()
constructor(canvasCore, config) {
  super(canvasCore, config);
  this.entityUnsubscribe = canvasCore.entityManager.subscribe(...);  // ❌ Too early!
}
```

```javascript
// ✅ CORRECT - Subscribe in setupBindings()
setupBindings() {
  this.entityUnsubscribe = this.canvasCore.entityManager.subscribe(...);  // ✅ Right place
}
```

### ❌ Don't Add Event Listeners

```javascript
// ❌ WRONG - No DOM element exists yet
constructor(canvasCore, config) {
  super(canvasCore, config);
  this.element.addEventListener("click", this.handleClick);  // ❌ this.element is null!
}
```

```javascript
// ✅ CORRECT - Add listeners in setupEventListeners()
setupEventListeners() {
  this.element.addEventListener("click", this.handleClick);  // ✅ this.element exists now
}
```

### ❌ Don't Start Timers/Animations

```javascript
// ❌ WRONG - Widget not mounted yet
constructor(canvasCore, config) {
  super(canvasCore, config);
  this.updateInterval = setInterval(() => this.update(), 1000);  // ❌ Too early!
}
```

```javascript
// ✅ CORRECT - Start timers in mount()
mount(container) {
  // ... create element ...
  this.updateInterval = setInterval(() => this.update(), 1000);  // ✅ Right place
}
```

## Constructor Checklist

### ✅ Always Do

- [ ] Call `super(canvasCore, config)` first
- [ ] Bind event handler methods
- [ ] Initialize state variables to null/false/0
- [ ] Set default values for computed properties
- [ ] Initialize arrays/objects if needed

### ❌ Never Do

- [ ] Create DOM elements
- [ ] Add event listeners
- [ ] Subscribe to entities
- [ ] Start timers/intervals
- [ ] Make API calls
- [ ] Access this.element (doesn't exist yet)
- [ ] Assume config values exist

### ⚠️ Optional

- [ ] Cache config values for performance
- [ ] Pre-compute derived values
- [ ] Set feature availability flags
- [ ] Initialize complex data structures

---

## Navigate

↑ **Overview**: [widget-dev-class-structure.md](widget-dev-class-structure.md) - Widget file structure
↑ **INDEX**: [widget-dev-INDEX.md](widget-dev-INDEX.md) - Widget development entry point
→ **Next Step**: [widget-dev-metadata.md](widget-dev-metadata.md) - Implement getMetadata()
→ **Next Step**: [widget-dev-lifecycle.md](widget-dev-lifecycle.md) - Implement mount/unmount
⟲ **Event Handlers**: [widget-dev-event-handlers.md](widget-dev-event-handlers.md) - Why binding matters
⟲ **Example**: [widget-dev-complete-example.md](widget-dev-complete-example.md) - See constructor in action
