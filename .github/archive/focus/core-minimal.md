# Canvas UI - Minimal Core Reference

**Project Type:** Home Assistant Custom Integration (Python backend + Vanilla JS frontend)

A dual-mode drag-and-drop dashboard system inspired by ioBroker VIS, optimized for Home Assistant.

---

## 🚀 Deployment

### Frontend (JavaScript/CSS)

```bash
# Single file
sshpass -p 'AWpoP6Rx@wQ7jK' scp www/canvas-ui/FILE.js root@192.168.1.103:/config/www/canvas-ui/

# Entire frontend
sshpass -p 'AWpoP6Rx@wQ7jK' scp -r www/canvas-ui/* root@192.168.1.103:/config/www/canvas-ui/
```

### Backend (Python - Requires Restart)

```bash
# Deploy custom component
sshpass -p 'AWpoP6Rx@wQ7jK' scp -r custom_components/canvas_ui/* root@192.168.1.103:/config/custom_components/canvas_ui/

# Restart Home Assistant
sshpass -p 'AWpoP6Rx@wQ7jK' ssh root@192.168.1.103 "ha core restart"
```

### Testing URLs

- **View Mode**: `http://192.168.1.103:8123/canvas-ui`
- **Edit Mode**: `http://192.168.1.103:8123/canvas-ui?edit=true`
- **Kiosk Mode**: `http://192.168.1.103:8123/canvas-ui?kiosk=main`

---

## 📁 Key File Locations

```
www/canvas-ui/
├── core/          # Connection, EntityManager, StateManager, WidgetRegistry
├── editor/        # Toolbar, drag/drop, resize (edit mode only)
├── inspector/     # Property editing (edit mode only)
├── dialogs/       # EntityPicker, BindingEditor, VisibilityCondition, IconPicker
├── widgets/basic/ # Text, Button, Image, Switch, Value widgets
└── binding/       # Parser, Evaluator (45+ operations)
```

---

## 📚 Complete Documentation

**BUILD_FOUNDATION.md contains ALL details:**

- Widget System Design
- Data Binding System (45+ operations)
- Inspector System Design
- Dialog & Popup Design System
- Property Persistence Workflows
- All Phase 1-15 Implementation Details
- Appendices A-H (Complete API Reference)

---

**Use this file as a base, then add focused content for specific work areas.**

**Last Updated:** January 28, 2026
