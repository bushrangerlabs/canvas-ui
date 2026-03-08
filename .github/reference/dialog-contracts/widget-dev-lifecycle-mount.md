# Widget Lifecycle: mount() Method

The 9-step process for initializing and displaying a widget on the canvas.

## mount() Flow Diagram

```
mount(container) called
        ↓
Step 1: Store Container Reference
        ↓
Step 2: Create Root Element (this.element)
        ↓
Step 3: Initial Render (build DOM structure)
        ↓
Step 4: Setup Event Listeners
        ↓
Step 5: Setup Entity Bindings
        ↓
Step 6: Apply Universal Styling
        ↓
Step 7: Setup Visibility System
        ↓
Step 8: Append to Container
        ↓
Step 9: Mark as Mounted (this.mounted = true)
        ↓
    Widget Rendered
```

## Step 1: Store Container Reference

```javascript
mount(container) {
  // ============================================================
  // STEP 1: STORE CONTAINER REFERENCE
  // ============================================================
  this.container = container;
```

**Why:** Needed for future operations (re-rendering, unmounting)

## Step 2: Create Root Element

```javascript
// ============================================================
// STEP 2: CREATE ROOT ELEMENT
// ============================================================
this.element = document.createElement("div");
this.element.className = "button-widget";
this.element.style.width = "100%";
this.element.style.height = "100%";
```

**Why:** Every widget needs a root DOM element that fills its container

**Element Best Practices:**

- Always use `<div>` as root element
- Set `width: 100%` and `height: 100%` to fill container
- Add widget-specific class for CSS targeting
- Store reference in `this.element` for later access

## Step 3: Initial Render

```javascript
// ============================================================
// STEP 3: INITIAL RENDER
// ============================================================
this.render();
```

**Why:** Build the widget's internal DOM structure

**What render() does:**

- Creates child elements
- Sets initial content from `this.config`
- Builds widget-specific HTML structure

## Step 4: Setup Event Listeners

```javascript
// ============================================================
// STEP 4: SETUP EVENT LISTENERS
// ============================================================
this.setupEventListeners();
```

**Why:** Enable user interactions (click, hover, etc.)

**Example setupEventListeners():**

```javascript
setupEventListeners() {
  if (!this.element) return;

  this.element.addEventListener("click", this.handleClick);
  this.element.addEventListener("mouseover", this.handleMouseOver);
  this.element.addEventListener("mouseout", this.handleMouseOut);
}
```

**Remember:** Event handlers must be bound in constructor:

```javascript
constructor(canvasCore, config) {
  super(canvasCore, config);
  this.handleClick = this.handleClick.bind(this);  // ← CRITICAL
}
```

## Step 5: Setup Entity Bindings

```javascript
// ============================================================
// STEP 5: SETUP ENTITY BINDINGS
// ============================================================
this.setupBindings();
```

**Why:** Subscribe to Home Assistant entity state changes

**Binding Decision Tree:**

```
What kind of binding?
│
├── Simple entity display
│   └── Direct EntityManager.subscribe()
│
├── Binding expressions ({entity;.state})
│   └── BindingBinder.bindWidget()
│
└── Multiple entities
    └── Track subscriptions in array
```

**Example setupBindings() - Direct:**

```javascript
setupBindings() {
  if (!this.config.entity || !this.canvasCore?.entityManager) return;

  this.entityUnsubscribe = this.canvasCore.entityManager.subscribe(
    this.config.entity,
    (state) => this.onEntityUpdate(state)
  );
}
```

**Example setupBindings() - BindingBinder:**

```javascript
setupBindings() {
  if (!this.canvasCore?.bindingBinder) return;

  // BindingBinder auto-detects expressions in config
  this.canvasCore.bindingBinder.bindWidget(this.config.id, this.config);
}
```

## Step 6: Apply Universal Styling

```javascript
// ============================================================
// STEP 6: APPLY UNIVERSAL STYLING
// ============================================================
this.applyUniversalStyling();
```

**Why:** Apply Widget API styling (background, border, shadow, padding)

**What it applies:**

- `backgroundColor`
- `backgroundImage`
- `border` / `borderRadius` / `borderOpacity`
- `boxShadow`
- `padding`

**Example:**

```javascript
applyUniversalStyling() {
  const cfg = this.config;

  if (cfg.backgroundColor) {
    this.element.style.backgroundColor = cfg.backgroundColor;
  }

  if (cfg.border) {
    this.element.style.border = cfg.border;
  }

  // ... more styling
}
```

## Step 7: Setup Visibility System

```javascript
// ============================================================
// STEP 7: SETUP VISIBILITY SYSTEM
// ============================================================
if (this.config.visibilityCondition) {
  this.setupVisibility();
}
```

**Why:** Handle conditional visibility based on entity states

**Visibility Expression Examples:**

```
{sensor.temp;.state;>70}        → Show if temp > 70
{light.kitchen;.state;==on}     → Show if light is on
```

## Step 8: Append to Container

```javascript
// ============================================================
// STEP 8: ADD TO CONTAINER
// ============================================================
container.appendChild(this.element);
```

**Why:** Make widget visible on canvas

**Critical:** Must happen AFTER all setup is complete

## Step 9: Mark as Mounted

```javascript
  // ============================================================
  // STEP 9: MARK AS MOUNTED
  // ============================================================
  this.mounted = true;

  console.log(`[${this.config.type}] Mounted:`, this.config.id);
}
```

**Why:**

- Prevent double-mounting
- Allow unmount() to check state
- Enable lifecycle tracking

## mount() Pattern Comparison

### Pattern 1: Minimal Widget (No Bindings)

```javascript
mount(container) {
  this.element = document.createElement("div");
  this.element.className = "text-widget";
  this.element.textContent = this.config.text || "Text";

  container.appendChild(this.element);
  this.mounted = true;
}
```

**Use for:** Static display widgets (text, image)

### Pattern 2: Entity Widget (Direct Subscription)

```javascript
mount(container) {
  this.element = document.createElement("div");
  this.element.className = "entity-widget";

  // Render
  this.render();

  // Subscribe to entity
  if (this.config.entity && this.canvasCore?.entityManager) {
    this.entityUnsubscribe = this.canvasCore.entityManager.subscribe(
      this.config.entity,
      (state) => this.onEntityUpdate(state)
    );
  }

  container.appendChild(this.element);
  this.mounted = true;
}
```

**Use for:** Simple entity display widgets

### Pattern 3: Advanced Widget (BindingBinder)

```javascript
mount(container) {
  this.element = document.createElement("div");
  this.element.className = "advanced-widget";

  this.render();
  this.setupEventListeners();

  // Use BindingBinder for expression evaluation
  if (this.canvasCore?.bindingBinder) {
    this.canvasCore.bindingBinder.bindWidget(this.config.id, this.config);
  }

  this.applyUniversalStyling();

  container.appendChild(this.element);
  this.mounted = true;
}
```

**Use for:** Widgets with binding expressions, advanced interactions

## Navigate

↑ **Overview**: [widget-dev-lifecycle.md](widget-dev-lifecycle.md) - Lifecycle state machine and timing
→ **Next**: [widget-dev-lifecycle-unmount.md](widget-dev-lifecycle-unmount.md) - Cleanup and teardown
→ **UpdateConfig**: [widget-dev-lifecycle-updateConfig.md](widget-dev-lifecycle-updateConfig.md) - Handle configuration changes
⟲ **Bindings**: [widget-dev-entity-bindings.md](widget-dev-entity-bindings.md) - Step 5 binding details
⟲ **Rendering**: [widget-dev-rendering.md](widget-dev-rendering.md) - Step 3 render details
⟲ **Class Structure**: [widget-dev-class-structure.md](widget-dev-class-structure.md) - Where mount() fits
