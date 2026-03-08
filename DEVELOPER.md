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

3. **Deploy to HA server for testing:**

   ```bash
   ./deploy.sh
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
│   └── deploy.sh          - Build + deploy to HA server
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

./dev-setup.sh      # Install dependencies
./build.sh          # Build HACS version
./deploy.sh         # Build + deploy to HA
```

---

## 📤 Deployment Targets

### Local HA Server (192.168.1.103)

```bash
./deploy.sh
```

### GitHub / HACS

```bash
./build.sh          # Build first
git add .
git commit -m "..."
git push
git tag v2.0.1      # For releases
git push origin v2.0.1
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

### 3. Distribution → HA Server

```
www/canvas-ui/          →  [scp]  →  /config/www/canvas-ui/
custom_components/      →  [scp]  →  /config/custom_components/
```

### 4. Distribution → GitHub → HACS

```
www/canvas-ui/          →  [git push]  →  GitHub  →  HACS install
custom_components/      →  [git push]  →  GitHub  →  HACS install
```

---

## 🎯 Common Tasks

### Add a New Widget

1. Create `canvas-ui-react/src/shared/widgets/MyWidget.tsx`
2. Add metadata export with `WidgetMetadata` type
3. Register in `src/shared/registry/widgetRegistry.ts`
4. Add lazy loading in `src/shared/components/WidgetRenderer.tsx`
5. Build and test: `./deploy.sh`

### Update Integration Code

1. Edit files in `custom_components/canvas_ui/`
2. Deploy: `./deploy.sh`
3. Restart Home Assistant

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

```bash
# Check files on HA server
sshpass -p 'AWpoP6Rx@wQ7jK' ssh root@192.168.1.103 "ls -lh /config/www/canvas-ui/*.js"
```

### Clear Browser Cache

```bash
# On HA server
sshpass -p 'AWpoP6Rx@wQ7jK' ssh root@192.168.1.103 "rm /config/www/canvas-ui/assets/*.gz"
```

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
- The deploy.sh script contains server credentials (edit before making repo public)

---

## ✅ Checklist Before Committing

- [ ] Ran `./build.sh` successfully
- [ ] Tested on HA server with `./deploy.sh`
- [ ] No console errors in browser
- [ ] Updated version in `manifest.json` (for releases)
- [ ] Updated `README.md` if user-facing changes
- [ ] No sensitive data in code

---

**Current Workspace:** `/home/spetchal/Code/canvas-ui-hacs/`  
**HA Server:** `192.168.1.103`
