# Canvas UI - Widget Inspector Focus

**Project Type:** Home Assistant Custom Integration (Python backend + Vanilla JS frontend)

A dual-mode drag-and-drop dashboard system inspired by ioBroker VIS, optimized for Home Assistant.

---

## 🚀 Quick Reference

### Deployment Commands

```bash
# Deploy frontend (most common)
sshpass -p 'AWpoP6Rx@wQ7jK' scp www/canvas-ui/FILE.js root@192.168.1.103:/config/www/canvas-ui/

# Deploy backend (requires restart)
sshpass -p 'AWpoP6Rx@wQ7jK' scp -r custom_components/canvas_ui/* root@192.168.1.103:/config/custom_components/canvas_ui/
sshpass -p 'AWpoP6Rx@wQ7jK' ssh root@192.168.1.103 "ha core restart"
```

### Testing URLs

- View: `http://192.168.1.103:8123/canvas-ui`
- Edit: `http://192.168.1.103:8123/canvas-ui?edit=true`
- Kiosk: `http://192.168.1.103:8123/canvas-ui?kiosk=main`

---

## 🎯 CURRENT FOCUS: Widget Inspector Standards

### Inspector Requirements (All Widgets)

**Every widget MUST have 5 categories:**

1. **Position** - x, y, w, h, z-index controls
2. **Custom** - Widget-specific options (button text, entity, icon, etc.)
3. **Typography** - Font controls (when widget outputs text)
4. **Styling** - Background, borders, shadows
5. **Visibility** - Visibility condition

### Universal Properties (All Widgets)

**Position Category:**

- x, y, w, h (via canvas drag/resize, shown in inspector)
- z-index (layer order)

**Styling Category:**

- Background color
- Background image (via file manager)
- Border (width, style, color, radius) - use Border Builder
- Shadow (offset, blur, spread, color, inset) - use Shadow Builder

**Visibility Category:**

- Visibility condition (binding expression that returns true/false)

### Existing Pickers/Dialogs to Use

**Available pickers (trigger via buttons):**

1. **Entity Picker** - "..." button
   - Shows all HA entities with search/filter
   - Domain-based grouping
   - 40+ domain icons with colors
   - Usage: `type: 'entity'` in schema

2. **Binding Editor** - "{}" button
   - Simple mode: Entity + operations builder
   - Multi-variable mode: JavaScript eval expressions
   - 45+ operations across 5 categories
   - Icon palette button for MDI icons
   - Usage: `binding: true` in schema

3. **Icon Picker** - "..." button
   - 150+ MDI icons in 9 categories
   - Category filtering dropdown
   - 20-icon SVG preview grid
   - Usage: `type: 'icon'` in schema

4. **Border Builder** - Gradient button
   - Visual border editor with live preview
   - Width, style, color, radius controls
   - Smart comma-separated radius parsing
   - Outputs atomic properties
   - Usage: `type: 'builder', builderType: 'border'`

5. **Shadow Builder** - Gradient button
   - Visual shadow editor with live preview
   - 6 presets (None, Subtle, Card, Elevated, Dramatic, Glow)
   - X, Y, blur, spread, color, inset controls
   - Outputs atomic properties
   - Usage: `type: 'builder', builderType: 'shadow'`

6. **Font Picker** - "Select..." button
   - 12 web-safe fonts + 15 Google Fonts
   - Live previews in actual typeface
   - Search/filter functionality
   - Usage: `type: 'font'`

7. **File Manager** - File browser
   - Navigate /local/ directory tree
   - Image preview
   - Usage: For background images

8. **Visibility Condition Dialog** - "{}" button
   - Simple Builder: Visual condition creator
   - Advanced Expression: Manual binding editor
   - 9 operators (==, !=, >, <, >=, <=, contains, startsWith, endsWith)
   - AND/OR logic support
   - Usage: For visibility conditions

### Dual Button Support (Entity + Binding)

**For fields that can accept either entity OR binding:**

```javascript
{
  name: 'text',
  type: 'text',
  default: 'Click Me',
  label: 'Button Text',
  entity: true,    // Enables "..." entity picker button
  binding: true,   // Enables "{}" binding editor button
  maxWidth: 140    // Recommended for proper button spacing
}
```

**Result:** Input field with BOTH "..." and "{}" buttons side-by-side

### Property Persistence (CRITICAL)

**Use blur events, NOT input events:**

```javascript
// ❌ WRONG - causes focus loss
input.addEventListener("input", () => {
  this.handlePropertyChange(prop.name, input.value);
});

// ✅ CORRECT - saves when leaving field
input.addEventListener("blur", () => {
  this.handlePropertyChange(prop.name, input.value);
});
```

**Why:** `handlePropertyChange` triggers widget update → inspector refresh → input destroyed → user loses focus

### Atomic Border Properties (Current System)

**Borders stored as individual properties:**

```javascript
borderWidth: 5,                    // Number (pixels)
borderStyle: 'solid',              // String (solid, dashed, dotted, etc.)
borderColor: '#03a9f4',           // Hex or rgba
borderRadius: '10,5,10,5'         // Smart parsing: "10" or "10,5,10,5"
```

**Border Radius Parsing:**

- Single value: `"10"` → All corners 10px
- Comma-separated: `"10,5,10,5"` → TL, TR, BR, BL
- Preserved through entire property flow (no parseFloat conversion)

**CRITICAL: noConvertProps Protection**

Both inspector.js AND canvas-core.js must protect borderRadius:

```javascript
const noConvertProps = [
  "border",
  "boxShadow",
  "font",
  "fontFamily",
  "borderRadius",
];
```

**Without this:** `"10,5,10,5"` becomes `10` (data loss!)

### Atomic Shadow Properties (Current System)

**Shadows stored as individual properties:**

```javascript
shadowX: 0,                       // X offset in pixels
shadowY: 4,                       // Y offset in pixels
shadowBlur: 8,                    // Blur radius in pixels
shadowSpread: 5,                  // Spread radius in pixels
shadowColor: 'rgba(0,0,0,0.15)', // Color with alpha
shadowInset: false                // Boolean for inset shadow
```

### Real-Time Canvas Updates

**All changes must update canvas immediately:**

- Property change → `handlePropertyChange()` → `viewRenderer.updateWidget()` → Canvas updates
- No "Apply" button needed
- Inspector changes instantly visible

### Widget Inspector Template

```javascript
export class ExampleWidget extends BaseWidget {
  static getConfigSchema() {
    return {
      // === POSITION CATEGORY ===
      x: {
        type: "number",
        label: "X Position",
        default: 0,
        category: "Position",
      },
      y: {
        type: "number",
        label: "Y Position",
        default: 0,
        category: "Position",
      },
      w: { type: "number", label: "Width", default: 150, category: "Position" },
      h: {
        type: "number",
        label: "Height",
        default: 100,
        category: "Position",
      },
      z: { type: "number", label: "Z-Index", default: 1, category: "Position" },

      // === CUSTOM CATEGORY ===
      text: {
        type: "text",
        label: "Text Content",
        default: "Text",
        category: "Custom",
        entity: true, // Dual buttons
        binding: true,
        maxWidth: 140,
        placeholder: "Enter text or select entity",
        description:
          "Entity attribute or static text. Supports {entity.attribute} bindings",
      },

      entity: {
        type: "entity",
        label: "Target Entity",
        default: "",
        category: "Custom",
        description: "Entity to control",
      },

      // === TYPOGRAPHY CATEGORY (if widget outputs text) ===
      fontSize: {
        type: "slider",
        label: "Font Size",
        default: 14,
        min: 8,
        max: 64,
        step: 1,
        category: "Typography",
      },

      fontWeight: {
        type: "slider",
        label: "Font Weight",
        default: 500,
        min: 100,
        max: 900,
        step: 100,
        category: "Typography",
      },

      fontFamily: {
        type: "font",
        label: "Font Family",
        default: "inherit",
        category: "Typography",
      },

      // === STYLING CATEGORY ===
      backgroundColor: {
        type: "color",
        label: "Background Color",
        default: "#2c2c2c",
        category: "Styling",
        binding: true,
      },

      backgroundImage: {
        type: "text",
        label: "Background Image",
        default: "",
        category: "Styling",
        placeholder: "/local/images/bg.jpg",
        description: "URL or /local/ path",
      },

      // Border builder (outputs atomic properties)
      _borderBuilder: {
        type: "builder",
        builderType: "border",
        label: "Border Builder",
        category: "Styling",
      },

      borderWidth: {
        type: "number",
        label: "Border Width",
        default: 0,
        category: "Styling",
      },
      borderStyle: {
        type: "select",
        label: "Border Style",
        default: "solid",
        options: ["solid", "dashed", "dotted", "double"],
        category: "Styling",
      },
      borderColor: {
        type: "color",
        label: "Border Color",
        default: "#333333",
        category: "Styling",
      },
      borderRadius: {
        type: "text",
        label: "Border Radius",
        default: "0",
        category: "Styling",
        binding: true,
        placeholder: "e.g. 10 or 10,0,10,0",
      },

      // Shadow builder (outputs atomic properties)
      _shadowBuilder: {
        type: "builder",
        builderType: "shadow",
        label: "Shadow Builder",
        category: "Styling",
      },

      shadowX: {
        type: "number",
        label: "Shadow X",
        default: 0,
        category: "Styling",
      },
      shadowY: {
        type: "number",
        label: "Shadow Y",
        default: 0,
        category: "Styling",
      },
      shadowBlur: {
        type: "number",
        label: "Shadow Blur",
        default: 0,
        category: "Styling",
      },
      shadowSpread: {
        type: "number",
        label: "Shadow Spread",
        default: 0,
        category: "Styling",
      },
      shadowColor: {
        type: "color",
        label: "Shadow Color",
        default: "rgba(0,0,0,0)",
        category: "Styling",
      },
      shadowInset: {
        type: "checkbox",
        label: "Inset Shadow",
        default: false,
        category: "Styling",
      },

      // === VISIBILITY CATEGORY ===
      visibilityCondition: {
        type: "text",
        label: "Visibility Condition",
        default: "",
        category: "Visibility",
        binding: true,
        placeholder: "Leave blank to always show",
        description: "Widget shows when expression evaluates to true",
      },
    };
  }

  // Widget implementation...
}
```

---

## 📚 Reference Documentation

**For complete details, see BUILD_FOUNDATION.md:**

- **Widget System Design** → § Widget System Design
- **Data Binding System** → § Data Binding System (45+ operations)
- **Dialog & Popup Design** → Appendix (color palette, spacing, ESC handlers)
- **Inspector Integration** → § Inspector System Design
- **Property Persistence** → Property flow documentation
- **Atomic Border/Shadow** → Phase 11 documentation
- **Visibility System** → Phase 13 documentation

---

**Last Updated:** January 28, 2026  
**Focus:** Widget Inspector Standards & Property Management
