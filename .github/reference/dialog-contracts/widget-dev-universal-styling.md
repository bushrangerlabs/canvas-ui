# Widget Development: Universal Styling

Complete guide to implementing universal styling support in widgets using the Widget API.

## Styling Application Flow

```
applyUniversalStyling() called
     ↓
Read config properties:
├── backgroundColor
├── border + borderRadius
├── boxShadow
├── padding (Top/Right/Bottom/Left)
└── backgroundImage + size/position/repeat
     ↓
Apply to this.element.style
     ↓
Universal styling visible on widget
```

## Widget API Coverage

The universal styling system applies these 5 styling properties automatically:

- ✅ `backgroundColor` → [widget-api-styling-background-color.md](widget-api-styling-background-color.md)
- ✅ `border` + `borderRadius` → [widget-api-styling-border.md](widget-api-styling-border.md)
- ✅ `boxShadow` → [widget-api-styling-shadow.md](widget-api-styling-shadow.md)
- ✅ `paddingTop/Right/Bottom/Left` → [widget-api-styling-padding.md](widget-api-styling-padding.md)
- ✅ `backgroundImage` + size/position/repeat → [widget-api-styling-background-image.md](widget-api-styling-background-image.md)

**Key Principle:** Inspector provides these options automatically. Widget just needs to call `applyUniversalStyling()`.

## Complete Implementation

### Standard Pattern

```javascript
applyUniversalStyling() {
  if (!this.element) return;

  const cfg = this.config;

  // === BACKGROUND COLOR ===
  if (cfg.backgroundColor) {
    this.element.style.backgroundColor = cfg.backgroundColor;
  }

  // === BORDER ===
  if (cfg.border) {
    this.element.style.border = cfg.border;
  }
  if (cfg.borderRadius) {
    this.element.style.borderRadius = cfg.borderRadius;
  }

  // === SHADOW ===
  if (cfg.boxShadow) {
    this.element.style.boxShadow = cfg.boxShadow;
  }

  // === PADDING ===
  if (cfg.paddingTop !== undefined) {
    this.element.style.paddingTop = cfg.paddingTop + 'px';
  }
  if (cfg.paddingRight !== undefined) {
    this.element.style.paddingRight = cfg.paddingRight + 'px';
  }
  if (cfg.paddingBottom !== undefined) {
    this.element.style.paddingBottom = cfg.paddingBottom + 'px';
  }
  if (cfg.paddingLeft !== undefined) {
    this.element.style.paddingLeft = cfg.paddingLeft + 'px';
  }

  // === BACKGROUND IMAGE ===
  if (cfg.backgroundImage) {
    this.element.style.backgroundImage = `url(${cfg.backgroundImage})`;
    this.element.style.backgroundSize = cfg.backgroundSize || 'cover';
    this.element.style.backgroundPosition = cfg.backgroundPosition || 'center';
    this.element.style.backgroundRepeat = cfg.backgroundRepeat || 'no-repeat';
  }
}
```

## When to Call applyUniversalStyling()

### 1. In mount() - Initial Styling

```javascript
mount(container) {
  this.element = document.createElement("div");
  this.render();
  this.setupEventListeners();
  this.applyUniversalStyling();  // ✅ Apply initial styling
  container.appendChild(this.element);
  this.mounted = true;
}
```

### 2. In updateConfig() - Handle Inspector Changes

```javascript
updateConfig(newConfig) {
  Object.assign(this.config, newConfig);

  // Check if any styling properties changed
  const stylingProps = [
    'backgroundColor',
    'border',
    'borderRadius',
    'boxShadow',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'backgroundImage',
    'backgroundSize',
    'backgroundPosition',
    'backgroundRepeat'
  ];

  const needsStylingUpdate = stylingProps.some(prop =>
    newConfig[prop] !== undefined
  );

  if (needsStylingUpdate) {
    this.applyUniversalStyling();  // ✅ Reapply styling
  }
}
```

### 3. Simplified updateConfig()

```javascript
updateConfig(newConfig) {
  Object.assign(this.config, newConfig);

  // Just reapply styling on any change (safe but less efficient)
  this.applyUniversalStyling();
}
```

## Property Details

### Background Color

```javascript
// Applied from config.backgroundColor
if (cfg.backgroundColor) {
  this.element.style.backgroundColor = cfg.backgroundColor;
}
```

**Formats:**

- Named: `"red"`, `"blue"`
- Hex: `"#ff0000"`, `"#f00"`
- RGB: `"rgb(255, 0, 0)"`
- RGBA: `"rgba(255, 0, 0, 0.5)"`

### Border

```javascript
// Border style (width, style, color)
if (cfg.border) {
  this.element.style.border = cfg.border;
}

// Border radius (rounded corners)
if (cfg.borderRadius) {
  this.element.style.borderRadius = cfg.borderRadius;
}
```

**Formats:**

- Border: `"2px solid #000"`, `"1px dashed red"`
- Radius: `"5px"`, `"10px"`, `"50%"`

### Box Shadow

```javascript
if (cfg.boxShadow) {
  this.element.style.boxShadow = cfg.boxShadow;
}
```

**Formats:**

- Simple: `"2px 2px 5px rgba(0,0,0,0.3)"`
- Complex: `"0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)"`

**Structure:** `offset-x offset-y blur-radius spread-radius color`

### Padding

```javascript
// Individual padding sides
if (cfg.paddingTop !== undefined) {
  this.element.style.paddingTop = cfg.paddingTop + "px";
}
if (cfg.paddingRight !== undefined) {
  this.element.style.paddingRight = cfg.paddingRight + "px";
}
if (cfg.paddingBottom !== undefined) {
  this.element.style.paddingBottom = cfg.paddingBottom + "px";
}
if (cfg.paddingLeft !== undefined) {
  this.element.style.paddingLeft = cfg.paddingLeft + "px";
}
```

**Values:** Numbers (pixels) - `0`, `10`, `20`, etc.

### Background Image

```javascript
if (cfg.backgroundImage) {
  this.element.style.backgroundImage = `url(${cfg.backgroundImage})`;
  this.element.style.backgroundSize = cfg.backgroundSize || "cover";
  this.element.style.backgroundPosition = cfg.backgroundPosition || "center";
  this.element.style.backgroundRepeat = cfg.backgroundRepeat || "no-repeat";
}
```

**backgroundSize:**

- `cover` - Scale to cover entire element
- `contain` - Scale to fit within element
- `auto` - Original size
- `100% 100%` - Stretch to fill

**backgroundPosition:**

- Keywords: `center`, `top`, `bottom`, `left`, `right`
- Combined: `top left`, `center center`
- Percentages: `50% 50%`

**backgroundRepeat:**

- `no-repeat` - Single image
- `repeat` - Tile in both directions
- `repeat-x` - Tile horizontally
- `repeat-y` - Tile vertically

## Advanced Patterns

### Conditional Styling

```javascript
applyUniversalStyling() {
  if (!this.element) return;

  const cfg = this.config;

  // Only apply background if not using background image
  if (cfg.backgroundColor && !cfg.backgroundImage) {
    this.element.style.backgroundColor = cfg.backgroundColor;
  }

  // Only apply border if enabled
  if (cfg.showBorder && cfg.border) {
    this.element.style.border = cfg.border;
  }

  // Apply rest normally
  if (cfg.borderRadius) {
    this.element.style.borderRadius = cfg.borderRadius;
  }
  // ...
}
```

### Reset Styling

```javascript
resetStyling() {
  if (!this.element) return;

  // Clear all universal styling
  this.element.style.backgroundColor = '';
  this.element.style.border = '';
  this.element.style.borderRadius = '';
  this.element.style.boxShadow = '';
  this.element.style.paddingTop = '';
  this.element.style.paddingRight = '';
  this.element.style.paddingBottom = '';
  this.element.style.paddingLeft = '';
  this.element.style.backgroundImage = '';
  this.element.style.backgroundSize = '';
  this.element.style.backgroundPosition = '';
  this.element.style.backgroundRepeat = '';
}
```

### Nested Element Styling

```javascript
applyUniversalStyling() {
  if (!this.element) return;

  const cfg = this.config;

  // Apply to main element
  if (cfg.backgroundColor) {
    this.element.style.backgroundColor = cfg.backgroundColor;
  }

  // Apply to inner content
  const content = this.element.querySelector('.content');
  if (content && cfg.contentPadding !== undefined) {
    content.style.padding = cfg.contentPadding + 'px';
  }
}
```

### Fallback Values

```javascript
applyUniversalStyling() {
  if (!this.element) return;

  const cfg = this.config;

  // Use fallback if not set
  this.element.style.backgroundColor = cfg.backgroundColor || 'transparent';
  this.element.style.border = cfg.border || 'none';
  this.element.style.borderRadius = cfg.borderRadius || '0';
  this.element.style.boxShadow = cfg.boxShadow || 'none';
}
```

## Complete Widget Example

```javascript
export class StyledWidget extends BaseWidget {
  constructor(canvasCore, config) {
    super(canvasCore, config);
  }

  static getMetadata() {
    return {
      name: "Styled Widget",
      icon: "mdi-palette",
      category: "basic",
      defaultSize: { w: 200, h: 100 },
      customFields: [
        {
          name: "text",
          type: "text",
          label: "Text",
          default: "Styled",
        },
      ],
      // Inspector automatically adds universal styling options
    };
  }

  mount(container) {
    // Create element
    this.element = document.createElement("div");
    this.element.className = "styled-widget";

    // Render content
    this.render();

    // Apply universal styling
    this.applyUniversalStyling();

    // Add to container
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

    // Update content
    if (newConfig.text !== undefined) {
      this.render();
    }

    // Reapply styling
    this.applyUniversalStyling();
  }

  render() {
    if (!this.element) return;
    this.element.innerHTML = `
      <div class="content">
        ${this.config.text || "No text"}
      </div>
    `;
  }

  applyUniversalStyling() {
    if (!this.element) return;

    const cfg = this.config;

    // Background Color
    if (cfg.backgroundColor) {
      this.element.style.backgroundColor = cfg.backgroundColor;
    }

    // Border
    if (cfg.border) {
      this.element.style.border = cfg.border;
    }
    if (cfg.borderRadius) {
      this.element.style.borderRadius = cfg.borderRadius;
    }

    // Shadow
    if (cfg.boxShadow) {
      this.element.style.boxShadow = cfg.boxShadow;
    }

    // Padding
    if (cfg.paddingTop !== undefined) {
      this.element.style.paddingTop = cfg.paddingTop + "px";
    }
    if (cfg.paddingRight !== undefined) {
      this.element.style.paddingRight = cfg.paddingRight + "px";
    }
    if (cfg.paddingBottom !== undefined) {
      this.element.style.paddingBottom = cfg.paddingBottom + "px";
    }
    if (cfg.paddingLeft !== undefined) {
      this.element.style.paddingLeft = cfg.paddingLeft + "px";
    }

    // Background Image
    if (cfg.backgroundImage) {
      this.element.style.backgroundImage = `url(${cfg.backgroundImage})`;
      this.element.style.backgroundSize = cfg.backgroundSize || "cover";
      this.element.style.backgroundPosition =
        cfg.backgroundPosition || "center";
      this.element.style.backgroundRepeat = cfg.backgroundRepeat || "no-repeat";
    }
  }
}
```

## Checklist

### ✅ Required

- [ ] Implement `applyUniversalStyling()` method
- [ ] Call in `mount()` for initial styling
- [ ] Call in `updateConfig()` when styling changes
- [ ] Check `if (!this.element)` before applying
- [ ] Apply to `this.element` (main widget container)

### ✅ Properties to Support

- [ ] `backgroundColor` (color value)
- [ ] `border` (CSS border string)
- [ ] `borderRadius` (px or %)
- [ ] `boxShadow` (CSS shadow string)
- [ ] `paddingTop` (number in px)
- [ ] `paddingRight` (number in px)
- [ ] `paddingBottom` (number in px)
- [ ] `paddingLeft` (number in px)
- [ ] `backgroundImage` (URL)
- [ ] `backgroundSize` (cover/contain/auto)
- [ ] `backgroundPosition` (center/top/bottom/etc)
- [ ] `backgroundRepeat` (no-repeat/repeat/etc)

### ⚠️ Best Practices

- [ ] Use `cfg.property !== undefined` for padding (allows 0)
- [ ] Provide fallback values where appropriate
- [ ] Apply to correct element (usually `this.element`)
- [ ] Don't override widget-specific styles unintentionally
- [ ] Clear styles when values are removed (if needed)

---

## Navigate

↑ **Overview**: [widget-dev-class-structure.md](widget-dev-class-structure.md) - Widget file structure
↑ **INDEX**: [widget-dev-INDEX.md](widget-dev-INDEX.md) - Widget development entry point
→ **Lifecycle**: [widget-dev-lifecycle.md](widget-dev-lifecycle.md) - When to call applyUniversalStyling()
→ **Widget API**: [widget-api-INDEX.md](widget-api-INDEX.md) - Inspector provides these options
⟲ **Background Color**: [widget-api-styling-background-color.md](widget-api-styling-background-color.md)
⟲ **Border**: [widget-api-styling-border.md](widget-api-styling-border.md)
⟲ **Shadow**: [widget-api-styling-shadow.md](widget-api-styling-shadow.md)
⟲ **Padding**: [widget-api-styling-padding.md](widget-api-styling-padding.md)
⟲ **Background Image**: [widget-api-styling-background-image.md](widget-api-styling-background-image.md)
⟲ **Example**: [widget-dev-complete-example.md](widget-dev-complete-example.md) - See styling in action
