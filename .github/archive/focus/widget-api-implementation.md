# Widget API Implementation

## 🚀 Deploy

```bash
sshpass -p 'AWpoP6Rx@wQ7jK' scp www/canvas-ui/inspector/field-renderer.js root@192.168.1.103:/config/www/canvas-ui/inspector/
```

## 🎯 Goal: Metadata-Driven Inspector

### The Problem We're Solving

**Current State - Code Duplication:**

1. **inspector.css** (296 lines): CSS classes with `padding: 8px 12px`
2. **inspector.js** (2533 lines): Inline styles with `padding: 6px 8px` (inconsistent!)
3. **table-renderer.js** (700 lines): Additional rendering logic

**Issues:**

- ✅ Duplication across 3 files
- ✅ Inconsistent styling (different padding values)
- ✅ Coupling (widget schema separate from rendering)
- ✅ Scalability (new widgets require inspector.js modification)

### The Solution - Metadata-Driven Inspector

**Vision:** "Each widget JS file tells the main canvas UI what it is, how it works, how it looks, and how its inspector should look"

**Architecture:**

- Widgets own their metadata via `static getMetadata()`
- Inspector becomes generic renderer
- All existing dialogs preserved (EntityPickerDialog, BindingEditorDialog, etc.)
- Hybrid approach: Simple strings + flexible objects

---

## 📐 Widget API Design (Hybrid VIS v1 + VIS v2)

### Metadata Structure

```javascript
export class ButtonWidget extends BaseWidget {
  static getMetadata() {
    return {
      type: "button",
      name: "Button",
      description: "Interactive button widget",
      category: "basic",
      icon: "mdi:button-cursor",
      version: "1.0.0",

      // Field definitions (hybrid syntax)
      fields: {
        // === POSITION CATEGORY ===
        x: "x:number:0:X Position", // Simple string syntax
        y: "y:number:0:Y Position",
        w: "w:number:150:Width",
        h: "h:number:100:Height",
        z: "z:number:1:Z-Index",

        // === CUSTOM CATEGORY ===
        text: {
          // Object syntax for complex fields
          name: "text",
          type: "text",
          default: "Click Me",
          label: "Button Text",
          category: "Custom",
          entity: true, // Enables "..." entity picker button
          binding: true, // Enables "{}" binding editor button
          maxWidth: 140,
          placeholder: "Enter text or select entity",
          description: "Entity attribute or static text",
        },

        entity: {
          name: "entity",
          type: "entity",
          default: "",
          label: "Target Entity",
          category: "Custom",
          description: "Entity to control on click",
        },

        // === TYPOGRAPHY CATEGORY ===
        fontSize: "fontSize:slider:14:Font Size (px):8:64:1", // slider with min/max/step
        fontWeight: "fontWeight:slider:500:Font Weight:100:900:100",
        fontFamily: {
          name: "fontFamily",
          type: "font",
          default: "inherit",
          label: "Font Family",
          category: "Typography",
        },

        // === STYLING CATEGORY ===
        backgroundColor: {
          name: "backgroundColor",
          type: "color",
          default: "#2c2c2c",
          label: "Background Color",
          category: "Styling",
          binding: true,
        },

        // Border builder (triggers BorderEditorDialog)
        _borderBuilder: {
          name: "_borderBuilder",
          type: "builder",
          builderType: "border",
          label: "Border Builder",
          category: "Styling",
        },

        // Atomic border properties (output from builder)
        borderWidth: "borderWidth:number:0:Border Width",
        borderStyle:
          "borderStyle:select:solid:Border Style:solid,dashed,dotted,double",
        borderColor: "borderColor:color:#333:Border Color",
        borderRadius: {
          name: "borderRadius",
          type: "text",
          default: "0",
          label: "Border Radius",
          category: "Styling",
          binding: true,
          placeholder: "e.g. 10 or 10,0,10,0",
          description: "Single value or comma-separated for TL,TR,BR,BL",
        },

        // Shadow builder (triggers ShadowEditorDialog)
        _shadowBuilder: {
          name: "_shadowBuilder",
          type: "builder",
          builderType: "shadow",
          label: "Shadow Builder",
          category: "Styling",
        },

        // Atomic shadow properties (output from builder)
        shadowX: "shadowX:number:0:Shadow X",
        shadowY: "shadowY:number:0:Shadow Y",
        shadowBlur: "shadowBlur:number:0:Shadow Blur",
        shadowSpread: "shadowSpread:number:0:Shadow Spread",
        shadowColor: "shadowColor:color:rgba(0,0,0,0):Shadow Color",
        shadowInset: "shadowInset:checkbox:false:Inset Shadow",

        // === VISIBILITY CATEGORY ===
        visibilityCondition: {
          name: "visibilityCondition",
          type: "text",
          default: "",
          label: "Visibility Condition",
          category: "Visibility",
          binding: true,
          placeholder: "Leave blank to always show",
          description: "Widget shows when expression evaluates to true",
        },
      },
    };
  }
}
```

### String Syntax Format

**Simple fields:**

```
'name:type:default:label'
'name:type:default:label:category'
```

**Slider fields:**

```
'name:slider:default:label:min:max:step'
'name:slider:default:label:min:max:step:category'
```

**Select fields:**

```
'name:select:default:label:option1,option2,option3'
'name:select:default:label:option1,option2,option3:category'
```

**Examples:**

```javascript
"x:number:0:X Position"; // Basic number
"fontSize:slider:14:Font Size (px):8:64:1"; // Slider with range
"borderStyle:select:solid:Border Style:solid,dashed,dotted,double"; // Dropdown
"text:text:Click Me:Button Text:Custom"; // With category
```

---

## 🔧 Implementation Plan

### Step 1: Create field-renderer.js

**Location:** `www/canvas-ui/inspector/field-renderer.js`

**Responsibilities:**

1. Parse string syntax → field object
2. Parse object syntax (passthrough)
3. Create field UI elements (input, buttons, labels)
4. Handle all field types (text, number, color, entity, icon, font, slider, select, checkbox, builder)
5. Invoke dialogs generically (EntityPickerDialog, BindingEditorDialog, etc.)

**Key Methods:**

```javascript
export class FieldRenderer {
  constructor(inspector) {
    this.inspector = inspector;
  }

  /**
   * Parse field definition (string or object)
   * @param {string|Object} fieldDef - Field definition
   * @returns {Object} Normalized field object
   */
  parseField(fieldDef) {
    if (typeof fieldDef === "string") {
      return this.parseStringField(fieldDef);
    }
    return fieldDef; // Already object
  }

  /**
   * Parse string field syntax
   * @param {string} str - Format: 'name:type:default:label:...params'
   * @returns {Object} Field object
   */
  parseStringField(str) {
    const parts = str.split(":");
    const [name, type, defaultValue, label, ...params] = parts;

    const field = { name, type, default: defaultValue, label };

    // Type-specific parsing
    if (type === "slider" && params.length >= 3) {
      field.min = parseFloat(params[0]);
      field.max = parseFloat(params[1]);
      field.step = parseFloat(params[2]);
      field.category = params[3] || "Custom";
    } else if (type === "select" && params.length >= 1) {
      field.options = params[0].split(",");
      field.category = params[1] || "Custom";
    } else {
      field.category = params[0] || "Custom";
    }

    return field;
  }

  /**
   * Create field UI element
   * @param {Object} field - Normalized field object
   * @param {*} currentValue - Current value
   * @param {Function} onChange - Change callback
   * @returns {HTMLElement} Field container
   */
  createField(field, currentValue, onChange) {
    const container = document.createElement("div");
    container.className = "inspector-field";

    // Label
    const label = document.createElement("label");
    label.textContent = field.label;
    container.appendChild(label);

    // Input (type-specific)
    const input = this.createInputForType(field, currentValue, onChange);
    container.appendChild(input);

    // Buttons (entity picker, binding editor, etc.)
    const buttons = this.createButtons(field, input, onChange);
    buttons.forEach((btn) => container.appendChild(btn));

    return container;
  }

  /**
   * Create type-specific input element
   */
  createInputForType(field, value, onChange) {
    switch (field.type) {
      case "text":
        return this.createTextInput(field, value, onChange);
      case "number":
        return this.createNumberInput(field, value, onChange);
      case "color":
        return this.createColorInput(field, value, onChange);
      case "slider":
        return this.createSlider(field, value, onChange);
      case "select":
        return this.createSelect(field, value, onChange);
      case "checkbox":
        return this.createCheckbox(field, value, onChange);
      case "entity":
        return this.createEntityInput(field, value, onChange);
      case "icon":
        return this.createIconInput(field, value, onChange);
      case "font":
        return this.createFontInput(field, value, onChange);
      case "builder":
        return this.createBuilderButton(field, value, onChange);
      default:
        return this.createTextInput(field, value, onChange);
    }
  }

  /**
   * Create picker/dialog buttons
   */
  createButtons(field, input, onChange) {
    const buttons = [];

    // Entity picker button
    if (field.entity === true || field.type === "entity") {
      const btn = this.createEntityPickerButton(input, onChange);
      buttons.push(btn);
    }

    // Binding editor button
    if (field.binding === true) {
      const btn = this.createBindingButton(input, onChange);
      buttons.push(btn);
    }

    // Icon picker button (for icon type)
    if (field.type === "icon") {
      const btn = this.createIconPickerButton(input, onChange);
      buttons.push(btn);
    }

    // Font picker button (for font type)
    if (field.type === "font") {
      const btn = this.createFontPickerButton(input, onChange);
      buttons.push(btn);
    }

    return buttons;
  }

  // ... implement all dialog invocations ...
}
```

### Step 2: Update Inspector.js

**Refactor `showWidget()` method:**

```javascript
async showWidget(widget) {
  if (!widget) return;

  this.currentWidget = widget;

  // Get widget metadata
  const widgetClass = this.canvasCore.widgetRegistry.get(widget.type);
  if (!widgetClass || !widgetClass.getMetadata) {
    console.error('[Inspector] Widget missing getMetadata():', widget.type);
    return;
  }

  const metadata = widgetClass.getMetadata();

  // Create field renderer
  const fieldRenderer = new FieldRenderer(this);

  // Group fields by category
  const categories = this.groupFieldsByCategory(metadata.fields);

  // Render fields
  this.contentArea.innerHTML = '';

  for (const [categoryName, fields] of Object.entries(categories)) {
    const categorySection = this.createCategorySection(categoryName);

    for (const fieldDef of fields) {
      const field = fieldRenderer.parseField(fieldDef);
      const currentValue = widget.config[field.name];

      const fieldElement = fieldRenderer.createField(
        field,
        currentValue,
        (value) => this.handleFieldChange(field.name, value)
      );

      categorySection.appendChild(fieldElement);
    }

    this.contentArea.appendChild(categorySection);
  }
}

groupFieldsByCategory(fields) {
  const categories = {
    Position: [],
    Custom: [],
    Typography: [],
    Styling: [],
    Visibility: []
  };

  for (const [name, fieldDef] of Object.entries(fields)) {
    const field = typeof fieldDef === 'string'
      ? this.parseStringField(fieldDef)
      : fieldDef;

    const category = field.category || 'Custom';
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(fieldDef);
  }

  return categories;
}
```

### Step 3: Migrate Button Widget

**Refactor `www/canvas-ui/widgets/basic/button-widget.js`:**

Add `static getMetadata()` method with all field definitions (see metadata structure above).

Test that:

- ✅ Inspector renders all fields
- ✅ Entity picker button works
- ✅ Binding editor button works
- ✅ Border builder works
- ✅ Shadow builder works
- ✅ All values persist

### Step 4: Migrate Remaining Widgets

Widgets to update:

- text-widget.js
- image-widget.js
- switch-widget.js
- value-widget.js

### Step 5: Cleanup

**Remove from inspector.js:**

- `createTextInput()` method (replaced by field-renderer)
- `createNumberInput()` method
- `createColorInput()` method
- `createEntityInput()` method
- `createIconInput()` method
- All hardcoded field creation logic

**Delete file:**

- `www/canvas-ui/styles/inspector.css` (no longer needed)

---

## 🔍 Existing Dialogs (Preserve Unchanged)

**All dialogs remain unchanged, just invoked generically:**

1. **EntityPickerDialog** - `/www/canvas-ui/dialogs/entity-picker.js`
2. **BindingEditorDialog** - `/www/canvas-ui/dialogs/binding-editor.js`
3. **IconPickerSimpleDialog** - `/www/canvas-ui/dialogs/icon-picker-simple-dialog.js`
4. **IconPickerDialog** - `/www/canvas-ui/dialogs/icon-picker-dialog.js`
5. **BorderEditorDialog** - `/www/canvas-ui/dialogs/border-editor-dialog.js`
6. **ShadowEditorDialog** - `/www/canvas-ui/dialogs/shadow-editor-dialog.js`
7. **FontPickerDialog** - `/www/canvas-ui/dialogs/font-picker-dialog.js`
8. **VisibilityConditionDialog** - `/www/canvas-ui/dialogs/visibility-condition-dialog.js`

**Integration Pattern:**

```javascript
// Generic invocation (field-renderer.js)
createEntityPickerButton(input, onChange) {
  const btn = document.createElement('button');
  btn.textContent = '...';
  btn.onclick = () => {
    const dialog = new EntityPickerDialog(
      this.inspector.canvasCore.entityManager,
      (entityId) => {
        input.value = entityId;
        onChange(entityId);
      }
    );
    dialog.show();
  };
  return btn;
}
```

---

## 📋 Testing Checklist

**After Each Widget Migration:**

- [ ] Inspector renders all categories
- [ ] All field types display correctly
- [ ] Entity picker button works
- [ ] Binding editor button works
- [ ] Icon picker works (for icon fields)
- [ ] Font picker works (for font fields)
- [ ] Border builder works
- [ ] Shadow builder works
- [ ] Color picker works
- [ ] Slider shows live value
- [ ] Select dropdown has all options
- [ ] Checkbox toggles correctly
- [ ] Values persist on refresh
- [ ] Real-time canvas updates work
- [ ] Undo/redo works with all fields

---

## 📚 Reference Documentation

**For complete VIS architecture analysis:**

- BUILD_FOUNDATION.md § Reference Implementation Analysis (VIS v1 & VIS v2)
- BUILD_FOUNDATION.md § Inspector System Design

**For existing inspector implementation:**

- BUILD_FOUNDATION.md Appendix (Dialog & Popup Design System)

---

**Last Updated:** January 28, 2026  
**Focus:** Widget API Implementation - Metadata-Driven Inspector
