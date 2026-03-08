# Widget Development: Class Structure

High-level widget file anatomy with step-by-step implementation flow. For detailed implementations, follow the links to dedicated guides.

## Widget File Creation Flow

```
Step 1: Create File
     ↓
Step 2: Import BaseWidget
     ↓
Step 3: Define Widget Class
     ↓
Step 4: Implement Constructor
     ↓
Step 5: Add getMetadata() [REQUIRED]
     ↓
Step 6: Add Lifecycle Methods [REQUIRED]
     ├── mount(container)
     ├── unmount()
     └── updateConfig(newConfig)
     ↓
Step 7: Add Display Methods
     ├── render()
     └── updateDisplay(changes)
     ↓
Step 8: Add Bindings (if needed)
     ├── setupBindings()
     └── cleanupBindings()
     ↓
Step 9: Add Event Handlers (if needed)
     ├── setupEventListeners()
     ├── removeEventListeners()
     └── handleXxx() methods
     ↓
Step 10: Add Universal Styling
     └── applyUniversalStyling()
     ↓
Step 11: Export Class
     ↓
Step 12: Register in WidgetRegistry
```

## File Anatomy Tree

```
widget-name.js
│
├── 1. IMPORTS
│   └── import { BaseWidget } from "../base-widget.js"
│
├── 2. CLASS DEFINITION
│   │
│   ├── constructor(canvasCore, config)
│   │   ├── super(canvasCore, config)           ← Call parent
│   │   ├── Bind event handlers                 ← this.handleX = ...bind(this)
│   │   └── Initialize state                    ← this.entityUnsubscribe = null
│   │
│   ├── static getMetadata()                     ← REQUIRED
│   │   ├── Identity (name, icon, category)
│   │   ├── Sizing (defaultSize, minSize)
│   │   ├── Behavior (requiresEntity, requiresConfig)
│   │   └── Custom Fields (inspector fields array)
│   │
│   ├── LIFECYCLE METHODS                        ← REQUIRED
│   │   ├── mount(container)
│   │   │   ├── Create this.element
│   │   │   ├── Call render()
│   │   │   ├── Call setupEventListeners()
│   │   │   ├── Call setupBindings()
│   │   │   ├── Call applyUniversalStyling()
│   │   │   ├── Append to container
│   │   │   └── Set this.mounted = true
│   │   │
│   │   ├── unmount()
│   │   │   ├── Check if (!this.mounted) return
│   │   │   ├── Call cleanupBindings()
│   │   │   ├── Call removeEventListeners()
│   │   │   ├── Remove from DOM
│   │   │   └── Set this.mounted = false
│   │   │
│   │   └── updateConfig(newConfig)
│   │       ├── Object.assign(this.config, newConfig)
│   │       ├── Re-bind if entity changed
│   │       └── Re-render if needed
│   │
│   ├── DISPLAY METHODS
│   │   ├── render()
│   │   │   └── Build/rebuild this.element.innerHTML
│   │   │
│   │   └── updateDisplay(changes)
│   │       └── Granular DOM updates (no full render)
│   │
│   ├── BINDING METHODS
│   │   ├── setupBindings()
│   │   │   └── Subscribe to entities
│   │   │
│   │   ├── cleanupBindings()
│   │   │   └── Unsubscribe from entities
│   │   │
│   │   └── onEntityUpdate(state)
│   │       └── Handle entity state changes
│   │
│   ├── EVENT HANDLERS
│   │   ├── setupEventListeners()
│   │   │   └── element.addEventListener(...)
│   │   │
│   │   ├── removeEventListeners()
│   │   │   └── element.removeEventListener(...)
│   │   │
│   │   └── handleXxx(event)
│   │       └── Event handler logic
│   │
│   └── UNIVERSAL STYLING
│       └── applyUniversalStyling()
│           └── Apply Widget API styling
│
└── 3. EXPORT
    └── export class WidgetName
```

## Step 1: Create File

Create `www/canvas-ui/widgets/my-widget.js`

## Step 2: Import BaseWidget

```javascript
import { BaseWidget } from "../base-widget.js";
```

**BaseWidget provides**:

- `this.config` - Widget configuration
- `this.canvasCore` - Access to canvas systems
- `this.mounted` - Mount state flag
- `getDefaults()` - Default config values
- Visibility helpers

## Step 3: Define Widget Class

```javascript
export class MyWidget extends BaseWidget {
  // Implementation goes here
}
```

**Inheritance flow**:

```
BaseWidget
     ↓
MyWidget extends
     ↓
Inherits:
├── config management
├── mounted state
└── visibility system
     ↓
Adds:
├── getMetadata()
├── Lifecycle methods
└── Widget-specific logic
```

## Step 4: Implement Constructor

### Quick Overview

```javascript
constructor(canvasCore, config) {
  super(canvasCore, config);
  this.handleClick = this.handleClick.bind(this);
  this.entityUnsubscribe = null;
}
```

**Purpose:**

- Call parent constructor
- Bind event handlers (preserve `this`)
- Initialize widget state

**See**: [widget-dev-constructor.md](widget-dev-constructor.md) for complete constructor patterns and binding explanation

## Step 5: Add getMetadata() [REQUIRED]

### Quick Overview

```javascript
static getMetadata() {
  return {
    name: "My Widget",
    icon: "mdi-cog",
    category: "basic",
    defaultSize: { w: 200, h: 100 },
    customFields: []
  };
}
```

**Purpose:**

- Define widget identity (name, icon, category)
- Set default sizing
- Define inspector fields

**See**: [widget-dev-metadata.md](widget-dev-metadata.md) for complete metadata reference

## Step 6: Add Lifecycle Methods [REQUIRED]

### Quick Overview

```javascript
mount(container) {
  this.element = document.createElement("div");
  this.render();
  this.applyUniversalStyling();
  container.appendChild(this.element);
  this.mounted = true;
}

unmount() {
  if (!this.mounted) return;
  if (this.element) this.element.remove();
  this.mounted = false;
}

updateConfig(newConfig) {
  Object.assign(this.config, newConfig);
  this.render();
  this.applyUniversalStyling();
}
```

**Purpose:**

- `mount()` - Create and show widget
- `unmount()` - Cleanup and remove widget
- `updateConfig()` - Handle inspector changes

**See**: [widget-dev-lifecycle.md](widget-dev-lifecycle.md) for detailed lifecycle patterns

## Step 7: Add Display Methods

### Quick Overview

```javascript
render() {
  if (!this.element) return;
  this.element.innerHTML = `
    <div class="content">
      ${this.config.text || "No text"}
    </div>
  `;
}

updateDisplay(changes) {
  if (changes.text !== undefined) {
    this.element.textContent = changes.text;
  }
}
```

**Purpose:**

- `render()` - Build/rebuild element HTML
- `updateDisplay()` - Granular DOM updates (fast)

**See**: [widget-dev-rendering.md](widget-dev-rendering.md) for rendering strategies

## Step 8: Add Bindings (if needed)

### Quick Overview

```javascript
setupBindings() {
  if (!this.config.entity) return;
  this.entityUnsubscribe = this.canvasCore.entityManager.subscribe(
    this.config.entity,
    (state) => this.onEntityUpdate(state)
  );
}

cleanupBindings() {
  if (this.entityUnsubscribe) {
    this.entityUnsubscribe();
    this.entityUnsubscribe = null;
  }
}

onEntityUpdate(state) {
  // Update widget with entity state
}
```

**Purpose:**

- Subscribe to entity state changes
- Update widget when entity changes
- Cleanup subscriptions on unmount

**See**: [widget-dev-entity-bindings.md](widget-dev-entity-bindings.md) for binding patterns

## Step 9: Add Event Handlers (if needed)

### Quick Overview

```javascript
setupEventListeners() {
  this.element.addEventListener("click", this.handleClick);
}

removeEventListeners() {
  this.element.removeEventListener("click", this.handleClick);
}

handleClick(event) {
  event.stopPropagation();
  // Handle click
}
```

**Purpose:**

- Add event listeners in setupEventListeners()
- Remove listeners in removeEventListeners()
- Handle user interactions

**See**: [widget-dev-event-handlers.md](widget-dev-event-handlers.md) for event handler patterns

## Step 10: Add Universal Styling

### Quick Overview

```javascript
applyUniversalStyling() {
  if (!this.element) return;

  const cfg = this.config;

  if (cfg.backgroundColor) {
    this.element.style.backgroundColor = cfg.backgroundColor;
  }
  if (cfg.border) {
    this.element.style.border = cfg.border;
  }
  if (cfg.borderRadius) {
    this.element.style.borderRadius = cfg.borderRadius;
  }
  if (cfg.boxShadow) {
    this.element.style.boxShadow = cfg.boxShadow;
  }
  if (cfg.paddingTop !== undefined) {
    this.element.style.paddingTop = cfg.paddingTop + 'px';
  }
  // ... paddingRight, paddingBottom, paddingLeft
  if (cfg.backgroundImage) {
    this.element.style.backgroundImage = `url(${cfg.backgroundImage})`;
    this.element.style.backgroundSize = cfg.backgroundSize || 'cover';
    this.element.style.backgroundPosition = cfg.backgroundPosition || 'center';
    this.element.style.backgroundRepeat = cfg.backgroundRepeat || 'no-repeat';
  }
}
```

**Purpose:**

- Apply Widget API universal styling
- Supports background, border, shadow, padding, background image

**See**: [widget-dev-universal-styling.md](widget-dev-universal-styling.md) for complete styling implementation

## Step 11: Export Class

```javascript
export class MyWidget extends BaseWidget {
  // ... all implementation above ...
}
```

## Step 12: Register Widget

### Registration Flow

```
Import widget class
     ↓
Call registry.register(type, WidgetClass)
     ↓
Registry stores:
├── Widget class
├── Metadata (from getMetadata())
└── loaded: true flag
     ↓
Widget available in toolbar
```

### Registration Code

```javascript
// In widget-registry.js or init.js
import { MyWidget } from "./widgets/my-widget.js";

registry.register("my-widget", MyWidget);
```

**OR** Lazy loading:

```javascript
registry.registerLazy("my-widget", "./widgets/my-widget.js");
```

**See**: [canvas-flow-widget-registration.md](canvas-flow-widget-registration.md)

## Complete Minimal Widget Example

```javascript
import { BaseWidget } from "../base-widget.js";

export class SimpleTextWidget extends BaseWidget {
  constructor(canvasCore, config) {
    super(canvasCore, config);
  }

  static getMetadata() {
    return {
      name: "Simple Text",
      icon: "mdi-text",
      category: "basic",
      defaultSize: { w: 200, h: 50 },
      customFields: [
        {
          name: "text",
          type: "text",
          label: "Text",
          default: "Hello World",
          binding: true,
        },
      ],
    };
  }

  mount(container) {
    this.element = document.createElement("div");
    this.element.className = "text-widget";
    this.element.textContent = this.config.text || "Text";

    if (this.canvasCore?.bindingBinder) {
      this.canvasCore.bindingBinder.bindWidget(this.config.id, this.config);
    }

    container.appendChild(this.element);
    this.mounted = true;
  }

  unmount() {
    if (this.canvasCore?.bindingBinder) {
      this.canvasCore.bindingBinder.unbindWidget(this.config.id);
    }
    if (this.element) this.element.remove();
    this.mounted = false;
  }

  updateConfig(newConfig) {
    Object.assign(this.config, newConfig);
    if (newConfig.text !== undefined) {
      this.element.textContent = newConfig.text;
    }
  }

  updateDisplay(changes) {
    if (changes.text !== undefined) {
      this.element.textContent = changes.text;
    }
  }
}
```

## Development Checklist

### ✅ REQUIRED

- [ ] Extend BaseWidget
- [ ] Implement `static getMetadata()`
- [ ] Implement `mount(container)`
- [ ] Implement `unmount()`
- [ ] Implement `updateConfig(newConfig)`
- [ ] Set `this.mounted = true` in mount()
- [ ] Set `this.mounted = false` in unmount()

### ✅ RECOMMENDED

- [ ] Bind event handlers in constructor
- [ ] Implement `render()` method
- [ ] Implement `updateDisplay(changes)`
- [ ] Setup/cleanup entity bindings
- [ ] Add/remove event listeners properly
- [ ] Apply universal styling
- [ ] Handle null/undefined config values

### ❌ COMMON MISTAKES

- [ ] Using arrow functions for lifecycle methods
- [ ] Not binding event handlers in constructor
- [ ] Forgetting to cleanup subscriptions
- [ ] Not checking `this.mounted` in unmount()
- [ ] Leaving timers/intervals running
- [ ] Not handling missing entities

---

## Navigate

↑ **INDEX**: [widget-dev-INDEX.md](widget-dev-INDEX.md) - Widget development entry point

**Step-by-Step Guides:**

→ **Step 4**: [widget-dev-constructor.md](widget-dev-constructor.md) - Constructor patterns & binding
→ **Step 5**: [widget-dev-metadata.md](widget-dev-metadata.md) - getMetadata() details
→ **Step 6**: [widget-dev-lifecycle.md](widget-dev-lifecycle.md) - mount, unmount, updateConfig
→ **Step 7**: [widget-dev-rendering.md](widget-dev-rendering.md) - render() and updateDisplay()
→ **Step 8**: [widget-dev-entity-bindings.md](widget-dev-entity-bindings.md) - Entity subscriptions
→ **Step 9**: [widget-dev-event-handlers.md](widget-dev-event-handlers.md) - Event handler patterns
→ **Step 10**: [widget-dev-universal-styling.md](widget-dev-universal-styling.md) - Universal styling implementation

**Related:**

⟲ **Example**: [widget-dev-complete-example.md](widget-dev-complete-example.md) - Full button widget
⟲ **Widget API**: [widget-api-INDEX.md](widget-api-INDEX.md) - Universal inspector structure
⟲ **Canvas**: [canvas-flow-widget-creation.md](canvas-flow-widget-creation.md) - Widget lifecycle in canvas
