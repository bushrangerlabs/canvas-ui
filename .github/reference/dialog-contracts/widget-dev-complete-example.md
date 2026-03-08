# Widget Development: Complete Example

A fully-featured widget demonstrating all concepts.

## Button Widget (Complete)

Combines metadata, lifecycle, bindings, rendering, and styling.

```javascript
import { BaseWidget } from "../base-widget.js";

/**
 * ButtonWidget - A clickable button with entity integration
 *
 * Features:
 * - Text with binding support
 * - Icon with binding support
 * - Entity state display
 * - Tap action (toggle, call-service, navigate)
 * - Universal styling (background, border, shadow, padding)
 * - Visibility conditions
 */
export class ButtonWidget extends BaseWidget {
  // ============================================================
  // ## CONSTRUCTOR
  // ============================================================

  constructor(canvasCore, config) {
    super(canvasCore, config);

    // Bind event handlers
    this.handleClick = this.handleClick.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);

    // State
    this.isPressed = false;
    this.entityUnsubscribe = null;
    this.currentState = null;
  }

  // ============================================================
  // ## STATIC METADATA
  // ============================================================

  static getMetadata() {
    return {
      // Identity
      name: "Button",
      icon: "mdi-gesture-tap-button",
      category: "basic",
      description: "A clickable button widget with entity integration",
      version: "2.0.0",

      // Sizing
      defaultSize: { w: 200, h: 100 },
      minSize: { w: 50, h: 30 },

      // Behavior
      requiresEntity: false,
      requiresConfig: false,

      // Inspector fields
      customFields: [
        // Text
        {
          name: "text",
          type: "text",
          label: "Button Text",
          default: "Button",
          binding: true, // Allows {entity;.state}
        },

        // Icon
        {
          name: "icon",
          type: "icon",
          label: "Icon",
          default: "",
          binding: true, // Allows {entity;.attributes.icon}
        },

        // Show/hide icon
        {
          name: "showIcon",
          type: "checkbox",
          label: "Show Icon",
          default: false,
        },

        // Icon position
        {
          name: "iconPosition",
          type: "select",
          label: "Icon Position",
          default: "left",
          options: [
            { value: "left", label: "Left" },
            { value: "right", label: "Right" },
            { value: "top", label: "Top" },
            { value: "bottom", label: "Bottom" },
          ],
        },

        // Entity (for state display and actions)
        {
          name: "entity",
          type: "entity",
          label: "Entity",
          default: "",
        },

        // Show entity state
        {
          name: "showState",
          type: "checkbox",
          label: "Show Entity State",
          default: false,
        },

        // Tap action
        {
          name: "tapAction",
          type: "tapAction",
          label: "Tap Action",
          default: {
            action: "none",
            entity: "",
            service: "",
            data: {},
          },
        },

        // Styling
        {
          name: "fontSize",
          type: "number",
          label: "Font Size",
          default: 16,
          min: 8,
          max: 72,
        },

        {
          name: "textColor",
          type: "color",
          label: "Text Color",
          default: "#ffffff",
          binding: true, // Allows {entity;.attributes.rgb_color}
        },

        {
          name: "iconSize",
          type: "number",
          label: "Icon Size",
          default: 24,
          min: 12,
          max: 96,
        },
      ],
    };
  }

  // ============================================================
  // ## LIFECYCLE METHODS
  // ============================================================

  mount(container) {
    this.container = container;

    // Create element
    this.element = document.createElement("div");
    this.element.className = "button-widget";
    this.element.style.width = "100%";
    this.element.style.height = "100%";
    this.element.style.display = "flex";
    this.element.style.alignItems = "center";
    this.element.style.justifyContent = "center";
    this.element.style.cursor = "pointer";
    this.element.style.userSelect = "none";

    // Initial render
    this.render();

    // Setup event listeners
    this.setupEventListeners();

    // Setup entity binding
    this.setupBindings();

    // Apply universal styling (Widget API)
    this.applyUniversalStyling();

    // Setup visibility
    if (this.config.visibilityCondition) {
      this.setupVisibility();
    }

    // Add to container
    container.appendChild(this.element);

    this.mounted = true;
    console.log("[ButtonWidget] Mounted:", this.config.id);
  }

  unmount() {
    if (!this.mounted) return;

    // Cleanup
    this.cleanupBindings();
    this.removeEventListeners();

    // Remove from DOM
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }

    this.element = null;
    this.container = null;
    this.mounted = false;

    console.log("[ButtonWidget] Unmounted:", this.config.id);
  }

  updateConfig(newConfig) {
    Object.assign(this.config, newConfig);

    // Entity change: re-subscribe
    if (newConfig.entity !== undefined) {
      this.cleanupBindings();
      this.setupBindings();
    }

    // Layout change: full render
    if (
      newConfig.showIcon !== undefined ||
      newConfig.iconPosition !== undefined ||
      newConfig.showState !== undefined
    ) {
      this.render();
    }

    // Simple text/icon: granular update
    else if (newConfig.text !== undefined || newConfig.icon !== undefined) {
      this.updateDisplay({
        text: newConfig.text,
        icon: newConfig.icon,
      });
    }

    // Styling: apply universal styling
    if (
      newConfig.backgroundColor !== undefined ||
      newConfig.border !== undefined ||
      newConfig.boxShadow !== undefined
    ) {
      this.applyUniversalStyling();
    }

    // Custom styling: direct update
    if (newConfig.fontSize !== undefined) {
      this.element.style.fontSize = newConfig.fontSize + "px";
    }

    if (newConfig.textColor !== undefined) {
      this.element.style.color = newConfig.textColor;
    }

    console.log("[ButtonWidget] Config updated:", newConfig);
  }

  // ============================================================
  // ## RENDER METHODS
  // ============================================================

  render() {
    if (!this.element) return;

    const { showIcon, iconPosition, showState } = this.config;

    // Build layout based on config
    const iconHtml = showIcon ? this.renderIcon() : "";
    const textHtml = this.renderText();
    const stateHtml = showState ? this.renderState() : "";

    // Layout direction
    let flexDirection = "row";
    if (iconPosition === "top") flexDirection = "column";
    else if (iconPosition === "bottom") flexDirection = "column-reverse";
    else if (iconPosition === "right") flexDirection = "row-reverse";

    this.element.style.flexDirection = flexDirection;

    // Render
    this.element.innerHTML = `
      <div class="button-content" style="
        display: flex;
        flex-direction: ${flexDirection};
        align-items: center;
        justify-content: center;
        gap: 8px;
      ">
        ${iconHtml}
        <div style="display: flex; flex-direction: column; align-items: center;">
          ${textHtml}
          ${stateHtml}
        </div>
      </div>
    `;

    // Cache references
    this.iconEl = this.element.querySelector(".button-icon");
    this.textEl = this.element.querySelector(".button-text");
    this.stateEl = this.element.querySelector(".button-state");
  }

  renderIcon() {
    const icon = this.config.icon || "mdi-help";
    const size = this.config.iconSize || 24;

    return `<i class="button-icon ${icon}" style="font-size: ${size}px;"></i>`;
  }

  renderText() {
    const text = this.config.text || "Button";
    const fontSize = this.config.fontSize || 16;

    return `<span class="button-text" style="font-size: ${fontSize}px;">${text}</span>`;
  }

  renderState() {
    const state = this.currentState?.state || "—";
    const fontSize = (this.config.fontSize || 16) * 0.8;

    return `<span class="button-state" style="font-size: ${fontSize}px; opacity: 0.7;">${state}</span>`;
  }

  updateDisplay(changes) {
    // Text update
    if (changes.text !== undefined && this.textEl) {
      this.textEl.textContent = changes.text;
    }

    // Icon update
    if (changes.icon !== undefined && this.iconEl) {
      // Extract icon class (remove mdi- prefix if present)
      const iconClass = changes.icon;
      this.iconEl.className = `button-icon ${iconClass}`;
    }

    // Text color update (from binding)
    if (changes.textColor !== undefined) {
      this.element.style.color = changes.textColor;
    }

    // State update
    if (changes.state !== undefined && this.stateEl) {
      this.stateEl.textContent = changes.state;
    }
  }

  // ============================================================
  // ## ENTITY BINDINGS
  // ============================================================

  setupBindings() {
    this.cleanupBindings();

    // Use BindingBinder for text/icon bindings
    if (this.canvasCore?.bindingBinder) {
      this.canvasCore.bindingBinder.bindWidget(this.config.id, this.config);
    }

    // Direct entity subscription for state display
    if (
      this.config.entity &&
      this.config.showState &&
      this.canvasCore?.entityManager
    ) {
      this.entityUnsubscribe = this.canvasCore.entityManager.subscribe(
        this.config.entity,
        (state) => this.onEntityUpdate(state),
      );

      // Get initial state
      const initialState = this.canvasCore.entityManager.getState(
        this.config.entity,
      );
      if (initialState) {
        this.onEntityUpdate(initialState);
      }
    }
  }

  cleanupBindings() {
    // Cleanup BindingBinder
    if (this.canvasCore?.bindingBinder) {
      this.canvasCore.bindingBinder.unbindWidget(this.config.id);
    }

    // Cleanup direct subscription
    if (this.entityUnsubscribe) {
      this.entityUnsubscribe();
      this.entityUnsubscribe = null;
    }
  }

  onEntityUpdate(state) {
    this.currentState = state;

    if (this.stateEl && state) {
      this.stateEl.textContent = state.state;
    }
  }

  // ============================================================
  // ## EVENT HANDLERS
  // ============================================================

  setupEventListeners() {
    if (!this.element) return;

    this.element.addEventListener("click", this.handleClick);
    this.element.addEventListener("mousedown", this.handleMouseDown);
    this.element.addEventListener("mouseup", this.handleMouseUp);
    this.element.addEventListener("mouseleave", this.handleMouseUp);
  }

  removeEventListeners() {
    if (!this.element) return;

    this.element.removeEventListener("click", this.handleClick);
    this.element.removeEventListener("mousedown", this.handleMouseDown);
    this.element.removeEventListener("mouseup", this.handleMouseUp);
    this.element.removeEventListener("mouseleave", this.handleMouseUp);
  }

  handleClick(event) {
    event.stopPropagation();

    this.executeTapAction();
  }

  handleMouseDown(event) {
    this.isPressed = true;
    this.element.style.opacity = "0.7";
  }

  handleMouseUp(event) {
    if (this.isPressed) {
      this.isPressed = false;
      this.element.style.opacity = "1";
    }
  }

  executeTapAction() {
    const action = this.config.tapAction;
    if (!action || action.action === "none") return;

    const entityId = action.entity || this.config.entity;

    switch (action.action) {
      case "toggle":
        if (entityId && this.canvasCore?.entityManager) {
          this.canvasCore.entityManager.callService("homeassistant", "toggle", {
            entity_id: entityId,
          });
        }
        break;

      case "call-service":
        if (action.service && this.canvasCore?.entityManager) {
          const [domain, service] = action.service.split(".");
          this.canvasCore.entityManager.callService(domain, service, {
            ...action.data,
            entity_id: entityId,
          });
        }
        break;

      case "navigate":
        if (action.navigation_path) {
          window.location.hash = action.navigation_path;
        }
        break;
    }
  }

  // ============================================================
  // ## UNIVERSAL STYLING (Widget API)
  // ============================================================

  applyUniversalStyling() {
    if (!this.element) return;

    const cfg = this.config;

    // Background
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
    if (cfg.paddingTop) this.element.style.paddingTop = cfg.paddingTop + "px";
    if (cfg.paddingRight)
      this.element.style.paddingRight = cfg.paddingRight + "px";
    if (cfg.paddingBottom)
      this.element.style.paddingBottom = cfg.paddingBottom + "px";
    if (cfg.paddingLeft)
      this.element.style.paddingLeft = cfg.paddingLeft + "px";

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

## Usage

### Registration

```javascript
// In widget-registry.js
import { ButtonWidget } from "./widgets/button-widget.js";

registry.register("button", ButtonWidget);
```

### Storage Format

```json
{
  "id": "widget_123",
  "type": "button",
  "x": 100,
  "y": 50,
  "w": 200,
  "h": 100,
  "z": 1,
  "config": {
    "text": "{sensor.temperature;.state;round}°F",
    "icon": "mdi-thermometer",
    "showIcon": true,
    "iconPosition": "left",
    "entity": "light.kitchen",
    "showState": true,
    "tapAction": {
      "action": "toggle",
      "entity": "light.kitchen"
    },
    "fontSize": 18,
    "textColor": "#ffffff",
    "iconSize": 28,
    "backgroundColor": "#03a9f4",
    "border": "2px solid #0288d1",
    "borderRadius": "8px",
    "boxShadow": "0 4px 6px rgba(0,0,0,0.3)",
    "paddingTop": 10,
    "paddingRight": 20,
    "paddingBottom": 10,
    "paddingLeft": 20
  }
}
```

---

## Navigate

↑ **INDEX**: [widget-dev-INDEX.md](widget-dev-INDEX.md) - Widget development entry point
→ **Class Structure**: [widget-dev-class-structure.md](widget-dev-class-structure.md) - File anatomy explained
→ **Metadata**: [widget-dev-metadata.md](widget-dev-metadata.md) - getMetadata() reference
→ **Lifecycle**: [widget-dev-lifecycle.md](widget-dev-lifecycle.md) - Lifecycle patterns
→ **Bindings**: [widget-dev-entity-bindings.md](widget-dev-entity-bindings.md) - Entity subscription patterns
→ **Rendering**: [widget-dev-rendering.md](widget-dev-rendering.md) - Display strategies
⟲ **Widget API**: [widget-api-INDEX.md](widget-api-INDEX.md) - Inspector integration
⟲ **Canvas**: [canvas-flow-widget-creation.md](canvas-flow-widget-creation.md) - Creation and registration
