# Widget Development: Metadata Contract

The `getMetadata()` static method defines widget identity, capabilities, and inspector fields.

## Metadata Building Flow

```
Step 1: Identity
  ├── name
  ├── icon
  ├── category
  └── description (optional)
      ↓
Step 2: Sizing
  ├── defaultSize { w, h }
  ├── minSize (optional)
  └── maxSize (optional)
      ↓
Step 3: Behavior Flags
  ├── requiresEntity
  └── requiresConfig
      ↓
Step 4: Custom Fields
  └── customFields: [ field, field, ... ]
      ↓
Complete Metadata Ready
```

## Progressive Metadata Construction

### Step 1: Identity - Who Am I?

```javascript
static getMetadata() {
  return {
    name: "Button",              // Display name in toolbar
    icon: "mdi-gesture-tap",     // MDI icon for toolbar
    category: "basic",           // Toolbar category
    description: "A clickable button widget",  // Tooltip (optional)
```

### Step 2: Sizing - How Big?

```javascript
    defaultSize: {              // Default when created
      w: 200,                   // Width in pixels
      h: 100                    // Height in pixels
    },

    minSize: { w: 50, h: 30 },  // Minimum size (optional)
    maxSize: { w: 1000, h: 800 }, // Maximum size (optional)
```

### Step 3: Behavior Flags - What Requirements?

```javascript
    requiresEntity: false,      // Show entity picker on create?
    requiresConfig: false,      // Show config dialog on create?
```

### Step 4: Custom Fields - What Options?

**CRITICAL CONCEPT: Inspector is Generated from Widget Metadata**

```javascript
    customFields: [
      // Each field object generates ONE inspector input
      {
        name: "text",           // Config property name
        type: "text",           // Inspector UI type
        label: "Button Text",   // User-visible label
        default: "Click Me"     // Initial value
      }
      // Inspector creates text input automatically ✓
    ]
  };
}
```

## Two Detail Guides

### [Field Type Reference](widget-dev-metadata-field-types.md) - Complete Field Guide

Complete reference for all 13 available inspector field types.

**Field Types:**
- Text, Number, Checkbox, Select
- Entity, Icon, Color, Font
- Border, Shadow, Tap Action
- Visibility, Binding

**Each with:**
- Type signature
- Configuration options
- Binding support
- Value format
- Usage examples

**[Read field type reference →](widget-dev-metadata-field-types.md)**

### [Metadata Examples](widget-dev-metadata-examples.md) - Progressive Complexity

6 levels of metadata showing evolution from simple to complex.

**Levels:**
1. Minimal (Static Display)
2. Entity Integration
3. Interactive Widget
4. Full-Featured Widget
5. Multi-Entity Widget
6. Complex Layout Widget

**[Read examples guide →](widget-dev-metadata-examples.md)**

## Metadata Validation Checklist

**Before deploying a widget:**

- [ ] `name` is descriptive and unique
- [ ] `icon` is valid MDI icon (check pictogrammers.com)
- [ ] `category` matches toolbar categories
- [ ] `defaultSize` is appropriate for widget type
- [ ] `minSize` prevents unreadable sizes (if set)
- [ ] `maxSize` prevents performance issues (if set)
- [ ] `requiresEntity` matches widget functionality
- [ ] `requiresConfig` improves UX (if needed)
- [ ] All `customFields` have:
  - [ ] Unique `name` values
  - [ ] Appropriate `type` for data
  - [ ] Clear `label` text
  - [ ] Sensible `default` values
  - [ ] `binding: true` if expressions supported
- [ ] `select` fields have `options` array
- [ ] `number` fields have `min`, `max`, `step` (if needed)
- [ ] Test all fields in inspector
- [ ] Test binding expressions (if enabled)

## Navigate

↑ **INDEX**: [widget-dev-INDEX.md](widget-dev-INDEX.md) - Widget development entry point
→ **Field Types**: [widget-dev-metadata-field-types.md](widget-dev-metadata-field-types.md) - Complete field reference
→ **Examples**: [widget-dev-metadata-examples.md](widget-dev-metadata-examples.md) - Progressive complexity
→ **Class Structure**: [widget-dev-class-structure.md](widget-dev-class-structure.md) - Widget file anatomy
→ **Lifecycle**: [widget-dev-lifecycle.md](widget-dev-lifecycle.md) - mount, unmount, updateConfig
→ **Example**: [widget-dev-complete-example.md](widget-dev-complete-example.md) - See metadata in action
⟲ **Widget API**: [widget-api-custom-section-overview.md](widget-api-custom-section-overview.md) - How inspector uses customFields
⟲ **Canvas**: [canvas-flow-widget-registration.md](canvas-flow-widget-registration.md) - Register widget with metadata
