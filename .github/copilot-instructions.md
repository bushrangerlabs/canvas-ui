# Canvas UI Development - React TypeScript

**Project Status:** Phase 41 (Weather Widget) - 19 widgets functional  
**Architecture:** React + TypeScript + Vite + Material-UI  
**Last Updated:** February 13, 2026

---

## 📂 File Paths

### **Local Development:**

- **Project Root:** `/home/spetchal/Code/HADD/`
- **React App:** `/home/spetchal/Code/HADD/canvas-ui-react/`
- **Widgets:** `/home/spetchal/Code/HADD/canvas-ui-react/src/shared/widgets/`
- **Registry:** `/home/spetchal/Code/HADD/canvas-ui-react/src/shared/registry/widgetRegistry.ts`
- **Build Output:** `/home/spetchal/Code/HADD/canvas-ui-react/dist/`

### **Home Assistant Server:**

- **Deployed Files:** `/config/www/canvas-ui/`
- **Config Storage:** `/config/www/canvas-ui/canvas-ui-config.json`
- **Custom Component:** `/config/custom_components/canvas_ui/`

### **Build Artifacts:**

- **Assets:** `dist/assets/widget-[name]-[hash].js`
- **Main Bundle:** `dist/assets/app-[hash].js`
- **Icon Libraries:** `dist/assets/icons-[library]-[hash].js`
- **Entry Points:** `dist/index.html`, `dist/app.html`

---

## 🔧 Build & Deploy Commands

### **Development Server:**

```bash
cd /home/spetchal/Code/HADD/canvas-ui-react
npm run dev
# Runs on http://localhost:5173
```

### **Production Build:**

```bash
cd /home/spetchal/Code/HADD/canvas-ui-react
npm run build
# Output: dist/ folder
# Modules: ~12,000 transformed
# Build time: ~10s
```

### **Deploy to HA:**

```bash
# Full deploy (all files)
cd /home/spetchal/Code/HADD/canvas-ui-react
npm run build && sshpass -p 'AWpoP6Rx@wQ7jK' scp -r dist/* root@192.168.1.103:/config/www/canvas-ui/

# Quick deploy (single file - rarely needed)
sshpass -p 'AWpoP6Rx@wQ7jK' scp dist/assets/FILE.js root@192.168.1.103:/config/www/canvas-ui/assets/
```

### **Clear Browser Cache:**

```bash
# Touch index.html to invalidate cache
sshpass -p 'AWpoP6Rx@wQ7jK' ssh root@192.168.1.103 "touch /config/www/canvas-ui/index.html"

# Or delete .gz cache files
sshpass -p 'AWpoP6Rx@wQ7jK' ssh root@192.168.1.103 "rm /config/www/canvas-ui/assets/*.gz"
```

---

## 🎨 Current Widgets (19 Total)

**Status:** All React TypeScript with metadata-driven inspector fields

1. **ButtonWidget** - Service calls, navigation, URL actions, confirmation dialogs, **icons**, **visual click feedback** (scale/highlight/ripple/shadow)
2. **TextWidget** - Static/entity text, font customization, alignment
3. **GaugeWidget** - Radial/semicircle/grafana types, custom zones, needle customization
4. **SliderWidget** - Horizontal/vertical, auto-service detection, live entity binding
5. **SwitchWidget** - Toggle entities, custom colors
6. **ImageWidget** - Static/entity images, object-fit modes
7. **IconWidget** - 17,000+ icons (MDI, React Icons, Emoji), outline modes, fill binding
8. **ProgressBarWidget** - Linear progress, entity binding, custom colors
9. **ProgressCircleWidget** - Circular/segmented modes, entity binding
10. **InputTextWidget** - Text input, entity binding, service calls
11. **FlipClockWidget** - Animated flip clock, 12/24hr, date display
12. **DigitalClockWidget** - LED-style clock, custom fonts (DSEG7, Orbitron)
13. **KnobWidget** - 5 skins (dial, arc, tick marks), angle customization
14. **IFrameWidget** - Embed external content, URL binding
15. **BorderWidget** - Decorative borders, dashed/solid/dotted styles
16. **ValueWidget** - Display entity values, unit conversion
17. **RadioButtonWidget** - Radio groups, entity binding
18. **ColorPickerWidget** - RGB/HSV color selection, entity binding
19. **WeatherWidget** - Current conditions + forecast, 3 display modes, emoji icons

---

## 🤖 Subagent Strategy (Token Optimization)

**CRITICAL: Use subagents for analysis work to minimize token usage**

### **Subagents (FREE tokens) - Use for:**

- Reading entire widget files (\*.tsx)
- Comparing multiple widgets
- Finding missing metadata fields across all widgets
- Detecting pattern mismatches (WidgetProps, WidgetMetadata)
- Cross-referencing widget metadata vs inspector fields
- Searching for TypeScript type issues
- Verifying fixes were applied correctly
- Reading REACT_MIGRATION_PLAN.md for project status
- ANY heavy file reading/analysis

### **Main Conversation (PAID tokens) - Use for:**

- Receiving subagent reports (200-500 tokens)
- Discussing strategy with user
- Writing code fixes (multi_replace_string_in_file)
- Building and deploying
- Updating REACT_MIGRATION_PLAN.md

### **Subagent Task Templates:**

**Widget Inventory (all widgets):**

```
runSubagent: "List all *.tsx files in canvas-ui-react/src/shared/widgets/.
For each widget: count metadata fields, check for entity_id field,
verify WidgetMetadata export, check defaultSize. Return CSV."
```

**Deep Widget Analysis (single widget):**

```
runSubagent: "Read canvas-ui-react/src/shared/widgets/[Widget].tsx completely.
Extract all metadata fields, verify types match FieldMetadata interface,
check for proper TypeScript types, return line numbers of issues."
```

**Pattern Verification:**

```
runSubagent: "Read [Widget].tsx and verify it follows React widget pattern:
- Imports WidgetProps and WidgetMetadata from types
- Component uses React.FC<WidgetProps>
- Accesses config via config.config.field_name
- Uses useWebSocket() for entity data
- Exports metadata as [name]WidgetMetadata
Return PASS/FAIL with details."
```

**Cross-Widget Search:**

```
runSubagent: "Search all *.tsx widgets for [pattern] (e.g., entity_id field,
useWebSocket usage, color field definitions). Return which widgets
match/don't match with line numbers."
```

**Check Build Status:**

```
runSubagent: "Read REACT_MIGRATION_PLAN.md lines 1-200.
Return current phase, completed features, and pending tasks."
```

### **Token Economics:**

- Per-widget WITHOUT subagents: ~8,500 tokens
- Per-widget WITH subagents: ~1,150 tokens
- **Savings: 85%**

---

## 🏗️ React Widget Architecture

### **TypeScript Structure:**

```typescript
// 1. Imports
import React from 'react';
import type { WidgetProps } from '../types';
import type { WidgetMetadata } from '../types/metadata';
import { useWebSocket } from '../providers/WebSocketProvider';

// 2. Component
const MyWidget: React.FC<WidgetProps> = ({ config }) => {
  const { entities } = useWebSocket();

  // Access config fields
  const entityId = config.config.entity_id || '';
  const customColor = config.config.customColor || '#ffffff';

  // Get entity data
  const entity = entityId && entities?.[entityId];
  const state = entity?.state || 'unavailable';

  return (
    <div style={{ width: config.width, height: config.height }}>
      {/* Widget content */}
    </div>
  );
};

// 3. Metadata Export
export const myWidgetMetadata: WidgetMetadata = {
  name: 'My Widget',
  description: 'Description here',
  icon: 'WidgetsOutlined', // MUI icon name
  category: 'display', // display|control|data|layout
  defaultSize: { w: 200, h: 100 },
  fields: [
    { name: 'width', type: 'number', label: 'Width', default: 200, category: 'layout' },
    { name: 'height', type: 'number', label: 'Height', default: 100, category: 'layout' },
    { name: 'entity_id', type: 'entity', label: 'Entity', default: '', category: 'behavior' },
    { name: 'customColor', type: 'color', label: 'Color', default: '#ffffff', category: 'style' },
  ],
};

export default MyWidget;
```

### **Field Types:**

- `number` - Numeric input (supports min, max, step)
- `text` - Text input
- `textarea` - Multi-line text
- `color` - Color picker
- `select` - Dropdown (requires options array)
- `checkbox` - Boolean toggle
- `entity` - Entity picker (domains filter support)
- `icon` - Icon picker (library + icon name)
- `slider` - Slider input (min, max, step)

### **Field Categories:**

- `layout` - Width, height, positioning
- `behavior` - Entity bindings, actions, services
- `style` - Colors, fonts, borders, shadows

### **Conditional Field Visibility:**

```typescript
// In metadata field definition:
{
  name: 'arcWidth',
  type: 'slider',
  label: 'Arc Width',
  default: 0.2,
  category: 'style',
  visibleWhen: { field: 'needleOnly', value: false }, // Show only when needleOnly=false
}
```

---

## 📋 Widget Creation Workflow

### **1. Create Widget File:**

```bash
# Create new widget TypeScript file
touch /home/spetchal/Code/HADD/canvas-ui-react/src/shared/widgets/MyWidget.tsx
```

### **2. Implement Widget:**

- Follow TypeScript structure above
- Import required types
- Define component with WidgetProps
- Export metadata with WidgetMetadata type

### **3. Register Widget:**

**File:** `canvas-ui-react/src/shared/registry/widgetRegistry.ts`

```typescript
// Add import
import { myWidgetMetadata } from "../widgets/MyWidget";

// Add to registry
export const WIDGET_REGISTRY: Record<string, WidgetMetadata> = {
  // ... existing widgets
  mywidget: myWidgetMetadata,
};
```

### **4. Add Lazy Loading:**

**File:** `canvas-ui-react/src/shared/components/WidgetRenderer.tsx`

```typescript
const widgetComponents: Record<
  string,
  React.LazyExoticComponent<React.FC<WidgetProps>>
> = {
  // ... existing widgets
  mywidget: lazy(() => import("../widgets/MyWidget")),
};
```

### **5. Build & Deploy:**

```bash
cd /home/spetchal/Code/HADD/canvas-ui-react
npm run build
sshpass -p 'AWpoP6Rx@wQ7jK' scp -r dist/* root@192.168.1.103:/config/www/canvas-ui/
```

### **6. Test:**

- Hard refresh browser (Ctrl+Shift+F5)
- Check Widget Library for new widget
- Add to canvas and test functionality
- Verify inspector fields appear correctly

### **7. Document:**

Update `REACT_MIGRATION_PLAN.md` with new widget details in current phase

---

## 🔍 Troubleshooting

### **Widget Not Appearing in Library:**

1. Check browser console for errors
2. Verify icon name exists in @mui/icons-material
3. Check category is valid: display|control|data|layout
4. Verify widget is in WIDGET_REGISTRY
5. Verify lazy loading in WidgetRenderer
6. Clear browser cache (Ctrl+Shift+F5)

### **TypeScript Build Errors:**

- Missing type imports: Add `import type { ... }`
- Wrong import paths: Use '../types' not '../types/widget'
- Metadata validation: Match WidgetMetadata interface exactly
- Unsupported field properties: Check FieldMetadata allowed properties

### **Entity Data Not Updating:**

- Verify WebSocket connection in browser DevTools
- Check entity_id field is in metadata
- Verify `const { entities } = useWebSocket();` is called
- Check entity exists in Home Assistant

### **Deployment Cache Issues:**

- Delete .gz files on server
- Touch index.html to invalidate cache
- Hard refresh browser (Ctrl+Shift+F5)
- Check Network tab for correct file hashes

---

## 📊 Project Status Tracking

**Master Document:** `/home/spetchal/Code/HADD/REACT_MIGRATION_PLAN.md`

**Update After:**

- Creating new widgets
- Major feature additions
- Completing project phases
- Bug fixes affecting multiple widgets

**Phase Numbering:**

- Phase 1-30: Infrastructure, core features, initial widgets
- Phase 31-40: Mode switching, persistence, widget polish
- Phase 41+: New widgets and feature expansions

**Always document:**

- Feature description
- File changes
- Build sizes (before/after)
- Breaking changes
- Migration notes
