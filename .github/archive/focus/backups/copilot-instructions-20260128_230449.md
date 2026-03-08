# Canvas UI - Home Assistant Dashboard Editor

**Project Type:** Home Assistant Custom Integration (Python backend + Vanilla JS frontend)

A dual-mode drag-and-drop dashboard system inspired by ioBroker VIS, optimized for Home Assistant.

---

## 📘 PRIMARY REFERENCE: BUILD_FOUNDATION.md

**⚠️ CRITICAL: All detailed documentation is in BUILD_FOUNDATION.md**

For ANY implementation work, ALWAYS consult [BUILD_FOUNDATION.md](../BUILD_FOUNDATION.md) first.

**Use BUILD_FOUNDATION.md for**:

- Dialog/popup specifications (color palette, spacing, ESC handlers)
- Inspector integration patterns (entity picker, binding editor, field types)
- Property persistence workflows (blur events, debouncing, undo/redo)
- Widget development (BaseWidget methods, visibility, state rendering)
- Binding syntax (operations, multi-variable, ternary conditionals)
- Deployment workflows (SSH commands, file deployment)
- Code archaeology (finding existing patterns)

---

## 🚀 Quick Reference (Brief Notes Only)

### Key File Locations

```
www/canvas-ui/
├── core/          # Connection, EntityManager, StateManager, WidgetRegistry
├── editor/        # Toolbar, drag/drop, resize (edit mode only)
├── inspector/     # Property editing (edit mode only)
├── dialogs/       # EntityPicker, BindingEditor, VisibilityCondition, IconPicker
├── widgets/basic/ # Text, Button, Image, Switch, Value widgets
└── binding/       # Parser, Evaluator (45+ operations)
```

### Three Operating Modes

1. **Edit Mode** (`?edit=true`) - Full editor with toolbar + inspector
2. **View Mode** (default) - Read-only with toolbar for navigation
3. **Kiosk Mode** (`?kiosk=viewname`) - Full-screen, NO toolbar

### Critical Patterns (See BUILD_FOUNDATION.md for details)

**Inspector Property Handling:**

- Use `blur` events (NOT `input`) to prevent focus loss
- Check multiple property name variations: `prop.name`, `prop.path`, `config.propertyName`, `endsWith(".propertyName")`
- See BUILD_FOUNDATION.md § "Property Name Prefix Convention"

**Widget Development:**

- Extend BaseWidget
- Use state-driven rendering (getDefaultStates, getStateVisual)
- Call `setupVisibilityCondition()` in constructor
- See BUILD_FOUNDATION.md § "Widget System Design"

**Binding Syntax:**

```javascript
{
  entity.attribute;
  operation1;
  operation2;
} // Simple
{
  var1: entity1;
  var2: entity2;
  formula;
} // Multi-variable
{
  sensor.temp;
  value > 20 ? "Hot" : "Cold";
} // Ternary
```

- See BUILD_FOUNDATION.md § "Data Binding System" for 45+ operations

**Dialog Design:**

- Use standard color palette: `#03a9f4` (primary), `#1e1e1e` (dark bg)
- Add ESC key handler, auto-focus first input
- Clean up event listeners in `close()`
- See BUILD_FOUNDATION.md § "Dialog & Popup Design System"

**Widget Inspector Standards:**

- ⚠️ **CRITICAL:** For widget creation/updates, use Agent Skill: `.github/skills/widget-inspector/`
- All widgets MUST have 5 categories: Position, Custom, Typography (if text), Styling, Visibility
- Universal properties: Position controls, background/borders/shadows, visibility condition
- Use existing pickers: Entity (`...`), Binding (`{}`), Font, Icon, Border/Shadow builders, File Manager
- All changes must update canvas in real-time
- Design with automation in mind: maximize binding support
- See skill for complete checklist and templates

### Deployment (HA Production)

```bash
# Deploy frontend
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

## 📖 Documentation Structure

**This File (copilot-instructions.md):**

- Brief overview and quick reference only
- Pointers to BUILD_FOUNDATION.md sections
- Critical patterns (1-2 line reminders)

**BUILD_FOUNDATION.md:**

- Complete implementation documentation
- Full code examples and patterns
- Architecture specifications
- Bug fixes and lessons learned
- All appendices (A-H: Widget API, Binding System, Dialogs, etc.)

**When in doubt:** Check BUILD_FOUNDATION.md first. It has ALL the details.

**Widget inspector guide when updating or creating new widgets.**

1. all widgets need position ans z-index controls.
2. all widgets need background full border and show controls.
3. all widgets need the ability to have a image as its background (select the image via and image button that opens the file selector maybe - an image picker button).
4. all widgets that output text need to have full font control including the font picker.
5. All widgets properties that require a default enetity exntry for functionality need to use the entity input box with both an entity and binding picker button.
6. numeric valies should always have a slider, input box and a binding widget button.
7. all text input properties should have a text box and a binding widget button.
8. all widgets should have a Visibility Condition input box and binding whidget button.
9. all properties need to live under one of the following heading.
   A) Position (all the position stuff).
   B) Content (all of non standard options just for the requirement of that widget) - maybe change this heading to Custom.
   c) Typography (when ever a widget is required to output text as a standard requirement).
   D) Styling (all widget will need this section to support background images and colors, borders and shadows).
   E) Visability (the visibility condition box and binding button).
10. all settings that get changed inside the inspector wether it be directly entered or applied by a picker or builder need to instantly take effect in the view/canvas.
11. remember you have prebuilt pickers, editors or builders to use as needed with an appropriate triffer button
    A) font picker
    B) entity picker
    C) Binding editor
    D) Border builder
    E) Shadow builder
12. the open shadow and open builder buttons need to be placed below the respective group properties data points

When we implement or edit the way a widget function and what we chose to add as editable options and how we implement then, at each step we need to be making sure this is done in such a way that we are always thinking to implement them to function best to support automation in mind.

**Last Updated:** January 27, 2026  
**Documentation Version:** Post-Phase 13
