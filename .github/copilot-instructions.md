# Canvas UI Development - React TypeScript

**Architecture:** React + TypeScript + Vite + Material-UI  
**Last Updated:** March 12, 2026

---

## 📂 Key Paths

| Purpose | Path |
|---|---|
| Project root | `/home/spetchal/Code/canvas-ui-hacs/` |
| React source | `canvas-ui-react/src/` |
| Widgets | `canvas-ui-react/src/shared/widgets/` |
| Widget registry | `canvas-ui-react/src/shared/registry/widgetRegistry.ts` |
| Lazy loading | `canvas-ui-react/src/shared/components/WidgetRenderer.tsx` |
| HACS build output | `canvas-ui-react/dist-hacs/` |
| Deployed frontend | `custom_components/canvas_ui/frontend/` |
| HA static file URL | `/canvas-ui-static/` (served by `_register_static_files()` in `__init__.py`) |

---

## 🔧 Build & Deploy

### CRITICAL — Two build configs exist. Always use the HACS one:

| Command | Config | Base URL | Output | Use for |
|---|---|---|---|---|
| `npm run build:hacs` | `vite.hacs.config.ts` | `/canvas-ui-static/` | `dist-hacs/` | **HACS — always use this** |
| `npm run build` | `vite.config.ts` | `/local/canvas-ui/` | `dist/` | ❌ Wrong for HACS — do not use |

Using `npm run build` produces asset paths starting with `/local/canvas-ui/` which don't exist in a HACS deployment — causes a white page (all JS 404s).

### Development server

```bash
cd /home/spetchal/Code/canvas-ui-hacs/canvas-ui-react
npm run dev
# http://localhost:5173
```

### Production build (local only)

```bash
cd /home/spetchal/Code/canvas-ui-hacs
./build.sh
# Runs npm run build:hacs, copies dist-hacs/ → custom_components/canvas_ui/frontend/
# NOTE: frontend/ is gitignored — built assets are NOT committed to git
```

### Branching model

| Branch | Purpose |
|---|---|
| `main` | Stable releases only — what HACS users get |
| `dev` | All active development — commits go here freely |

**Day-to-day workflow:**
- Do all work on `dev`
- Quick iteration: `./deploy.sh` (SCP direct to HA, no git needed)
- Test via HACS: `./release-beta.sh` from `dev` (pre-release, only visible with HACS beta enabled)
- Ship to users: merge `dev → main` locally, then `./release.sh` from `main`

### Stable release (from `main` only)

```bash
git checkout main
git merge dev          # bring in batched work
./release.sh 1.0.1 "Brief release notes here"
# Guards: exits if not on main branch
# What it does:
#   1. Bumps version in BOTH manifest.json files (repo root AND custom_components/canvas_ui/)
#   2. Runs build:hacs
#   3. Zips contents of custom_components/canvas_ui/ with files AT zip root
#   4. Commits version bump, tags v1.0.1, pushes main + tag
#   5. Creates GitHub release, uploads canvas_ui.zip as release asset
#   6. Deletes local zip
# User then: HACS → Canvas UI → Update → Restart HA
```

### Beta release (from `dev` only)

```bash
git checkout dev
./release-beta.sh 1.0.1-beta.1 "Testing new feature"
# Guards: exits if not on dev branch
# Creates a GitHub PRE-RELEASE — only visible to users with HACS beta versions enabled
# To enable on your HA: HACS → Canvas UI → ⋮ → Enable pre-releases
```

**HACS zip_release mode — CRITICAL details:**
- `hacs.json` has `"zip_release": true` and `"content_in_root": true`
- HACS validates by scanning the **git tree** for `manifest.json` at the **repo root** — so `manifest.json` MUST exist at repo root (not just inside `custom_components/canvas_ui/`)
- HACS then downloads the zip and extracts it directly to `/config/custom_components/canvas_ui/`
- Therefore the zip must have files at root: `__init__.py`, `manifest.json`, `frontend/` etc — NO wrapping `canvas_ui/` folder inside the zip
- Both `manifest.json` files (repo root + `custom_components/canvas_ui/`) must be kept in sync — `release.sh` handles this automatically
- Built `frontend/` assets are gitignored and only live inside the zip

**WRONG zip structures (do not use):**
```
# Wrong — canvas_ui/ wrapper inside zip (content_in_root: false)
canvas_ui/__init__.py
canvas_ui/manifest.json

# Wrong — custom_components/ wrapper
custom_components/canvas_ui/__init__.py
```
**Correct zip structure:**
```
__init__.py
manifest.json
frontend/
services.py
...etc
```

### Direct deploy to HA server (optional)

Requires a `.env` file in the project root (never committed to git):

```bash
# .env
HA_HOST=192.168.1.178
HA_USER=root
HA_PASS=yourpassword
```

```bash
./deploy.sh
# Builds with build:hacs, SCPs to HA server
```

---

## 🎨 Current Widgets (28)

| Widget | Description |
|---|---|
| ButtonWidget | Service calls, navigation, URL actions, confirmation dialogs, icons, click feedback |
| TextWidget | Static/entity text, font customization, alignment |
| GaugeWidget | Radial/semicircle/grafana types, custom zones, needle |
| SliderWidget | Horizontal/vertical, auto-service detection, entity binding |
| SwitchWidget | Toggle entities, custom colors |
| ImageWidget | Static/entity images, object-fit modes |
| IconWidget | 17,000+ icons (MDI, React Icons, Emoji), outline modes, fill binding |
| ProgressBarWidget | Linear progress, entity binding, custom colors |
| ProgressCircleWidget | Circular/segmented modes, entity binding |
| InputTextWidget | Text input, entity binding, service calls |
| FlipClockWidget | Animated flip clock, 12/24hr, date display |
| DigitalClockWidget | LED-style clock, DSEG7/Orbitron fonts |
| KnobWidget | 5 skins (dial, arc, tick marks), angle customization |
| IFrameWidget | Embed external content, URL binding |
| BorderWidget | Decorative borders, dashed/solid/dotted |
| ValueWidget | Display entity values, unit conversion |
| RadioButtonWidget | Radio groups, entity binding |
| ColorPickerWidget | RGB/HSV color selection, entity binding |
| WeatherWidget | Current conditions + forecast, 3 display modes |
| CalendarWidget | Calendar display |
| CameraWidget | Camera feed |
| GraphWidget | Entity history graph |
| HtmlWidget | Raw HTML content |
| KeyboardWidget | On-screen keyboard |
| LovelaceCardWidget | Embed any Lovelace card |
| ResolutionWidget | Canvas resolution/viewport |
| ScrollingTextWidget | Scrolling marquee text |
| ExampleModernWidget | Template/example widget |

---

## 🏗️ Widget Architecture

### TypeScript structure

```typescript
import React from 'react';
import type { WidgetProps } from '../types';
import type { WidgetMetadata } from '../types/metadata';
import { useWebSocket } from '../providers/WebSocketProvider';

const MyWidget: React.FC<WidgetProps> = ({ config }) => {
  const { entities } = useWebSocket();

  const entityId = config.config.entity_id || '';
  const customColor = config.config.customColor || '#ffffff';

  const entity = entityId ? entities?.[entityId] : null;
  const state = entity?.state || 'unavailable';

  return (
    <div style={{ width: config.width, height: config.height }}>
      {/* content */}
    </div>
  );
};

export const myWidgetMetadata: WidgetMetadata = {
  name: 'My Widget',
  description: 'Description',
  icon: 'WidgetsOutlined',         // MUI icon name
  category: 'display',             // display | control | data | layout
  defaultSize: { w: 200, h: 100 },
  fields: [
    { name: 'width',     type: 'number', label: 'Width',  default: 200,       category: 'layout' },
    { name: 'height',    type: 'number', label: 'Height', default: 100,       category: 'layout' },
    { name: 'entity_id', type: 'entity', label: 'Entity', default: '',        category: 'behavior' },
    { name: 'color',     type: 'color',  label: 'Color',  default: '#ffffff', category: 'style' },
  ],
};

export default MyWidget;
```

### Field types

| Type | Notes |
|---|---|
| `number` | Supports `min`, `max`, `step` |
| `text` | Single-line text input |
| `textarea` | Multi-line text |
| `color` | Color picker (text input + picker button) |
| `select` | Dropdown — requires `options` array |
| `checkbox` | Boolean toggle |
| `entity` | Entity picker — supports `domains` filter |
| `icon` | Icon picker (library + icon name) |
| `slider` | Slider — requires `min`, `max`, `step` |

### Field categories

- `layout` — width, height, positioning
- `behavior` — entity bindings, actions, services
- `style` — colors, fonts, borders, shadows

### Conditional field visibility

```typescript
{ name: 'arcWidth', type: 'slider', label: 'Arc Width', default: 0.2,
  category: 'style',
  visibleWhen: { field: 'needleOnly', value: false } }
```

---

## 📋 Adding a New Widget

1. **Create** `canvas-ui-react/src/shared/widgets/MyWidget.tsx`
2. **Register** in `widgetRegistry.ts`:
   ```typescript
   import { myWidgetMetadata } from '../widgets/MyWidget';
   // add to WIDGET_REGISTRY:
   mywidget: myWidgetMetadata,
   ```
3. **Add lazy loading** in `WidgetRenderer.tsx`:
   ```typescript
   mywidget: lazy(() => import('../widgets/MyWidget')),
   ```
4. **Build & deploy:** `./build.sh` then commit/push

---

## 🤖 Subagent Strategy (Token Optimization)

Use subagents for all heavy file reading/analysis — saves ~85% of tokens.

| Subagent (cheap) | Main conversation (expensive) |
|---|---|
| Reading widget `.tsx` files | Receiving subagent reports |
| Comparing widgets for patterns | Writing code edits |
| Finding TypeScript issues | Running builds |
| Verifying fixes were applied | Git commits/pushes |

---

## 🔍 Troubleshooting

**White page / blank app**
- Check `app.html` — scripts must reference `/canvas-ui-static/assets/...`
- If they say `/local/canvas-ui/assets/...` the wrong build was used — run `./build.sh`

**Widget not in library**
- Confirm it's in `WIDGET_REGISTRY` and `WidgetRenderer` lazy map
- Verify `icon` is a valid MUI icon name, `category` is one of the four valid values

**Entity data not updating**
- Confirm `useWebSocket()` is called inside the widget component
- Confirm `entity_id` field exists in metadata

**TypeScript build errors**
- Import types with `import type { ... }`
- Use `'../types'` not `'../types/widget'`
- Match `FieldMetadata` interface exactly — no unsupported extra properties

**`useWebSocket` crash in inspector**
- Never call `useWebSocket()` in inspector field components — they render outside `WebSocketProvider`
- Use static utilities like `BindingEvaluator.hasBinding()` instead

**HACS download fails with "No manifest.json file found"**
- `manifest.json` must exist at the **repo root** (git tree) — HACS validates there before downloading the zip
- The repo root `manifest.json` is a copy of `custom_components/canvas_ui/manifest.json` — keep them in sync
- `release.sh` bumps both files automatically — never manually edit only one

**HACS installs but integration "not found" / not in sidebar**
- The zip must have files at root (`__init__.py`, `manifest.json`, `frontend/` etc) — NO `canvas_ui/` folder wrapping
- `hacs.json` must have `"content_in_root": true` with this zip structure
- After any HACS update, HA needs a **full restart** (not config reload) for new files to register
- Check HA logs: `Integration 'canvas_ui' not found` means the files aren't where HA expects them — wrong zip structure
- The integration also requires `custom_components/canvas_ui/translations/en.json` to appear in "Add Integration" search
