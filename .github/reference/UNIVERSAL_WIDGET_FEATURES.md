# Universal Widget Features - Implementation Plan

**Date:** February 8, 2026  
**Status:** Planning Phase  
**Goal:** Implement core widget features that ALL widgets share

---

## 🎯 Requirements Overview

Every Canvas UI widget needs these universal capabilities:

### **1. Position & Layout**

- ✅ X, Y position (already implemented)
- ✅ Width, Height (already implemented)
- 📋 Z-index (layering control)
- 📋 Rotation (transform: rotate)

### **2. Background Styling**

- 📋 Background color (solid fill)
- 📋 Background image (URL, upload, gradient)
- 📋 Background opacity
- 📋 Background position/size/repeat

### **3. Border Styling**

- 📋 Border color
- 📋 Border width (all sides or individual)
- 📋 Border radius (all corners or individual)
- 📋 Border style (solid, dashed, dotted)

### **4. Shadow Effects**

- 📋 Box shadow (external) - offsetX, offsetY, blur, spread, color
- 📋 Inset shadow (internal) - same properties but inset
- 📋 Multiple shadows support

### **5. Visibility Control**

- 📋 Visibility conditions (entity-based show/hide)
- 📋 Visibility expression evaluation
- 📋 Real-time visibility updates

### **6. Entity Binding**

- 📋 Bind widget properties to entity states
- 📋 Binding syntax: `{entity_id.state}`
- 📋 Binding operations: math, formatting, eval
- 📋 Real-time state subscription
- 📋 Value transformation pipeline

---

## 🏗️ Architecture Pattern (inspired by ioBroker vis)

### **Base Widget Structure**

```typescript
interface BaseWidgetConfig {
  // Position (already implemented)
  x: number;
  y: number;
  width: number;
  height: number;

  // New universal properties
  zIndex?: number;
  rotation?: number;

  // Background
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundOpacity?: number;
  backgroundSize?: "cover" | "contain" | "auto";
  backgroundPosition?: string;
  backgroundRepeat?: "no-repeat" | "repeat" | "repeat-x" | "repeat-y";

  // Border
  borderColor?: string;
  borderWidth?:
    | number
    | { top?: number; right?: number; bottom?: number; left?: number };
  borderRadius?:
    | number
    | {
        topLeft?: number;
        topRight?: number;
        bottomRight?: number;
        bottomLeft?: number;
      };
  borderStyle?: "solid" | "dashed" | "dotted" | "double";

  // Shadow
  boxShadow?: ShadowConfig[];

  // Visibility
  visibilityCondition?: string; // Expression: "{light.living_room.state} == 'on'"

  // Widget-specific config
  [key: string]: any;
}

interface ShadowConfig {
  offsetX: number;
  offsetY: number;
  blur: number;
  spread: number;
  color: string;
  inset: boolean;
}
```

### **Widget Metadata (Inspector Fields)**

Using the new Widget API pattern:

```typescript
static getMetadata() {
  return {
    customFields: [
      // Universal Style Tab (shared by ALL widgets)
      {
        tab: 'Style',
        section: 'Position',
        fields: [
          { name: 'zIndex', label: 'Z-Index', type: 'number', default: 0 },
          { name: 'rotation', label: 'Rotation', type: 'number', default: 0, unit: '°' },
        ],
      },
      {
        tab: 'Style',
        section: 'Background',
        fields: [
          { name: 'backgroundColor', label: 'Color', type: 'color' },
          { name: 'backgroundImage', label: 'Image', type: 'image' },
          { name: 'backgroundOpacity', label: 'Opacity', type: 'slider', min: 0, max: 1, step: 0.1 },
        ],
      },
      {
        tab: 'Style',
        section: 'Border',
        fields: [
          { name: 'borderColor', label: 'Color', type: 'color' },
          { name: 'borderWidth', label: 'Width', type: 'number' },
          { name: 'borderRadius', label: 'Radius', type: 'border-radius' }, // Custom control
        ],
      },
      {
        tab: 'Style',
        section: 'Shadow',
        fields: [
          { name: 'boxShadow', label: 'Shadows', type: 'shadow-editor' }, // Custom control
        ],
      },

      // Universal Behavior Tab
      {
        tab: 'Behavior',
        section: 'Visibility',
        fields: [
          {
            name: 'visibilityCondition',
            label: 'Show When',
            type: 'visibility-condition',
            dialog: 'VisibilityConditionDialog'
          },
        ],
      },

      // Widget-specific fields...
    ],
  };
}
```

---

## 📦 Implementation Phases

### **Phase 1: Base Widget Class Enhancements**

**Goal:** Add universal styling support to base widget class

**Files to Create/Modify:**

- `src/widgets/BaseWidget.ts` - Add universal style methods
- `src/widgets/types.ts` - Add universal config interfaces
- `src/widgets/utils/styleBuilder.ts` - CSS generation utilities

**Implementation:**

```typescript
// BaseWidget.ts
export class BaseWidget {
  protected applyUniversalStyles() {
    const style: React.CSSProperties = {
      // Position (existing)
      position: "absolute",
      left: this.config.x,
      top: this.config.y,
      width: this.config.width,
      height: this.config.height,

      // Z-index & Rotation (new)
      zIndex: this.config.zIndex || 0,
      transform: this.config.rotation
        ? `rotate(${this.config.rotation}deg)`
        : undefined,

      // Background (new)
      backgroundColor: this.config.backgroundColor,
      backgroundImage: this.config.backgroundImage
        ? `url(${this.config.backgroundImage})`
        : undefined,
      backgroundSize: this.config.backgroundSize || "cover",
      backgroundPosition: this.config.backgroundPosition || "center",
      backgroundRepeat: this.config.backgroundRepeat || "no-repeat",
      opacity: this.config.backgroundOpacity ?? 1,

      // Border (new)
      borderColor: this.config.borderColor,
      borderWidth: this.buildBorderWidth(this.config.borderWidth),
      borderRadius: this.buildBorderRadius(this.config.borderRadius),
      borderStyle: this.config.borderStyle || "solid",

      // Shadow (new)
      boxShadow: this.buildBoxShadow(this.config.boxShadow),
    };

    return style;
  }

  protected buildBorderWidth(
    width: number | object | undefined,
  ): string | undefined {
    if (typeof width === "number") return `${width}px`;
    if (typeof width === "object") {
      const { top = 0, right = 0, bottom = 0, left = 0 } = width;
      return `${top}px ${right}px ${bottom}px ${left}px`;
    }
    return undefined;
  }

  protected buildBorderRadius(
    radius: number | object | undefined,
  ): string | undefined {
    if (typeof radius === "number") return `${radius}px`;
    if (typeof radius === "object") {
      const {
        topLeft = 0,
        topRight = 0,
        bottomRight = 0,
        bottomLeft = 0,
      } = radius;
      return `${topLeft}px ${topRight}px ${bottomRight}px ${bottomLeft}px`;
    }
    return undefined;
  }

  protected buildBoxShadow(
    shadows: ShadowConfig[] | undefined,
  ): string | undefined {
    if (!shadows || shadows.length === 0) return undefined;
    return shadows
      .map(
        (s) =>
          `${s.inset ? "inset " : ""}${s.offsetX}px ${s.offsetY}px ${s.blur}px ${s.spread}px ${s.color}`,
      )
      .join(", ");
  }
}
```

### **Phase 2: Entity Binding System**

**Goal:** Implement vis-style entity binding for dynamic widget properties

**Files to Create:**

- `src/services/BindingEvaluator.ts` - Parse and evaluate binding expressions
- `src/services/EntitySubscriptionManager.ts` - Subscribe to entity state changes
- `src/hooks/useEntityBinding.ts` - React hook for bindings
- `src/types/bindings.ts` - Binding type definitions

**Binding Syntax:**

```typescript
// Simple binding
text: "{sensor.temperature.state}"; // → "72.5"

// With formatting
text: "{sensor.temperature.state}°F"; // → "72.5°F"

// With operations
text: "{sensor.temperature.state;*;1.8;+;32}°F"; // C to F conversion

// Multiple entities (eval)
text: "{a:sensor.temp1;b:sensor.temp2;(a+b)/2}°F"; // Average temperature

// Conditional
backgroundColor: "{light.living_room.state} == 'on' ? '#ffff00' : '#000000'";
```

**Architecture:**

```typescript
// BindingEvaluator.ts
export class BindingEvaluator {
  extractBindings(text: string): BindingInfo[] {
    // Parse {entity.state} patterns
    // Return array of entity IDs and operations
  }

  evaluate(expression: string, entityStates: Record<string, any>): any {
    // Replace {entity} with actual values
    // Apply operations (*, /, +, -, date, etc.)
    // Return final value
  }
}

// EntitySubscriptionManager.ts
export class EntitySubscriptionManager {
  subscribe(
    entityIds: string[],
    callback: (entityId: string, state: any) => void,
  ) {
    // Connect to Home Assistant WebSocket
    // Subscribe to entity state changes
    // Call callback when states update
  }

  unsubscribe(entityIds: string[]) {
    // Cleanup subscriptions
  }
}

// useEntityBinding.ts (React Hook)
export function useEntityBinding(bindingExpression: string) {
  const [value, setValue] = useState<any>(null);
  const evaluator = useBindingEvaluator();
  const subscriptionManager = useEntitySubscriptionManager();

  useEffect(() => {
    const bindings = evaluator.extractBindings(bindingExpression);
    const entityIds = bindings.map((b) => b.entityId);

    const updateValue = () => {
      const result = evaluator.evaluate(bindingExpression, getEntityStates());
      setValue(result);
    };

    subscriptionManager.subscribe(entityIds, updateValue);
    updateValue(); // Initial evaluation

    return () => subscriptionManager.unsubscribe(entityIds);
  }, [bindingExpression]);

  return value;
}
```

**Widget Usage:**

```typescript
// In widget render()
const ButtonWidget: React.FC<WidgetProps> = ({ config }) => {
  // Binding for text property
  const text = useEntityBinding(config.text);

  // Binding for background color
  const bgColor = useEntityBinding(config.backgroundColor);

  return (
    <button style={{ backgroundColor: bgColor }}>
      {text}
    </button>
  );
};
```

### **Phase 3: Visibility System**

**Goal:** Implement conditional widget visibility based on entity states

**Files to Create:**

- `src/hooks/useVisibility.ts` - Visibility evaluation hook
- `src/dialogs/VisibilityConditionDialog.tsx` - Visual condition builder

**Implementation:**

```typescript
// useVisibility.ts
export function useVisibility(visibilityCondition: string | undefined): boolean {
  const [isVisible, setIsVisible] = useState(true);
  const evaluator = useBindingEvaluator();
  const subscriptionManager = useEntitySubscriptionManager();

  useEffect(() => {
    if (!visibilityCondition) {
      setIsVisible(true);
      return;
    }

    const bindings = evaluator.extractBindings(visibilityCondition);
    const entityIds = bindings.map(b => b.entityId);

    const evaluateVisibility = () => {
      const result = evaluator.evaluate(visibilityCondition, getEntityStates());
      setIsVisible(result === true);
    };

    subscriptionManager.subscribe(entityIds, evaluateVisibility);
    evaluateVisibility(); // Initial check

    return () => subscriptionManager.unsubscribe(entityIds);
  }, [visibilityCondition]);

  return isVisible;
}

// Widget usage
const ButtonWidget: React.FC<WidgetProps> = ({ config }) => {
  const isVisible = useVisibility(config.visibilityCondition);

  if (!isVisible) return null;

  return <button>...</button>;
};
```

### **Phase 4: Inspector Custom Controls**

**Goal:** Build specialized inspector controls for complex styling

**Files to Create:**

- `src/inspector/controls/BorderRadiusControl.tsx` - 4-corner radius editor
- `src/inspector/controls/ShadowEditorControl.tsx` - Shadow list editor
- `src/inspector/controls/ImagePickerControl.tsx` - Background image picker

**Example: BorderRadiusControl**

```typescript
// BorderRadiusControl.tsx
export const BorderRadiusControl: React.FC<ControlProps> = ({ value, onChange }) => {
  const [linked, setLinked] = useState(true);
  const [corners, setCorners] = useState(
    typeof value === 'number'
      ? { topLeft: value, topRight: value, bottomRight: value, bottomLeft: value }
      : value
  );

  const handleChange = (corner: string, newValue: number) => {
    const updated = linked
      ? { topLeft: newValue, topRight: newValue, bottomRight: newValue, bottomLeft: newValue }
      : { ...corners, [corner]: newValue };

    setCorners(updated);
    onChange(linked ? updated.topLeft : updated);
  };

  return (
    <Box>
      <IconButton onClick={() => setLinked(!linked)}>
        {linked ? <LinkIcon /> : <LinkOffIcon />}
      </IconButton>
      {linked ? (
        <TextField
          type="number"
          value={corners.topLeft}
          onChange={(e) => handleChange('topLeft', +e.target.value)}
        />
      ) : (
        <Grid container>
          <TextField label="↖" value={corners.topLeft} onChange={(e) => handleChange('topLeft', +e.target.value)} />
          <TextField label="↗" value={corners.topRight} onChange={(e) => handleChange('topRight', +e.target.value)} />
          <TextField label="↙" value={corners.bottomLeft} onChange={(e) => handleChange('bottomLeft', +e.target.value)} />
          <TextField label="↘" value={corners.bottomRight} onChange={(e) => handleChange('bottomRight', +e.target.value)} />
        </Grid>
      )}
    </Box>
  );
};
```

---

## 🎨 Inspector Tab Structure

All widgets will have these universal tabs:

```
┌─────────────────────────────────────┐
│ Widget Properties                   │
├─────────────────────────────────────┤
│ Tabs: [Widget] [Style] [Behavior]  │
├─────────────────────────────────────┤
│ Widget Tab:                          │
│   - Widget-specific properties       │
│   - (e.g., Button: text, icon)      │
│                                      │
│ Style Tab:                           │
│   ├─ Position                        │
│   │  • X, Y, Width, Height           │
│   │  • Z-Index, Rotation             │
│   ├─ Background                      │
│   │  • Color, Image, Opacity         │
│   ├─ Border                          │
│   │  • Color, Width, Radius, Style   │
│   └─ Shadow                          │
│      • Box Shadow, Inset Shadow      │
│                                      │
│ Behavior Tab:                        │
│   ├─ Visibility                      │
│   │  • Show When (condition)         │
│   └─ Bindings                        │
│      • Entity bindings per property  │
└─────────────────────────────────────┘
```

---

## 📋 Implementation Checklist

### **Phase 1: Universal Styling (Week 1)**

- [ ] Create `BaseWidgetConfig` interface
- [ ] Add z-index support
- [ ] Add rotation support
- [ ] Implement background color/image
- [ ] Implement border styling (color, width, radius)
- [ ] Implement shadow system
- [ ] Add Style tab to inspector
- [ ] Create BorderRadiusControl
- [ ] Create ShadowEditorControl
- [ ] Test on existing widgets

### **Phase 2: Entity Binding (Week 2)**

- [ ] Create BindingEvaluator class
- [ ] Implement binding syntax parser
- [ ] Add operation support (math, formatting)
- [ ] Create EntitySubscriptionManager
- [ ] Connect to HA WebSocket
- [ ] Create `useEntityBinding` hook
- [ ] Add binding UI to inspector fields
- [ ] Test real-time updates
- [ ] Document binding syntax

### **Phase 3: Visibility System (Week 3)**

- [ ] Create `useVisibility` hook
- [ ] Migrate old VisibilityConditionDialog to React
- [ ] Add Behavior tab to inspector
- [ ] Implement visibility evaluation
- [ ] Test conditional visibility
- [ ] Add visibility preview in editor

### **Phase 4: Widget Migration (Week 4)**

- [ ] Update ButtonWidget with universal features
- [ ] Update TextWidget with universal features
- [ ] Update GaugeWidget with universal features
- [ ] Create migration guide
- [ ] Update widget development docs
- [ ] Test bundle size impact

---

## 🔍 Technical Decisions

### **Why React Hooks for Bindings?**

- Automatic subscription management
- Re-render on state changes
- Clean component code
- Easy to test

### **Why CSS-in-JS (emotion)?**

- Dynamic styling based on config
- No className management
- Already using MUI (which uses emotion)
- Better TypeScript support

### **Why Separate Style/Behavior Tabs?**

- Matches user mental model
- Reduces visual clutter
- Easy to find properties
- Consistent with other tools (Figma, etc.)

---

## 📖 References

**Old Canvas UI Implementation:**

- `archive/vis-canvas-deprecated/vis-canvas/vis-canvas.js` - Visibility system
- `www/canvas-ui/binding/evaluator.js` - Binding evaluator
- `www/canvas-ui/dialogs/visibility-condition-dialog.js` - Visibility dialog

**ioBroker vis-2 Implementation:**

- `ioBroker.vis-2/packages/iobroker.vis-2/src-vis/src/Vis/visRxWidget.tsx` - Widget base class
- `ioBroker.vis-2/packages/iobroker.vis-2/src-vis/src/Utils/visUtils.tsx` - Binding extraction
- `ioBroker.vis-2/packages/iobroker.vis-2/src-vis/src/Utils/visFormatUtils.tsx` - Value formatting

**Widget API Documentation:**

- `.github/reference/dialog-contracts/widget-api-INDEX.md` - API overview
- `.github/reference/dialog-contracts/widget-api-visibility-conditions.md` - Visibility patterns
- `.github/reference/dialog-contracts/widget-dev-INDEX.md` - Widget development guide
