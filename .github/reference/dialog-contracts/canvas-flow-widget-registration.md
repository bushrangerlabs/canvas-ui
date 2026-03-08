# Canvas Flow: Widget Registration

How widgets get registered and loaded into the system.

## Registration Flow

```
Widget File Created              WidgetRegistry              Widget Available
       ↓                                ↓                              ↓
   class ButtonWidget    →    registry.register()    →    Available for use
   + getMetadata()            (type, class, metadata)      in toolbar/factory
       ↓                                ↓                              ↓
   Export class          →    Store in Map()         →    Lazy load on demand
                              widgets.set(type, {...})
```

## Two Registration Patterns

### Pattern 1: Manual Registration (Immediate)

```javascript
// In app initialization
import { ButtonWidget } from "./widgets/basic/button-widget.js";

widgetRegistry.register("button", ButtonWidget);
// Widget class loaded immediately
```

**Flow:**

1. Import widget class at startup
2. Call `registry.register(type, class, metadata)`
3. Widget available immediately
4. Class stays in memory

### Pattern 2: Lazy Loading (On-Demand)

```javascript
// Widget registered but not loaded
widgetRegistry.registerLazy("button", "../widgets/basic/button-widget.js");

// Later, when needed:
const ButtonClass = await widgetRegistry.loadWidget("button");
// Now imported and available
```

**Flow:**

1. Register widget path (no import yet)
2. When toolbar/factory needs it → `loadWidget(type)`
3. Dynamic `import()` loads the module
4. Extract widget class from module
5. Cache for future use

## WidgetRegistry Storage

```javascript
Map<type, {
  class: WidgetClass,      // The widget constructor
  metadata: {              // From class.getMetadata()
    name: "Button",
    icon: "mdi-gesture-tap",
    category: "basic",
    defaultSize: {w: 100, h: 50},
    requiresEntity: false
  },
  loaded: true             // Is class loaded?
}>
```

## Dynamic Loading Process

```
User action triggers widget need
       ↓
Check: isLoaded(type)?
       ↓           ↓
     YES          NO
       ↓           ↓
   Return     loadWidget(type)
   cached         ↓
   class     import(modulePath)
              ↓
         Extract class from module
              ↓
         Call class.getMetadata()
              ↓
         Store in registry Map
              ↓
         Return class
```

## Widget Metadata Contract

Every widget class should provide:

```javascript
class ButtonWidget {
  static getMetadata() {
    return {
      // Display
      name: "Button",
      icon: "mdi-gesture-tap",
      category: "basic",

      // Sizing
      defaultSize: { w: 100, h: 50 },
      minSize: { w: 50, h: 30 },

      // Behavior
      requiresEntity: false, // Needs entity picker on create?
      requiresConfig: false, // Show config dialog on create?

      // Inspector sections (NEW API)
      customFields: [
        // Custom inspector fields
        { name: "text", type: "text", label: "Button Text" },
        { name: "icon", type: "icon", label: "Icon" },
        { name: "tapAction", type: "tapAction", label: "Tap Action" },
      ],
    };
  }
}
```

## Connection to Widget API

**Registry provides metadata** → **Inspector renders fields**

1. Inspector calls `widgetRegistry.getMetadata(widget.type)`
2. Gets `customFields` array
3. Renders custom section using field types
4. See: [widget-api-custom-section-overview.md](widget-api-custom-section-overview.md)

---

## Navigate

→ **Next**: [canvas-flow-toolbar-loading.md](canvas-flow-toolbar-loading.md) - How widgets appear in toolbar
↓ **Create**: [canvas-flow-widget-creation.md](canvas-flow-widget-creation.md) - How widgets get instantiated
⟲ **Widget API**: [widget-api-INDEX.md](widget-api-INDEX.md) - Inspector structure
⟲ **Widget Dev**: [widget-dev-metadata.md](widget-dev-metadata.md) - Define getMetadata() for registration
⟲ **Widget Dev**: [widget-dev-class-structure.md](widget-dev-class-structure.md) - Complete widget structure
