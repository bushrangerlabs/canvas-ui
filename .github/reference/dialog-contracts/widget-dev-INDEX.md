# Widget Development - Knowledge Graph Entry Point

Complete guide to creating widgets for Canvas UI, based on the original ioBroker.vis-2 method enhanced with the new Widget API.

## Quick Start

**New widget in 3 steps:**

1. **Create widget class** extending BaseWidget → [widget-dev-class-structure.md](widget-dev-class-structure.md)
2. **Define metadata** with getMetadata() → [widget-dev-metadata.md](widget-dev-metadata.md)
3. **Register widget** in WidgetRegistry → [canvas-flow-widget-registration.md](canvas-flow-widget-registration.md)

## Core Concepts

### Widget Class Structure

- [widget-dev-class-structure.md](widget-dev-class-structure.md) - Complete widget file anatomy
- [widget-dev-metadata.md](widget-dev-metadata.md) - getMetadata() and customFields
- [widget-dev-lifecycle.md](widget-dev-lifecycle.md) - mount(), unmount(), updateConfig()

### Widget Functionality

- [widget-dev-entity-bindings.md](widget-dev-entity-bindings.md) - Entity subscriptions and binding expressions
- [widget-dev-rendering.md](widget-dev-rendering.md) - render() and updateDisplay() methods
- [widget-dev-constructor.md](widget-dev-constructor.md) - Constructor patterns and event handler binding
- [widget-dev-event-handlers.md](widget-dev-event-handlers.md) - Event listener setup and cleanup
- [widget-dev-universal-styling.md](widget-dev-universal-styling.md) - Universal styling implementation
- [widget-dev-complete-example.md](widget-dev-complete-example.md) - Full button widget implementation

## Detailed Guides

### Lifecycle Methods (4 files)

- [widget-dev-lifecycle.md](widget-dev-lifecycle.md) - Overview & state machine
- [widget-dev-lifecycle-mount.md](widget-dev-lifecycle-mount.md) - 9-step mount() process
- [widget-dev-lifecycle-unmount.md](widget-dev-lifecycle-unmount.md) - Cleanup checklist
- [widget-dev-lifecycle-updateConfig.md](widget-dev-lifecycle-updateConfig.md) - Update strategies

### Entity Bindings (4 files)

- [widget-dev-entity-bindings.md](widget-dev-entity-bindings.md) - Method comparison & decision tree
- [widget-dev-bindings-direct-entity.md](widget-dev-bindings-direct-entity.md) - Direct EntityManager.subscribe()
- [widget-dev-bindings-expressions.md](widget-dev-bindings-expressions.md) - BindingBinder for expressions
- [widget-dev-bindings-multi-entity.md](widget-dev-bindings-multi-entity.md) - Multiple entity pattern

### Rendering Methods (4 files)

- [widget-dev-rendering.md](widget-dev-rendering.md) - render() vs updateDisplay() overview
- [widget-dev-rendering-render-method.md](widget-dev-rendering-render-method.md) - Template strategies
- [widget-dev-rendering-update-display.md](widget-dev-rendering-update-display.md) - Granular updates
- [widget-dev-rendering-optimization.md](widget-dev-rendering-optimization.md) - Performance techniques

### Metadata & Inspector (3 files)

- [widget-dev-metadata.md](widget-dev-metadata.md) - Building flow & progressive construction
- [widget-dev-metadata-field-types.md](widget-dev-metadata-field-types.md) - Complete field type reference
- [widget-dev-metadata-examples.md](widget-dev-metadata-examples.md) - 6 levels of complexity

## Widget API Integration

**KEY PRINCIPLE: Inspector is Driven by Widget Metadata**

```
Widget JS File
     ↓
getMetadata() returns customFields array
     ↓
Inspector reads customFields
     ↓
Inspector AUTOMATICALLY generates UI controls
     ↓
No separate inspector configuration needed!
```

Widgets automatically get **5 universal inspector sections**:

1. **Identity** - Widget name, ID (automatic, read-only)
2. **Position** - X, Y, Width, Height, Z-index (automatic, bidirectional sync)
3. **Custom** - Widget-specific fields (from customFields) ← **YOU DEFINE THIS**
4. **Styling** - Background, border, shadow, padding, background image (automatic, apply with `applyUniversalStyling()`)
5. **Visibility** - Visibility conditions (automatic, use `setupVisibility()`)

**What widgets must do:**

- ✅ Define `customFields` in getMetadata() → Controls section 3
- ✅ Call `applyUniversalStyling()` in mount() → Enables section 4
- ✅ Call `setupVisibility()` in mount() (optional) → Enables section 5
- ✅ Sections 1 & 2 work automatically (no code needed)

See: [widget-api-INDEX.md](widget-api-INDEX.md) for complete Widget API documentation

## Complete Widget API Coverage

**All 5 Inspector Sections Documented:**

| Section           | Widget Action                          | Documented In                                                                                | Widget API Ref                                                                       |
| ----------------- | -------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **1. Identity**   | None (automatic)                       | N/A                                                                                          | [widget-api-identity-widget-name-id.md](widget-api-identity-widget-name-id.md)       |
| **2. Position**   | None (automatic)                       | N/A                                                                                          | [widget-api-position-coordinate-fields.md](widget-api-position-coordinate-fields.md) |
| **3. Custom**     | Define `customFields` in getMetadata() | [widget-dev-metadata.md](widget-dev-metadata.md)                                             | [widget-api-custom-section-overview.md](widget-api-custom-section-overview.md)       |
| **4. Styling**    | Call `applyUniversalStyling()`         | [widget-dev-class-structure.md](widget-dev-class-structure.md#step-10-add-universal-styling) | [widget-api-styling-background-color.md](widget-api-styling-background-color.md)     |
| **5. Visibility** | Call `setupVisibility()` (optional)    | [widget-dev-lifecycle.md](widget-dev-lifecycle.md)                                           | [widget-api-visibility-conditions.md](widget-api-visibility-conditions.md)           |

**Styling Properties Covered:**

- ✅ Background Color → [widget-dev-class-structure.md](widget-dev-class-structure.md#step-10-add-universal-styling)
- ✅ Border & Border Radius → [widget-dev-class-structure.md](widget-dev-class-structure.md#step-10-add-universal-styling)
- ✅ Box Shadow → [widget-dev-class-structure.md](widget-dev-class-structure.md#step-10-add-universal-styling)
- ✅ Padding (T/R/B/L) → [widget-dev-class-structure.md](widget-dev-class-structure.md#step-10-add-universal-styling)
- ✅ Background Image → [widget-dev-class-structure.md](widget-dev-class-structure.md#step-10-add-universal-styling)

**Custom Fields (12 Types) Covered:**

- ✅ All field types documented → [widget-dev-metadata.md](widget-dev-metadata.md)
- ✅ Field type decision tree → [widget-dev-metadata.md](widget-dev-metadata.md)

## Development Flow

```
Create Class → Define Metadata → Implement Lifecycle → Add Bindings → Register
     ↓              ↓                   ↓                    ↓            ↓
base-widget  getMetadata()       mount/unmount      setupBindings   registry
  extends    customFields[]      updateConfig        EntityManager   .register()
```

## What Widgets Must Provide

### Required (Minimum)

```javascript
export class MyWidget extends BaseWidget {
  static getMetadata() {
    return {
      name: "My Widget",
      icon: "mdi-cog",
      category: "basic",
      defaultSize: { w: 200, h: 100 },
      customFields: [], // Can be empty
    };
  }

  mount(container) {
    this.element = document.createElement("div");
    this.element.textContent = "My Widget";
    container.appendChild(this.element);
    this.mounted = true;
  }

  unmount() {
    if (this.element) this.element.remove();
    this.mounted = false;
  }

  updateConfig(newConfig) {
    Object.assign(this.config, newConfig);
    this.render();
  }
}
```

### Recommended (Full Featured)

```javascript
export class MyWidget extends BaseWidget {
  constructor(canvasCore, config) {
    super(canvasCore, config);
    this.handleClick = this.handleClick.bind(this);
    this.entityUnsubscribe = null;
  }

  static getMetadata() {
    return {
      // Identity
      name: "My Widget",
      icon: "mdi-cog",
      category: "advanced",
      description: "Widget description",
      version: "1.0.0",

      // Sizing
      defaultSize: { w: 200, h: 100 },
      minSize: { w: 50, h: 30 },

      // Behavior
      requiresEntity: false,
      requiresConfig: false,

      // Inspector fields
      customFields: [
        {
          name: "text",
          type: "text",
          label: "Text",
          default: "Text",
          binding: true,
        },
        { name: "entity", type: "entity", label: "Entity", default: "" },
        { name: "icon", type: "icon", label: "Icon", default: "" },
      ],
    };
  }

  mount(container) {
    this.element = document.createElement("div");
    this.render();
    this.setupEventListeners();
    this.setupBindings();
    this.applyUniversalStyling();
    container.appendChild(this.element);
    this.mounted = true;
  }

  unmount() {
    this.cleanupBindings();
    this.removeEventListeners();
    if (this.element) this.element.remove();
    this.mounted = false;
  }

  updateConfig(newConfig) {
    Object.assign(this.config, newConfig);

    if (newConfig.entity !== undefined) {
      this.cleanupBindings();
      this.setupBindings();
    }

    if (newConfig.text !== undefined) {
      this.render();
    }
  }

  render() {
    this.element.innerHTML = `<div>${this.config.text || ""}</div>`;
  }

  updateDisplay(changes) {
    if (changes.text !== undefined) {
      this.element.textContent = changes.text;
    }
  }

  setupBindings() {
    if (this.canvasCore?.bindingBinder) {
      this.canvasCore.bindingBinder.bindWidget(this.config.id, this.config);
    }
  }

  cleanupBindings() {
    if (this.canvasCore?.bindingBinder) {
      this.canvasCore.bindingBinder.unbindWidget(this.config.id);
    }
  }

  setupEventListeners() {
    this.element.addEventListener("click", this.handleClick);
  }

  removeEventListeners() {
    this.element.removeEventListener("click", this.handleClick);
  }

  handleClick() {
    console.log("Clicked!");
  }

  applyUniversalStyling() {
    const cfg = this.config;
    if (cfg.backgroundColor)
      this.element.style.backgroundColor = cfg.backgroundColor;
    if (cfg.border) this.element.style.border = cfg.border;
    if (cfg.borderRadius) this.element.style.borderRadius = cfg.borderRadius;
    if (cfg.boxShadow) this.element.style.boxShadow = cfg.boxShadow;
    // ... more styling
  }
}
```

## Field Types Reference

| Type         | Inspector UI | Dialog           | Binding Support |
| ------------ | ------------ | ---------------- | --------------- |
| `text`       | Text input   | None             | ✓ Yes           |
| `number`     | Number input | None             | ✓ Yes           |
| `checkbox`   | Checkbox     | None             | ✗ No            |
| `select`     | Dropdown     | None             | ✗ No            |
| `entity`     | Button       | EntityPicker     | ✗ No            |
| `icon`       | Button       | IconPicker       | ✓ Yes           |
| `color`      | Button       | ColorPicker      | ✓ Yes           |
| `font`       | Button       | FontPicker       | ✗ No            |
| `border`     | Button       | BorderEditor     | Partial         |
| `shadow`     | Button       | ShadowEditor     | Partial         |
| `tapAction`  | Button       | TapActionEditor  | ✗ No            |
| `visibility` | Button       | VisibilityEditor | ✗ No            |

See: [widget-dev-metadata.md](widget-dev-metadata.md#field-types-reference)

## Original vis-2 vs New Canvas UI

### Original ioBroker.vis-2 Method

```javascript
// OLD: vis.binds approach (jQuery-based)
vis.binds['basic'] = {
  createWidget: function(widgetID, view, data, style) {
    var $div = $('#' + widgetID);
    $div.html('<div>' + data.text + '</div>');

    // Bind entity
    vis.binds['basic'].bindStates($div, ['entity_id'], function(id, state) {
      $div.text(state.val);
    });

    return { /* widget info */ };
  }
};

// Metadata in separate JSON file
{
  "name": "Button",
  "attrs": [
    { "name": "text", "type": "string", "default": "Button" },
    { "name": "entity", "type": "id" }
  ]
}
```

### New Canvas UI Method

```javascript
// NEW: Class-based with integrated metadata
export class ButtonWidget extends BaseWidget {
  static getMetadata() {
    return {
      name: "Button",
      icon: "mdi-gesture-tap",
      category: "basic",
      defaultSize: { w: 200, h: 100 },
      customFields: [
        {
          name: "text",
          type: "text",
          label: "Text",
          default: "Button",
          binding: true,
        },
        { name: "entity", type: "entity", label: "Entity", default: "" },
      ],
    };
  }

  mount(container) {
    this.element = document.createElement("div");
    this.render();
    this.setupBindings();
    container.appendChild(this.element);
    this.mounted = true;
  }

  setupBindings() {
    if (this.canvasCore?.bindingBinder) {
      this.canvasCore.bindingBinder.bindWidget(this.config.id, this.config);
    }
  }
}
```

**Advantages of new method:**

- ✓ Modern class-based architecture
- ✓ Integrated metadata (no separate JSON)
- ✓ Automatic inspector generation
- ✓ Better encapsulation (instance methods)
- ✓ Universal styling system
- ✓ Advanced binding expressions
- ✓ TypeScript-friendly structure

## Canvas Integration

How canvas system interacts with widgets:

1. **Registration** → [canvas-flow-widget-registration.md](canvas-flow-widget-registration.md)
2. **Toolbar** → [canvas-flow-toolbar-loading.md](canvas-flow-toolbar-loading.md)
3. **Creation** → [canvas-flow-widget-creation.md](canvas-flow-widget-creation.md)
4. **Rendering** → [canvas-flow-widget-rendering.md](canvas-flow-widget-rendering.md)
5. **Updates** → [canvas-flow-inspector-updates.md](canvas-flow-inspector-updates.md)

## Common Patterns

### Simple Text Widget

```javascript
class TextWidget extends BaseWidget {
  static getMetadata() {
    return {
      name: "Text",
      icon: "mdi-text",
      category: "basic",
      defaultSize: { w: 200, h: 50 },
      customFields: [
        {
          name: "text",
          type: "text",
          label: "Text",
          default: "Text",
          binding: true,
        },
      ],
    };
  }

  mount(container) {
    this.element = document.createElement("div");
    this.element.textContent = this.config.text || "Text";
    container.appendChild(this.element);
    this.mounted = true;

    if (this.canvasCore?.bindingBinder) {
      this.canvasCore.bindingBinder.bindWidget(this.config.id, this.config);
    }
  }

  updateDisplay(changes) {
    if (changes.text !== undefined) {
      this.element.textContent = changes.text;
    }
  }
}
```

### Entity Display Widget

```javascript
class EntityWidget extends BaseWidget {
  static getMetadata() {
    return {
      name: "Entity",
      icon: "mdi-database",
      category: "basic",
      defaultSize: { w: 200, h: 100 },
      requiresEntity: true,
      customFields: [
        { name: "entity", type: "entity", label: "Entity", default: "" },
      ],
    };
  }

  mount(container) {
    this.element = document.createElement("div");
    this.render();
    this.setupBindings();
    container.appendChild(this.element);
    this.mounted = true;
  }

  setupBindings() {
    if (!this.config.entity || !this.canvasCore?.entityManager) return;

    this.entityUnsubscribe = this.canvasCore.entityManager.subscribe(
      this.config.entity,
      (state) => {
        this.element.textContent = state?.state || "—";
      },
    );
  }

  cleanupBindings() {
    if (this.entityUnsubscribe) {
      this.entityUnsubscribe();
      this.entityUnsubscribe = null;
    }
  }

  unmount() {
    this.cleanupBindings();
    if (this.element) this.element.remove();
    this.mounted = false;
  }
}
```

## Best Practices

### ✓ DO

- Extend BaseWidget
- Define complete metadata
- Bind event handlers in constructor
- Clean up subscriptions in unmount()
- Use BindingBinder for binding expressions
- Apply universal styling via applyUniversalStyling()
- Cache DOM references for performance
- Handle entity state changes gracefully

### ✗ DON'T

- Use arrow functions for lifecycle methods
- Forget to set this.mounted flag
- Leave entity subscriptions active after unmount
- Skip error handling for missing entities
- Re-render on every config change (use updateDisplay)
- Hard-code styles (use Widget API styling)

## Troubleshooting

**Widget not appearing in toolbar?**

- Check registration: `registry.register("my-widget", MyWidget)`
- Verify getMetadata() returns valid object
- Check category is valid: "basic", "advanced", "gauges"

**Inspector not showing fields?**

- Verify customFields array in getMetadata()
- Check field types are valid
- Ensure getMetadata() is static method

**Bindings not working?**

- Check field has `binding: true` in metadata
- Verify setupBindings() calls bindingBinder.bindWidget()
- Ensure updateDisplay() handles binding updates

**Memory leaks?**

- Verify cleanupBindings() is called in unmount()
- Check all event listeners are removed
- Confirm animation frames/timers are cancelled

---

## Navigate

**Widget Development Files:**

- [widget-dev-class-structure.md](widget-dev-class-structure.md) - Complete widget file anatomy
- [widget-dev-metadata.md](widget-dev-metadata.md) - getMetadata() and customFields
- [widget-dev-lifecycle.md](widget-dev-lifecycle.md) - mount(), unmount(), updateConfig()
- [widget-dev-entity-bindings.md](widget-dev-entity-bindings.md) - Entity subscriptions
- [widget-dev-rendering.md](widget-dev-rendering.md) - render() and updateDisplay()
- [widget-dev-complete-example.md](widget-dev-complete-example.md) - Full ButtonWidget

**Related Documentation:**
⟲ **Widget API**: [widget-api-INDEX.md](widget-api-INDEX.md) - Universal inspector structure
⟲ **Canvas Lifecycle**: [canvas-flow-widget-creation.md](canvas-flow-widget-creation.md) - Widget creation flow
⟲ **Canvas Registration**: [canvas-flow-widget-registration.md](canvas-flow-widget-registration.md) - Registration and loading
⟲ **Canvas Rendering**: [canvas-flow-widget-rendering.md](canvas-flow-widget-rendering.md) - Rendering coordination
