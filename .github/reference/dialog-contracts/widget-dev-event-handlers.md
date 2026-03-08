# Widget Development: Event Handlers

Complete guide to implementing event handlers in widgets with proper setup and cleanup patterns.

## Event Handler Flow

```
setupEventListeners()
     ↓
addEventListener with bound handler
     ↓
User interaction (click, hover, etc.)
     ↓
Handler function executes
     ↓
Widget logic runs (update state, call actions, etc.)
     ↓
removeEventListeners() on unmount
```

## Basic Event Handler Pattern

### Three Required Parts

1. **Bind in constructor** (preserve `this`)
2. **Add listeners in setupEventListeners()** (called from mount)
3. **Remove listeners in removeEventListeners()** (called from unmount)

### Complete Example

```javascript
export class ButtonWidget extends BaseWidget {
  constructor(canvasCore, config) {
    super(canvasCore, config);

    // PART 1: Bind handlers
    this.handleClick = this.handleClick.bind(this);
    this.handleMouseOver = this.handleMouseOver.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
  }

  mount(container) {
    this.element = document.createElement("button");
    this.render();
    this.setupEventListeners(); // PART 2: Add listeners
    container.appendChild(this.element);
    this.mounted = true;
  }

  unmount() {
    if (!this.mounted) return;
    this.removeEventListeners(); // PART 3: Remove listeners
    if (this.element) this.element.remove();
    this.mounted = false;
  }

  // PART 2: Add listeners
  setupEventListeners() {
    if (!this.element) return;

    this.element.addEventListener("click", this.handleClick);
    this.element.addEventListener("mouseover", this.handleMouseOver);
    this.element.addEventListener("mouseleave", this.handleMouseLeave);
  }

  // PART 3: Remove listeners
  removeEventListeners() {
    if (!this.element) return;

    this.element.removeEventListener("click", this.handleClick);
    this.element.removeEventListener("mouseover", this.handleMouseOver);
    this.element.removeEventListener("mouseleave", this.handleMouseLeave);
  }

  // Handler implementations
  handleClick(event) {
    event.stopPropagation(); // Prevent canvas from handling
    console.log("Button clicked:", this.config.id);
    this.executeTapAction();
  }

  handleMouseOver(event) {
    this.element.style.opacity = "0.8";
  }

  handleMouseLeave(event) {
    this.element.style.opacity = "1";
  }
}
```

## Common Event Types

### Click Events

```javascript
setupEventListeners() {
  this.element.addEventListener("click", this.handleClick);
}

handleClick(event) {
  // Stop event from bubbling to canvas
  event.stopPropagation();

  // Widget logic
  console.log("Clicked:", this.config.id);

  // Execute tap action if configured
  if (this.config.tapAction) {
    this.canvasCore.actionManager.execute(this.config.tapAction);
  }
}
```

### Mouse Events (Hover Effects)

```javascript
setupEventListeners() {
  this.element.addEventListener("mouseenter", this.handleMouseEnter);
  this.element.addEventListener("mouseleave", this.handleMouseLeave);
}

handleMouseEnter(event) {
  this.isHovered = true;
  this.element.classList.add("hovered");
}

handleMouseLeave(event) {
  this.isHovered = false;
  this.element.classList.remove("hovered");
}
```

### Mouse Down/Up Events (Press Effects)

```javascript
constructor(canvasCore, config) {
  super(canvasCore, config);
  this.handleMouseDown = this.handleMouseDown.bind(this);
  this.handleMouseUp = this.handleMouseUp.bind(this);
  this.isPressed = false;
}

setupEventListeners() {
  this.element.addEventListener("mousedown", this.handleMouseDown);
  this.element.addEventListener("mouseup", this.handleMouseUp);
  this.element.addEventListener("mouseleave", this.handleMouseUp);
}

handleMouseDown(event) {
  event.stopPropagation();
  this.isPressed = true;
  this.element.classList.add("pressed");
}

handleMouseUp(event) {
  this.isPressed = false;
  this.element.classList.remove("pressed");
}
```

### Touch Events (Mobile Support)

```javascript
setupEventListeners() {
  // Mouse events
  this.element.addEventListener("click", this.handleClick);

  // Touch events
  this.element.addEventListener("touchstart", this.handleTouchStart);
  this.element.addEventListener("touchend", this.handleTouchEnd);
}

handleTouchStart(event) {
  event.preventDefault();  // Prevent mouse event emulation
  this.element.classList.add("pressed");
}

handleTouchEnd(event) {
  event.preventDefault();
  this.element.classList.remove("pressed");
  this.handleClick(event);  // Execute click logic
}
```

### Input Events (Text Fields)

```javascript
setupEventListeners() {
  const input = this.element.querySelector("input");
  if (input) {
    input.addEventListener("input", this.handleInput);
    input.addEventListener("change", this.handleChange);
    input.addEventListener("focus", this.handleFocus);
    input.addEventListener("blur", this.handleBlur);
  }
}

handleInput(event) {
  // Real-time updates as user types
  this.currentValue = event.target.value;
}

handleChange(event) {
  // Final value when user commits
  this.updateConfig({ value: event.target.value });
}

handleFocus(event) {
  this.element.classList.add("focused");
}

handleBlur(event) {
  this.element.classList.remove("focused");
}
```

## Advanced Event Handler Patterns

### Delegated Events (Multiple Child Elements)

```javascript
setupEventListeners() {
  // Single listener on parent handles all buttons
  this.element.addEventListener("click", this.handleButtonClick);
}

handleButtonClick(event) {
  const button = event.target.closest("button");
  if (!button) return;

  event.stopPropagation();

  const action = button.dataset.action;
  switch (action) {
    case "increment":
      this.increment();
      break;
    case "decrement":
      this.decrement();
      break;
    case "reset":
      this.reset();
      break;
  }
}
```

### Throttled Events (Performance)

```javascript
constructor(canvasCore, config) {
  super(canvasCore, config);
  this.handleResize = this.handleResize.bind(this);
  this.resizeTimeout = null;
}

setupEventListeners() {
  window.addEventListener("resize", this.handleResize);
}

removeEventListeners() {
  window.removeEventListener("resize", this.handleResize);
  if (this.resizeTimeout) {
    clearTimeout(this.resizeTimeout);
  }
}

handleResize(event) {
  // Throttle: only execute once per 100ms
  clearTimeout(this.resizeTimeout);
  this.resizeTimeout = setTimeout(() => {
    this.updateLayout();
  }, 100);
}
```

### Conditional Event Listeners

```javascript
setupEventListeners() {
  if (!this.element) return;

  // Always add click
  this.element.addEventListener("click", this.handleClick);

  // Only add hover if enabled
  if (this.config.enableHover) {
    this.element.addEventListener("mouseenter", this.handleMouseEnter);
    this.element.addEventListener("mouseleave", this.handleMouseLeave);
  }

  // Only add double-click if configured
  if (this.config.doubleTapAction) {
    this.element.addEventListener("dblclick", this.handleDoubleClick);
  }
}
```

### Global Event Listeners (Window/Document)

```javascript
setupEventListeners() {
  // Widget element listeners
  this.element.addEventListener("click", this.handleClick);

  // Global listeners (for drag, resize, etc.)
  document.addEventListener("mousemove", this.handleMouseMove);
  document.addEventListener("mouseup", this.handleMouseUp);
}

removeEventListeners() {
  // Clean up widget listeners
  if (this.element) {
    this.element.removeEventListener("click", this.handleClick);
  }

  // Clean up global listeners
  document.removeEventListener("mousemove", this.handleMouseMove);
  document.removeEventListener("mouseup", this.handleMouseUp);
}
```

## Event Handler Best Practices

### ✅ Always stopPropagation on Click

```javascript
handleClick(event) {
  event.stopPropagation();  // ✅ Prevent canvas from handling click
  // Widget logic here
}
```

**Why?** Without this, clicks bubble to the canvas which may deselect the widget or trigger canvas interactions.

### ✅ Check Element Exists

```javascript
setupEventListeners() {
  if (!this.element) return;  // ✅ Safety check
  this.element.addEventListener("click", this.handleClick);
}
```

### ✅ Clean Up All Listeners

```javascript
removeEventListeners() {
  if (!this.element) return;

  // ✅ Remove EVERY listener added in setupEventListeners()
  this.element.removeEventListener("click", this.handleClick);
  this.element.removeEventListener("mouseover", this.handleMouseOver);
  // ... etc
}
```

**Why?** Memory leaks if listeners aren't removed before unmount.

### ✅ Use Same Function Reference

```javascript
// ✅ CORRECT - Same bound function
constructor() {
  this.handleClick = this.handleClick.bind(this);
}

setupEventListeners() {
  this.element.addEventListener("click", this.handleClick);
}

removeEventListeners() {
  this.element.removeEventListener("click", this.handleClick);  // ✅ Removes successfully
}
```

```javascript
// ❌ WRONG - Different functions
setupEventListeners() {
  this.element.addEventListener("click", () => this.handleClick());  // Arrow function
}

removeEventListeners() {
  this.element.removeEventListener("click", () => this.handleClick());  // ❌ Different arrow function!
}
```

### ✅ Handle Null State

```javascript
handleClick(event) {
  if (!this.mounted) return;  // ✅ Ignore if unmounted
  if (!this.config.entity) {
    console.warn("No entity configured");
    return;
  }
  // Safe to proceed
}
```

## Common Event Handler Implementations

### Execute Tap Action

```javascript
handleClick(event) {
  event.stopPropagation();

  if (this.config.tapAction) {
    this.canvasCore.actionManager.execute(
      this.config.tapAction,
      { widgetId: this.config.id }
    );
  }
}
```

### Toggle Entity State

```javascript
handleClick(event) {
  event.stopPropagation();

  if (!this.config.entity) return;

  const currentState = this.canvasCore.entityManager.getState(this.config.entity);
  if (!currentState) return;

  const newState = currentState.state === "on" ? "off" : "on";

  this.canvasCore.entityManager.callService(
    "homeassistant",
    "toggle",
    { entity_id: this.config.entity }
  );
}
```

### Show Dialog on Click

```javascript
handleClick(event) {
  event.stopPropagation();

  // Open entity picker dialog
  this.canvasCore.dialogManager.show({
    type: "entity-picker",
    entityId: this.config.entity,
    onSelect: (entityId) => {
      this.updateConfig({ entity: entityId });
    }
  });
}
```

### Update Widget on Hover

```javascript
handleMouseEnter(event) {
  this.isHovered = true;

  // Show additional info on hover
  const infoEl = this.element.querySelector(".info");
  if (infoEl) {
    infoEl.style.display = "block";
  }
}

handleMouseLeave(event) {
  this.isHovered = false;

  const infoEl = this.element.querySelector(".info");
  if (infoEl) {
    infoEl.style.display = "none";
  }
}
```

## Checklist

### ✅ Required Setup

- [ ] Bind handlers in constructor: `this.handleX = this.handleX.bind(this)`
- [ ] Add listeners in `setupEventListeners()`
- [ ] Remove listeners in `removeEventListeners()`
- [ ] Call `event.stopPropagation()` on click handlers
- [ ] Call `setupEventListeners()` from `mount()`
- [ ] Call `removeEventListeners()` from `unmount()`

### ✅ Best Practices

- [ ] Check `if (!this.element)` before adding listeners
- [ ] Check `if (!this.mounted)` in handlers
- [ ] Use same function reference for add/remove
- [ ] Clean up timers in `removeEventListeners()`
- [ ] Handle null/undefined config values
- [ ] Add mobile touch events if needed

### ❌ Common Mistakes

- [ ] Forgetting to bind in constructor
- [ ] Using arrow functions in addEventListener (can't remove)
- [ ] Not calling `stopPropagation()` on clicks
- [ ] Adding listeners in constructor (element doesn't exist)
- [ ] Not removing listeners in unmount (memory leak)
- [ ] Assuming entity/config values exist

---

## Navigate

↑ **Overview**: [widget-dev-class-structure.md](widget-dev-class-structure.md) - Widget file structure
↑ **INDEX**: [widget-dev-INDEX.md](widget-dev-INDEX.md) - Widget development entry point
→ **Constructor**: [widget-dev-constructor.md](widget-dev-constructor.md) - Why binding matters
→ **Lifecycle**: [widget-dev-lifecycle.md](widget-dev-lifecycle.md) - When to setup/remove listeners
⟲ **Actions**: (Coming soon) - How to execute tap actions
⟲ **Example**: [widget-dev-complete-example.md](widget-dev-complete-example.md) - See handlers in action
