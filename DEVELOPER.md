# Canvas UI Development Guide

## 🚀 Quick Start

### First Time Setup

```bash
cd /home/spetchal/Code/canvas-ui-hacs
./dev-setup.sh
```

### Daily Development Workflow

1. **Make your changes:**

   ```bash
   cd canvas-ui-react/src/
   # Edit components, widgets, services, etc.
   ```

2. **Build HACS version:**

   ```bash
   cd /home/spetchal/Code/canvas-ui-hacs
   ./build.sh
   ```

3. **Release beta for testing via HACS:**

   ```bash
   ./release-beta.sh 1.x.x-beta.y "Description"
   # Then: HACS → Canvas UI → enable beta → Update
   ```

4. **Commit to GitHub:**
   ```bash
   git add .
   git commit -m "feat: your changes"
   git push
   ```

---

## 📁 Project Structure

```
canvas-ui-hacs/
│
├── 🔧 Helper Scripts
│   ├── dev-setup.sh       - First-time setup (npm install)
│   ├── build.sh           - Build HACS version
│   ├── deploy.sh          - Build only (no SSH deploy)
│   ├── release-beta.sh    - Build + tag + GitHub pre-release
│   └── release.sh         - Build + tag + GitHub stable release
│
├── 💻 Source Code
│   └── canvas-ui-react/
│       ├── src/           - React components
│       │   ├── edit/      - Edit mode UI
│       │   ├── runtime/   - View/kiosk mode
│       │   ├── shared/    - Widgets, stores, providers
│       │   └── services/  - AI, config management
│       ├── public/        - Static files (local dev)
│       ├── public-hacs/   - Static files (HACS build)
│       └── vite.hacs.config.ts - HACS build config
│
├── 🏠 Home Assistant Integration
│   └── custom_components/canvas_ui/
│       ├── __init__.py    - Integration setup
│       ├── services.py    - Service handlers
│       └── manifest.json  - HA metadata
│
├── 📦 Distribution Files
│   └── www/canvas-ui/     - Built frontend (for HACS)
│
└── 📝 Documentation
    ├── README.md          - User installation guide
    ├── info.md            - HACS description
    └── DEVELOPER.md       - This file
```

---

## 🛠️ Development Commands

### Build Commands

```bash
cd canvas-ui-react

# Development server (with hot reload)
npm run dev

# Build for local testing
npm run build

# Build for HACS/GitHub
npm run build:hacs
```

### Helper Scripts

```bash
# From project root (/home/spetchal/Code/canvas-ui-hacs)

./dev-setup.sh              # Install dependencies
./build.sh                  # Build HACS version
./deploy.sh                 # Build only
./release-beta.sh 1.x.x-beta.y "Notes"  # Beta release (from dev)
./release.sh 1.x.x "Notes"              # Stable release (from main)
```

---

## 📤 Deployment Targets

### Beta testing (pre-release via HACS)

```bash
git checkout dev
./release-beta.sh 1.x.x-beta.y "Testing new feature"
# Users: HACS → Canvas UI → enable beta → Update
```

### Stable release

```bash
git checkout main
git merge dev
./release.sh 1.x.x "Release notes"
```

---

## 🔄 Build Process Explained

### 1. Source → Build

```
canvas-ui-react/src/  →  [vite build]  →  canvas-ui-react/dist-hacs/
```

### 2. Build → Distribution

```
canvas-ui-react/dist-hacs/  →  [copy]  →  www/canvas-ui/
```

### 3. Distribution → GitHub → HACS

```
custom_components/canvas_ui/  →  [zip + gh release]  →  GitHub  →  HACS install
```

---

## 🎯 Common Tasks

### Add a New Widget

1. Create `canvas-ui-react/src/shared/widgets/MyWidget.tsx`
2. Add metadata export with `WidgetMetadata` type
3. Register in `src/shared/registry/widgetRegistry.ts`
4. Add lazy loading in `src/shared/components/WidgetRenderer.tsx`
5. Build and release beta: `./release-beta.sh 1.x.x-beta.y "desc"`, then update via HACS

### Update Integration Code

1. Edit files in `custom_components/canvas_ui/`
2. Release beta: `./release-beta.sh 1.x.x-beta.y "desc"`
3. Update via HACS, then restart Home Assistant

### Update Documentation

1. Edit `README.md` (user guide) or `info.md` (HACS description)
2. Commit changes
3. GitHub will show updated docs automatically

---

## 🐛 Debugging

### Check Build Output

```bash
cd canvas-ui-react
npm run build:hacs 2>&1 | tee build.log
```

### Verify Deployment

After a HACS update + HA restart, open browser DevTools → Network and confirm the new asset hash is loading (e.g. `widget-analogclock-XxXxXx.js`).

### Clear Browser Cache

If assets seem stale after a HACS update:
1. DevTools → Application → Service Workers → Unregister
2. Clear site data
3. Hard refresh (Ctrl+Shift+R)

---

## 📚 Key Files to Know

| File                                                         | Purpose                  |
| ------------------------------------------------------------ | ------------------------ |
| `canvas-ui-react/src/shared/widgets/*.tsx`                   | Widget implementations   |
| `canvas-ui-react/src/shared/registry/widgetRegistry.ts`      | Widget registration      |
| `canvas-ui-react/src/shared/providers/WebSocketProvider.tsx` | HA connection            |
| `canvas-ui-react/vite.hacs.config.ts`                        | HACS build configuration |
| `custom_components/canvas_ui/__init__.py`                    | HA integration setup     |
| `custom_components/canvas_ui/services.py`                    | HA service handlers      |
| `custom_components/canvas_ui/manifest.json`                  | HA metadata              |

---

## 🔐 Security Notes

**DO NOT commit these files to public GitHub:**

- Any files with passwords/credentials
- Personal HA configurations
- `.env` files (gitignored)

---

## ✅ Checklist Before Committing

- [ ] Ran `./build.sh` successfully (or `./release-beta.sh` for testing)
- [ ] Tested via HACS beta update + HA restart
- [ ] No console errors in browser
- [ ] Updated version in `manifest.json` (for releases)
- [ ] Updated `README.md` if user-facing changes
- [ ] No sensitive data in code

---

**Current Workspace:** `/home/spetchal/Code/canvas-ui-hacs/`
