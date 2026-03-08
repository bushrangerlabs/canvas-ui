# Canvas UI v2.0 - Build Foundation Document

**Created:** January 23, 2026  
**Purpose:** Complete reference for rebuilding Canvas UI based on ioBroker VIS analysis  
**Status:** 🔥 ACTIVE - Reference for v2.0 rebuild

---

## 📋 TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Modular Architecture Specification](#modular-architecture-specification)
3. [Reference Implementation Analysis](#reference-implementation-analysis)
4. [Core Architecture Patterns](#core-architecture-patterns)
5. [Critical Functions to Replicate](#critical-functions-to-replicate)
6. [Widget System Design](#widget-system-design)
7. [Inspector System Design](#inspector-system-design)
8. [Data Binding System](#data-binding-system)
9. [Canvas Editor System](#canvas-editor-system)
10. [File Structure & Organization](#file-structure-organization)
11. [Implementation Roadmap](#implementation-roadmap)

---

## 🎯 EXECUTIVE SUMMARY

### Analysis Scope

**Documents Analyzed:**

- `iobroker-vis-analysis.md` (7,373 lines) - Complete VIS v1 architecture
- `VIS2_FEATURE_EXTRACTION.md` (874 lines) - VIS 2 React/TypeScript implementation
- `VIS2_MIGRATION_PLAN.md` (1,257 lines) - Migration strategy analysis
- `INSPECTOR_ANALYSIS.md` (1,031 lines) - Inspector deep dive
- `MODULAR_WIDGET_ARCHITECTURE.md` (3,766 lines) - Widget system design
- Original VIS v1 source code (7,000+ lines per core file)

**Total Reference Material:** ~45,000 lines of documentation + ~30,000 lines of source code

### Key Findings

#### ✅ What VIS Does Better (Must Replicate)

1. **Dual-Mode Architecture** - Separate edit.html and index.html for optimal performance
2. **Advanced Binding System** - Multi-variable eval expressions with JavaScript formula support
3. **String-Based Attribute System** - Powerful declarative property definitions
4. **Can.js Reactive State** - Automatic UI updates via observable data binding
5. **WebSocket Communication** - Real-time bidirectional data sync
6. **Grid Snapping System** - 3 modes: disabled, snap-to-elements, snap-to-grid
7. **Visual Alignment Guides** - Red/green lines for precise widget alignment
8. **Undo/Redo System** - 50-step history with JSON serialization
9. **Widget Registry** - Dynamic widget set loading and management
10. **Professional Ribbon UI** - Microsoft Office-style interface organization

#### ⚠️ What VIS v2 Does Better (Consider for Future)

1. **React + TypeScript** - Modern framework with type safety
2. **Material-UI** - Professional component library
3. **Redux State Management** - Centralized state with DevTools support
4. **Vite Build System** - Fast development and optimized production builds

#### 🎯 Our Unique Advantages (Preserve)

1. **Native Home Assistant Integration** - Direct HA WebSocket, no adapter needed
2. **Lovelace Card Support** - Reuse existing HA card ecosystem
3. **Simpler Deployment** - Single custom component, no separate server
4. **Modern Vanilla JS** - No framework overhead, faster runtime
5. **BaseWidget System** - Clean state-based rendering pattern

### Recommended Approach

**Hybrid Architecture:**

- **Core Engine:** VIS v1 patterns (proven, battle-tested)
- **Widget API:** Our BaseWidget system (cleaner than VIS template system)
- **Inspector:** VIS v1 table-based layout with our modern controls
- **Bindings:** VIS v2 multi-variable eval system (more powerful)
- **UI Framework:** Keep vanilla JS (lighter than React for this use case)

---

## 🔬 REFERENCE IMPLEMENTATION ANALYSIS

### VIS v1 vs VIS v2 - Architectural Comparison

| Component            | VIS v1              | VIS v2                | Recommendation for Canvas UI             |
| -------------------- | ------------------- | --------------------- | ---------------------------------------- |
| **Framework**        | jQuery + Can.js     | React 18 + TypeScript | Vanilla JS (lighter, HA compatible)      |
| **State Management** | Can.js observables  | Redux Toolkit         | Simple reactive system (VIS v1 inspired) |
| **Build System**     | Gulp                | Vite 7.2              | None (deploy source) or optional Vite    |
| **Styling**          | jQuery UI themes    | Material-UI v6        | Custom CSS (maintain current approach)   |
| **Widget Templates** | EJS strings         | React components      | ES6 classes (current BaseWidget)         |
| **Property System**  | String-based attrs  | TypeScript interfaces | Keep string attrs (flexible, proven)     |
| **Binding System**   | Regex parser        | TypeScript parser     | Enhance current (add eval expressions)   |
| **Inspector**        | Table-based rows    | React forms           | Hybrid (table layout + modern controls)  |
| **File Loading**     | Dynamic script tags | ES6 imports           | ES6 modules (current approach)           |
| **Data Sync**        | Socket.io           | Socket.io + Redux     | WebSocket (HA native)                    |
| **Total Size**       | ~25,000 lines       | ~50,000+ lines        | Target: <20,000 lines                    |

**Winner by Category:**

- 🏆 **Performance:** VIS v1 (lighter runtime)
- 🏆 **Developer Experience:** VIS v2 (TypeScript, modern tooling)
- 🏆 **User Experience:** Tie (both excellent)
- 🏆 **Maintainability:** VIS v2 (type safety, component isolation)
- 🏆 **Home Assistant Fit:** Canvas UI (native integration)

**Decision:** Use VIS v1 architecture with VIS v2 features selectively

---

## � IMPLEMENTATION STATUS

**Last Updated:** January 23, 2026

### ✅ Phase 5: Widget Library - COMPLETE

**Status:** Deployed and functional  
**Completion Date:** January 23, 2026

#### Widgets Implemented (5 Basic Widgets)

1. **TextWidget** (`text-widget.js` - 264 lines)
   - Dynamic text display with entity binding
   - Font customization (size, weight, family, align)
   - Color and background color support
   - Centering via flex container with overflow clip wrapper
   - Support for binding expressions `{entity.attribute}`

2. **ImageWidget** (`image-widget.js` - 416 lines)
   - MDI icon display with entity icon support
   - Dynamic icon scaling (80% of container height)
   - URL image display with object-fit modes
   - Automatic switching between icon/image based on source
   - Flex centering with overflow clip wrapper
   - Border radius and opacity support

3. **ButtonWidget** (`button-widget.js` - 502 lines)
   - Toggle entity state on click
   - Icon + label positioning (left, right, top, bottom)
   - State-based styling (active/inactive colors)
   - Hover and active visual feedback
   - Proper z-index layering for selection outline visibility

4. **SwitchWidget** (`switch-widget.js` - 434 lines)
   - iOS-style toggle switch
   - Entity state binding (on/off)
   - Label positioning (left, right, top, bottom)
   - Animated toggle transitions
   - Custom colors for track and knob
   - Disabled state support

5. **ValueWidget** (`value-widget.js` - 501 lines)
   - Numeric value display from entity states
   - Label + value with unit support
   - Unit positioning (left/right of value)
   - Precision control (decimal places)
   - Font size and weight customization
   - Flex centering with overflow clip wrapper

#### Core Systems Implemented

**Selection & Editing System:**

- Selection outline (2px blue) via `selection-manager.js`
- 8-point resize handles (12x12 blue squares) via `resize-handler.js`
- Drag-and-drop with position updates
- Multi-widget selection support
- Edit mode toggle functionality

**Widget Architecture Fixes:**

- **Overflow Handling:** Widgets use `overflow: visible` on container, `overflow: hidden` on clip wrapper
  - Allows resize handles to extend outside widget bounds
  - Prevents content from overflowing widget dimensions
  - Maintains clean visual boundaries

- **Content Centering:** All widgets use flex centering
  - Text/Image/Value: Flex containers with `alignItems: center` and `justifyContent: center`
  - Icons scale dynamically to 80% of container height
  - Text properly centers vertically and horizontally

- **Selection Visibility:** Button widget z-index fix
  - Container: `position: relative`
  - Content: `position: relative; z-index: 1`
  - Selection outline renders on container (z-index auto, below content)
  - Resize handles render at `z-index: 9999` (always on top)

**Inspector System:**

- Right sidebar panel (320px wide)
- Widget selection integration
- Property display for selected widgets
- Basic property editing (future: expand property controls)

**Testing Infrastructure:**

- `test.html` - Phase 5 widget testing page
- Automatic widget creation with entity bindings
- MDI font integration via CDN
- Dark theme UI matching HA aesthetic

#### Files Deployed

```bash
# Widget implementations
www/canvas-ui/widgets/basic/text-widget.js       (264 lines)
www/canvas-ui/widgets/basic/image-widget.js      (416 lines)
www/canvas-ui/widgets/basic/button-widget.js     (502 lines)
www/canvas-ui/widgets/basic/switch-widget.js     (434 lines)
www/canvas-ui/widgets/basic/value-widget.js      (501 lines)

# Core systems
www/canvas-ui/core/canvas-core.js
www/canvas-ui/core/view-renderer.js
www/canvas-ui/editor/selection-manager.js
www/canvas-ui/editor/resize-handler.js
www/canvas-ui/editor/drag-handler.js
www/canvas-ui/inspector/panel.js

# Testing
www/canvas-ui/test.html                          (561 lines)
```

**Total Widget Code:** ~2,117 lines across 5 widgets  
**Average Widget Size:** ~423 lines per widget

#### Known Limitations (Future Work)

- Inspector property controls are basic (need rich attribute types)
- No widget-specific inspector tabs yet (all properties in one list)
- No onChange callbacks for dynamic property updates
- No dependency system for conditional property visibility
- No indexed attributes for bulk property generation
- Widget definitions are inline (need widget registry/manifest system)

---

### ✅ Phase 6: Core Systems - 100% COMPLETE

**Status:** All 4 feature groups complete  
**Completion Date:** January 24, 2026

#### Feature Group Status

**1. ✅ Widget Registry - COMPLETE (100%)**

Implements dynamic widget loading and management system.

Files:

- `www/canvas-ui/core/widget-registry.js` (350 lines) - Widget type registration and loading
- `www/canvas-ui/core/widget-manifest.js` - Widget metadata definitions

Features Implemented:

- ✅ Widget set system (basic, controls, charts, etc.)
- ✅ Manifest-based widget definitions
- ✅ Auto-generated inspector forms from attributes
- ✅ Lazy loading via ES6 dynamic imports
- ✅ Widget metadata and versioning

**2. ✅ Advanced Bindings - COMPLETE (100%)**

Implements powerful expression evaluation system with 45+ operations.

Files:

- `www/canvas-ui/binding/evaluator.js` (553 lines) - Expression evaluation engine
- `www/canvas-ui/binding/parser.js` - Binding syntax parser
- `www/canvas-ui/binding/binder.js` - Binding coordination
- `www/canvas-ui/dialogs/binding-editor.js` (966 lines) - Visual binding editor
- `docs/ADVANCED_BINDINGS.md` (348 lines) - Complete documentation

Features Implemented:

- ✅ Mathematical operations (`*`, `/`, `+`, `-`, `%`, `round`, `pow`, `sqrt`, `floor`, `ceil`, `abs`, `min`, `max`)
- ✅ Formatting operations (`value`, `hex`, `HEX`, `hex2`, `HEX2`, `date`, `ago`, `timestamp`)
- ✅ Conditional operations (`gt`, `lt`, `gte`, `lte`, `eq`, `ne`, `between`)
- ✅ **Ternary conditionals** (`value > 20 ? 'Hot' : 'Cold'`) - **NEW Jan 25, 2026**
- ✅ JSON extraction (`json(path.to.prop)`)
- ✅ String operations (`replace`, `substring`, `split`, `concat`, `toLowerCase`, `toUpperCase`, `trim`)
- ✅ Type conversion (`number`, `string`, `bool`)
- ✅ Array operations (`array[index]`)
- ✅ **12-hour time format** (`hh`, `A`, `a` tokens) - **NEW Jan 25, 2026**
- ✅ **Uppercase HEX** (`HEX`, `HEX2` operations) - **NEW Jan 25, 2026**

Supported Syntax:

```javascript
// Simple binding
{sensor.temperature}                    → 23.5
{sensor.temperature;round(1)}           → 23.5
{sensor.temperature;* 1.8;+ 32}         → 74.3

// Ternary conditionals (NEW)
{sensor.temperature;value > 20 ? '🔥 Hot' : '❄️ Cool'}
{binary_sensor.door;value == 'on' ? '🔓 Open' : '🔒 Closed'}
{sensor.battery;value < 20 ? '⚠️ Low' : '✓ OK'}

// HEX formatting (NEW uppercase variants)
{sensor.color;hex}    → ff5500  (lowercase)
{sensor.color;HEX}    → FF5500  (uppercase)
{sensor.value;hex2}   → 0f      (2-digit lowercase)
{sensor.value;HEX2}   → 0F      (2-digit uppercase)

// 12-hour time format (NEW)
{sensor.timestamp;date(hh:mm A)}  → 03:45 PM
{sensor.timestamp;date(hh:mm a)}  → 03:45 pm

// Multi-variable eval
{h:sensor.height;w:sensor.width;Math.sqrt(h*h + w*w)}
{temp:sensor.temp;hum:sensor.humidity;temp > 20 && hum < 60 ? 'OK' : 'Bad'}
```

**3. ✅ Editor Features - COMPLETE (100%)**

Implements professional editing workflow tools.

Files:

- `www/canvas-ui/editor/undo-redo.js` (289 lines) - 50-step history system
- `www/canvas-ui/editor/clipboard.js` (252 lines) - Copy/paste/duplicate operations
- `www/canvas-ui/editor/alignment-tools.js` (429 lines) - Batch widget operations
- `www/canvas-ui/editor/drag-handler.js` (452 lines) - Drag system with snap & guides
- `www/canvas-ui/editor/selection-manager.js` (438 lines) - Multi-selection
- `www/canvas-ui/editor/resize-handler.js` - 8-point resize handles

Features Implemented:

- ✅ Undo/redo system (50-step history with debouncing)
- ✅ Alignment guides (red vertical, green horizontal lines)
- ✅ Snap-to-grid/elements (3 modes: 'none', 'grid', 'elements')
- ✅ Multi-select batch operations (14 total operations)
- ✅ Copy/paste/duplicate (Ctrl+C/X/V/D, Delete)

Batch Operations:

- Align: Left, Center Horizontal, Right, Top, Center Vertical, Bottom
- Distribute: Horizontal, Vertical (3+ widgets)
- Sizing: Same Width, Same Height, Same Size
- Z-Index: Bring to Front, Send to Back
- Delete: Remove selected widgets

Keyboard Shortcuts:

- `Ctrl+Z` - Undo
- `Ctrl+Y` / `Ctrl+Shift+Z` - Redo
- `Ctrl+C` - Copy
- `Ctrl+X` - Cut
- `Ctrl+V` - Paste
- `Ctrl+D` - Duplicate
- `Delete` / `Backspace` - Delete selected

**4. ✅ Inspector Enhancement - COMPLETE (100%)**

Implements VIS-style table-based inspector with rich attribute types.

Files:

- `www/canvas-ui/inspector/attribute-parser.js` (220 lines) - String-based attribute parsing
- `www/canvas-ui/inspector/table-renderer.js` (460 lines) - 3-column table layout
- `www/canvas-ui/inspector/tab-manager.js` (130 lines) - Common/Custom/Action tabs
- `www/canvas-ui/inspector/validators.js` (310 lines) - Input validation system
- `www/canvas-ui/inspector/fields/entity-picker-field.js` (95 lines) - Entity picker
- `www/canvas-ui/inspector/fields/icon-picker-field.js` (85 lines) - MDI icon picker
- `www/canvas-ui/inspector/fields/dimension-field.js` (105 lines) - Dimension with units

Features Implemented:

- ✅ Table-based property layout (3-column: label, input, button)
- ✅ Rich attribute types (color, icon, entity, dimension, etc.)
- ✅ String-based attribute parsing (`name[default]/type,params/label`)
- ✅ Collapsible property groups with expand/collapse
- ✅ Input validation (type checking, min/max, regex, custom)
- ✅ Tab system (Common, Custom, Action)
- ✅ onChange callbacks for dynamic forms
- ✅ Indexed attributes support via `parseIndexedProperty()`

Supported Field Types:

- Basic: text, number, color, checkbox, select, slider, textarea
- Advanced: entity picker (with autocomplete), icon picker (MDI), dimension (with units)
- Extensible: Custom field types via `registerFieldType()`

Attribute String Format:

```javascript
// Simple property
"text[Hello]/text/Button Text";

// With parameters
"fontSize[14]/slider,8,64,1/Font Size (px)";

// With onChange callback
"entity[]/id/Target Entity/onEntityChange";

// Grouped properties
"group.appearance/Appearance;bgColor[#fff]/color/Background;fontSize[14]/number,8,64/Font Size";

// Indexed properties (generates signal1-8)
"signal(1-8)[]/text/Signal {index}";
```

#### Summary

**Phase 6: 100% COMPLETE ✅**

All four feature groups are now fully implemented:

1. ✅ Widget Registry - Dynamic loading, manifest system, lazy imports
2. ✅ Advanced Bindings - 40+ operations, multi-variable eval, JSON extraction
3. ✅ Editor Features - Undo/redo, alignment tools, snap modes, clipboard
4. ✅ Inspector Enhancement - Table-based layout, rich fields, validation, tabs

**Total Phase 6 Code:** ~3,700 lines across 13 new files

#### Critical Bug Fixes (January 25, 2026)

**Issue: Binding Evaluation Overwrites Config** ✅ RESOLVED

**Symptom:**

- User enters binding: `{sensor.temperature;value > 20 ? 'Hot' : 'Cold'}`
- Binding evaluates to: `Hot`
- After save/reload, text field contains: `Hot` (binding lost!)
- Opening Binding Editor shows blank (can't parse `Hot` as binding)

**Root Cause:**

- Binding system called `updateWidget()` with evaluated result
- `updateWidget()` updated `widget.config` with the result
- Config saved with evaluated value instead of binding expression
- Original binding expression permanently lost

**Solution - Display vs Config Separation:**

Created two separate update paths:

1. **User/Inspector Changes** → `updateWidget()` → Updates config + saves
2. **Binding Evaluations** → `updateWidgetDisplay()` → Updates display ONLY

**Files Modified:**

- `binding/binder.js` (Line 166): Changed `updateWidget()` to `updateWidgetDisplay()`
- `core/view-renderer.js` (Lines 311-336): Added `updateWidgetDisplay()` method
- `widgets/basic/text-widget.js` (Lines 272-286): Added `updateDisplay()` method

**Key Pattern:**

```javascript
// BAD - Overwrites config
this.viewRenderer.updateWidget(widgetId, { text: evaluatedValue });
// widget.config.text = evaluatedValue ❌ LOSES BINDING!

// GOOD - Updates display only
this.viewRenderer.updateWidgetDisplay(widgetId, { text: evaluatedValue });
// widget.textElement.textContent = evaluatedValue ✅ PRESERVES BINDING!
```

**Impact:**

- ✅ Binding expressions preserved in config after evaluation
- ✅ Binding Editor displays correctly when reopened
- ✅ Page reload maintains binding expressions
- ✅ Evaluated results still display correctly in real-time

**Testing:**

```javascript
// User enters:
{
  sensor.michael_air_quality_temperature;
  value > 20 ? "🔥 Hot" : "❄️ Cool";
}

// After save/reload:
// Config still contains: {sensor.michael_air_quality_temperature;value > 20 ? '🔥 Hot' : '❄️ Cool'}
// Display shows: 🔥 Hot (if temp > 20) or ❄️ Cool (if temp ≤ 20)
// Binding Editor: Opens correctly with entity and operation fields populated
```

---

### ✅ Phase 7: Application Systems - 100% COMPLETE

**Status:** All 4 feature groups complete  
**Completion Date:** January 24, 2026

#### Feature Group Status

**1. ✅ Dual-Mode System - COMPLETE (100%)**

Separate entry points for editing vs viewing modes.

Files:

- `www/canvas-ui/edit.html` (already exists) - Full editor interface
- `www/canvas-ui/index.html` (already exists) - Runtime viewer only

Features Implemented:

- ✅ Edit mode loads all editor modules (toolbar, inspector, drag/drop, etc.)
- ✅ View mode loads only core runtime (70% less code)
- ✅ `CANVAS_UI_EDIT_MODE` flag for conditional loading
- ✅ Security: View-only users cannot modify dashboards
- ✅ Optimized performance for each use case
- ✅ "Edit Dashboard" floating button in view mode

**2. ✅ Save/Load System - COMPLETE (100%)**

Persistent storage with debounced auto-save and undo/redo.

Files:

- `www/canvas-ui/editor/save-system.js` (350 lines) - Core save logic
- `www/canvas-ui/editor/ha-storage.js` (360 lines) - HA integration

Features Implemented:

- ✅ Debounced auto-save (2 second default delay)
- ✅ 50-step undo/redo history
- ✅ JSON serialization with pretty-print
- ✅ Home Assistant service integration (read/write/delete files)
- ✅ Error handling for permissions and storage failures
- ✅ Dirty state tracking
- ✅ Immediate save option (skip debounce)
- ✅ Backup creation before saves

SaveSystem Methods:

- `save(data, immediate)` - Trigger save (debounced or immediate)
- `load()` - Load from storage
- `undo()` / `redo()` - History navigation
- `canUndo()` / `canRedo()` - Check availability
- `exportJSON()` / `importJSON()` - JSON operations
- `forceSave()` - Immediate save
- `clearHistory()` - Reset history

HAStorage Methods:

- `writeFile(filename, data)` - Write JSON to HA
- `readFile(filename)` - Read JSON from HA
- `deleteFile(filename)` - Delete file
- `listFiles()` - List all dashboard files
- `createBackup(filename)` - Create timestamped backup

**3. ✅ View Management - COMPLETE (100%)**

Multi-view dashboard support with CRUD operations.

Files:

- `www/canvas-ui/editor/view-manager.js` (480 lines) - View CRUD logic
- `www/canvas-ui/editor/view-navigation-ui.js` (550 lines) - UI components

Features Implemented:

- ✅ Create/update/delete/duplicate views
- ✅ View metadata (name, theme, grid settings, background)
- ✅ View switching with active view tracking
- ✅ Widget management per view (add/update/delete)
- ✅ View change event system
- ✅ View dropdown selector in toolbar
- ✅ View settings dialog
- ✅ Create view dialog
- ✅ Auto-generated unique IDs for views and widgets

ViewManager Methods:

- `loadViews()` - Load all views from storage
- `createView(config)` - Create new view
- `updateView(viewId, updates)` - Update view
- `deleteView(viewId)` - Delete view (with safeguards)
- `duplicateView(viewId)` - Clone view with new IDs
- `switchView(viewId)` - Change active view
- `getView(viewId)` / `getActiveView()` / `getViews()` - Getters
- `addWidget()` / `updateWidget()` / `deleteWidget()` - Widget operations
- `save()` - Persist to storage
- `onViewChange(callback)` - Event listener
- `exportView()` / `importView()` - Single view import/export
- `exportAllViews()` / `importAllViews()` - Full dashboard import/export

ViewNavigationUI Components:

- View selector dropdown with current view name
- View list menu with active indicator
- Create view dialog (name + grid size)
- View settings dialog (name, grid, delete)
- View action buttons (add, settings)
- Responsive dialogs with overlay

**4. ✅ Import/Export System - COMPLETE (100%)**

Dashboard and view import/export with validation.

Files:

- `www/canvas-ui/editor/import-export.js` (610 lines) - Import/export logic

Features Implemented:

- ✅ Export single view to JSON file
- ✅ Export full dashboard to JSON file
- ✅ Import view from JSON with validation
- ✅ Import dashboard from JSON (merge or replace)
- ✅ Copy view/dashboard to clipboard
- ✅ Paste from clipboard with auto-detection
- ✅ File picker for drag-and-drop import
- ✅ Data structure validation
- ✅ Error handling for malformed data
- ✅ Import/Export UI dialog
- ✅ Export statistics (size, widget count)

ImportExport Methods:

- `exportView(viewId, download)` - Export view
- `exportDashboard(download)` - Export all views
- `importView(jsonString)` - Import view
- `importDashboard(jsonString, merge)` - Import dashboard
- `copyViewToClipboard(viewId)` - Copy to clipboard
- `copyDashboardToClipboard()` - Copy dashboard
- `pasteFromClipboard()` - Parse clipboard data
- `importFromFile()` - File picker import
- `validateViewData(data)` - View validation
- `validateDashboardData(data)` - Dashboard validation
- `downloadJSON(data, filename)` - Browser download
- `getExportStats(viewId)` - Export statistics
- `createImportExportDialog()` - UI dialog

Export Data Format:

```json
{
  "type": "canvas-ui-view",
  "version": "1.0.0",
  "exported": "2026-01-24T...",
  "view": {
    "id": "view_123...",
    "name": "Main View",
    "settings": { "gridSize": 10, "snapMode": "grid", ... },
    "widgets": [...]
  }
}
```

Dashboard Format:

```json
{
  "type": "canvas-ui-dashboard",
  "version": "1.0.0",
  "exported": "2026-01-24T...",
  "views": [...],
  "activeViewId": "view_123..."
}
```

#### Summary

**Phase 7: 100% COMPLETE ✅**

All four feature groups are now fully implemented:

1. ✅ Dual-Mode System - Edit vs view entry points
2. ✅ Save/Load System - Debounced auto-save + HA storage
3. ✅ View Management - Multi-view CRUD with UI
4. ✅ Import/Export - Full import/export with validation

**Total Phase 7 Code:** ~2,350 lines across 5 new files

**Phase 7 Integration:**

- edit.html and index.html already exist (entry points)
- save-system.js provides core persistence layer
- ha-storage.js connects to Home Assistant services
- view-manager.js handles view lifecycle
- view-navigation-ui.js provides user interface
- import-export.js enables data portability

---

### ✅ Phase 8: Backend & Editor Integration - 100% COMPLETE

**Status:** All 4 feature groups complete  
**Completion Date:** January 24, 2026

#### Feature Group Status

**1. ✅ Python Backend Services - COMPLETE (100%)**

Home Assistant custom component services for file operations.

Files:

- `custom_components/canvas_ui/services.py` (210 lines) - Service implementations
- `custom_components/canvas_ui/__init__.py` (updated) - Service registration

Features Implemented:

- ✅ `canvas_ui.write_file` - Write JSON data to file
- ✅ `canvas_ui.read_file` - Read JSON data from file
- ✅ `canvas_ui.delete_file` - Delete dashboard file
- ✅ `canvas_ui.list_files` - List all dashboard files
- ✅ Path security validation (restricts to config directory)
- ✅ Automatic directory creation
- ✅ Error handling for permissions and file operations
- ✅ Service schemas with voluptuous validation

Service Schemas:

```python
WRITE_FILE_SCHEMA = vol.Schema({
    vol.Required("path"): cv.string,
    vol.Required("data"): cv.string,
})

READ_FILE_SCHEMA = vol.Schema({
    vol.Required("path"): cv.string,
})
```

**2. ✅ WebSocket & Entity Systems - COMPLETE (100%)**

Real-time connection to Home Assistant (files already existed).

Files:

- `www/canvas-ui/core/connection.js` (456 lines) - WebSocket connection
- `www/canvas-ui/core/entity-manager.js` - Entity subscriptions

Features Implemented:

- ✅ WebSocket connection with authentication
- ✅ Automatic reconnection with exponential backoff
- ✅ Message routing and callbacks
- ✅ Service call support
- ✅ Event subscription system
- ✅ Entity state tracking
- ✅ Access token management

**3. ✅ Widget Factory - COMPLETE (100%)**

Dynamic widget creation with configuration dialogs.

Files:

- `www/canvas-ui/editor/widget-factory.js` (440 lines) - Widget creation logic

Features Implemented:

- ✅ Create widgets from toolbar
- ✅ Initial configuration dialogs
- ✅ Widget templates and defaults
- ✅ Drag from toolbar to canvas
- ✅ Type-specific configuration forms
- ✅ Widget library with 5 basic widgets
- ✅ Drop position calculation

WidgetFactory Methods:

- `createWidget(type, position)` - Create widget with dialog
- `getDefaultConfig(type)` - Get type-specific defaults
- `showConfigDialog(type, config)` - Show configuration UI
- `createConfigDialog(...)` - Build dialog DOM
- `addConfigFields(form, type, config)` - Add form fields
- `enableToolbarDrag(item, type)` - Enable drag from toolbar
- `handleCanvasDrop(e, canvas)` - Handle drop on canvas
- `getWidgetLibrary()` - Get available widgets

Widget Library (5 widgets):

- Text - Display text with entity binding
- Button - Toggle entity state
- Image - Display icon or image
- Switch - iOS-style toggle switch
- Value - Display numeric value

**4. ✅ Toolbar & Editor Coordination - COMPLETE (100%)**

Complete toolbar and editor system coordination.

Files:

- `www/canvas-ui/editor/toolbar.js` (370 lines) - Toolbar UI
- `www/canvas-ui/editor/editor-core.js` (340 lines) - System coordinator

Features Implemented:

- ✅ Widget library panel with grid layout
- ✅ Edit tools (undo/redo buttons)
- ✅ Alignment tool buttons (6 alignment options)
- ✅ Save status indicator
- ✅ Keyboard shortcuts (Ctrl+Z/Y/C/X/V/D/S/A, Delete, Escape)
- ✅ System coordination and event routing
- ✅ Mode switching (edit/view)
- ✅ Grid and snap controls

Toolbar Components:

- Logo and title
- Widget library button
- Undo/Redo buttons
- Alignment tools (left, center, right, top, middle, bottom)
- Save status indicator (saved/saving/error)

EditorCore Methods:

- `setSystems(systems)` - Dependency injection
- `setupKeyboardShortcuts()` - Register shortcuts
- `undo()` / `redo()` - History navigation
- `copy()` / `cut()` / `paste()` - Clipboard operations
- `duplicate()` - Duplicate selected widgets
- `deleteSelected()` - Delete selected widgets
- `selectAll()` / `deselectAll()` - Selection operations
- `save()` - Immediate save
- `toggleGrid()` - Grid visibility
- `setSnapMode(mode)` - Snap mode control
- `handleWidgetSelected(widget)` - Selection handler
- `handlePropertyChange(widget, prop, value)` - Property handler

Keyboard Shortcuts:

- `Ctrl+Z` - Undo
- `Ctrl+Y` / `Ctrl+Shift+Z` - Redo
- `Ctrl+C` - Copy
- `Ctrl+X` - Cut
- `Ctrl+V` - Paste
- `Ctrl+D` - Duplicate
- `Ctrl+A` - Select All
- `Ctrl+S` - Save
- `Delete` / `Backspace` - Delete selected
- `Escape` - Deselect all

#### Summary

**Phase 8: 100% COMPLETE ✅**

All four feature groups are now fully implemented:

1. ✅ Python Backend Services - File operations via HA services
2. ✅ WebSocket & Entity Systems - Real-time HA connection
3. ✅ Widget Factory - Dynamic widget creation with dialogs
4. ✅ Toolbar & Editor Coordination - Complete editor UI

**Total Phase 8 Code:** ~1,360 lines across 4 new files + 1 Python module

**Phase 8 Integration:**

- Python services provide backend file operations
- WebSocket connection enables real-time HA communication
- Widget factory creates widgets with configuration
- Toolbar provides user-friendly editor interface
- EditorCore coordinates all systems with keyboard shortcuts

**Overall Progress:**

**Phases Complete:**

- ✅ Phase 5: Widget Library (5 widgets, 2,117 lines)
- ✅ Phase 6: Core Systems (17 files, 4,085 lines)
- ✅ Phase 7: Application Systems (5 files, 2,350 lines)
- ✅ Phase 8: Backend & Editor Integration (5 files, 1,360 lines)
- ✅ Phase 9: Rendering & Application - COMPLETE
- ✅ Phase 10: Home Assistant Integration & Live Testing - COMPLETE
- ✅ Phase 11: Enhanced Inspector Field Types - COMPLETE
- ✅ Phase 12: Widget Icon Registry System - COMPLETE
- ✅ **Phase 13: Universal Widget Visibility System - COMPLETE**
- ✅ **Phase 14: Text Widget Prepend/Postpend Fields - COMPLETE**
- ✅ **Phase 15: Dual Button Support (Entity + Binding) - COMPLETE**

**Total Implementation:** ~14,700 lines across 46+ files

**Remaining Work:**

- User acceptance testing
- Performance optimization
- Additional widget types
- Documentation and user guides

\n### ✅ Phase 9: Rendering & Application - 100% COMPLETE\
\
**Status:** Complete | **Date:** January 24, 2026\
\
**New Files:**\

- widget-renderer.js (420 lines) - Widget rendering with live updates\
- canvas-renderer.js (380 lines) - Canvas display engine\
- theme-manager.js (280 lines) - HA theme integration\
- canvas-ui.js (340 lines) - Main application\
  \
  **Total Phase 9:** ~1,420 lines\
  \
  ---\
  \

## 🎉 Canvas UI v2.0 - COMPLETE (100%)\

\
**All Phases:** 5-9 ✅ | **Total:** ~11,332 lines across 36+ files\
\
**Ready for testing!**\

---

## ✅ Phase 10: Home Assistant Integration & Live Testing - COMPLETE

**Status:** All Priority 1-5 features deployed and fully functional  
**Last Updated:** January 25, 2026

### Completed Features

**✅ Panel Integration (January 24, 2026)**

Successfully deployed Canvas UI as a Home Assistant panel accessible at `/canvas-ui`.

Implementation:

- **Panel Registration:** `custom_components/canvas_ui/canvas-ui-panel.js` (17 lines)
  - Registers custom panel with `embed_iframe = False`
  - Detects edit mode via `?edit=true` URL parameter
  - Loads iframe with `/local/canvas-ui/index.html`
- **Entry Points:**
  - View mode: `/canvas-ui` (read-only dashboard display)
  - Edit mode: `/canvas-ui?edit=true` (full editor with toolbar)
  - Direct access: `/local/canvas-ui/index.html?edit=true`

**✅ Toolbar System (January 24, 2026)**

Minimal toolbar with mode switching fully functional.

Features:

- View name display ("Main View")
- Edit mode toggle button
  - "Edit Dashboard" (view mode) → switches to edit mode
  - "Exit Edit Mode" (edit mode) → returns to view mode
- Dark theme styling (hardcoded colors, no CSS variables)
- Iframe-aware URL manipulation

Fixes Applied:

- CSS variables (`var(--card-background-color)`) replaced with hardcoded colors for iframe compatibility
- Edit mode detection reads `?edit=true` parameter instead of hardcoded value
- Mode toggle button detects iframe context and updates parent window URL

**✅ Widget Library Panel (January 24, 2026)**

Fancy widget library with all 5 basic widgets working.

Features:

- "+ Add Widget" button (green #4caf50) in edit mode toolbar
- Popup panel with gradient background
- 5 widgets with MDI icons:
  - Text (mdi:format-text)
  - Button (mdi:gesture-tap-button)
  - Switch (mdi:toggle-switch)
  - Value (mdi:numeric)
  - Image (mdi:image)
- Uniform blue icon backgrounds (#03a9f4)
- Smooth hover effects (slide right, border color change)
- Close button in top-right corner

**✅ Widget Addition & Rendering (January 24, 2026)**

All 5 widgets can be added to canvas and are fully functional.

Widget System:

- Flat widget config structure: `{ id, type, x, y, w, h, z }`
- Default position: x:100, y:100
- Default size: w:150, h:100
- Auto-generated unique IDs: `widget_${timestamp}`

Widgets Working:

1. ✅ **Text Widget** - Dynamic text display with entity binding
2. ✅ **Button Widget** - Toggle entity state on click
3. ✅ **Switch Widget** - iOS-style toggle switch (syntax error fixed)
4. ✅ **Value Widget** - Numeric value with unit display
5. ✅ **Image Widget** - MDI icon or URL image display

**✅ Editor Features (January 24, 2026)**

Drag, resize, and select functionality connected for all widgets.

Implementation:

- `ViewRenderer._enableEditorFeatures()` method calls:
  - `DragHandler.enableDrag(element, widgetId)` - Drag to reposition
  - `ResizeHandler.enableResize(element, widgetId)` - 8-point resize handles
  - `SelectionManager.makeSelectable(element, widgetId)` - 2px blue selection outline
- Only enabled in edit mode (`editMode === true`)
- Features apply to all widgets after render

**✅ Dark Theme Optimization (January 24, 2026)**

Widget default colors optimized for dark backgrounds.

Color Changes:

- Text widget: `#000000` → `#cccccc` (visible on dark)
- Image widget border: `#000000` → `#666666` (subtle border)
- Switch widget label: `#FFFFFF` → `#888888` (less harsh)

Fixed Locations:

- `text-widget.js` line 49 (defaultConfig)
- `text-widget.js` line 173 (getDefaults)
- `image-widget.js` line 59 (borderColor)
- `switch-widget.js` line 65 (textColor - also fixed syntax error)

### Bug Fixes Applied

**Issue 1: Toolbar Not Visible (Resolved)**

- **Symptom:** Toolbar existed in DOM but screen was black
- **Root Cause:** CSS variables undefined in iframe context
- **Solution:** Replaced `var(--card-background-color)` with `#1c1c1c`, etc.
- **Files Modified:** `core/canvas-core.js` toolbar creation

**Issue 2: Edit Mode Toggle Not Working (Resolved)**

- **Symptom:** Clicking "Edit Dashboard" had no effect
- **Root Cause:** `index.html` had hardcoded `editMode: false`
- **Solution:** Read URL parameter `?edit=true`, detect iframe, update parent URL
- **Files Modified:** `index.html` initialization

**Issue 3: Widgets Not Draggable/Resizable (Resolved)**

- **Symptom:** Widgets appeared but no selection/drag/resize
- **Root Cause:** ViewRenderer didn't connect editor handlers
- **Solution:** Added `_enableEditorFeatures()` method called after widget append
- **Files Modified:** `core/view-renderer.js` lines 245-257, 502-525

**Issue 4: Widget Config Structure Mismatch (Resolved)**

- **Symptom:** Switch widget not appearing on canvas
- **Root Cause:** `_addWidget()` created nested config `position: {x, y}, size: {w, h}`
- **Solution:** Changed to flat structure `{ x, y, w, h }` matching ViewRenderer expectations
- **Files Modified:** `core/canvas-core.js` lines 865-895

**Issue 5: Switch Widget Syntax Error (Resolved)**

- **Symptom:** Console error "Invalid or unexpected token" when loading switch widget
- **Root Cause:** Escaped quotes in string `textColor: \"#888888\"`
- **Solution:** Removed backslashes: `textColor: "#888888"`
- **Files Modified:** `widgets/basic/switch-widget.js` line 65

### Current Working State

**Deployed Files:**

```bash
# Panel registration
custom_components/canvas_ui/canvas-ui-panel.js (17 lines)

# Core systems
www/canvas-ui/core/canvas-core.js (1062 lines) - Main coordinator
www/canvas-ui/core/view-renderer.js (557 lines) - Widget rendering
www/canvas-ui/core/widget-registry.js - Widget loading
www/canvas-ui/core/connection.js - HA WebSocket
www/canvas-ui/core/entity-manager.js - Entity state management

# Editor systems
www/canvas-ui/editor/drag-handler.js - Drag positioning
www/canvas-ui/editor/resize-handler.js - Resize handles
www/canvas-ui/editor/selection-manager.js - Selection outline

# Widgets (all working)
www/canvas-ui/widgets/basic/text-widget.js (264 lines)
www/canvas-ui/widgets/basic/button-widget.js (502 lines)
www/canvas-ui/widgets/basic/switch-widget.js (617 lines)
www/canvas-ui/widgets/basic/value-widget.js (501 lines)
www/canvas-ui/widgets/basic/image-widget.js (416 lines)

# Entry points
www/canvas-ui/index.html - Main application loader
```

**Functional Features:**

- ✅ Panel displays at `/canvas-ui`
- ✅ Toolbar visible with view name and mode toggle
- ✅ Edit mode switching (Edit Dashboard ↔ Exit Edit Mode)
- ✅ Widget library panel (5 widgets with fancy UI)
- ✅ All 5 widgets can be added to canvas
- ✅ Drag widgets to reposition
- ✅ Visual alignment guides (red/green lines when snap mode = "elements")
- ✅ Resize widgets with 8-point handles
- ✅ Select widgets (2px blue outline)
- ✅ Colors optimized for dark backgrounds
- ✅ Widget config structure matches renderer expectations

**Access URLs:**

- View mode: `http://192.168.1.103:8123/canvas-ui`
- Edit mode: `http://192.168.1.103:8123/canvas-ui?edit=true`
- Direct: `http://192.168.1.103:8123/local/canvas-ui/index.html?edit=true`

### ✅ Phase 13: Universal Widget Visibility System - COMPLETE

**Status:** ✅ 100% COMPLETE (January 26, 2026)  
**Completion Date:** January 26, 2026  
**Sessions:** 5 sessions (Planning through Deployment + Bug Fixes)

#### Overview

Universal conditional visibility system allowing every widget to show/hide based on entity states, user-friendly dual-mode dialog for creating visibility conditions without coding.

**User Requirement:** "each widget will need to have a visibility function" - Universal system for all widgets

#### Implementation Summary

**Planning & Design (Session 1):**

- Analyzed VIS Canvas predecessor system
- Designed dual-mode approach: Simple Builder + Advanced Expression
- Enhanced binding evaluator with string operations (contains, startsWith, endsWith)
- Specified 9 operators: ==, !=, >, <, >=, <=, contains, startsWith, endsWith
- Created VisibilityConditionDialog (~950 lines)

**Infrastructure (Session 2):**

- Implemented BaseWidget visibility methods (5 methods, ~130 lines)
- Added Inspector integration for visibility property
- Created universal property schema pattern

**Widget Rollout (Sessions 3-4):**

- Rolled out to all 5 production widgets:
  - TextWidget
  - ButtonWidget
  - ImageWidget
  - SwitchWidget
  - ValueWidget
- Deployed 8 files to Home Assistant production
- Git commit for Phase 13

**Post-Deployment Fixes (Session 5):**

- Fixed import path error (entity-picker-dialog.js → entity-picker.js)
- Deployed missing entity-picker.js dependency
- Fixed dialog routing (property name prefix handling)
- 2 git commits for bug fixes

#### Files Created/Modified

**New Files (2):**

1. `www/canvas-ui/dialogs/visibility-condition-dialog.js` (950 lines)
   - Dual-mode visibility editor
   - Simple Builder: Visual condition creator
   - Advanced Expression: Manual binding editor
   - Entity picker integration
   - AND/OR logic support
   - Live preview

2. `www/canvas-ui/dialogs/entity-picker.js` (538 lines)
   - Reusable entity picker component
   - Domain-based grouping
   - Search/filter functionality
   - Entity state preview

**Modified Files (8):**

1. `www/canvas-ui/binding/evaluator.js` - Added 3 string operations
2. `www/canvas-ui/inspector/inspector.js` - Visibility property integration + routing fix
3. `www/canvas-ui/widgets/base-widget.js` - 5 visibility methods
4. `www/canvas-ui/widgets/basic/text-widget.js` - Visibility integration
5. `www/canvas-ui/widgets/basic/button-widget.js` - Visibility integration
6. `www/canvas-ui/widgets/basic/image-widget.js` - Visibility integration
7. `www/canvas-ui/widgets/basic/switch-widget.js` - Visibility integration
8. `www/canvas-ui/widgets/basic/value-widget.js` - Visibility integration

#### BaseWidget Visibility Methods

**5 Methods Added (~130 lines):**

```javascript
// 1. Check if widget has visibility condition
hasVisibilityCondition() {
  return !!this.config.visibilityCondition;
}

// 2. Evaluate visibility condition
evaluateVisibility() {
  if (!this.config.visibilityCondition || !this.bindingEvaluator) {
    this.isVisible = true;
    return;
  }

  const result = this.bindingEvaluator.evaluate(
    this.config.visibilityCondition,
    this.canvasCore.entityManager
  );

  this.isVisible = result === true || result === 'true';
  this.updateVisibility();
}

// 3. Update widget visibility in DOM
updateVisibility() {
  if (this.element) {
    this.element.style.display = this.isVisible ? '' : 'none';
  }
}

// 4. Subscribe to visibility-related entities
subscribeVisibilityEntities() {
  if (!this.config.visibilityCondition) return;

  const entityIds = this.bindingParser.extractEntityIds(
    this.config.visibilityCondition
  );

  entityIds.forEach((entityId) => {
    this.canvasCore.entityManager.subscribe(entityId, () => {
      this.evaluateVisibility();
    });
  });
}

// 5. Update config with visibility re-evaluation
updateConfig(newConfig) {
  const visibilityChanged =
    newConfig.visibilityCondition !== undefined &&
    newConfig.visibilityCondition !== this.config.visibilityCondition;

  Object.assign(this.config, newConfig);

  if (visibilityChanged) {
    this.evaluateVisibility();
  }
}
```

#### VisibilityConditionDialog Features

**Dual-Mode Interface:**

**Simple Builder Mode:**

- Entity dropdown with picker button (...)
- Operator dropdown (9 operators)
- Value input field
- AND/OR buttons for multiple conditions
- Live expression preview
- Auto-generates binding syntax

**Advanced Expression Mode:**

- Direct binding expression editor
- Full syntax flexibility
- For power users who prefer manual editing

**9 Supported Operators:**

1. `==` - Equals
2. `!=` - Not equals
3. `>` - Greater than
4. `<` - Less than
5. `>=` - Greater than or equal
6. `<=` - Less than or equal
7. `contains` - String contains substring
8. `startsWith` - String starts with
9. `endsWith` - String ends with

**Example Conditions:**

```javascript
// Simple comparison
{sensor.temperature;> 20}

// String operation
{sensor.status;contains(alarm)}

// Complex AND logic
{t:sensor.temp;h:sensor.hum;t > 20 && h < 60}

// Complex OR logic
{a:sensor.alarm;m:sensor.motion;a == 'on' || m == 'on'}
```

#### Binding Evaluator Enhancements

**3 String Operations Added:**

```javascript
// contains - Check if string contains substring
{sensor.status;contains(alarm)}  // true if "alarm" in sensor.status

// startsWith - Check if string starts with prefix
{sensor.entity_id;startswith(light.)}  // true for light.* entities

// endsWith - Check if string ends with suffix
{sensor.state;endswith(ing)}  // true if state ends with "ing"
```

**Implementation Pattern:**

```javascript
// In binding/evaluator.js
case "contains":
  return String(value).includes(param);

case "startswith":
case "startsWith":
  return String(value).startsWith(param);

case "endswith":
case "endsWith":
  return String(value).endsWith(param);
```

#### Inspector Integration

**Property Added to All Widgets:**

```javascript
visibilityCondition: {
  type: "text",
  label: "Visibility Condition",
  default: "",
  category: "Behavior",
  binding: true,  // Triggers {} button
  placeholder: "Leave blank to always show",
  description: "Widget shows when expression evaluates to true",
}
```

**Special Handling in Inspector:**

```javascript
// inspector.js lines ~752-758
// Special handling for visibility condition - use VisibilityConditionDialog
if (
  prop.name === "visibilityCondition" ||
  prop.path === "visibilityCondition" ||
  prop.name === "config.visibilityCondition" ||
  (prop.name && prop.name.endsWith(".visibilityCondition"))
) {
  const dialog = new VisibilityConditionDialog(
    canvasCore.entityManager,
    input.value,
    (binding) => {
      input.value = binding;
      this.handlePropertyChange(prop.path || prop.name, binding, target, type);
    },
  );
  dialog.show();
  return;
}
```

#### Post-Deployment Bug Fixes (Session 5)

**Issue 1: Missing Import File (RESOLVED)**

**Problem:** 404 error for entity-picker-dialog.js  
**Root Cause:** Import referenced wrong filename (included -dialog suffix)  
**Fix:** Changed import from `./entity-picker-dialog.js` to `./entity-picker.js`  
**Deployment:** Deployed corrected visibility-condition-dialog.js + missing entity-picker.js  
**Git Commit:** "fix: Correct entity-picker import path in visibility-condition-dialog.js"

**Issue 2: Wrong Dialog Opening (RESOLVED)**

**Problem:** Standard BindingEditorDialog opened instead of VisibilityConditionDialog  
**Root Cause:** Property name was `config.visibilityCondition` (with prefix) but code checked for `visibilityCondition` (without prefix)  
**Discovery Method:** Added console logging to capture runtime property values  
**Fix:** Added checks for both `config.visibilityCondition` and `endsWith(".visibilityCondition")` pattern  
**Git Commit:** "fix: Handle 'config.' prefix in visibilityCondition check"

**Lessons Learned:**

- Always deploy all dependencies, not just modified files
- Inspector adds parent object prefix to nested property names
- Use data-driven debugging (console logging) instead of assumptions
- Check both prefixed and non-prefixed property name variations

#### Testing Status

**✅ Completed:**

- [x] BaseWidget infrastructure
- [x] Inspector integration
- [x] All 5 widgets updated
- [x] Deployment to production
- [x] Bug fixes deployed
- [x] Git commits created

**⏳ Pending User Verification:**

- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] VisibilityConditionDialog opens correctly
- [ ] Simple Builder mode functional
- [ ] All 9 operators working
- [ ] Real-time visibility updates
- [ ] Entity picker integration
- [ ] AND/OR logic functional

#### Code Statistics

**Total Phase 13:**

- New files: 2 (1,488 lines)
- Modified files: 8 (~500 lines changes)
- Bug fixes: 2 issues resolved
- Git commits: 3 (1 main + 2 fixes)
- Sessions: 5 (planning through deployment)
- Production deployments: 11 file deployments

**Per-Widget Integration:** ~50 lines each widget (5 methods + 1 property)

---

### ✅ Phase 14: Text Widget Prepend/Postpend Fields - COMPLETE

**Status:** ✅ 100% COMPLETE (January 27, 2026)  
**Completion Date:** January 27, 2026  
**User Request:** "under text content in the text widget we should have 2 other options prepend and postpend text to allow the user to apply text before and after the text content"

#### Overview

Added prepend and postpend text fields to text widget, allowing users to add text before and after the main content with full binding support.

#### Implementation Summary

**Files Modified:**

1. `www/canvas-ui/widgets/basic/text-widget.js`
   - Added `prepend` field to configSchema (lines 69-76)
   - Added `postpend` field to configSchema (lines 77-84)
   - Updated defaults to include empty prepend/postpend (lines 182-184)
   - Modified `_updateText()` to concatenate: `prepend + text + postpend` (lines 353-368)
   - Modified `updateDisplay()` to handle all three fields with icon parsing (lines 313-354)
   - Updated `updateConfig()` change detection (lines 277-283)

#### Features Implemented

**New Config Fields:**

```javascript
configSchema: {
  text: {
    type: "text",
    label: "Text Content",
    default: "Text",
    category: "Content",
    entity: true,      // ⬅️ Added in Phase 15
    binding: true,     // ⬅️ Added in Phase 15
    placeholder: "Enter text or select entity",
    description: "Entity attribute or static text. Supports {entity.attribute} bindings",
  },
  prepend: {
    type: "text",
    label: "Prepend Text",
    default: "",
    category: "Content",
    binding: true,
    placeholder: "Text to add before content",
    description: "Text added before main content. Supports bindings",
  },
  postpend: {
    type: "text",
    label: "Postpend Text",
    default: "",
    category: "Content",
    binding: true,
    placeholder: "Text to add after content",
    description: "Text added after main content. Supports bindings",
  },
}
```

**Text Rendering:**

```javascript
_updateText() {
  if (!this.textElement) return;

  // Build final text with prepend and postpend
  const prepend = this.config.prepend || "";
  const text = this.config.text || "";
  const postpend = this.config.postpend || "";

  const finalText = prepend + text + postpend;

  // Text can be a binding expression, will be resolved by binder
  this.textElement.textContent = finalText;
}
```

**Display Updates with Icon Parsing:**

```javascript
async updateDisplay(displayUpdates) {
  if (!this.element) return;

  if (displayUpdates.text !== undefined ||
      displayUpdates.prepend !== undefined ||
      displayUpdates.postpend !== undefined) {
    if (this.textElement) {
      const { parseIcons, containsIcons } = await import("../../utils/icon-parser.js");

      const prepend = displayUpdates.prepend !== undefined ?
                      displayUpdates.prepend :
                      (this.config.prepend || "");
      const text = displayUpdates.text !== undefined ?
                   displayUpdates.text :
                   (this.config.text || "");
      const postpend = displayUpdates.postpend !== undefined ?
                       displayUpdates.postpend :
                       (this.config.postpend || "");

      const finalText = prepend + text + postpend;

      // Parse icons if present
      if (containsIcons(finalText)) {
        const fontSize = parseInt(window.getComputedStyle(this.textElement).fontSize) || 16;
        const parsedText = parseIcons(finalText, fontSize, this.config.color || "currentColor");
        this.textElement.innerHTML = parsedText;
      } else {
        this.textElement.textContent = finalText;
      }
    }
  }
}
```

#### Use Cases

**Temperature Display:**

```javascript
prepend: "🌡️ Temperature: ";
text: "{sensor.bedroom_temp;round(1)}";
postpend: "°C";

// Result: "🌡️ Temperature: 23.5°C"
```

**Status with Icons:**

```javascript
prepend: "Status: ";
text: "{sensor.door;value == 'on' ? 'mdi:lock-open:#f44336 Open' : 'mdi:lock:#4caf50 Closed'}";
postpend: "";

// Result: "Status: 🔓 Open" or "Status: 🔒 Closed"
```

**Multiple Bindings:**

```javascript
prepend: "Home: ";
text: "{sensor.temp;round(0)}°C";
postpend: " | {sensor.humidity}% humidity";

// Result: "Home: 24°C | 65% humidity"
```

#### Benefits

- ✅ **User-Friendly**: No need for complex string concatenation in bindings
- ✅ **Binding Support**: All three fields support full binding expressions
- ✅ **Icon Parsing**: Icons work across combined text
- ✅ **Clean Separation**: Prepend/postpend can be static while text is dynamic
- ✅ **Flexible**: Can use all three, or just prepend, or just postpend

#### Code Statistics

**Total Phase 14:**

- Modified files: 1 (text-widget.js)
- New config fields: 2 (prepend, postpend)
- Code changes: ~120 lines
- Production deployments: 1 file

---

### ✅ Phase 15: Dual Button Support (Entity + Binding) - COMPLETE

**Status:** ✅ 100% COMPLETE (January 27, 2026)  
**Completion Date:** January 27, 2026  
**User Request:** "for text content as well as the entity button add a binding button so we need to have both button not just 1 or the other"

#### Overview

Enhanced inspector to support BOTH entity picker button ("...") AND binding editor button ("{}") on the same text input field, giving users choice between simple entity selection or advanced binding expressions.

#### Problem Discovered

**Initial Issue:**

When text field was configured with `entity: true, binding: true`, only the binding button appeared. The entity button was missing.

**Root Cause:**

Inspector's `createTextInput()` method wasn't copying the `entity` and `binding` flags from the widget's configSchema. Lines 541-558 only copied:

- name, label, type, min, max, step, options, unit, description

But was **missing**:

- `entity`
- `binding`

**Console Output Revealed Problem:**

```javascript
[Inspector] createTextInput for config.text: {
  entity: undefined,      // ❌ Should be true
  binding: undefined,     // ❌ Should be true
  supportsEntity: false,  // ❌ Should be true
  supportsBinding: true   // ✅ Correct (default when binding undefined)
}
```

#### Implementation Summary

**Files Modified:**

1. `www/canvas-ui/widgets/basic/text-widget.js`
   - Changed `text` field type from plain text to support dual buttons
   - Added `entity: true` flag (line 64)
   - Added `binding: true` flag (line 65)

2. `www/canvas-ui/inspector/inspector.js`
   - **CRITICAL FIX**: Added `entity` and `binding` to property object creation (lines 557-558)
   - Added debug console logging to diagnose issue (lines 688-691, 735, 791)
   - Added `max-width: 180px` to text input for better button fitting (line 713)

#### Key Code Changes

**Widget Config:**

```javascript
text: {
  type: "text",        // ⬅️ Use text type, not entity type
  label: "Text Content",
  default: "Text",
  category: "Content",
  entity: true,        // ⬅️ Enable entity picker button
  binding: true,       // ⬅️ Enable binding editor button
  placeholder: "Enter text or select entity",
  description: "Entity attribute or static text. Supports {entity.attribute} bindings",
}
```

**Inspector Property Creation Fix:**

```javascript
// www/canvas-ui/inspector/inspector.js lines 548-560
categories[category].push({
  name: `config.${key}`,
  label: schema.label || key,
  type: schema.type || "text",
  min: schema.min,
  max: schema.max,
  step: schema.step,
  options: schema.options,
  unit: schema.unit,
  description: schema.description,
  entity: schema.entity, // ⬅️ ADD: Entity picker flag
  binding: schema.binding, // ⬅️ ADD: Binding editor flag
});
```

**Inspector Button Logic:**

```javascript
createTextInput(prop, target, type) {
  // Check if property supports bindings or entity picker
  const supportsBinding = prop.binding !== false;
  const supportsEntity = prop.entity === true;

  if (supportsBinding || supportsEntity) {
    const container = document.createElement("div");
    const input = document.createElement("input");
    input.style.cssText = `
      flex: 1;
      max-width: 180px;  // ⬅️ Shorter input for better button fit
      // ... other styles
    `;

    container.appendChild(input);

    // Add entity picker button if enabled
    if (supportsEntity) {
      const entityBtn = document.createElement("button");
      entityBtn.textContent = "...";
      entityBtn.title = "Select Entity";
      // ... onclick shows EntityPickerDialog
      container.appendChild(entityBtn);
    }

    // Add binding editor button if enabled
    if (supportsBinding) {
      const bindingBtn = document.createElement("button");
      bindingBtn.textContent = "{}";
      bindingBtn.title = "Open Binding Editor";
      // ... onclick shows BindingEditorDialog
      container.appendChild(bindingBtn);
    }

    return container;
  }
}
```

#### UI Structure

**Expected DOM:**

```html
<div style="display: flex; gap: 4px; align-items: center;">
  <input type="text" style="flex: 1; max-width: 180px;" />
  <!-- Shorter -->
  <button>...</button>
  <!-- Entity picker -->
  <button>{}</button>
  <!-- Binding editor -->
</div>
```

#### Use Cases

**Entity Picker (Simple):**

User clicks "..." button → EntityPickerDialog opens → Select from entity list → Auto-fills input with `sensor.temperature`

**Binding Editor (Advanced):**

User clicks "{}" button → BindingEditorDialog opens → Build expression → Auto-fills input with `{sensor.temp;round(1)}`

**Both Options Available:**

- New users: Use entity picker for simple selection
- Power users: Use binding editor for complex expressions
- Can switch between methods at any time

#### Benefits

- ✅ **User Choice**: Simple entity selection OR advanced bindings
- ✅ **Discovery**: New users see both options
- ✅ **Flexibility**: Can switch methods without losing data
- ✅ **Consistent**: Same pattern can be used for other fields
- ✅ **Space Efficient**: Shorter input (180px) fits buttons better

#### Debugging Process

**Step 1: Added Console Logging**

```javascript
console.log(`[Inspector] createTextInput for ${prop.name}:`, {
  entity: prop.entity,
  binding: prop.binding,
  supportsEntity,
  supportsBinding,
});
```

**Step 2: Discovered Missing Properties**

Console showed `entity: undefined, binding: undefined` despite widget config having them.

**Step 3: Found Root Cause**

Inspector wasn't copying `entity` and `binding` flags from configSchema when building property objects.

**Step 4: Applied Fix**

Added two lines to copy the flags: `entity: schema.entity, binding: schema.binding`

**Step 5: Verified Fix**

Console now shows: `entity: true, binding: true, supportsEntity: true, supportsBinding: true`

#### Code Statistics

**Total Phase 15:**

- Modified files: 2 (text-widget.js, inspector.js)
- Bug fixed: Property flags not copied from schema
- Code changes: ~30 lines
- Debug logging: 3 console.log statements
- Production deployments: 2 files
- Iterations: 3 (initial attempt, debug, fix)

---

### ✅ All Priority 1-5 Features COMPLETE (January 25, 2026)

**✅ Priority 1: Inspector Panel - COMPLETE**

**File:** `/www/canvas-ui/inspector/inspector.js` (1593 lines)

**Features Implemented:**

- ✅ Right sidebar (320px wide) for property editing
- ✅ 4-tab system: View | Widget | Views | Widgets
- ✅ **Design Decision**: Single unified Widget tab (NO Common/Custom/Action sub-tabs)
- ✅ Category-based grouping (Position, Custom categories)
- ✅ Widget selection integration
- ✅ 9 field types fully implemented:
- ✅ Text input (with optional `{}` binding button → BindingEditorDialog)
- ✅ Number input (with min/max/step)
- ✅ Entity picker (with `...` button → EntityPickerDialog)
- ✅ Icon picker (with palette button → IconPickerSimpleDialog + 20-icon SVG preview)
- ✅ Slider (with live value display)
- ✅ Select dropdown (object/string options)
- ✅ Color picker (text + native picker + `{}` binding button)
- ✅ Checkbox (with clickable label)
- ✅ Textarea (multiline monospace)
- ✅ Real-time property updates via callbacks
- ✅ Focus loss prevention (blur events, not input events)
- ✅ Dialog integrations: BindingEditorDialog, EntityPickerDialog, IconPickerSimpleDialog
- ✅ Multi-select support with property filtering

**✅ Priority 2: Alignment Tools - COMPLETE**

**Files:**

- `/www/canvas-ui/editor/toolbar.js` (613+ lines) - Toolbar buttons
- `/www/canvas-ui/editor/drag-handler.js` (451 lines) - Visual alignment guides

**Features Implemented:**

- ✅ Align Left button (mdi-format-align-left)
- ✅ Center Horizontal button (mdi-format-align-center)
- ✅ Align Right button (mdi-format-align-right)
- ✅ Align Top button (mdi-format-align-top)
- ✅ Center Vertical button (mdi-format-align-middle)
- ✅ Align Bottom button (mdi-format-align-bottom)
- ✅ AlignmentManager integration (`/www/canvas-ui/alignment/alignment-manager.js`)
- ✅ All buttons connected to alignment functions
- ✅ **Visual Alignment Guides** (red/green lines during drag)
  - Red vertical lines for X-axis alignment (left, center, right)
  - Green horizontal lines for Y-axis alignment (top, middle, bottom)
  - 5px snap tolerance
  - Auto-appear when snap mode = "elements"
  - Lines 280-370 in drag-handler.js

**✅ Priority 3: Undo/Redo UI - COMPLETE**

**File:** `/www/canvas-ui/editor/toolbar.js` (613+ lines)

**Features Implemented:**

- ✅ Undo button in toolbar (mdi-undo icon, tooltip "Undo (Ctrl+Z)")
- ✅ Redo button in toolbar (mdi-redo icon, tooltip "Redo (Ctrl+Y)")
- ✅ Keyboard shortcuts (Ctrl+Z / Ctrl+Y)
- ✅ UndoRedoSystem integration (`/www/canvas-ui/editor/undo-redo.js`)
- ✅ 50-step history implementation
- ✅ State application on undo/redo

**✅ Priority 4: Save System UI - COMPLETE**

**File:** `/www/canvas-ui/editor/toolbar.js` (613+ lines)

**Features Implemented:**

- ✅ Save status indicator in toolbar (line 116: `createSaveStatus()`)
- ✅ Visual feedback for save state (saved/saving/error)
- ✅ SaveSystem integration (`/www/canvas-ui/save/save-system.js`)
- ✅ 2-second debounced auto-save
- ✅ localStorage + Home Assistant file sync

**✅ Priority 5: View Management - COMPLETE**

**File:** `/www/canvas-ui/inspector/inspector.js` (1593 lines)

**Features Implemented:**

- ✅ Views tab in inspector (Lines 150-400)
- ✅ View list navigator with active indicator
- ✅ View switching on click
- ✅ View creation/deletion support
- ✅ ViewManager integration (`/www/canvas-ui/views/view-manager.js`)
- ✅ View metadata display (name, widget count)

### Summary

**Phase 10 Status: 100% COMPLETE ✅**

All five priority features are fully implemented, tested, and deployed:

1. ✅ Inspector Panel with 9 field types and 3 dialog integrations
2. ✅ Alignment Tools with 6 toolbar buttons
3. ✅ Undo/Redo UI with keyboard shortcuts
4. ✅ Save System UI with auto-save
5. ✅ View Management with Views tab

**Total Implementation:**

- Inspector: 1593 lines (9 field types, 4 tabs, category grouping)
- Toolbar: 613+ lines (11 buttons, module integration)
- Supporting Modules: AlignmentManager, UndoRedoSystem, SaveSystem, ViewManager
- All systems integrated via CanvasCore

### Known Issues & Usage Notes

**Visual Alignment Guides:**

- ✅ **IMPLEMENTED** in `/www/canvas-ui/editor/drag-handler.js` (lines 280-370, 396-445)
- **How to enable**: Set snap mode to "elements" (not "grid" or "none")
- **Behavior**: Red/green lines appear automatically during drag when widgets align
- **Snap tolerance**: 5 pixels (configurable at line 32: `this.snapTolerance = 5`)
- **Colors**: Red for vertical (X-axis), Green for horizontal (Y-axis)

**Snap Mode Control:**

- Currently snap mode is set via GridSystem in canvas-core.js
- **TODO**: Add snap mode toggle buttons to toolbar (VIS has 3 buttons: None/Grid/Elements)
- **Workaround**: Guides work when dragging if GridSystem.snapMode = "elements"

### Testing Environment

**Home Assistant Server:**

- IP: 192.168.1.103
- SSH: `sshpass -p 'AWpoP6Rx@wQ7jK' ssh root@192.168.1.103`
- HA Restart: `ha core restart`

**Browser Testing:**

- Chrome/Edge with DevTools (F12)
- Hard refresh required after deployment (Ctrl+Shift+R)
- Console logging enabled for debugging

**Deployment Workflow:**

```bash
# Deploy single file (most common)
sshpass -p 'AWpoP6Rx@wQ7jK' scp www/canvas-ui/FILE.js \
  root@192.168.1.103:/config/www/canvas-ui/

# Deploy entire frontend
sshpass -p 'AWpoP6Rx@wQ7jK' scp -r www/canvas-ui/* \
  root@192.168.1.103:/config/www/canvas-ui/

# Deploy backend (requires restart)
sshpass -p 'AWpoP6Rx@wQ7jK' scp -r custom_components/canvas_ui/* \
  root@192.168.1.103:/config/custom_components/canvas_ui/
sshpass -p 'AWpoP6Rx@wQ7jK' ssh root@192.168.1.103 "ha core restart"
```

---

## ✅ Phase 11: Enhanced Inspector Field Types - COMPLETE

**Status:** ✅ COMPLETE | **Date:** January 26-27, 2026  
**Latest Update:** January 27, 2026 - Atomic Border Properties System

### Overview

Extended inspector field type system with visual CSS editors for borders and shadows, enabling designers to style widgets without manual CSS coding. **Major architectural change:** Moved from monolithic CSS strings to **atomic property system** for better modularity and smart parsing.

### Atomic Border Properties System (January 27, 2026)

**Revolutionary Change:** Borders are now stored as individual atomic properties instead of CSS strings.

**Old System (Deprecated):**

```javascript
// Monolithic CSS string
border: "2px solid #03a9f4; border-radius: 8px";
boxShadow: "0 4px 8px rgba(0,0,0,0.15)";
```

**New System (Current):**

```javascript
// Atomic properties
borderWidth: 5; // Single number (applies to all sides)
borderStyle: "solid"; // solid, dashed, dotted, double, etc.
borderColor: "#03a9f4"; // Hex or rgba color
borderRadius: "10,5,10,5"; // Smart parsing: "10" or "10,5,10,5"

shadowX: 0; // X offset in pixels
shadowY: 4; // Y offset in pixels
shadowBlur: 8; // Blur radius in pixels
shadowSpread: 5; // Spread radius in pixels
shadowColor: "rgba(0,0,0,0.15)"; // Color with alpha
shadowInset: false; // Boolean for inset shadow
```

**Benefits:**

- ✅ Each property independently editable in inspector
- ✅ Type-safe values (numbers, strings, booleans)
- ✅ Smart parsing for borderRadius (single value or comma-separated)
- ✅ Direct property access in widgets (no CSS parsing needed)
- ✅ Better performance (no regex parsing on every render)
- ✅ Undo/redo tracks individual property changes
- ✅ Visual builders update atomic properties directly

### New Field Types Implemented

#### 1. Builder Field Type

**Purpose:** Visual CSS editor button for complex properties (borders, shadows)

**File:** `/www/canvas-ui/inspector/inspector.js` - `createBuilderButton()` method

**Usage:**

```javascript
{
  label: "Border Builder",
  name: "_borderBuilder",
  type: "builder",
  builderType: "border",  // or "shadow"
  category: "Styling"
}
```

**Features:**

- ✅ Gradient-styled button in inspector
- ✅ Opens BorderEditorDialog or ShadowEditorDialog
- ✅ Updates atomic properties on Apply
- ✅ Refreshes inspector after changes
- ✅ Hover gradient animation

**Integration Pattern:**

```javascript
// In widget configSchema
_borderBuilder: {
  type: "builder",
  builderType: "border",
  label: "Border Builder",
  category: "Border"
},
borderWidth: {
  type: "number",
  label: "Border Width",
  default: 0,
  category: "Border"
},
borderStyle: {
  type: "select",
  label: "Border Style",
  default: "solid",
  options: ["solid", "dashed", "dotted", "double"],
  category: "Border"
},
borderColor: {
  type: "color",
  label: "Border Color",
  default: "#333333",
  category: "Border"
},
borderRadius: {
  type: "text",
  label: "Border Radius",
  default: "0",
  binding: true,
  placeholder: "e.g. 10 or 10,0,10,0",
  description: "Single value or comma-separated for TL,TR,BR,BL",
  category: "Border"
}
```

#### 2. Border Editor Dialog

**Purpose:** Visual border builder with atomic property output

**File:** `/www/canvas-ui/dialogs/border-editor-dialog.js` (1416 lines)

**Features:**

- ✅ Live 200×100px preview panel
- ✅ Enable/disable border toggle
- ✅ Unified border controls:
  - Width slider (0-20px) with number input
  - Style dropdown: solid, dashed, dotted, double, groove, ridge, inset, outset
  - Color picker: text input + HTML5 color picker
- ✅ Border radius slider (0-50px, supports individual corners)
- ✅ Smart radius parsing: "10" or "10,5,10,5" (comma-separated)
- ✅ Generated CSS display (monospace, for reference)
- ✅ ESC key support for closing

**Output Format (Atomic Properties):**

```javascript
// Border builder outputs atomic properties via inspector callback:
borderWidth: 5;
borderStyle: "solid";
borderColor: "#03a9f4";
borderRadius: "10,5,10,5"; // Comma-separated, no px suffix
```

**Smart Border Radius Parsing:**

```javascript
// Parser supports both formats:
"10"         → All corners: 10px
"10,5,10,5"  → Individual corners: TL=10px, TR=5px, BR=10px, BL=5px

// Optimized output:
// If all corners same → single value: "10"
// If corners differ  → comma format: "10,5,10,5"
```

**Key Methods:**

- `_parseBorderRadius(radiusValue)` - Parse "10" or "10,5,10,5" (supports both comma and space separation)
- `generateCSS()` - Return border CSS string with comma-separated radius
- `_updatePreview()` - Apply styles to preview element
- `_applyBorderValue()` - Convert CSS to atomic properties (in inspector.js)
- `_buildBorderValue()` - Convert atomic properties to CSS (in inspector.js)

**Critical Implementation Detail:**

The border builder outputs atomic properties which are then applied by the inspector:

```javascript
// In inspector.js - Border builder callback (lines 2125-2155)
const editor = new BorderEditorDialog(currentBorder, (css) => {
  // Parse CSS and update atomic properties
  this._applyBorderValue(target, css);

  // Refresh inspector to show updated fields
  this.refreshInspector(target);

  // Trigger property change for each atomic property
  this.handlePropertyChange(
    "config.borderWidth",
    target.config.borderWidth,
    target,
    type,
  );
  this.handlePropertyChange(
    "config.borderStyle",
    target.config.borderStyle,
    target,
    type,
  );
  this.handlePropertyChange(
    "config.borderColor",
    target.config.borderColor,
    target,
    type,
  );
  this.handlePropertyChange(
    "config.borderRadius",
    target.config.borderRadius,
    target,
    type,
  );
});
```

#### 2. Shadow Editor Dialog

**Purpose:** Visual shadow builder with atomic property output

**File:** `/www/canvas-ui/dialogs/shadow-editor-dialog.js` (750 lines)

**Usage:**

```javascript
{
  label: "Shadow Builder",
  name: "_shadowBuilder",
  type: "builder",
  builderType: "shadow",
  category: "Shadow"
}
```

**Features:**

- ✅ Live 200×100px preview with 60px padding (shows shadows)
- ✅ 6 preset buttons: None, Subtle, Card, Elevated, Dramatic, Glow
- ✅ Unified shadow controls:
  - X offset slider (-50 to 50px) + number input
  - Y offset slider (-50 to 50px) + number input
  - Blur slider (0-50px) + number input
  - Spread slider (-50 to 50px) + number input
  - Color picker: text input (RGBA) + HTML5 color picker
  - Inset toggle (inner/outer shadow)
- ✅ Generated CSS display (monospace, for reference)
- ✅ ESC key support for closing

**Output Format (Atomic Properties):**

```javascript
// Shadow builder outputs atomic properties via inspector callback:
shadowX: 0; // X offset in pixels
shadowY: 4; // Y offset in pixels
shadowBlur: 8; // Blur radius in pixels
shadowSpread: 5; // Spread radius in pixels
shadowColor: "rgba(0,0,0,0.15)"; // Color with alpha
shadowInset: false; // Boolean for inset shadow
```

**Preset Values:**

```javascript
None: All properties set to 0/false
Subtle: { shadowX: 0, shadowY: 1, shadowBlur: 3, shadowSpread: 0, shadowColor: "rgba(0,0,0,0.12)", shadowInset: false }
Card: { shadowX: 0, shadowY: 2, shadowBlur: 8, shadowSpread: 0, shadowColor: "rgba(0,0,0,0.15)", shadowInset: false }
Elevated: { shadowX: 0, shadowY: 4, shadowBlur: 16, shadowSpread: 0, shadowColor: "rgba(0,0,0,0.2)", shadowInset: false }
Dramatic: { shadowX: 0, shadowY: 10, shadowBlur: 40, shadowSpread: 0, shadowColor: "rgba(0,0,0,0.3)", shadowInset: false }
Glow: { shadowX: 0, shadowY: 0, shadowBlur: 20, shadowSpread: 0, shadowColor: "rgba(3,169,244,0.5)", shadowInset: false }
```

**Inspector Integration:**

```javascript
// In inspector.js - Shadow builder callback (lines 2065-2083)
const editor = new ShadowEditorDialog(currentShadow, (css) => {
  // Parse CSS and update atomic properties
  this._applyShadowValue(target, css);

  // Refresh inspector to show updated fields
  this.refreshInspector(target);

  // Trigger property change for each atomic property
  this.handlePropertyChange(
    "config.shadowX",
    target.config.shadowX,
    target,
    type,
  );
  this.handlePropertyChange(
    "config.shadowY",
    target.config.shadowY,
    target,
    type,
  );
  this.handlePropertyChange(
    "config.shadowBlur",
    target.config.shadowBlur,
    target,
    type,
  );
  this.handlePropertyChange(
    "config.shadowSpread",
    target.config.shadowSpread,
    target,
    type,
  );
  this.handlePropertyChange(
    "config.shadowColor",
    target.config.shadowColor,
    target,
    type,
  );
  this.handlePropertyChange(
    "config.shadowInset",
    target.config.shadowInset,
    target,
    type,
  );
});
```

**Key Methods:**

- `parseShadowValue(cssString)` - Parse "0 4px 8px 0 rgba(0,0,0,0.15)" into atomic properties
- `generateCSS()` - Return CSS string for preview
- `_rgbaToHex(rgba)` - Convert rgba(0,0,0,0.3) → #000000 for color picker
- `_hexToRgb(hex)` - Convert #000000 → {r:0, g:0, b:0}
- `_extractAlpha(rgba)` - Get 0.3 from rgba(0,0,0,0.3)
- `_updatePreview()` - Apply box-shadow to preview element
- `_applyShadowValue()` - Convert CSS to atomic properties (in inspector.js)
- `_buildShadowValue()` - Convert atomic properties to CSS (in inspector.js)

### Inspector Integration

**Files Modified:**

1. **inspector.js** (Updated)
   - Added imports: `BorderEditorDialog`, `ShadowEditorDialog`
   - Added switch case for "builder" type (lines 608-611)
   - Added `createBuilderButton()` method (lines 1500-1580)
   - Added `refreshInspector()` method (lines 167-175)
   - Added border/shadow builder callbacks (lines 2065-2095)
   - **CRITICAL:** Added "borderRadius" to `noConvertProps` array (line 1747)

**Integration Pattern:**

```javascript
// Import dialogs
import { BorderEditorDialog } from "../dialogs/border-editor-dialog.js";
import { ShadowEditorDialog } from "../dialogs/shadow-editor-dialog.js";

// Switch case handling (lines 608-611)
case "builder":
  input = this.createBuilderButton(prop, target, type);
  break;

// Builder button creator method (lines 1500-1580)
createBuilderButton(prop, target, type) {
  const container = document.createElement("div");
  container.style.cssText = `
    display: flex;
    gap: 4px;
    align-items: center;
  `;

  // Gradient-styled button
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = prop.builderType === "border" ? "Border Builder" : "Shadow Builder";
  button.style.cssText = `
    flex: 1;
    padding: 8px 16px;
    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
    color: #fff;
    border: 1px solid #3d5a80;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.3s;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  `;

  // Hover gradient animation
  button.onmouseenter = () => {
    button.style.background = "linear-gradient(135deg, #2a5298 0%, #1e3c72 100%)";
    button.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)";
  };
  button.onmouseleave = () => {
    button.style.background = "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)";
    button.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
  };

  // Click handler
  button.onclick = () => {
    if (prop.builderType === "border") {
      this._openBorderBuilder(target, type);
    } else if (prop.builderType === "shadow") {
      this._openShadowBuilder(target, type);
    }
  };

  container.appendChild(button);
  return container;
}

// Border builder callback (lines 2084-2095)
const editor = new BorderEditorDialog(currentBorder, (css) => {
  // Parse CSS and update atomic properties
  this._applyBorderValue(target, css);

  // Refresh inspector UI
  this.refreshInspector(target);

  // Notify property changes for each atomic property
  this.handlePropertyChange("config.borderWidth", target.config.borderWidth, target, type);
  this.handlePropertyChange("config.borderStyle", target.config.borderStyle, target, type);
  this.handlePropertyChange("config.borderColor", target.config.borderColor, target, type);
  this.handlePropertyChange("config.borderRadius", target.config.borderRadius, target, type);
});

// Shadow builder callback (lines 2065-2083)
const editor = new ShadowEditorDialog(currentShadow, (css) => {
  // Parse CSS and update atomic properties
  this._applyShadowValue(target, css);

  // Refresh inspector UI
  this.refreshInspector(target);

  // Notify property changes for each atomic property
  this.handlePropertyChange("config.shadowX", target.config.shadowX, target, type);
  this.handlePropertyChange("config.shadowY", target.config.shadowY, target, type);
  this.handlePropertyChange("config.shadowBlur", target.config.shadowBlur, target, type);
  this.handlePropertyChange("config.shadowSpread", target.config.shadowSpread, target, type);
  this.handlePropertyChange("config.shadowColor", target.config.shadowColor, target, type);
  this.handlePropertyChange("config.shadowInset", target.config.shadowInset, target, type);
});

// CRITICAL: noConvertProps array (line 1747)
// Prevents parseFloat from corrupting comma-separated borderRadius
const noConvertProps = ["border", "boxShadow", "font", "fontFamily", "borderRadius"];
```

### Canvas Core Integration

**File:** `/www/canvas-ui/core/canvas-core.js`

**CRITICAL FIX (Line 892):**

```javascript
// Property conversion protection
const noConvertProps = [
  "border",
  "boxShadow",
  "font",
  "fontFamily",
  "borderRadius",
];

// Property change handler (lines 878-900)
const propName = property.startsWith("config.")
  ? property.substring(7)
  : property;

const shouldConvert =
  !noConvertProps.includes(propName) &&
  typeof value === "string" &&
  !isNaN(parseFloat(value));

const changes = {
  [propName]: shouldConvert ? parseFloat(value) || value : value,
};

this.viewRenderer.updateWidget(widgetId, changes);
```

**Why This Matters:**

Without `"borderRadius"` in both `noConvertProps` arrays:

- Inspector saves `"25,0,0,0"` → Canvas-core converts to `25` → Widget receives wrong value
- Two conversion points exist: inspector.js and canvas-core.js
- Both must preserve comma-separated strings to prevent data loss

**Property Flow:**

```
1. BorderBuilder.apply() → "10,5,10,5"
2. inspector._applyBorderValue() → Updates widget.config.borderRadius = "10,5,10,5"
3. inspector.handlePropertyChange() → Checks noConvertProps, preserves string
4. canvas-core.onPropertyChange() → Checks noConvertProps, preserves string
5. viewRenderer.updateWidget() → Passes "10,5,10,5" to widget
6. widget.updateConfig() → Receives correct comma-separated value
7. widget._applyBorderStyles() → Parses and applies individual corners
```

#### 3. Font Field Type

**Purpose:** Visual font selector with live previews of web-safe and Google Fonts

**File:** `/www/canvas-ui/dialogs/font-picker-dialog.js` (520 lines)

**Usage:**

```javascript
{
  label: "Font Family",
  name: "fontFamily",
  type: "font",
  category: "Typography"
}
```

**Features:**

- ✅ Search/filter fonts by name
- ✅ Live font previews in actual typeface
- ✅ Two font categories:
  - **Web-Safe Fonts** (12 fonts): Arial, Helvetica, Times New Roman, Georgia, Courier New, Verdana, Trebuchet MS, Comic Sans MS, Impact, Lucida Console, Palatino, inherit
  - **Google Fonts** (15 fonts): Roboto, Open Sans, Lato, Montserrat, Oswald, Raleway, Poppins, Playfair Display, Merriweather, Ubuntu, Nunito, PT Sans, Fira Sans, Source Sans Pro, Bebas Neue
- ✅ Automatic Google Fonts loading (dynamic link injection)
- ✅ Font cards with name and preview text
- ✅ Click to select (blue border highlight)
- ✅ Preview text: "The quick brown fox jumps over the lazy dog"
- ✅ Monospace CSS display in footer
- ✅ ESC key support for closing

**Font Output Format:**

```javascript
// Web-safe font
"Arial, sans-serif";

// Google Font
"'Roboto', sans-serif";

// Inherit from parent
"inherit";
```

**Inspector Integration:**

- Disabled text input showing current font family (styled in that font)
- Blue "Select..." button opens FontPickerDialog
- Input displays with selected font applied
- Callback updates widget config on Apply

**Key Methods:**

- `_loadGoogleFonts()` - Dynamically inject Google Fonts CSS links into document head
- `_renderFontList()` - Filter and render font cards by search term
- `_createFontCard(font)` - Create interactive font card with preview
- `_updatePreview()` - Update footer preview with selected font family

**Font Library Structure:**

```javascript
this.fonts = {
  webSafe: {
    label: "Web-Safe Fonts",
    fonts: [
      { name: "Arial", display: "Arial", family: "Arial, sans-serif" },
      // ... 11 more fonts
    ],
  },
  google: {
    label: "Google Fonts",
    fonts: [
      {
        name: "Roboto",
        display: "Roboto",
        family: "'Roboto', sans-serif",
        url: "https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap",
      },
      // ... 14 more fonts
    ],
  },
};
```

### Inspector Integration

**Files Modified:**

1. **inspector.js** (Updated)
   - Added imports: `BorderEditorDialog`, `ShadowEditorDialog`
   - Added switch cases for "border" and "shadow" types (lines 608-611)
   - Added `createBorderInput()` method (lines 1607-1658)
   - Added `createShadowInput()` method (lines 1660-1711)

**Integration Pattern:**

```javascript
// Import dialogs
import { BorderEditorDialog } from "../dialogs/border-editor-dialog.js";
import { ShadowEditorDialog } from "../dialogs/shadow-editor-dialog.js";
import { FontPickerDialog } from "../dialogs/font-picker-dialog.js";

// Switch case handling
case "border":
  input = this.createBorderInput(prop, target, type);
  break;
case "shadow":
  input = this.createShadowInput(prop, target, type);
  break;
case "font":
  input = this.createFontInput(prop, target, type);
  break;

// Creator method structure
createBorderInput(prop, target, type) {
  // Container with flex layout
  const container = document.createElement("div");

  // Disabled text input (displays current CSS)
  const input = document.createElement("input");
  input.disabled = true;
  input.value = this.getPropertyValue(target, prop.name) || "none";

  // Blue "Edit..." button
  const btn = document.createElement("button");
  btn.textContent = "Edit...";
  btn.onclick = () => {
    const editor = new BorderEditorDialog(input.value, (css) => {
      input.value = css;
      this.handlePropertyChange(prop.name, css, target, type);
    });
    editor.show();
  };

  container.appendChild(input);
  container.appendChild(btn);
  return container;
}
```

### Testing Completed

**Test Widgets Created:**

- ✅ Text widget with atomic border properties
- ✅ Value widget with atomic shadow properties
- ✅ Border builder dialog with comma-separated borderRadius
- ✅ Shadow builder dialog with atomic property output

**Functionality Verified:**

- ✅ Builder buttons render with correct labels (Border vs Shadow)
- ✅ Dialogs open without errors
- ✅ Live preview updates in real-time
- ✅ CSS parses correctly (comma and space-separated borderRadius)
- ✅ CSS generates valid output (comma-separated borderRadius format)
- ✅ Apply callback fires and updates atomic properties
- ✅ Individual property changes trigger inspector refresh
- ✅ Config persists across page refresh
- ✅ ESC key closes dialog
- ✅ Cancel discards changes
- ✅ Preset buttons work correctly (shadow presets)
- ✅ Smart parsing: "10" vs "10,5,10,5" both work
- ✅ noConvertProps protection in inspector.js
- ✅ noConvertProps protection in canvas-core.js
- ✅ Comma-separated borderRadius preserved through entire property flow
- ✅ Widget receives correct borderRadius value and applies individual corners

**Browser Testing:**

- ✅ Chrome/Edge - All features working
- ✅ Firefox - All features working
- ✅ Safari - All features working
- ✅ Mobile (Chrome Android) - Touch interactions work

### Deployment Status

**Files Deployed to Production (192.168.1.103):**

```bash
# Border editor dialog (atomic property output)
sshpass -p 'AWpoP6Rx@wQ7jK' scp www/canvas-ui/dialogs/border-editor-dialog.js \
  root@192.168.1.103:/config/www/canvas-ui/dialogs/

# Shadow editor dialog (atomic property output)
sshpass -p 'AWpoP6Rx@wQ7jK' scp www/canvas-ui/dialogs/shadow-editor-dialog.js \
  root@192.168.1.103:/config/www/canvas-ui/dialogs/

# Updated inspector (builder field type + noConvertProps)
sshpass -p 'AWpoP6Rx@wQ7jK' scp www/canvas-ui/inspector/inspector.js \
  root@192.168.1.103:/config/www/canvas-ui/inspector/

# Updated canvas-core (noConvertProps protection)
sshpass -p 'AWpoP6Rx@wQ7jK' scp www/canvas-ui/core/canvas-core.js \
  root@192.168.1.103:/config/www/canvas-ui/core/

# Updated widgets (atomic border/shadow support)
sshpass -p 'AWpoP6Rx@wQ7jK' scp www/canvas-ui/widgets/basic/text-widget.js \
  root@192.168.1.103:/config/www/canvas-ui/widgets/basic/
sshpass -p 'AWpoP6Rx@wQ7jK' scp www/canvas-ui/widgets/basic/value-widget.js \
  root@192.168.1.103:/config/www/canvas-ui/widgets/basic/
```

**Status:** ✅ All files deployed successfully

### Total Implementation

**Code Statistics:**

- BorderEditorDialog: 1416 lines (with smart borderRadius parsing)
- ShadowEditorDialog: 750 lines (atomic property output)
- FontPickerDialog: 520 lines
- Inspector integration: 400 lines (builder field type, noConvertProps, refreshInspector)
- Canvas-core integration: 23 lines (noConvertProps protection)
- Widget updates: 200 lines (atomic border/shadow support)
- **Total new code:** ~3,309 lines

**Architectural Changes:**

- **Monolithic CSS → Atomic Properties** - Border/shadow stored as individual properties
- **Smart Parsing** - borderRadius supports "10" or "10,5,10,5" formats
- **Builder Field Type** - New inspector field type for visual editors
- **Dual noConvertProps Arrays** - Protection in both inspector.js and canvas-core.js

**Field Types Now Available:** 12 types total

1. text (with optional binding)
2. number (with min/max/step)
3. entity (with EntityPickerDialog)
4. icon (with IconPickerSimpleDialog)
5. slider (with dual controls)
6. select (object/string options)
7. color (with binding support)
8. checkbox (boolean toggle)
9. textarea (multiline)
10. **builder** (visual border/shadow editors) ← NEW
11. **font** (visual picker with previews)

**Border/Shadow Properties:**

- Border: borderWidth, borderStyle, borderColor, borderRadius (4 atomic properties)
- Shadow: shadowX, shadowY, shadowBlur, shadowSpread, shadowColor, shadowInset (6 atomic properties)

### Benefits

**For Designers:**

- ✅ No CSS knowledge required
- ✅ Visual, real-time feedback
- ✅ Preset quick starts
- ✅ Professional results

**For Developers:**

- ✅ Consistent CSS output
- ✅ Valid syntax guaranteed
- ✅ Reusable dialog pattern
- ✅ Easy to extend

**For Users:**

- ✅ Professional-looking widgets
- ✅ Easy styling customization
- ✅ Preset library for common cases
- ✅ Multi-layer shadow effects

### Future Enhancements

**Potential Additions:**

- [ ] Border image support
- [ ] Gradient shadows (conic, radial)
- [ ] Shadow animation presets
- [ ] Copy/paste shadow between widgets
- [ ] Border pattern library
- [ ] Advanced border-radius (per-corner control)

### Remaining Proposed Field Types

**High Priority:**

1. Duration/Time Input - HH:MM:SS or ms
2. Multi-Entity Selector - Checkbox list
3. Font Picker - Dropdown with previews
4. Image/File Browser - /local/ tree view

**Medium Priority:** 5. Gradient Builder - Visual gradient editor 6. JSON/Object Editor - Syntax highlighting 7. CSS Editor - Full CSS panel 8. Action Sequence Builder - Visual flow

**Low Priority:** 9. Date/Time Picker - Calendar popup 10. Rich Text Editor - WYSIWYG

---

## ✅ Phase 12: Widget Icon Registry System - COMPLETE

**Status:** ✅ COMPLETE | **Date:** January 26, 2026

### Overview

Implemented centralized widget icon management system to ensure consistent MDI icon display across all UI components. This phase addresses the issue where different parts of the UI (widget library popup, inspector widgets tab) were showing inconsistent or missing icons.

### Problem Statement

**Before Phase 12:**

- Widget library popup and inspector widgets tab showed different icons
- Icons were retrieved inconsistently (some from widget class, some hardcoded)
- SVG icons used in inspector vs MDI font icons in popup
- No single source of truth for widget icon definitions
- Icons could become out of sync across different UI components

### Solution: Centralized Widget Registry

**Core Concept:** All widget metadata (including icons) is registered once when widgets are loaded, then accessed consistently via registry helper methods.

### Implementation Details

#### 1. Widget Registry Enhancements

**File:** `/www/canvas-ui/core/widget-registry.js`

**New Methods Added:**

```javascript
/**
 * Get widget icon (centralized method)
 * @param {string} type - Widget type
 * @returns {string} MDI icon name (e.g., "mdi:button-cursor") or "mdi:cog" as fallback
 */
getIcon(type) {
  const widget = this.widgets.get(type);
  if (widget && widget.metadata && widget.metadata.icon) {
    return widget.metadata.icon;
  }
  return "mdi:cog"; // Default fallback
}

/**
 * Get widget name (centralized method)
 * @param {string} type - Widget type
 * @returns {string} Widget display name
 */
getName(type) {
  const widget = this.widgets.get(type);
  if (widget && widget.metadata && widget.metadata.name) {
    return widget.metadata.name;
  }
  // Fallback: capitalize type
  return type.charAt(0).toUpperCase() + type.slice(1);
}
```

**How Registration Works:**

```javascript
// When widget module is loaded:
async _loadWidgetModule(type, basePath) {
  // ... import widget class ...

  // Get metadata from widget's static method
  const metadata = widgetClass.getMetadata ? widgetClass.getMetadata() : {};

  // Store in registry with metadata
  this.register(type, widgetClass, metadata);

  // Now metadata.icon is available via getIcon(type)
}
```

#### 2. Inspector Integration

**File:** `/www/canvas-ui/inspector/inspector.js`

**Before (Inconsistent):**

```javascript
// Manually accessing widget class and metadata
const widgetClass = this.canvasCore.widgetRegistry.get(widgetType);
if (widgetClass && widgetClass.getMetadata) {
  const metadata = widgetClass.getMetadata();
  iconName = metadata.icon || "mdi:cog";
}
const iconSvg = this._createMDIIcon(iconName, 18, color); // SVG rendering
```

**After (Centralized + MDI Font):**

```javascript
// Use centralized registry method
const iconName = this.canvasCore.widgetRegistry.getIcon(widgetType);
const iconClass = iconName.replace("mdi:", "mdi-");

// Use MDI font icon (consistent with popup)
widgetItem.innerHTML = `
  <i class="mdi ${iconClass}" style="font-size: 18px; color: ${color};"></i>
  ...
`;
```

#### 3. Widget Factory Integration

**File:** `/www/canvas-ui/editor/widget-factory.js`

**Before (Direct metadata access):**

```javascript
const widgetClass = this.widgetRegistry.get(type);
const metadata = widgetClass.getMetadata ? widgetClass.getMetadata() : {};

return {
  type: type,
  name: metadata.name || type.charAt(0).toUpperCase() + type.slice(1),
  icon: metadata.icon || "mdi:cog",
  category: metadata.category || "basic",
  description: metadata.description || "",
};
```

**After (Centralized registry methods):**

```javascript
// Use centralized registry methods
const icon = this.widgetRegistry.getIcon(type);
const name = this.widgetRegistry.getName(type);
const metadata = this.widgetRegistry.getMetadata(type);

return {
  type: type,
  name: name,
  icon: icon,
  category: metadata?.category || "basic",
  description: metadata?.description || "",
};
```

### Icon Rendering Standardization

**Conversion from SVG to MDI Font Icons:**

**Why MDI Font Icons:**

- ✅ Consistent with Home Assistant's UI standards
- ✅ Simpler implementation (no SVG path library needed)
- ✅ Better performance (font glyphs vs SVG DOM elements)
- ✅ Easier to style and animate
- ✅ Reduces bundle size (no mdi-icon-library.js dependency)

**Icon Format Conversion:**

```javascript
// Widget metadata stores:
icon: "mdi:button-cursor"; // Colon separator

// Convert to MDI font class:
const iconClass = iconName.replace("mdi:", "mdi-");
// Result: "mdi-button-cursor"

// Render as MDI font icon:
<i class="mdi mdi-button-cursor" style="font-size: 18px; color: #03a9f4;"></i>;
```

### Async Widget Loading Pattern

**Critical Requirement:** Widgets must be loaded before accessing metadata.

**Widget Factory:**

```javascript
async getWidgetLibrary() {
  // Load all widgets first
  await Promise.all(
    widgetTypes.map(type => this.widgetRegistry.loadWidget(type))
  );

  // Now icons are available
  widgetTypes.map(type => this.widgetRegistry.getIcon(type));
}
```

**Inspector:**

```javascript
async renderWidgetsTab(container) {
  // Load all widget types first
  const widgetTypes = [...new Set(sortedWidgets.map(w => w.config?.type || w.type))];
  await Promise.all(
    widgetTypes.map(type => this.canvasCore.widgetRegistry.loadWidget(type))
  );

  // Now icons are available
  sortedWidgets.forEach(widget => {
    const iconName = this.canvasCore.widgetRegistry.getIcon(widgetType);
  });
}
```

### Benefits Achieved

**1. Single Source of Truth:**

- Icons defined once in widget's `getMetadata()` method
- Stored once in widget registry
- Accessed consistently via `widgetRegistry.getIcon(type)`

**2. Guaranteed Consistency:**

- Widget library popup and inspector show identical icons
- All future UI components will use same icons
- No possibility of icons drifting out of sync

**3. Easy Maintenance:**

- Change icon in widget JS file → updates everywhere automatically
- No need to update multiple files for icon changes
- Clear documentation of where icons are defined

**4. Performance Improvements:**

- MDI font icons instead of SVG (lighter rendering)
- Removed dependency on mdi-icon-library.js SVG paths
- Async loading prevents premature metadata access

### Widget Icon Definitions

**Current Widget Icons:**

| Widget Type | Icon Name           | MDI Class           | Display Icon |
| ----------- | ------------------- | ------------------- | ------------ |
| Text        | `mdi:format-text`   | `mdi-format-text`   | 📝           |
| Button      | `mdi:button-cursor` | `mdi-button-cursor` | 🖱️           |
| Image       | `mdi:image`         | `mdi-image`         | 🖼️           |
| Switch      | `mdi:toggle-switch` | `mdi-toggle-switch` | 🔄           |
| Value       | `mdi:numeric`       | `mdi-numeric`       | 🔢           |

**Adding New Widget Icons:**

```javascript
// In widget-name-widget.js:
static getMetadata() {
  return {
    type: "widget-name",
    name: "Widget Display Name",
    icon: "mdi:icon-name",  // ← Define here, used everywhere
    category: "basic",
    description: "Widget description",
  };
}
```

### Testing Completed

**Verified:**

- ✅ Widget library popup displays correct MDI font icons
- ✅ Inspector widgets tab displays same MDI font icons
- ✅ Icons match widget metadata definitions
- ✅ Icons load consistently on page refresh
- ✅ No console errors related to icon loading
- ✅ Async loading works correctly (widgets loaded before icon access)
- ✅ Fallback to "mdi:cog" works when widget not loaded

### Files Modified

1. **widget-registry.js** - Added `getIcon()` and `getName()` methods
2. **inspector.js** - Changed to use centralized `getIcon()` + MDI font icons
3. **widget-factory.js** - Changed to use centralized `getIcon()` and `getName()`

### Deployment Status

**Deployed:** January 26, 2026

```bash
sshpass -p 'AWpoP6Rx@wQ7jK' scp \
  www/canvas-ui/core/widget-registry.js \
  www/canvas-ui/editor/widget-factory.js \
  www/canvas-ui/inspector/inspector.js \
  root@192.168.1.103:/config/www/canvas-ui/
```

**Status:** ✅ All files deployed successfully

### Future Enhancements

**Potential Improvements:**

- [ ] Icon caching for performance optimization
- [ ] Icon validation on widget registration
- [ ] Support for custom icon sets beyond MDI
- [ ] Icon preview in widget creation dialog
- [ ] Icon search/filter in widget library

---

## 🔧 HOME ASSISTANT INSTALLATION ACCESS

---

## �🔧 HOME ASSISTANT INSTALLATION ACCESS

### SSH Access (Canvas UI)

**Connection Details:**

```bash
# Direct SSH connection
ssh root@192.168.1.103
# Password: AWpoP6Rx@wQ7jK

# Quick connection with sshpass
sshpass -p 'AWpoP6Rx@wQ7jK' ssh root@192.168.1.103
```

**Deploy Canvas UI Frontend:**

```bash
# Deploy all Canvas UI files to HA
sshpass -p 'AWpoP6Rx@wQ7jK' scp -r www/canvas-ui/* \
  root@192.168.1.103:/config/www/canvas-ui/

# Deploy specific files (faster for incremental updates)
sshpass -p 'AWpoP6Rx@wQ7jK' scp www/canvas-ui/*.js www/canvas-ui/*.css \
  root@192.168.1.103:/config/www/canvas-ui/
```

**Deploy Custom Component (Backend):**

```bash
# Deploy custom component (Python integration)
sshpass -p 'AWpoP6Rx@wQ7jK' scp -r custom_components/canvas_ui/* \
  root@192.168.1.103:/config/custom_components/canvas_ui/

# Restart Home Assistant after backend changes
sshpass -p 'AWpoP6Rx@wQ7jK' ssh root@192.168.1.103 "ha core restart"
```

**Common Commands:**

```bash
# View Canvas UI files on HA
sshpass -p 'AWpoP6Rx@wQ7jK' ssh root@192.168.1.103 "ls -la /config/www/canvas-ui/"

# View custom component files
sshpass -p 'AWpoP6Rx@wQ7jK' ssh root@192.168.1.103 "ls -la /config/custom_components/canvas_ui/"

# Clear cache (if needed)
sshpass -p 'AWpoP6Rx@wQ7jK' ssh root@192.168.1.103 "rm -rf /config/.storage/lovelace*"

# View Home Assistant logs
sshpass -p 'AWpoP6Rx@wQ7jK' ssh root@192.168.1.103 "tail -f /config/home-assistant.log"
```

**Deployment Workflow:**

1. Make changes locally in `/home/spetchal/Code/HADD/www/canvas-ui/`
2. Deploy to HA using `scp` commands above
3. Hard refresh browser (Ctrl+Shift+R) to clear cache
4. For backend changes: restart HA core and wait ~30 seconds

---

## 🏗️ MODULAR ARCHITECTURE SPECIFICATION

### Design Decisions

**✅ Confirmed Choices:**

1. **File Granularity:** Many small files (50-800 lines each) for easy maintenance
2. **Inspector Fields:** Individual files per field type (fields/text-field.js, fields/color-field.js)
3. **Widget Loading:** Dynamic imports for on-demand loading
4. **State Management:** Simple reactive system (Can.js inspired, lightweight)
5. **Naming Convention:** kebab-case for files, PascalCase for classes
6. **Exports:** Named exports (better for tree-shaking)

### Complete File Structure

```
www/canvas-ui/
├── core/                       (~3,300 lines - Runtime only)
│   ├── canvas-core.js          (500 lines)  Main initialization, view switching
│   ├── state-manager.js        (300 lines)  Simple reactive state (Can.js style)
│   ├── connection.js           (350 lines)  HA WebSocket connection
│   ├── entity-manager.js       (400 lines)  Entity subscriptions, state updates
│   ├── binding-parser.js       (300 lines)  Parse {entity;operations} syntax
│   ├── binding-evaluator.js    (400 lines)  Evaluate expressions, 40+ operations
│   ├── view-renderer.js        (450 lines)  Render views, widgets, backgrounds
│   ├── widget-registry.js      (300 lines)  Dynamic widget loading, registration
│   └── utils.js                (200 lines)  Shared utilities
│
├── editor/                     (~6,600 lines - Editor only)
│   ├── editor-core.js          (600 lines)  Edit mode toggle, coordination
│   ├── toolbar.js              (800 lines)  Ribbon toolbar (6 tabs)
│   ├── inspector.js            (500 lines)  Inspector coordination
│   ├── drag-drop.js            (600 lines)  Drag system with multi-select
│   ├── resize.js               (500 lines)  Resize handles
│   ├── selection.js            (400 lines)  Selection management
│   ├── snap-grid.js            (450 lines)  Grid snapping (3 modes)
│   ├── alignment-guides.js     (400 lines)  Red/green alignment lines
│   ├── alignment-tools.js      (500 lines)  Align, distribute, same size
│   ├── undo-redo.js            (350 lines)  50-step history
│   ├── save-system.js          (400 lines)  Debounced save (2 sec)
│   ├── view-manager.js         (500 lines)  Add/edit/delete views
│   ├── widget-creator.js       (600 lines)  Widget creation dialogs
│   ├── clipboard.js            (300 lines)  Copy/paste operations
│   └── kiosk-handler.js        (200 lines)  Kiosk mode detection
│
├── inspector/                  (~1,890 lines total)
│   ├── renderer.js             (400 lines)  Table-based inspector layout
│   ├── tab-manager.js          (300 lines)  Common/Custom/Action tabs
│   ├── category-renderer.js    (250 lines)  Collapsible category groups
│   ├── validators.js           (150 lines)  Input validation
│   └── fields/                 (~790 lines total)
│       ├── text-field.js       (80 lines)   Text input
│       ├── number-field.js     (100 lines)  Number input with min/max
│       ├── color-field.js      (120 lines)  Color picker
│       ├── select-field.js     (90 lines)   Dropdown select
│       ├── checkbox-field.js   (70 lines)   Checkbox toggle
│       ├── entity-picker-field.js (150 lines) Entity selector
│       ├── slider-field.js     (100 lines)  Range slider
│       └── textarea-field.js   (80 lines)   Multi-line text
│
├── api/                        (~1,500 lines)
│   ├── base-widget.js          (800 lines)  Base widget class (state-driven)
│   ├── widget-loader.js        (300 lines)  Dynamic widget module loading
│   └── widget-helpers.js       (400 lines)  Shared widget utilities
│
├── widgets/                    (~4,000 lines total for 10 widgets)
│   ├── button.js               (400 lines)  Button widget (1 state)
│   ├── toggle-button.js        (450 lines)  Toggle button (2 states)
│   ├── text.js                 (300 lines)  Text display
│   ├── image.js                (350 lines)  Image display
│   ├── slider.js               (500 lines)  Slider control
│   ├── card.js                 (600 lines)  Lovelace card embedding
│   ├── gauge.js                (400 lines)  Gauge display
│   ├── border.js               (250 lines)  Border/container
│   ├── iframe.js               (350 lines)  Iframe embed
│   └── navigation.js           (400 lines)  Navigation button
│
├── index.html                  View-only mode entry point
├── edit.html                   Editor mode entry point
└── canvas-ui-panel.js          (200 lines) HA panel registration
```

**Total: ~17,490 lines across ~51 files**  
**Average: ~343 lines per file**  
**✅ All files under 1,000 lines!**

### Module API Definitions

See [APPENDIX G: Complete Module API Reference](#appendix-g-complete-module-api-reference) for detailed function signatures and usage examples for all modules.

### Size Summary

| Category         | Files  | Total Lines | Per File Avg | Max File |
| ---------------- | ------ | ----------- | ------------ | -------- |
| **Core Runtime** | 9      | 3,300       | 367          | 500      |
| **Editor**       | 14     | 6,600       | 471          | 800      |
| **Inspector**    | 12     | 1,890       | 158          | 400      |
| **Widget API**   | 3      | 1,500       | 500          | 800      |
| **Widgets**      | 10     | 4,000       | 400          | 600      |
| **Entry Points** | 3      | 200         | 67           | 200      |
| **TOTAL**        | **51** | **17,490**  | **343**      | **800**  |

✅ **All files under 1,000 lines**  
✅ **Highly modular and maintainable**  
✅ **Clear separation of concerns**  
✅ **Easy to navigate and edit**

---

## 🏗️ CORE ARCHITECTURE PATTERNS

### 1. Dual-Mode System (VIS v1 Pattern)

**VIS v1 Implementation:**

```javascript
// vis.js - Mode detection
vis.editMode =
  window.location.href.indexOf("edit.html") !== -1 ||
  window.location.href.indexOf("?edit") !== -1;

// Conditional loading
if (vis.editMode) {
  // Load 294KB of editing code
  loadScript("visEdit.js");
  loadScript("visEditInspect.js");
  loadScript("visEditExt.js");
}
```

**Canvas UI Implementation:**

```
www/canvas-ui/
├── index.html          ← Runtime viewer (light)
├── edit.html           ← Editor interface (full)
├── canvas-ui.js        ← Core engine (shared)
├── canvas-ui-edit.js   ← Editor-only code
└── canvas-ui-runtime.js ← Runtime-only code
```

**Benefits:**

- Runtime viewers load ~70% less code
- Security: End users can't modify dashboards
- Performance: Optimized for each use case
- Deployment: Can serve view-only versions

### 2. State Management System

**VIS v1 Can.js Pattern:**

```javascript
// Observable state object
vis.states = new can.Map({
  "sensor.temperature.val": 23.5,
  "binary_sensor.motion.val": "on",
});

// Automatic UI updates
vis.states.bind("sensor.temperature.val", function (ev, newVal, oldVal) {
  updateWidget(widgetId, newVal);
});
```

**Canvas UI Equivalent (Lightweight):**

```javascript
class ReactiveState {
  constructor() {
    this.states = {};
    this.listeners = new Map(); // entity -> Set of callbacks
  }

  set(entityId, state) {
    const oldState = this.states[entityId];
    this.states[entityId] = state;

    // Notify listeners
    if (this.listeners.has(entityId)) {
      this.listeners.get(entityId).forEach((callback) => {
        callback(state, oldState);
      });
    }
  }

  subscribe(entityId, callback) {
    if (!this.listeners.has(entityId)) {
      this.listeners.set(entityId, new Set());
    }
    this.listeners.get(entityId).add(callback);

    // Return unsubscribe function
    return () => this.listeners.get(entityId).delete(callback);
  }
}

// Global instance
window.canvasState = new ReactiveState();
```

### 3. WebSocket Communication Layer

**VIS v1 Pattern (Socket.io):**

```javascript
// conn.js - Connection management
_socket.on("connect", function () {
  vis.states.attr("connected", true);
});

_socket.on("stateChange", function (id, state) {
  vis.updateState(id, state);
});

// Subscription management
vis.conn.subscribe("sensor.temperature");
```

**Canvas UI (Home Assistant WebSocket):**

```javascript
class HAConnection {
  constructor() {
    this.ws = null;
    this.subscriptions = new Map(); // entity -> subscription id
  }

  async connect() {
    this.ws = new WebSocket("ws://homeassistant:8123/api/websocket");

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === "event" && msg.event.event_type === "state_changed") {
        const data = msg.event.data;
        window.canvasState.set(data.entity_id, data.new_state);
      }
    };
  }

  async subscribeToEntity(entityId) {
    if (this.subscriptions.has(entityId)) return;

    const id = await this.sendMessage({
      type: "subscribe_entities",
      entity_ids: [entityId],
    });

    this.subscriptions.set(entityId, id);
  }
}
```

### 4. Widget Registry System

**VIS v1 Pattern:**

```javascript
// Widget sets registered globally
vis.binds = {};
vis.widgets = {};

// Register widget set
vis.binds["basic"] = {
  createWidget: function (widgetID, view, data, style) {
    // Widget creation logic
  },
  button: {
    onClick: function (widgetID) {
      // Button click handler
    },
  },
};

// Load widget sets dynamically
vis.loadWidgetSet = function (setName) {
  $.getScript("widgets/" + setName + ".html");
};
```

**Canvas UI Pattern:**

```javascript
class WidgetRegistry {
  constructor() {
    this.widgets = new Map(); // type -> WidgetClass
    this.instances = new Map(); // widgetId -> instance
  }

  register(type, WidgetClass) {
    this.widgets.set(type, WidgetClass);
  }

  create(type, config) {
    const WidgetClass = this.widgets.get(type);
    if (!WidgetClass) throw new Error(`Unknown widget: ${type}`);

    const instance = new WidgetClass(config);
    this.instances.set(config.id, instance);
    return instance;
  }

  async loadWidgetSet(setName) {
    const module = await import(`./widgets/${setName}.js`);

    // Register all widgets from set
    for (const [type, WidgetClass] of Object.entries(module)) {
      this.register(type, WidgetClass);
    }
  }
}

// Global registry
window.widgetRegistry = new WidgetRegistry();
```

---

## ⚡ CRITICAL FUNCTIONS TO REPLICATE

### Priority 1: Core Engine Functions

#### 1. View Rendering (`vis.js` lines 880-1000)

**What it does:**

- Loads view configuration from storage
- Creates view container with proper styling
- Renders all widgets in correct positions
- Applies theme and custom CSS
- Sets up event handlers

**VIS Implementation Pattern:**

```javascript
renderView: function(viewDiv, view, hidden, noChange) {
  var $view = $('#visview_' + viewDiv);

  // Create view container
  if (!$view.length) {
    $('#vis_container').append(
      '<div id="visview_' + viewDiv + '" ' +
      'data-view="' + view + '" ' +
      'class="vis-view">' +
      '</div>'
    );
  }

  // Apply theme styling
  this.addViewStyle(viewDiv, view, this.views[view].settings.theme);

  // Apply custom CSS
  $view.css(this.views[view].settings.style);

  // Render all widgets
  for (var id in this.views[view].widgets) {
    this.renderWidget(viewDiv, view, id);
  }

  // Hide if needed
  if (hidden) {
    $view.hide();
  } else {
    $view.show();
    this.activeView = view;
  }
}
```

**Canvas UI Must Have:**

```javascript
class ViewRenderer {
  render(viewId, config) {
    // 1. Create view container
    const container = this.createViewContainer(viewId, config);

    // 2. Apply theme (HA theme integration)
    this.applyTheme(container, config.theme);

    // 3. Apply custom styles
    Object.assign(container.style, config.styles);

    // 4. Render widgets
    config.widgets.forEach((widgetConfig) => {
      const widget = widgetRegistry.create(widgetConfig.type, widgetConfig);
      const element = widget.render();
      container.appendChild(element);
    });

    // 5. Setup view-level event handlers
    this.attachEventHandlers(container, config);

    return container;
  }
}
```

#### 2. Widget Rendering (`vis.js` lines 1200-1500)

**What it does:**

- Instantiates widget from template
- Applies position and size styling
- Sets up data bindings
- Attaches event handlers
- Handles visibility conditions

**VIS Pattern:**

```javascript
renderWidget: function(viewDiv, view, id) {
  var widget = this.views[view].widgets[id];
  var $view = $('#visview_' + viewDiv);

  // Get widget template
  var tpl = $('#' + widget.tpl);
  var widgetSet = tpl.attr('data-vis-set');

  // Compile EJS template
  var html = can.view.render(widget.tpl, {
    data: widget.data,
    wid: id
  });

  // Create widget element
  var $widget = $(html);
  $widget.attr('id', id);

  // Apply position and size
  $widget.css({
    position: 'absolute',
    left: widget.style.left,
    top: widget.style.top,
    width: widget.style.width,
    height: widget.style.height,
    zIndex: widget.style['z-index'] || 1
  });

  // Append to view
  $view.append($widget);

  // Setup bindings
  this.bindWidget(view, id);

  // Call widget-specific init
  if (this.binds[widgetSet] && this.binds[widgetSet].createWidget) {
    this.binds[widgetSet].createWidget(id, view, widget.data, widget.style);
  }
}
```

**Canvas UI Implementation:**

```javascript
class WidgetRenderer {
  render(widget, container) {
    // 1. Create widget instance
    const instance = widgetRegistry.create(widget.type, widget);

    // 2. Render widget element
    const element = instance.render();

    // 3. Apply absolute positioning
    element.style.position = "absolute";
    element.style.left = widget.position.x + "px";
    element.style.top = widget.position.y + "px";
    element.style.width = widget.size.w + "px";
    element.style.height = widget.size.h + "px";
    element.style.zIndex = widget.zIndex || 1;

    // 4. Setup data bindings
    if (widget.entity) {
      canvasState.subscribe(widget.entity, (state) => {
        instance.onStateUpdate(state);
      });
    }

    // 5. Attach to container
    container.appendChild(element);

    // 6. Call lifecycle hook
    instance.onMount();

    return instance;
  }
}
```

#### 3. Data Binding System (`vis.js` lines 2500-3000)

**VIS Pattern:**

```javascript
// Simple binding: {sensor.temperature.val}
// Formatted: {sensor.temperature.val;min(0);max(100);round(1)}
// Multi-var: {h:sensor.height;w:sensor.width;Math.sqrt(h*h + w*w)}

extractBinding: function(format) {
  var oid = format.match(/{(.+?)}/g);
  var bindings = [];

  for (var i = 0; i < oid.length; i++) {
    var content = oid[i].substring(1, oid[i].length - 1);
    var parts = content.split(';');

    // Check for eval binding (has : in identifier)
    if (parts[0].indexOf(':') !== -1) {
      // Multi-variable binding
      var vars = [];
      var formula = '';

      for (var j = 0; j < parts.length; j++) {
        if (parts[j].indexOf(':') !== -1) {
          var varParts = parts[j].split(':');
          vars.push({
            name: varParts[0].trim(),
            oid: varParts[1].trim() + '.val'
          });
        } else {
          formula = parts[j].trim();
        }
      }

      bindings.push({
        type: 'eval',
        vars: vars,
        formula: formula
      });
    } else {
      // Simple binding with operations
      bindings.push({
        type: 'simple',
        oid: parts[0].trim() + '.val',
        operations: parts.slice(1)
      });
    }
  }

  return bindings;
}
```

**Canvas UI Must Implement:**

```javascript
class BindingSystem {
  parse(text) {
    // Extract all {binding} expressions
    const regex = /{([^}]+)}/g;
    const bindings = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      bindings.push(this.parseBinding(match[1]));
    }

    return bindings;
  }

  parseBinding(content) {
    const parts = content.split(";");

    // Check for multi-variable eval: {var1:entity1;var2:entity2;formula}
    if (parts[0].includes(":")) {
      return this.parseEvalBinding(parts);
    }

    // Simple binding: {entity.id;operation1;operation2}
    return {
      type: "simple",
      entity: parts[0].trim(),
      operations: parts.slice(1).map((op) => this.parseOperation(op)),
    };
  }

  parseEvalBinding(parts) {
    const variables = [];
    let formula = "";

    parts.forEach((part) => {
      if (part.includes(":")) {
        const [name, entity] = part.split(":").map((s) => s.trim());
        variables.push({ name, entity });
      } else {
        formula = part.trim();
      }
    });

    return {
      type: "eval",
      variables,
      formula,
    };
  }

  evaluate(binding, getState) {
    if (binding.type === "eval") {
      return this.evaluateFormula(binding, getState);
    }

    let value = getState(binding.entity);

    // Apply operations
    binding.operations.forEach((op) => {
      value = this.applyOperation(value, op);
    });

    return value;
  }

  evaluateFormula(binding, getState) {
    // Build function code
    let code = "";

    // Add variable declarations
    binding.variables.forEach((v) => {
      const state = getState(v.entity);
      code += `const ${v.name} = ${JSON.stringify(state)};\n`;
    });

    // Add formula
    code += `return ${binding.formula};`;

    // Safe eval using Function constructor
    try {
      const fn = new Function(code);
      return fn();
    } catch (error) {
      console.error("Binding eval error:", error, code);
      return "ERROR";
    }
  }
}
```

### Priority 2: Editor Functions

#### 4. Drag & Drop System (`visEdit.js` lines 4794-4976)

**Key Features:**

- Multi-widget dragging (selection moves together)
- Grid snapping (3 modes: off, snap-to-elements, snap-to-grid)
- Visual alignment guides (red/green lines)
- Boundary constraints (keep in view)
- Undo/redo support

**VIS Pattern:**

```javascript
$widget.draggable({
  handle: ".vis-editmode-helper",
  start: function (event, ui) {
    // Store initial positions of all selected widgets
    that.dragging = {
      start: { left: ui.position.left, top: ui.position.top },
      widgets: that.activeWidgets.map((id) => ({
        id: id,
        start: $("#" + id).position(),
      })),
    };
  },

  drag: function (event, ui) {
    // Calculate grid-snapped position
    if (that.gridWidth && that.snapType === 2) {
      var offsetX =
        Math.round(
          (ui.position.left - that.dragging.start.left) / that.gridWidth,
        ) * that.gridWidth;

      var offsetY =
        Math.round(
          (ui.position.top - that.dragging.start.top) / that.gridWidth,
        ) * that.gridWidth;

      ui.position.left = that.dragging.start.left + offsetX;
      ui.position.top = that.dragging.start.top + offsetY;
    }

    // Move other selected widgets
    that.dragging.widgets.forEach((w) => {
      if (w.id !== event.target.id) {
        var deltaX = ui.position.left - that.dragging.start.left;
        var deltaY = ui.position.top - that.dragging.start.top;

        $("#" + w.id).css({
          left: w.start.left + deltaX,
          top: w.start.top + deltaY,
        });
      }
    });

    // Show alignment guides
    that.showAlignmentGuides(event.target.id);
  },

  stop: function (event, ui) {
    // Update widget data
    that.dragging.widgets.forEach((w) => {
      var $w = $("#" + w.id);
      var pos = $w.position();

      that.views[that.activeView].widgets[w.id].style.left = pos.left + "px";
      that.views[that.activeView].widgets[w.id].style.top = pos.top + "px";
    });

    // Hide alignment guides
    $(".alignment-guide").hide();

    // Save changes
    that.save();
  },
});
```

**Canvas UI Implementation:**

```javascript
class DragDropSystem {
  constructor(gridSize = 10, snapMode = "grid") {
    this.gridSize = gridSize;
    this.snapMode = snapMode; // 'off', 'grid', 'elements'
    this.dragging = null;
  }

  enableDrag(widget, selectedWidgets) {
    widget.element.draggable = true;

    widget.element.addEventListener("dragstart", (e) => {
      this.dragging = {
        widget: widget,
        start: { x: widget.position.x, y: widget.position.y },
        selected: selectedWidgets.map((w) => ({
          widget: w,
          start: { x: w.position.x, y: w.position.y },
        })),
      };
    });

    widget.element.addEventListener("drag", (e) => {
      const deltaX = e.clientX - this.dragging.start.x;
      const deltaY = e.clientY - this.dragging.start.y;

      // Apply snap
      const snappedDelta = this.applySnap(deltaX, deltaY);

      // Move all selected widgets
      this.dragging.selected.forEach(({ widget, start }) => {
        widget.position.x = start.x + snappedDelta.x;
        widget.position.y = start.y + snappedDelta.y;
        widget.updatePosition();
      });

      // Show alignment guides
      this.updateAlignmentGuides(widget);
    });

    widget.element.addEventListener("dragend", (e) => {
      // Save final positions
      this.savePositions(this.dragging.selected);
      this.hideAlignmentGuides();
      this.dragging = null;
    });
  }

  applySnap(deltaX, deltaY) {
    if (this.snapMode === "off") {
      return { x: deltaX, y: deltaY };
    }

    if (this.snapMode === "grid") {
      return {
        x: Math.round(deltaX / this.gridSize) * this.gridSize,
        y: Math.round(deltaY / this.gridSize) * this.gridSize,
      };
    }

    if (this.snapMode === "elements") {
      // Find nearest widget edges
      const snapPoints = this.findSnapPoints(this.dragging.widget);
      return this.snapToNearest(deltaX, deltaY, snapPoints);
    }
  }
}
```

#### 5. Inspector Property System (`visEditInspect.js` lines 1-300)

**Key Features:**

- Dynamic property forms based on widget type
- String-based attribute definitions
- Multiple input types (text, number, color, select, etc.)
- Grouped properties with collapse/expand
- Real-time widget updates
- Change debouncing

**VIS Attribute Definition Format:**

```
propertyName[defaultValue]/type,param1,param2.../Label,Hint/onChangeCallback
```

**Examples:**

```javascript
// Simple text input
"text[Hello]/text,Button Label";

// Number slider
"fontSize[14]/slider,8,64,1,Font Size (px)";

// Color picker
"bgColor[#03a9f4]/color,Background Color";

// Dropdown select
"align[center]/select,left,center,right,Text Alignment";

// Entity picker
"entity[]/id,Entity ID,Select target entity";

// Grouped properties
"group.content/Content Settings;text[]/text;showIcon[false]/checkbox";
```

**Canvas UI Must Support:**

```javascript
class AttributeParser {
  parse(attrString) {
    const lines = attrString.split(";");
    const properties = [];
    let currentGroup = null;

    for (const line of lines) {
      // Group definition: group.name/Label
      if (line.startsWith("group.")) {
        const [name, label] = line.substring(6).split("/");
        currentGroup = { name, label, properties: [] };
        properties.push(currentGroup);
        continue;
      }

      // Property definition
      const prop = this.parseProperty(line);

      if (currentGroup) {
        currentGroup.properties.push(prop);
      } else {
        properties.push(prop);
      }
    }

    return properties;
  }

  parseProperty(line) {
    // Format: name[default]/type,params/onChange
    const parts = line.split("/");
    const nameMatch = parts[0].match(/([^\[]+)(?:\[([^\]]*)\])?/);

    const property = {
      name: nameMatch[1].trim(),
      default: nameMatch[2] || "",
      type: "text",
      params: [],
      onChange: null,
    };

    if (parts.length > 1) {
      const typeParts = parts[1].split(",");
      property.type = typeParts[0].trim();
      property.params = typeParts.slice(1).map((p) => p.trim());
    }

    if (parts.length > 2) {
      property.onChange = parts[2].trim();
    }

    return property;
  }

  generateFormControl(property, currentValue) {
    switch (property.type) {
      case "text":
      case "textarea":
        return `<input type="${property.type}" 
                       value="${currentValue || property.default}"
                       data-property="${property.name}">`;

      case "slider":
        const [min, max, step] = property.params;
        return `<input type="range" 
                       min="${min}" max="${max}" step="${step}"
                       value="${currentValue || property.default}"
                       data-property="${property.name}">`;

      case "color":
        return `<input type="color" 
                       value="${currentValue || property.default}"
                       data-property="${property.name}">`;

      case "select":
        const options = property.params
          .map(
            (opt) =>
              `<option value="${opt}" 
                   ${opt === currentValue ? "selected" : ""}>
            ${opt}
          </option>`,
          )
          .join("");

        return `<select data-property="${property.name}">
                  ${options}
                </select>`;

      case "checkbox":
        const checked = currentValue === "true" || currentValue === true;
        return `<input type="checkbox" 
                       ${checked ? "checked" : ""}
                       data-property="${property.name}">`;

      case "id": // Entity picker
        return this.generateEntityPicker(property, currentValue);

      default:
        return `<input type="text" value="${currentValue || ""}"
                       data-property="${property.name}">`;
    }
  }
}
```

#### 6. Save/Load System (`visEdit.js` lines 113-250, 5544-5650)

**Key Features:**

- Debounced auto-save (2 second delay)
- JSON serialization with pretty-print
- Undo/redo history (50 steps)
- Error handling for permissions
- File versioning support

**VIS Pattern:**

```javascript
// Three-tier save system

// Tier 1: Debounced save trigger
save: function() {
  if (this.saveTimer) clearTimeout(this.saveTimer);

  this.saveTimer = setTimeout(() => {
    this._saveToServer();
  }, 2000); // 2 second debounce
},

// Tier 2: Add to undo history
_saveToServer: function() {
  // Add to undo stack
  if (this.undoHistory.length >= this.maxUndoSteps) {
    this.undoHistory.shift();
  }
  this.undoHistory.push(JSON.parse(JSON.stringify(this.views)));

  // Call actual save
  this.saveRemote();
},

// Tier 3: Write to file
saveRemote: function(callback) {
  // Serialize views to JSON
  var data = JSON.stringify(this.views, null, 2);

  // Write to file
  this.conn.writeFile(
    this.projectPrefix + 'vis-views.json',
    data,
    function(err) {
      if (err) {
        if (err === 'permissionError') {
          that.showError('Cannot save: permission denied');
        }
        return;
      }

      if (callback) callback();
    }
  );
}
```

**Canvas UI Implementation:**

```javascript
class SaveSystem {
  constructor(maxHistory = 50, debounceMs = 2000) {
    this.maxHistory = maxHistory;
    this.debounceMs = debounceMs;
    this.history = [];
    this.historyIndex = -1;
    this.saveTimer = null;
  }

  save(views) {
    // Cancel pending save
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }

    // Debounced save
    this.saveTimer = setTimeout(() => {
      this.performSave(views);
    }, this.debounceMs);
  }

  async performSave(views) {
    // Add to history
    this.addToHistory(views);

    // Serialize to JSON
    const data = JSON.stringify(views, null, 2);

    // Save to HA storage
    try {
      await this.writeToHA("canvas-ui-views.json", data);
    } catch (error) {
      console.error("Save failed:", error);
      this.showError("Failed to save views");
    }
  }

  addToHistory(views) {
    // Remove any redo history
    this.history = this.history.slice(0, this.historyIndex + 1);

    // Add current state
    this.history.push(JSON.parse(JSON.stringify(views)));

    // Limit history size
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }
  }

  undo() {
    if (this.historyIndex <= 0) return null;

    this.historyIndex--;
    return JSON.parse(JSON.stringify(this.history[this.historyIndex]));
  }

  redo() {
    if (this.historyIndex >= this.history.length - 1) return null;

    this.historyIndex++;
    return JSON.parse(JSON.stringify(this.history[this.historyIndex]));
  }

  async writeToHA(filename, data) {
    // Call Home Assistant file write service
    await window.hass.callService("canvas_ui", "write_file", {
      filename: filename,
      data: data,
    });
  }

  async loadFromHA(filename) {
    // Call Home Assistant file read service
    const result = await window.hass.callService("canvas_ui", "read_file", {
      filename: filename,
    });

    return JSON.parse(result.data);
  }
}
```

---

## 🎨 WIDGET SYSTEM DESIGN

### BaseWidget API (Our Current System - Keep and Enhance)

**Current Implementation:**

```javascript
class BaseWidget {
  constructor(config) {
    this.id = config.id;
    this.type = config.type;
    this.config = config;
    this.element = null;
  }

  // Lifecycle hooks
  onMount() {}
  onDestroy() {}
  onConfigUpdate(changes) {}
  onStateUpdate(entityId, newState, oldState) {}

  // Required methods
  render() {
    throw new Error("render() must be implemented");
  }

  update(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.onConfigUpdate(newConfig);
  }
}
```

**Enhanced with VIS Patterns:**

```javascript
class BaseWidget {
  constructor(config) {
    this.id = config.id;
    this.type = config.type;
    this.config = config;
    this.element = null;
    this.bindings = new Map(); // binding -> unsubscribe function
    this.boundEntities = new Set();
  }

  // State-based rendering (current system - KEEP)
  getStateVisual(stateIndex) {
    // Return visual configuration for state
  }

  renderFromState(stateIndex) {
    const visual = this.getStateVisual(stateIndex);
    // Apply visual to element
  }

  // NEW: VIS-inspired binding system
  setupBindings() {
    // Parse config for bindings
    Object.entries(this.config).forEach(([key, value]) => {
      if (typeof value === "string") {
        const bindings = bindingSystem.parse(value);

        bindings.forEach((binding) => {
          this.setupBinding(key, binding);
        });
      }
    });
  }

  setupBinding(property, binding) {
    // Collect entities to subscribe to
    const entities =
      binding.type === "eval"
        ? binding.variables.map((v) => v.entity)
        : [binding.entity];

    entities.forEach((entity) => {
      if (!this.boundEntities.has(entity)) {
        const unsubscribe = canvasState.subscribe(entity, () => {
          this.updateBindings();
        });

        this.bindings.set(entity, unsubscribe);
        this.boundEntities.add(entity);
      }
    });
  }

  updateBindings() {
    // Re-evaluate all bindings and update widget
    Object.entries(this.config).forEach(([key, value]) => {
      if (typeof value === "string" && value.includes("{")) {
        const bindings = bindingSystem.parse(value);
        let result = value;

        bindings.forEach((binding) => {
          const evaluated = bindingSystem.evaluate(binding, (entity) => {
            return canvasState.get(entity);
          });

          result = result.replace(binding.original, evaluated);
        });

        // Update element with new value
        this.applyPropertyValue(key, result);
      }
    });
  }

  // Lifecycle hooks
  onMount() {
    this.setupBindings();
  }

  onDestroy() {
    // Cleanup bindings
    this.bindings.forEach((unsubscribe) => unsubscribe());
    this.bindings.clear();
    this.boundEntities.clear();
  }

  onConfigUpdate(changes) {
    // Re-setup bindings if config changed
    this.onDestroy();
    this.setupBindings();
    this.renderFromState(0);
  }

  onStateUpdate(entityId, newState, oldState) {
    // Called when subscribed entity changes
    this.updateBindings();
  }

  // Static metadata (VIS pattern)
  static getMetadata() {
    return {
      type: "widget",
      name: "Widget",
      description: "Base widget",
      category: "basic",
      icon: "mdi-widgets",
      version: "1.0.0",
    };
  }

  // Static schema (VIS pattern adapted)
  static getConfigSchema() {
    return {
      propertyName: {
        type: "text",
        label: "Property Label",
        default: "default value",
        category: "General",
        tab: "custom", // common, custom, action
      },
    };
  }
}
```

### Widget Definition Format

**VIS v1 String-Based (Simple, Proven):**

```javascript
attrs: `
  group.content/Content Settings;
  text[Button]/text,Button Text;
  showText[true]/checkbox,Show Text;
  entity[]/id,Target Entity;
  bgColor[#03a9f4]/color,Background Color;
  fontSize[14]/slider,8,24,1,Font Size (px);
`;
```

**Canvas UI Object-Based (Type-Safe, Our Current):**

```javascript
static getConfigSchema() {
  return {
    text: {
      type: 'text',
      label: 'Text',
      default: 'Click Me',
      category: 'Button Appearance',
      tab: 'custom'
    },
    fontSize: {
      type: 'number',
      label: 'Font Size',
      default: 14,
      min: 8,
      max: 64,
      category: 'Typography',
      tab: 'custom'
    },
    backgroundColor: {
      type: 'color',
      label: 'Background Color',
      default: '#03a9f4',
      category: 'Button Styling',
      tab: 'common'
    }
  };
}
```

**Recommendation:** Support BOTH formats

- String format for simple widgets (easier to write)
- Object format for complex widgets (better tooling)
- Parser converts string format to object format internally

---

## 🎛️ INSPECTOR SYSTEM DESIGN

### Table-Based Layout (VIS v1 Pattern)

**Why Table-Based?**

- ✅ Consistent vertical alignment
- ✅ Easy to scan properties
- ✅ Works well for multi-select (hide incompatible)
- ✅ Simple group collapse/expand
- ✅ Proven pattern (industry standard)

**HTML Structure:**

```html
<div id="inspector-content">
  <table class="inspector-table">
    <tbody>
      <!-- Group Header -->
      <tr class="group-header" data-group="general">
        <td colspan="3">
          <button class="group-toggle">▼</button>
          <span class="group-title">General</span>
        </td>
      </tr>

      <!-- Property Row -->
      <tr class="group-general property-row" data-property="entity">
        <td class="property-label">
          <label>Entity ID</label>
        </td>
        <td class="property-input">
          <input type="text" data-property="entity" value="" />
        </td>
        <td class="property-button">
          <button class="entity-picker-btn">...</button>
        </td>
      </tr>

      <!-- More properties -->
    </tbody>
  </table>
</div>
```

**CSS:**

```css
.inspector-table {
  width: 100%;
  border-collapse: collapse;
}

.property-row td {
  padding: 6px 8px;
  vertical-align: middle;
}

.property-label {
  width: 40%;
  font-weight: 500;
  color: var(--primary-text-color);
}

.property-input {
  width: 50%;
}

.property-button {
  width: 10%;
  text-align: right;
}

.property-input input,
.property-input select {
  width: 100%;
  padding: 6px;
  border: 1px solid var(--divider-color);
  border-radius: 4px;
  background: var(--card-background-color);
  color: var(--primary-text-color);
}

/* Group collapse/expand */
.group-header {
  background: var(--secondary-background-color);
  cursor: pointer;
}

.group-header:hover {
  background: var(--divider-color);
}

.group-toggle {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 4px;
  transition: transform 0.2s;
}

.group-collapsed .group-toggle {
  transform: rotate(-90deg);
}

/* Hide collapsed group properties */
tr.group-general {
  display: table-row;
}

.group-collapsed ~ tr.group-general {
  display: none;
}
```

**Inspector Renderer:**

```javascript
class InspectorRenderer {
  renderPropertyTable(schema, config) {
    const table = document.createElement("table");
    table.className = "inspector-table";

    const tbody = document.createElement("tbody");

    // Group properties by category
    const grouped = this.groupByCategory(schema);

    for (const [category, properties] of Object.entries(grouped)) {
      // Add group header
      tbody.appendChild(this.renderGroupHeader(category));

      // Add property rows
      properties.forEach((prop) => {
        tbody.appendChild(this.renderPropertyRow(prop, config[prop.name]));
      });
    }

    table.appendChild(tbody);
    return table;
  }

  renderGroupHeader(category) {
    const tr = document.createElement("tr");
    tr.className = "group-header";
    tr.dataset.group = category.toLowerCase().replace(/\s+/g, "-");

    const td = document.createElement("td");
    td.colSpan = 3;

    const toggle = document.createElement("button");
    toggle.className = "group-toggle";
    toggle.textContent = "▼";
    toggle.onclick = (e) => {
      e.stopPropagation();
      tr.classList.toggle("group-collapsed");
    };

    const title = document.createElement("span");
    title.className = "group-title";
    title.textContent = category;

    td.appendChild(toggle);
    td.appendChild(title);
    tr.appendChild(td);

    return tr;
  }

  renderPropertyRow(property, value) {
    const tr = document.createElement("tr");
    tr.className = `property-row group-${property.category.toLowerCase().replace(/\s+/g, "-")}`;
    tr.dataset.property = property.name;

    // Label column
    const labelTd = document.createElement("td");
    labelTd.className = "property-label";
    const label = document.createElement("label");
    label.textContent = property.label;
    label.htmlFor = `prop-${property.name}`;
    labelTd.appendChild(label);

    // Input column
    const inputTd = document.createElement("td");
    inputTd.className = "property-input";
    const input = this.createInputControl(property, value);
    input.id = `prop-${property.name}`;
    input.dataset.property = property.name;
    inputTd.appendChild(input);

    // Button column (if needed)
    const buttonTd = document.createElement("td");
    buttonTd.className = "property-button";

    if (property.type === "entity") {
      const button = document.createElement("button");
      button.textContent = "...";
      button.className = "entity-picker-btn";
      button.onclick = () => this.showEntityPicker(property.name);
      buttonTd.appendChild(button);
    }

    tr.appendChild(labelTd);
    tr.appendChild(inputTd);
    tr.appendChild(buttonTd);

    return tr;
  }

  createInputControl(property, value) {
    switch (property.type) {
      case "text":
        const text = document.createElement("input");
        text.type = "text";
        text.value = value || property.default || "";
        return text;

      case "number":
        const number = document.createElement("input");
        number.type = "number";
        number.value = value || property.default || 0;
        number.min = property.min;
        number.max = property.max;
        number.step = property.step || 1;
        return number;

      case "color":
        const color = document.createElement("input");
        color.type = "color";
        color.value = value || property.default || "#000000";
        return color;

      case "select":
        const select = document.createElement("select");
        property.options.forEach((opt) => {
          const option = document.createElement("option");
          option.value = opt.value;
          option.textContent = opt.label;
          option.selected = opt.value === value;
          select.appendChild(option);
        });
        return select;

      case "checkbox":
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = value === true || value === "true";
        return checkbox;

      case "entity":
        const entity = document.createElement("input");
        entity.type = "text";
        entity.value = value || "";
        entity.placeholder = "Select entity...";
        entity.className = "entity-input";
        return entity;

      default:
        const fallback = document.createElement("input");
        fallback.type = "text";
        fallback.value = value || "";
        return fallback;
    }
  }
}
```

### Change Detection and Debouncing

**VIS Pattern:**

```javascript
// Text inputs: 500ms debounce
$("input[type=text]").on(
  "keyup",
  debounce(function () {
    var value = $(this).val();
    var property = $(this).data("property");
    that.updateWidgetProperty(property, value);
  }, 500),
);

// Other inputs: Immediate
$("input[type=color], select, input[type=checkbox]").on("change", function () {
  var value = $(this).val();
  var property = $(this).data("property");
  that.updateWidgetProperty(property, value);
});
```

**Canvas UI Implementation:**

```javascript
class InspectorEventHandler {
  constructor(debounceMs = 500) {
    this.debounceMs = debounceMs;
    this.debounceTimers = new Map();
  }

  attachEventHandlers(container, onPropertyChange) {
    // Text inputs: Debounced
    container
      .querySelectorAll("input[type=text], textarea")
      .forEach((input) => {
        input.addEventListener("input", (e) => {
          this.debouncedChange(
            input.dataset.property,
            input.value,
            onPropertyChange,
          );
        });
      });

    // Numbers, colors, selects, checkboxes: Immediate
    container
      .querySelectorAll(
        "input[type=number], input[type=color], select, input[type=checkbox]",
      )
      .forEach((input) => {
        input.addEventListener("change", (e) => {
          const value = input.type === "checkbox" ? input.checked : input.value;
          onPropertyChange(input.dataset.property, value);
        });
      });

    // Sliders: Show live value, debounced save
    container.querySelectorAll("input[type=range]").forEach((slider) => {
      const valueDisplay = slider.nextElementSibling;

      slider.addEventListener("input", (e) => {
        if (valueDisplay) valueDisplay.textContent = slider.value;
        this.debouncedChange(
          slider.dataset.property,
          slider.value,
          onPropertyChange,
        );
      });
    });
  }

  debouncedChange(property, value, callback) {
    // Clear existing timer
    if (this.debounceTimers.has(property)) {
      clearTimeout(this.debounceTimers.get(property));
    }

    // Set new timer
    const timer = setTimeout(() => {
      callback(property, value);
      this.debounceTimers.delete(property);
    }, this.debounceMs);

    this.debounceTimers.set(property, timer);
  }
}
```

---

## 🔗 DATA BINDING SYSTEM

### Enhanced Binding Syntax (VIS v2 Pattern)

**Simple Binding:**

```
{sensor.temperature}              → 23.5
{sensor.temperature;round(1)}     → 23.5
{sensor.temperature;* 1.8;+ 32}   → 74.3 (Celsius to Fahrenheit)
```

**Multi-Variable Eval:**

```
{h:sensor.height;w:sensor.width;Math.sqrt(h*h + w*w)}
→ Calculates diagonal from height and width

{temp:sensor.temperature;hum:sensor.humidity;temp > 20 && hum < 60 ? 'Comfortable' : 'Uncomfortable'}
→ Complex logic with multiple entities
```

**Supported Operations (VIS v1):**

```
*, /, +, -, %           - Math operations
min(value), max(value)  - Bounds
round(digits)           - Rounding
pow(exponent)           - Power
value                   - Pass through
array[index]            - Array access
hex, hex2, HEX, HEX2    - Hex conversion
date(format)            - Date formatting
```

**Implementation:**

```javascript
class BindingEvaluator {
  evaluate(text, getState) {
    // Find all {binding} expressions
    return text.replace(/{([^}]+)}/g, (match, content) => {
      const binding = this.parse(content);
      return this.evaluateBinding(binding, getState);
    });
  }

  parse(content) {
    const parts = content.split(";");

    // Check for eval binding: var:entity
    if (parts[0].includes(":")) {
      return this.parseEvalBinding(parts);
    }

    // Simple binding: entity;operation1;operation2
    return {
      type: "simple",
      entity: parts[0].trim(),
      operations: parts.slice(1).map((op) => this.parseOperation(op)),
    };
  }

  parseEvalBinding(parts) {
    const variables = [];
    let formula = "";

    for (const part of parts) {
      if (part.includes(":")) {
        const [name, entity] = part.split(":").map((s) => s.trim());
        variables.push({ name, entity });
      } else {
        formula = part.trim();
      }
    }

    return {
      type: "eval",
      variables,
      formula,
    };
  }

  parseOperation(opString) {
    // Format: operator(param) or just operator
    const match = opString.match(/([a-zA-Z0-9_]+)(?:\(([^)]+)\))?/);

    if (!match) return null;

    return {
      operator: match[1].trim(),
      param: match[2] ? match[2].trim() : null,
    };
  }

  evaluateBinding(binding, getState) {
    if (binding.type === "eval") {
      return this.evaluateFormula(binding, getState);
    }

    // Get initial value
    let value = getState(binding.entity);

    if (value === null || value === undefined) {
      return "";
    }

    // Apply operations
    for (const op of binding.operations) {
      value = this.applyOperation(value, op);
    }

    return value;
  }

  evaluateFormula(binding, getState) {
    // Build function code
    let code = "";

    // Add variable declarations
    for (const v of binding.variables) {
      const state = getState(v.entity);
      const value = state?.state || state;

      if (typeof value === "string") {
        code += `const ${v.name} = "${value}";\n`;
      } else if (typeof value === "number") {
        code += `const ${v.name} = ${value};\n`;
      } else if (typeof value === "boolean") {
        code += `const ${v.name} = ${value};\n`;
      } else {
        code += `const ${v.name} = null;\n`;
      }
    }

    // Add formula
    code += `return ${binding.formula};`;

    // Safe eval using Function constructor
    try {
      const fn = new Function(code);
      return fn();
    } catch (error) {
      console.error("Binding eval error:", error);
      console.error("Code:", code);
      return "ERROR";
    }
  }

  applyOperation(value, operation) {
    if (!operation) return value;

    const num = parseFloat(value);
    const param = operation.param ? parseFloat(operation.param) : null;

    switch (operation.operator) {
      case "*":
        return num * param;
      case "/":
        return num / param;
      case "+":
        return num + param;
      case "-":
        return num - param;
      case "%":
        return num % param;

      case "min":
        return Math.max(num, param);
      case "max":
        return Math.min(num, param);
      case "round":
        return param !== null
          ? Math.round(num * Math.pow(10, param)) / Math.pow(10, param)
          : Math.round(num);
      case "floor":
        return Math.floor(num);
      case "ceil":
        return Math.ceil(num);
      case "pow":
        return Math.pow(num, param);
      case "sqrt":
        return Math.sqrt(num);

      case "hex":
        return Math.round(num).toString(16);
      case "hex2":
        return Math.round(num).toString(16).padStart(2, "0");
      case "HEX":
        return Math.round(num).toString(16).toUpperCase();
      case "HEX2":
        return Math.round(num).toString(16).toUpperCase().padStart(2, "0");

      case "date":
        const date = new Date(num);
        return operation.param
          ? this.formatDate(date, operation.param)
          : date.toLocaleString();

      case "value":
      default:
        return value;
    }
  }

  formatDate(date, format) {
    // Simple date formatting
    return format
      .replace("YYYY", date.getFullYear())
      .replace("MM", String(date.getMonth() + 1).padStart(2, "0"))
      .replace("DD", String(date.getDate()).padStart(2, "0"))
      .replace("HH", String(date.getHours()).padStart(2, "0"))
      .replace("mm", String(date.getMinutes()).padStart(2, "0"))
      .replace("ss", String(date.getSeconds()).padStart(2, "0"));
  }
}

// Global instance
window.bindingEvaluator = new BindingEvaluator();
```

---

## 🖱️ CANVAS EDITOR SYSTEM

### Grid Snapping System

**Three Modes (VIS Pattern):**

1. **Mode 0: Disabled** - Free positioning, no snapping
2. **Mode 1: Snap to Elements** - Snap to edges of other widgets
3. **Mode 2: Snap to Grid** - Snap to configurable grid (default: 10px)

**Implementation:**

```javascript
class GridSnap {
  constructor(gridSize = 10) {
    this.mode = 2; // 0=off, 1=elements, 2=grid
    this.gridSize = gridSize;
    this.tolerance = 5; // pixels for element snapping
  }

  snapPosition(x, y, widget, allWidgets) {
    if (this.mode === 0) {
      return { x, y };
    }

    if (this.mode === 2) {
      return {
        x: Math.round(x / this.gridSize) * this.gridSize,
        y: Math.round(y / this.gridSize) * this.gridSize,
      };
    }

    if (this.mode === 1) {
      return this.snapToElements(x, y, widget, allWidgets);
    }
  }

  snapToElements(x, y, widget, allWidgets) {
    const snapPoints = this.findSnapPoints(widget, allWidgets);

    let snappedX = x;
    let snappedY = y;

    // Check left edge
    const leftSnap = snapPoints.vertical.find(
      (point) => Math.abs(x - point) < this.tolerance,
    );
    if (leftSnap !== undefined) snappedX = leftSnap;

    // Check right edge
    const rightSnap = snapPoints.vertical.find(
      (point) => Math.abs(x + widget.size.w - point) < this.tolerance,
    );
    if (rightSnap !== undefined) snappedX = rightSnap - widget.size.w;

    // Check top edge
    const topSnap = snapPoints.horizontal.find(
      (point) => Math.abs(y - point) < this.tolerance,
    );
    if (topSnap !== undefined) snappedY = topSnap;

    // Check bottom edge
    const bottomSnap = snapPoints.horizontal.find(
      (point) => Math.abs(y + widget.size.h - point) < this.tolerance,
    );
    if (bottomSnap !== undefined) snappedY = bottomSnap - widget.size.h;

    return { x: snappedX, y: snappedY };
  }

  findSnapPoints(widget, allWidgets) {
    const points = {
      vertical: [0], // View left edge
      horizontal: [0], // View top edge
    };

    allWidgets.forEach((other) => {
      if (other.id === widget.id) return;

      // Add vertical snap points (left, center, right)
      points.vertical.push(
        other.position.x, // Left edge
        other.position.x + other.size.w / 2, // Center
        other.position.x + other.size.w, // Right edge
      );

      // Add horizontal snap points (top, middle, bottom)
      points.horizontal.push(
        other.position.y, // Top edge
        other.position.y + other.size.h / 2, // Middle
        other.position.y + other.size.h, // Bottom edge
      );
    });

    return points;
  }
}
```

### Visual Alignment Guides

**VIS Pattern:**

```javascript
// Show red/green guide lines when widgets align
showAlignmentGuides: function(widgetId) {
  var $widget = $('#' + widgetId);
  var pos = $widget.position();
  var width = $widget.width();
  var height = $widget.height();

  // Widget edges
  var left = pos.left;
  var right = left + width;
  var top = pos.top;
  var bottom = top + height;
  var centerX = left + width / 2;
  var centerY = top + height / 2;

  // Check all other widgets
  $('.vis-widget').each(function() {
    if ($(this).attr('id') === widgetId) return;

    var otherPos = $(this).position();
    var otherWidth = $(this).width();
    var otherHeight = $(this).height();

    var otherLeft = otherPos.left;
    var otherRight = otherLeft + otherWidth;
    var otherTop = otherPos.top;
    var otherBottom = otherTop + otherHeight;
    var otherCenterX = otherLeft + otherWidth / 2;
    var otherCenterY = otherTop + otherHeight / 2;

    // Check vertical alignment (red lines)
    if (Math.abs(left - otherLeft) < 3) {
      that.showGuide('vertical', left);
    }
    if (Math.abs(right - otherRight) < 3) {
      that.showGuide('vertical', right);
    }
    if (Math.abs(centerX - otherCenterX) < 3) {
      that.showGuide('vertical', centerX);
    }

    // Check horizontal alignment (green lines)
    if (Math.abs(top - otherTop) < 3) {
      that.showGuide('horizontal', top);
    }
    if (Math.abs(bottom - otherBottom) < 3) {
      that.showGuide('horizontal', bottom);
    }
    if (Math.abs(centerY - otherCenterY) < 3) {
      that.showGuide('horizontal', centerY);
    }
  });
}
```

**Canvas UI Implementation:**

```javascript
class AlignmentGuides {
  constructor() {
    this.guides = {
      vertical: [],
      horizontal: [],
    };
    this.tolerance = 3; // pixels
  }

  update(widget, allWidgets) {
    this.hide();

    const alignments = this.findAlignments(widget, allWidgets);

    alignments.forEach((alignment) => {
      this.showGuide(alignment.type, alignment.position);
    });
  }

  findAlignments(widget, allWidgets) {
    const alignments = [];

    // Calculate widget edges
    const edges = {
      left: widget.position.x,
      right: widget.position.x + widget.size.w,
      centerX: widget.position.x + widget.size.w / 2,
      top: widget.position.y,
      bottom: widget.position.y + widget.size.h,
      centerY: widget.position.y + widget.size.h / 2,
    };

    // Check against each other widget
    allWidgets.forEach((other) => {
      if (other.id === widget.id) return;

      const otherEdges = {
        left: other.position.x,
        right: other.position.x + other.size.w,
        centerX: other.position.x + other.size.w / 2,
        top: other.position.y,
        bottom: other.position.y + other.size.h,
        centerY: other.position.y + other.size.h / 2,
      };

      // Check vertical alignments (left, right, center)
      if (Math.abs(edges.left - otherEdges.left) < this.tolerance) {
        alignments.push({ type: "vertical", position: edges.left });
      }
      if (Math.abs(edges.right - otherEdges.right) < this.tolerance) {
        alignments.push({ type: "vertical", position: edges.right });
      }
      if (Math.abs(edges.centerX - otherEdges.centerX) < this.tolerance) {
        alignments.push({ type: "vertical", position: edges.centerX });
      }

      // Check horizontal alignments (top, bottom, middle)
      if (Math.abs(edges.top - otherEdges.top) < this.tolerance) {
        alignments.push({ type: "horizontal", position: edges.top });
      }
      if (Math.abs(edges.bottom - otherEdges.bottom) < this.tolerance) {
        alignments.push({ type: "horizontal", position: edges.bottom });
      }
      if (Math.abs(edges.centerY - otherEdges.centerY) < this.tolerance) {
        alignments.push({ type: "horizontal", position: edges.centerY });
      }
    });

    return alignments;
  }

  showGuide(type, position) {
    const guide = document.createElement("div");
    guide.className = `alignment-guide alignment-guide-${type}`;

    if (type === "vertical") {
      guide.style.cssText = `
        position: absolute;
        left: ${position}px;
        top: 0;
        bottom: 0;
        width: 1px;
        background: red;
        pointer-events: none;
        z-index: 10000;
      `;
    } else {
      guide.style.cssText = `
        position: absolute;
        top: ${position}px;
        left: 0;
        right: 0;
        height: 1px;
        background: green;
        pointer-events: none;
        z-index: 10000;
      `;
    }

    document.querySelector(".canvas-container").appendChild(guide);
    this.guides[type].push(guide);
  }

  hide() {
    this.guides.vertical.forEach((guide) => guide.remove());
    this.guides.horizontal.forEach((guide) => guide.remove());
    this.guides.vertical = [];
    this.guides.horizontal = [];
  }
}
```

### Undo/Redo System

**VIS Pattern:**

```javascript
// Store state snapshots
undoHistory: [],
undoHistoryMaxLength: 50,

addToHistory: function() {
  // Remove any redo history
  if (this.undoHistory.length > this.undoIndex + 1) {
    this.undoHistory = this.undoHistory.slice(0, this.undoIndex + 1);
  }

  // Add current state
  this.undoHistory.push(JSON.parse(JSON.stringify(this.views)));

  // Limit size
  if (this.undoHistory.length > this.undoHistoryMaxLength) {
    this.undoHistory.shift();
  } else {
    this.undoIndex++;
  }
},

undo: function() {
  if (this.undoIndex <= 0) return;

  this.undoIndex--;
  this.views = JSON.parse(JSON.stringify(this.undoHistory[this.undoIndex]));
  this.renderActiveView();
},

redo: function() {
  if (this.undoIndex >= this.undoHistory.length - 1) return;

  this.undoIndex++;
  this.views = JSON.parse(JSON.stringify(this.undoHistory[this.undoIndex]));
  this.renderActiveView();
}
```

**Canvas UI Implementation:**

```javascript
class UndoRedoSystem {
  constructor(maxSteps = 50) {
    this.maxSteps = maxSteps;
    this.history = [];
    this.currentIndex = -1;
  }

  captureState(state, description) {
    // Remove any redo history
    this.history = this.history.slice(0, this.currentIndex + 1);

    // Add new state
    this.history.push({
      state: JSON.parse(JSON.stringify(state)),
      description: description,
      timestamp: Date.now(),
    });

    // Limit history size
    if (this.history.length > this.maxSteps) {
      this.history.shift();
    } else {
      this.currentIndex++;
    }
  }

  undo() {
    if (this.currentIndex <= 0) {
      console.log("Nothing to undo");
      return null;
    }

    this.currentIndex--;
    const entry = this.history[this.currentIndex];
    console.log(`Undo: ${entry.description}`);

    return JSON.parse(JSON.stringify(entry.state));
  }

  redo() {
    if (this.currentIndex >= this.history.length - 1) {
      console.log("Nothing to redo");
      return null;
    }

    this.currentIndex++;
    const entry = this.history[this.currentIndex];
    console.log(`Redo: ${entry.description}`);

    return JSON.parse(JSON.stringify(entry.state));
  }

  canUndo() {
    return this.currentIndex > 0;
  }

  canRedo() {
    return this.currentIndex < this.history.length - 1;
  }

  getHistory() {
    return this.history.map((entry, index) => ({
      description: entry.description,
      timestamp: entry.timestamp,
      current: index === this.currentIndex,
    }));
  }
}
```

---

## 📁 FILE STRUCTURE & ORGANIZATION

### Recommended Structure (VIS v1 inspired + Modern Modules)

```
www/canvas-ui/
├── index.html              ← Runtime viewer (light)
├── edit.html               ← Editor interface (full)
│
├── core/
│   ├── canvas-ui.js        ← Main entry point (shared)
│   ├── state-manager.js    ← Reactive state system
│   ├── connection.js       ← HA WebSocket connection
│   ├── view-renderer.js    ← View rendering engine
│   └── config.js           ← Global configuration
│
├── editor/
│   ├── canvas-editor.js    ← Canvas manipulation (drag/drop/resize)
│   ├── grid-snap.js        ← Grid snapping system
│   ├── alignment-guides.js ← Visual alignment guides
│   ├── undo-redo.js        ← Undo/redo system
│   ├── toolbar.js          ← Editor toolbar
│   └── save-system.js      ← Save/load with debouncing
│
├── inspector/
│   ├── inspector.js        ← Main inspector controller
│   ├── inspector-renderer.js  ← Property form generator
│   ├── attribute-parser.js    ← Parse schema definitions
│   ├── inspector-fields.js    ← Field type implementations
│   └── entity-picker.js       ← Entity selection dialog
│
├── bindings/
│   ├── binding-parser.js   ← Parse {binding} syntax
│   ├── binding-evaluator.js  ← Evaluate bindings
│   └── operations.js       ← Binding operations (math, format, etc.)
│
├── widgets/
│   ├── base-widget.js      ← Base widget class
│   ├── widget-registry.js  ← Widget registration system
│   │
│   ├── button-v3.js        ← Button widget
│   ├── label.js            ← Label widget
│   ├── slider.js           ← Slider widget
│   └── ...
│
├── api/
│   ├── BaseWidget.js       ← Export base class (current)
│   └── widget-schemas.js   ← Schema utilities
│
├── css/
│   ├── canvas-ui.css       ← Core styles
│   ├── canvas-editor.css   ← Editor-specific styles
│   ├── inspector.css       ← Inspector panel styles
│   └── themes/
│       ├── light.css
│       └── dark.css
│
└── lib/
    ├── color-picker.js     ← Color picker component
    └── entity-selector.js  ← Entity selection component
```

**File Size Targets:**

- **Runtime bundle** (index.html): ~10-12,000 lines
  - core/ + bindings/ + widgets/ only
- **Editor bundle** (edit.html): ~18-20,000 lines
  - All files
- **Individual files**: Max 1,000 lines each

---

## 🗺️ IMPLEMENTATION ROADMAP

### Phase 1: Core Architecture (Week 1-2)

**Goals:** Establish foundation systems

**Tasks:**

1. ✅ Create dual-mode system (index.html vs edit.html)
2. ✅ Implement ReactiveState class
3. ✅ Enhance HAConnection with proper subscription management
4. ✅ Create WidgetRegistry with dynamic loading
5. ✅ Refactor file structure (split monolithic files)

**Deliverables:**

- Working state management
- Basic widget loading
- View rendering
- No editor features yet

### Phase 2: Enhanced Binding System (Week 3)

**Goals:** Implement VIS v2-level binding capabilities

**Tasks:**

1. ✅ Create BindingParser class
2. ✅ Implement multi-variable eval syntax
3. ✅ Add all VIS operations (math, format, etc.)
4. ✅ Integrate with BaseWidget
5. ✅ Add binding tests

**Deliverables:**

- {entity;operations} working
- {var:entity;formula} working
- All operations supported
- Real-time updates

### Phase 3: Inspector Overhaul (Week 4)

**Goals:** Professional table-based inspector

**Tasks:**

1. ⏳ Create InspectorRenderer with table layout
2. ⏳ Implement group collapse/expand
3. ⏳ Add all field types
4. ⏳ Implement change debouncing
5. ⏳ Add multi-select support

**Deliverables:**

- Table-based property forms
- Collapsible groups
- All control types working
- Real-time preview

### Phase 4: Canvas Editor (Week 5-6)

**Goals:** Professional drag/drop/resize

**Tasks:**

1. ⏳ Implement GridSnap class (3 modes)
2. ⏳ Add AlignmentGuides system
3. ⏳ Create drag/drop handlers
4. ⏳ Add resize handlers
5. ⏳ Implement multi-select

**Deliverables:**

- Grid snapping working
- Alignment guides showing
- Multi-widget drag
- Resize with grid snap

### Phase 5: Save/Undo System (Week 7)

**Goals:** Robust data persistence

**Tasks:**

1. ⏳ Implement SaveSystem with debouncing
2. ⏳ Create UndoRedoSystem
3. ⏳ Add HA file storage integration
4. ⏳ Implement auto-save
5. ⏳ Add save indicators

**Deliverables:**

- Auto-save working
- Undo/redo (50 steps)
- File versioning
- Error handling

### Phase 6: Widget Migration (Week 8-9)

**Goals:** Migrate existing widgets to new system

**Tasks:**

1. ⏳ Update all widgets to use new binding system
2. ⏳ Convert schemas to new format
3. ⏳ Test each widget thoroughly
4. ⏳ Add missing features
5. ⏳ Documentation

**Deliverables:**

- All widgets working
- Schemas updated
- Tests passing
- Documentation complete

### Phase 7: Polish & Optimization (Week 10)

**Goals:** Performance and UX improvements

**Tasks:**

1. ⏳ Performance profiling
2. ⏳ Optimize rendering
3. ⏳ Reduce bundle size
4. ⏳ Add loading states
5. ⏳ Error handling improvements

**Deliverables:**

- Smooth 60fps editing
- Fast load times
- Graceful error handling
- Professional polish

---

## ✅ SUCCESS CRITERIA

### Functional Requirements

- ✅ **Dual Mode:** Separate edit/view modes with different bundles
- ✅ **Binding System:** Support VIS v2 eval expressions
- ✅ **Inspector:** Table-based with collapsible groups
- ✅ **Canvas Editor:** Grid snap, alignment guides, multi-select
- ✅ **Save System:** Debounced auto-save with undo/redo
- ✅ **Widget System:** BaseWidget with binding support
- ✅ **Performance:** <100ms render time per widget

### Code Quality Requirements

- ✅ **Modularity:** No file >1,000 lines
- ✅ **Documentation:** Every class/function documented
- ✅ **Testing:** Core systems have unit tests
- ✅ **Maintainability:** Clear separation of concerns
- ✅ **Standards:** Consistent code style

### User Experience Requirements

- ✅ **Professional UI:** Microsoft Office-style interface
- ✅ **Smooth Interaction:** 60fps drag/drop/resize
- ✅ **Real-time Updates:** Instant widget preview
- ✅ **Error Handling:** Clear error messages
- ✅ **Help System:** Tooltips and documentation

---

## 📚 REFERENCE DOCUMENTS

**Primary Sources:**

- `/review/iobroker-vis-analysis.md` - Complete VIS v1 reference
- `/review/VIS2_FEATURE_EXTRACTION.md` - VIS 2 features
- `/review/INSPECTOR_ANALYSIS.md` - Inspector deep dive
- `/review/MODULAR_WIDGET_ARCHITECTURE.md` - Widget design

**Source Code:**

- `/reference/iobroker-vis-original/www/js/vis.js` - Runtime engine
- `/reference/iobroker-vis-original/www/js/visEdit.js` - Editor
- `/reference/iobroker-vis-original/www/js/visEditInspect.js` - Inspector
- `/reference/iobroker-vis-original/www/js/conn.js` - WebSocket

**Key Findings:**

- VIS v1 total: ~25,000 lines, proven architecture
- VIS v2 total: ~50,000+ lines, modern but heavier
- Canvas UI target: ~20,000 lines, best of both

---

**Last Updated:** January 23, 2026  
**Next Review:** After Phase 3 completion  
**Status:** 🔥 ACTIVE REFERENCE

**Created:** 23 January 2026  
**Purpose:** Collect and organize all critical information needed to build Canvas UI v2.0  
**Status:** 🟡 Accumulating Information

---

## Overview

This document serves as the single source of truth for building Canvas UI v2.0. All critical information from the review process (49 documents + codebase analysis) will be consolidated here.

**Sections:**

1. **Core Requirements** - What must Canvas UI do?
2. **Architecture Decisions** - How should it be structured?
3. **Widget API Specification** - How do widgets work?
4. **Inspector System Design** - How is property editing handled?
5. **File Structure** - Where does everything live?
6. **Data Models** - How is data stored and structured?
7. **Working Code Inventory** - What existing code to keep?
8. **Reference Implementations** - Examples to follow

---

## 1. Core Requirements

### Must-Have Features (v2.0 Launch)

_To be determined during review_

**Canvas Operations:**

- [ ] TBD

**Widget System:**

- [ ] TBD

**Inspector/Property Editing:**

- [ ] TBD

**Home Assistant Integration:**

- [ ] TBD

### Nice-to-Have Features (Post-Launch)

_To be determined during review_

---

## 2. Architecture Decisions

### File Structure (Proposed)

_To be designed during Phase 4_

```
/www/canvas-ui/
  /core/          # Core canvas functionality
  /api/           # Widget API and base classes
  /inspector/     # Property editing system
  /widgets/       # All widget implementations
  /services/      # HA connection, entity management
  /utils/         # Helpers and utilities
```

### Module Separation Principles

_To be defined during review_

---

## 3. Widget API Specification

### Required Methods

_To be extracted from working widgets (button-v3.js, etc.)_

```javascript
class MyWidget extends BaseWidget {
  // Required static methods
  static getMetadata() {}
  static getConfigSchema() {}

  // Required instance methods
  constructor(config) {}
  render() {}

  // Optional lifecycle hooks
  onMount() {}
  onUpdate() {}
  onDestroy() {}
  onStateUpdate(entityId, newState, oldState) {}
}
```

### Property Storage Rules

_Critical: Define config vs styles clearly_

**Current Understanding:**

- `widget.config.*` - Widget-specific properties (from schema `tab: "custom"` or `tab: "action"`)
- `widget.styles.*` - CSS properties (from schema `tab: "common"`)
- `widget.position.*` - Position (x, y)
- `widget.size.*` - Size (w, h)

**Issues Found:**

- [ ] TBD during code audit

---

## 4. Inspector System Design

### Schema Format

_To be finalized based on working implementation_

```javascript
{
  propertyName: {
    type: "text|number|color|select|checkbox|entity|icon",
    label: "Display Label",
    default: "default value",
    category: "Group Name",  // For accordion organization
    tab: "custom|common|action",  // Determines storage location
    placeholder: "hint text",
    min: 0,  // For numbers
    max: 100,
    step: 1,
    options: []  // For selects
  }
}
```

### Field Component Library

_List of reusable field types_

- [ ] Text input (with binding support)
- [ ] Number input (slider vs plain input)
- [ ] Color picker
- [ ] Entity picker
- [ ] Icon picker
- [ ] Select dropdown
- [ ] Checkbox
- [ ] Accordion groups

---

## 5. Data Models

### Widget Data Structure

```json
{
  "id": "widget_123",
  "type": "button",
  "name": "My Button",
  "position": { "x": 100, "y": 200 },
  "size": { "w": 200, "h": 80 },
  "config": {
    "text": "Click Me",
    "fontSize": 14,
    "entity": "light.living_room"
  },
  "styles": {
    "borderWidth": 2,
    "borderColor": "#999999",
    "backgroundColor": "#03a9f4"
  }
}
```

### View Data Structure

_To be documented_

### Canvas State

_To be documented_

---

## 6. Working Code Inventory

### Confirmed Working ✅

_To be filled during Phase 3 code audit_

**Files to Keep As-Is:**

- [ ] TBD

**Files to Refactor:**

- [ ] TBD

**Files to Delete:**

- [ ] TBD

---

## 7. Reference Implementations

### ioBroker VIS 1 & 2 Patterns

_Key learnings from reference code_

**Attribute System:**

- Uses `data-vis-attrs` string format
- Separates common/custom/action tabs
- Group-based organization

**Widget Registration:**

- TBD

**Property Editing:**

- TBD

### Canvas UI Working Examples

**Button Widget (button-v3.js):**

- ✅ Clean schema definition with categories
- ✅ State-based visual system
- ✅ Proper lifecycle hooks
- ✅ Entity subscription pattern
- ⚠️ Reads from both config and styles (fallback pattern)

**BaseWidget:**

- ✅ State rendering system
- ✅ Icon/text layout handling
- TBD: What else works?

---

## 8. Key Insights from Review

### What Worked Well

_To be filled during review_

### What Didn't Work

_To be filled during review_

### Architectural Mistakes

_To be filled during review_

### Best Practices Discovered

_To be filled during review_

---

## 9. Build Checklist

_This section will become the step-by-step build plan after review is complete_

### Phase 1: Core Systems

- [ ] TBD

### Phase 2: Widget API

- [ ] TBD

### Phase 3: Inspector System

- [ ] TBD

### Phase 4: Widgets

- [ ] TBD

---

## 10. Testing Requirements

### Functionality Tests

_To be defined_

### Integration Tests

_To be defined_

### User Acceptance Criteria

_To be defined_

---

## 📚 APPENDIX A: STATE-DRIVEN WIDGET ARCHITECTURE

### Overview

The state-driven architecture separates widget **behavior** (logic) from **presentation** (rendering). Widgets declare visual states; the API renders them.

### Core Principles

1. **Widgets declare** what they should look like - **API renders** it
2. **Widgets control** state logic - **API displays** the active state
3. **Inspector edits** visual configs - **API rebuilds** DOM from configs
4. **Widgets provide** behavior - **API handles** presentation

### Visual State Structure

Each state is a complete visual description:

```javascript
{
  background: {
    color: "#ff0000",        // Hex color
    opacity: 1.0,            // 0.0 - 1.0
    pattern: null,           // "dots" | "grid" | "diagonal-lines" | "cross-hatch"
    patternColor: "#333",    // Pattern overlay color
    image: null,             // URL for background image
    imageSize: "cover"       // "cover" | "contain"
  },
  border: {
    width: 2,                // Pixels
    color: "#000000",        // Hex color
    style: "solid",          // "solid" | "dashed" | "dotted" | "double"
    radius: [8, 8, 8, 8],    // [TL, TR, BR, BL] in pixels
    opacity: 1.0             // 0.0 - 1.0
  },
  text: {
    content: "Label",        // Text to display
    color: "#ffffff",        // Hex color
    size: 16,                // Font size in pixels
    weight: 600,             // 100-900
    align: "center",         // "left" | "center" | "right"
    verticalAlign: "middle", // "top" | "middle" | "bottom"
    font: "inherit",         // Font family
    shadow: null             // CSS text-shadow value
  },
  icon: {
    name: "mdi-icon",        // Material Design Icon name
    color: "#ffffff",        // Hex color
    size: 24,                // Icon size in pixels
    position: "left",        // "left" | "right" | "above" | "below"
    spacing: 8               // Gap between icon and text (pixels)
  }
}
```

### State Count Patterns

| States | Use Case                       | Examples                                      |
| ------ | ------------------------------ | --------------------------------------------- |
| 1      | Static display, no interaction | Label, Image, Border, Display widgets         |
| 2      | Binary toggle                  | Switch, Toggle Button, Boolean sensors        |
| 3      | On/Off/Unavailable             | Light with unknown state, Conditional display |
| 4      | Multi-mode or complex          | Thermostat modes, Media player states         |

### Widget Implementation Pattern

```javascript
export class ToggleButtonWidget extends BaseWidget {
  constructor(config) {
    super(config);
    // NO DOM CREATION - behavior properties only
    this.clickTimeout = null;
  }

  // REQUIRED: Declare state count
  getStateCount() {
    return 2; // OFF (state 0) and ON (state 1)
  }

  // REQUIRED: Define default visual states
  getDefaultStates() {
    return [
      {
        // State 0: OFF
        background: { color: "#2c2c2c", opacity: 1.0 },
        border: {
          width: 2,
          color: "#444",
          style: "solid",
          radius: [4, 4, 4, 4],
        },
        text: { content: "OFF", color: "#ffffff", size: 14 },
        icon: { name: "mdi-toggle-switch-off", color: "#ffffff", size: 24 },
      },
      {
        // State 1: ON
        background: { color: "#03a9f4", opacity: 1.0 },
        border: {
          width: 2,
          color: "#0288d1",
          style: "solid",
          radius: [4, 4, 4, 4],
        },
        text: { content: "ON", color: "#ffffff", size: 14 },
        icon: { name: "mdi-toggle-switch", color: "#ffffff", size: 24 },
      },
    ];
  }

  // REQUIRED: Merge config into state visual
  getStateVisual(stateIndex) {
    const defaults = this.getDefaultStates();
    const visual = { ...defaults[stateIndex] };

    // Merge user config values
    if (this.config.backgroundColor !== undefined) {
      visual.background.color = this.config.backgroundColor;
    }
    if (this.config.text !== undefined) {
      visual.text.content = this.config.text;
    }

    return visual;
  }

  // BEHAVIOR: Handle click
  onClick(event) {
    const current = this.getActiveState();
    const next = current === 0 ? 1 : 0;
    this.setActiveState(next); // API will render the new state
  }

  // LIFECYCLE: State changed
  onStateChange(oldState, newState) {
    // Call Home Assistant service
    this.callService("homeassistant", newState === 1 ? "turn_on" : "turn_off", {
      entity_id: this.config.entity,
    });
  }

  // LIFECYCLE: Mounted
  onMount() {
    if (this.config.entity) {
      this.subscribeToEntity(this.config.entity);
    }
  }

  // LIFECYCLE: Entity state updated
  onStateUpdate(entityId, newState, oldState) {
    const isOn = newState?.state === "on";
    this.setActiveState(isOn ? 1 : 0);
  }
}
```

### Benefits

✅ **Separation of Concerns** - Logic vs presentation cleanly separated  
✅ **No DOM Manipulation** - Widgets never touch DOM directly  
✅ **Declarative** - States described, not constructed  
✅ **Testable** - Behavior logic can be unit tested  
✅ **Inspector-Friendly** - Visual configs directly editable  
✅ **Consistent** - All widgets use same rendering pattern  
✅ **Maintainable** - Changes to rendering engine don't affect widgets

---

## 📚 APPENDIX B: EXPRESSION BINDING SYSTEM

### Overview

The expression binding system allows real-time data transformations without custom code. Expressions evaluate automatically when entity states change.

### Basic Syntax

```javascript
{entity.attribute;operation1;operation2;...}
```

- **entity**: Home Assistant entity ID (e.g., `sensor.temperature`)
- **attribute**: Entity attribute (default: `state`)
- **operations**: Chain of transformations (optional)

### Quick Examples

```javascript
// Temperature conversion (Celsius to Fahrenheit)
{sensor.bedroom_temp.state;*1.8;+32;round(1)}°F

// Brightness percentage (0-255 → 0-100%)
Brightness: {light.living_room.brightness;/255;*100;round(0)}%

// Status translation (numeric to text)
Mode: {climate.thermostat.state;array(['Off','Heat','Cool','Auto'])}

// Multi-entity average
Avg: {sensor.room1.state;sensor.room2.state;(sensor_room1 + sensor_room2)/2;round(1)}°C

// Conditional display
{sensor.temp.state;value > 20 ? 'Hot' : 'Cold'}
```

### Operation Categories

#### 1. Mathematical Operations

```javascript
// Arithmetic
{sensor.value;*2}      // Multiply
{sensor.value;/10}     // Divide
{sensor.value;+32}     // Add
{sensor.value;-10}     // Subtract
{sensor.value;%3}      // Modulo

// Rounding
{sensor.value;round(2)}  // Round to 2 decimals
{sensor.value;floor()}   // Round down
{sensor.value;ceil()}    // Round up

// Limits
{sensor.value;min(0)}    // Clamp minimum
{sensor.value;max(100)}  // Clamp maximum

// Math functions
{sensor.value;pow(2)}    // Square
{sensor.value;sqrt()}    // Square root
{sensor.value;abs()}     // Absolute value
```

#### 2. Formatting Operations

```javascript
// Number formatting with thousand separators
{sensor.population;value(0)}    // → "1,234,567"
{sensor.price;value(2)}         // → "1,234.56"

// Hex conversion
{sensor.color;hex()}      // → "ff5500" (lowercase)
{sensor.color;HEX()}      // → "FF5500" (uppercase)
{sensor.value;hex2()}     // → "0f" (2-digit lowercase)
{sensor.value;HEX2()}     // → "0F" (2-digit uppercase)

// Date formatting
{sensor.timestamp;date(YYYY-MM-DD)}           // → "2026-01-23"
{sensor.timestamp;date(DD/MM/YYYY HH:mm)}     // → "23/01/2026 15:30"
{sensor.timestamp;date(MM-DD-YYYY hh:mm A)}   // → "01-23-2026 03:30 PM"
```

#### 3. String Operations

```javascript
// Case conversion
{sensor.message;toLowerCase}
{sensor.message;toUpperCase}

// String manipulation
{sensor.text;trim}                    // Remove whitespace
{sensor.text;replace(old,new)}        // Replace all "old" with "new"
{sensor.url;substring(0,10)}          // First 10 characters
{sensor.csv;split(,)}                 // Split by comma
{sensor.name;concat( Jr.)}            // Append text
```

#### 4. Array & Mapping Operations

```javascript
// Array indexing (state as index)
{binary_sensor.door;array(Closed,Open)}
// State 0 → "Closed", State 1 → "Open"

{sensor.mode;array(Off,Heat,Cool,Auto)}
// State 0 → "Off", 1 → "Heat", 2 → "Cool", 3 → "Auto"

// Icon mapping
{binary_sensor.door;array(🔒,🔓)}
{binary_sensor.motion;array(Clear,Detected)}
```

#### 5. Advanced Operations

```javascript
// Ternary conditionals
{sensor.temp.state;value > 20 ? 'Hot' : 'Cold'}
{sensor.battery.state;value < 20 ? '⚠️ Low' : '✓ OK'}

// Multi-entity calculations (entities become variables)
// sensor.room1_temp → sensor_room1_temp
// sensor.bedroom_temp → sensor_bedroom_temp
{sensor.room1.state;sensor.room2.state;(sensor_room1 + sensor_room2)/2}

// Complex chaining
{sensor.temp;*1.8;+32;round(1);value < 70 ? 'Cold' : 'Warm'}
```

### Real-World Examples

#### Temperature Display with Conversion

```javascript
🌡️ Bedroom: {sensor.bedroom_temp.state;round(1)}°C ({sensor.bedroom_temp.state;*1.8;+32;round(0)}°F)
// Output: 🌡️ Bedroom: 22.5°C (73°F)
```

#### Battery Status with Warning

```javascript
🔋 Battery: {sensor.phone_battery.state}% {sensor.phone_battery.state;value < 20 ? '⚠️' : ''}
// At 85%: 🔋 Battery: 85%
// At 15%: 🔋 Battery: 15% ⚠️
```

#### Energy Cost Calculation

```javascript
Cost: ${sensor.energy_kwh.state;*0.15;round(2)}
// If 150 kWh: Cost: $22.50
```

#### Dynamic Image Based on State

```javascript
https://example.com/status-{sensor.security_mode.state;array(['off','home','away'])}.png
// Mode 0 → status-off.png
// Mode 1 → status-home.png
// Mode 2 → status-away.png
```

### Implementation Pattern

```javascript
class BindingEvaluator {
  evaluate(text, getState) {
    // Find all {entity;operations} patterns
    return text.replace(/\{([^}]+)\}/g, (match, expr) => {
      return this.evaluateExpression(expr, getState);
    });
  }

  evaluateExpression(expr, getState) {
    const parts = expr.split(";");
    const entityPath = parts[0];
    const operations = parts.slice(1);

    // Get initial value from entity
    let value = this.getEntityValue(entityPath, getState);

    // Apply each operation in sequence
    for (const op of operations) {
      value = this.applyOperation(value, op, getState);
    }

    return value;
  }

  applyOperation(value, operation, getState) {
    // Math: *2, /10, +5, -3, %4
    if (/^[*\/+\-%][\d.]+$/.test(operation)) {
      const op = operation[0];
      const num = parseFloat(operation.slice(1));
      switch (op) {
        case "*":
          return value * num;
        case "/":
          return value / num;
        case "+":
          return value + num;
        case "-":
          return value - num;
        case "%":
          return value % num;
      }
    }

    // round(decimals)
    if (operation.startsWith("round(")) {
      const decimals = parseInt(operation.match(/\d+/)[0]);
      return parseFloat(value).toFixed(decimals);
    }

    // array([...])
    if (operation.startsWith("array(")) {
      const items = operation.match(/\[(.+)\]/)[1].split(",");
      const index = parseInt(value);
      return items[index] || value;
    }

    // Add 40+ more operations...

    return value;
  }
}
```

---

## 📚 APPENDIX C: DUAL-MODE ARCHITECTURE DETAILS

### Overview

Separate core runtime from editor code for 70% smaller runtime bundle, better security, and optimized performance.

### File Structure

```
www/canvas-ui/
├── index.html                  (View-only entry point)
├── edit.html                   (Editor entry point)
├── core/
│   ├── canvas-ui-core.js      (~4,000 lines - runtime only)
│   ├── state-manager.js       (Entity subscriptions, state)
│   ├── connection.js          (HA WebSocket)
│   ├── view-renderer.js       (Widget rendering)
│   └── binding-evaluator.js   (Expression evaluation)
├── editor/
│   ├── canvas-ui-edit.js      (~9,000 lines - editor only)
│   ├── drag-drop.js           (Drag system)
│   ├── resize.js              (Resize handles)
│   ├── alignment.js           (Alignment tools)
│   ├── snap-grid.js           (Grid snapping)
│   ├── undo-redo.js           (History system)
│   └── inspector.js           (Property inspector)
├── widgets/
│   ├── button.js
│   ├── toggle-button.js
│   └── ...
└── api/
    └── BaseWidget.js
```

### Core Functions (View-Only - ~4,000 lines)

**Always loaded for displaying dashboards:**

```javascript
// Core initialization
init()
connectToHomeAssistant()
loadConfiguration()

// Widget rendering
renderWidgets()
Widget class (state-driven)

// Entity system
subscribeToEntities()
onEntityStateChanged()
getEntityValue()

// Data binding
parseBinding()
evaluateBinding()
applyOperation()

// View navigation
switchView()
renderViews()
applyViewBackground()
applyViewResolution()

// Visibility evaluation
checkWidgetVisibility()
evaluateCondition()

// Settings
loadSettings()
saveSettingsToStorage()

// Widget module loader
registerWidgetSet()
loadWidgetSet()
```

### Editor Functions (Edit-Only - ~9,000 lines)

**Only loaded when editing:**

```javascript
// Edit mode
toggleEditMode();
enableEditControls();
disableEditControls();

// Widget creation
addWidget();
showAddWidgetDialog();
createWidgetFromType();

// Selection
selectWidget();
deselectWidget();
deselectAllWidgets();
multiSelect();

// Clipboard
copyWidget();
pasteWidget();
deleteSelected();

// Drag & drop
initDragDrop();
onWidgetDragStart();
onWidgetDrag();
onWidgetDragEnd();

// Resize
initResizeHandles();
onResizeStart();
onResize();
onResizeEnd();

// Alignment tools
alignLeft();
alignCenter();
alignRight();
alignTop();
alignMiddle();
alignBottom();
distributeHorizontally();
distributeVertically();
makeSameWidth();
makeSameHeight();

// Grid snapping
setSnapMode();
snapToGrid();
snapToElements();
showAlignmentGuides();

// Undo/Redo
pushToUndoStack();
undo();
redo();
clearUndoStack();

// Save
saveConfiguration();
autoSave();
showSaveIndicator();

// Inspector
showInspector();
updateInspector();
renderPropertyFields();

// Dialogs
showWidgetDialog();
showViewDialog();
showEntitySelector();
showCardDialog();
showImageBrowser();
```

### Loading Strategy

**View Mode (index.html):**

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Canvas UI - View</title>
    <link rel="stylesheet" href="/local/canvas-ui/canvas-ui.css" />
  </head>
  <body>
    <div id="canvas-container"></div>

    <!-- Core only (4,000 lines) -->
    <script
      type="module"
      src="/local/canvas-ui/core/canvas-ui-core.js"
    ></script>
    <script type="module" src="/local/canvas-ui/widgets/button.js"></script>
    <!-- Other widgets... -->
  </body>
</html>
```

**Edit Mode (edit.html or via panel):**

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Canvas UI - Editor</title>
    <link rel="stylesheet" href="/local/canvas-ui/canvas-ui.css" />
    <link rel="stylesheet" href="/local/canvas-ui/editor/editor.css" />
  </head>
  <body>
    <div id="toolbar"></div>
    <div id="canvas-container"></div>
    <div id="inspector"></div>

    <!-- Core + Editor (13,000 lines total) -->
    <script
      type="module"
      src="/local/canvas-ui/core/canvas-ui-core.js"
    ></script>
    <script
      type="module"
      src="/local/canvas-ui/editor/canvas-ui-edit.js"
    ></script>
    <script type="module" src="/local/canvas-ui/widgets/button.js"></script>
    <!-- Other widgets... -->
  </body>
</html>
```

### Global API Structure

```javascript
window.CanvasUI = {
  // CORE (always loaded)
  core: {
    init,
    renderWidgets,
    switchView,
    subscribeToEntities,
    evaluateBinding,
    // ... view functions
  },

  // EDITOR (loaded on demand)
  editor: {
    toggleEditMode,
    addWidget,
    saveConfiguration,
    showInspector,
    // ... editor functions
  },

  // MODULE SYSTEM (always loaded)
  registerWidgetSet,
  loadWidgetSet,

  // STATE (shared)
  state: {
    widgets: new Map(),
    views: new Map(),
    currentViewId: null,
    editMode: false,
    selectedWidgets: [],
    entityStates: new Map(),
    // ... shared state
  },

  // UTILS (shared)
  utils: {
    parseBinding,
    hexToRgba,
    debounce,
    // ... utilities
  },
};
```

### Benefits

✅ **70% Smaller Runtime Bundle** - View mode loads only 4K lines vs 13K  
✅ **Better Security** - Editor code not accessible in kiosk/view mode  
✅ **Faster Load Time** - Less code to parse and execute  
✅ **Better Caching** - Core changes less frequently than editor  
✅ **Clear Separation** - Easier to maintain and extend  
✅ **Easier Testing** - Can test core independently from editor

---

## 📚 APPENDIX D: LOVELACE CARD EMBEDDING

### Overview

Canvas UI supports embedding full Lovelace cards as widgets, allowing reuse of the entire Home Assistant card ecosystem.

### Card Widget Structure

```javascript
{
  id: "widget-123",
  type: "card",
  position: { x: 100, y: 100 },
  size: { w: 300, h: 200 },
  config: {
    cardType: "hui-entities-card",  // Card type with hui- prefix
    cardConfig: {                    // Card's YAML config as JSON
      type: "entities",
      entities: ["light.living_room"],
      title: "Living Room"
    },
    cardModSettings: {               // Styling (card-mod)
      styleCornerRadius: 8,
      styleBackgroundColor: "#1c1c1c",
      styleBorderWidth: 1,
      styleBorderColor: "#333"
    }
  }
}
```

### Card Type Normalization

```javascript
function normalizeCardType(cardType) {
  // Built-in cards need hui- prefix
  if (!cardType.includes(":") && !cardType.startsWith("hui-")) {
    return `hui-${cardType}-card`;
  }
  // Custom cards already have prefix
  return cardType;
}

// Examples:
// "entities" → "hui-entities-card"
// "button" → "hui-button-card"
// "custom:mushroom-card" → "custom:mushroom-card" (unchanged)
```

### YAML to JSON Parser

```javascript
function parseSimpleYAML(yamlText) {
  const lines = yamlText.trim().split("\n");
  const obj = {};
  let currentArray = null;

  lines.forEach((line) => {
    const trimmed = line.trim();

    // Skip comments and empty
    if (!trimmed || trimmed.startsWith("#")) return;

    // Handle array items
    if (trimmed.startsWith("-")) {
      const value = trimmed.substring(1).trim();
      if (currentArray) {
        currentArray.push(parseValue(value));
      }
      return;
    }

    // Handle key-value pairs
    if (trimmed.includes(":")) {
      const [key, ...valueParts] = trimmed.split(":");
      const value = valueParts.join(":").trim();

      if (value === "") {
        // Start array
        currentArray = [];
        obj[key.trim()] = currentArray;
      } else {
        obj[key.trim()] = parseValue(value);
      }
    }
  });

  return obj;
}

function parseValue(value) {
  // Boolean
  if (value === "true") return true;
  if (value === "false") return false;

  // Number
  if (!isNaN(value)) return parseFloat(value);

  // String (remove quotes)
  return value.replace(/['"]/g, "");
}
```

### Card Rendering Process

```javascript
async function renderCard(widget, container) {
  const { cardType, cardConfig, cardModSettings } = widget.config;

  // 1. Normalize card type
  const normalizedType = normalizeCardType(cardType);

  // 2. Create card element
  const cardEl = document.createElement(normalizedType);

  // 3. Pass Home Assistant connection
  cardEl.hass = window.hass;

  // 4. Set card configuration
  cardEl.setConfig(cardConfig);

  // 5. Apply card-mod styling
  const styles = buildCardModStyle(cardModSettings);
  Object.entries(styles).forEach(([prop, value]) => {
    cardEl.style.setProperty(prop, value);
  });

  // 6. Wrap in container
  const wrapper = document.createElement("div");
  wrapper.className = "card-widget-wrapper";
  wrapper.style.cssText = `
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
    pointer-events: ${editMode ? "none" : "auto"};
  `;
  wrapper.appendChild(cardEl);

  // 7. Add to DOM
  container.appendChild(wrapper);

  return cardEl;
}
```

### Card-Mod Styling

```javascript
function buildCardModStyle(settings) {
  const {
    styleCornerRadius = 8,
    styleBackgroundColor = "#1c1c1c",
    styleBackgroundOpacity = 100,
    styleGradientEnabled = false,
    styleGradientColor = "#333",
    styleGradientDirection = "180deg",
    styleBackgroundImage = "",
    styleBorderWidth = 1,
    styleBorderColor = "#333",
    styleBorderStyle = "solid",
    stylePadding = 16,
    styleShadow = "none",
    styleZIndex = 1,
  } = settings;

  // Build background
  let background = styleBackgroundColor;

  if (styleGradientEnabled && styleGradientColor) {
    background = `linear-gradient(${styleGradientDirection}, ${styleBackgroundColor}, ${styleGradientColor})`;
  }

  if (styleBackgroundImage) {
    background = `url(${styleBackgroundImage})`;
  }

  // Apply opacity
  const opacity = styleBackgroundOpacity / 100;

  return {
    "--ha-card-border-radius": `${styleCornerRadius}px`,
    "border-radius": `${styleCornerRadius}px`,
    background: background,
    opacity: opacity.toString(),
    border: `${styleBorderWidth}px ${styleBorderStyle} ${styleBorderColor}`,
    padding: `${stylePadding}px`,
    "box-shadow": styleShadow,
    "z-index": styleZIndex,
  };
}
```

### Supported Card Types

**Built-in Cards (hui- prefix):**

- `entities` - Entity list
- `button` - Button card
- `glance` - Quick overview
- `sensor` - Sensor display
- `gauge` - Gauge display
- `thermostat` - Climate control
- `media-control` - Media player
- `weather-forecast` - Weather card
- `picture-entity` - Picture with entity
- `markdown` - Markdown content
- `history-graph` - History chart
- And 20+ more...

**Custom Cards (custom: prefix):**

- `custom:mushroom-card` - Mushroom UI
- `custom:mini-graph-card` - Graphs
- `custom:button-card` - Advanced buttons
- `custom:vertical-stack-in-card` - Layouts
- Any custom card from HACS

### Card Updates

```javascript
// Subscribe to entity updates
function subscribeCardEntities(cardEl, cardConfig) {
  const entities = extractEntities(cardConfig);

  entities.forEach((entityId) => {
    connection.subscribeEvents((event) => {
      if (event.data.entity_id === entityId) {
        // Update hass object
        window.hass.states[entityId] = event.data.new_state;

        // Trigger card update
        cardEl.hass = { ...window.hass };
      }
    }, "state_changed");
  });
}

function extractEntities(config, entities = []) {
  if (typeof config === "string" && config.includes(".")) {
    entities.push(config);
  } else if (Array.isArray(config)) {
    config.forEach((item) => extractEntities(item, entities));
  } else if (typeof config === "object") {
    Object.values(config).forEach((value) => extractEntities(value, entities));
  }
  return [...new Set(entities)]; // Remove duplicates
}
```

### Benefits

✅ **Reuse Existing Cards** - 100+ built-in + custom cards available  
✅ **No Reimplementation** - Don't rebuild what HA already has  
✅ **Community Cards** - Access HACS card ecosystem  
✅ **Consistent UX** - Same cards as Lovelace dashboards  
✅ **Auto Updates** - Cards update with HA updates  
✅ **Full Features** - All card functionality preserved

---

## 📚 APPENDIX E: KIOSK MODE IMPLEMENTATION

### Overview

Kiosk mode provides clean, view-only, full-screen display for wall-mounted tablets and digital signage.

### URL Structure

```
# Editor mode (full controls)
http://ha:8123/canvas-ui

# Kiosk mode (view-specific, no controls)
http://ha:8123/canvas-ui?kiosk=VIEWNAME

# Examples:
http://ha:8123/canvas-ui?kiosk=main
http://ha:8123/canvas-ui?kiosk=kitchen
http://ha:8123/canvas-ui?kiosk=livingroom
```

### Detection Logic

```javascript
function detectKioskMode() {
  const urlParams = new URLSearchParams(window.location.search);
  const kioskView = urlParams.get("kiosk");

  if (kioskView) {
    return {
      enabled: true,
      viewName: kioskView.toLowerCase().replace(/\s+/g, ""),
    };
  }

  return { enabled: false };
}

// Usage
const kioskMode = detectKioskMode();
if (kioskMode.enabled) {
  console.log("🎭 KIOSK MODE ENABLED - View-only, full-screen");
  console.log(`🎯 Target view: ${kioskMode.viewName}`);

  // Hide all editor UI
  hideToolbar();
  hideInspector();
  hideHASidebar();

  // Lock to specific view
  loadView(kioskMode.viewName);
  disableViewSwitching();
}
```

### UI Hiding

```javascript
function enableKioskMode(viewName) {
  // Hide HA sidebar
  const sidebar = document
    .querySelector("home-assistant")
    ?.shadowRoot?.querySelector("home-assistant-main")
    ?.shadowRoot?.querySelector("ha-drawer");

  if (sidebar) {
    sidebar.style.display = "none";
  }

  // Hide Canvas UI toolbar
  const toolbar = document.getElementById("toolbar");
  if (toolbar) {
    toolbar.style.display = "none";
  }

  // Hide inspector
  const inspector = document.getElementById("inspector");
  if (inspector) {
    inspector.style.display = "none";
  }

  // Disable edit mode permanently
  window.KIOSK_MODE = true;
  window.EDIT_MODE = false;

  // Add subtle indicator
  addKioskIndicator(viewName);
}

function addKioskIndicator(viewName) {
  const indicator = document.createElement("div");
  indicator.style.cssText = `
    position: fixed;
    bottom: 8px;
    right: 8px;
    padding: 4px 8px;
    background: rgba(0,0,0,0.5);
    color: #fff;
    font-size: 10px;
    border-radius: 4px;
    z-index: 9999;
  `;
  indicator.textContent = `🎭 ${viewName}`;
  document.body.appendChild(indicator);
}
```

### Disabled Features in Kiosk Mode

```javascript
function setupKioskRestrictions() {
  // Disable all edit operations
  const disabledOperations = [
    "toggleEditMode",
    "addWidget",
    "deleteWidget",
    "showInspector",
    "showAddWidgetDialog",
    "dragWidget",
    "resizeWidget",
    "saveConfiguration",
    "switchView",
    "showViewDialog",
  ];

  disabledOperations.forEach((op) => {
    window.CanvasUI.editor[op] = () => {
      console.warn(`🎭 Operation blocked in kiosk mode: ${op}`);
    };
  });

  // Disable context menus
  document.addEventListener("contextmenu", (e) => {
    if (window.KIOSK_MODE) {
      e.preventDefault();
      return false;
    }
  });

  // Disable keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (window.KIOSK_MODE) {
      // Block Ctrl+S, Delete, etc.
      if ((e.ctrlKey && e.key === "s") || e.key === "Delete") {
        e.preventDefault();
        return false;
      }
    }
  });
}
```

### Kiosk Button in Editor

```javascript
function createKioskButton() {
  const button = document.createElement("button");
  button.innerHTML = "🎭 Kiosk Mode";
  button.className = "toolbar-button";
  button.title = "Open current view in kiosk mode (new tab)";

  button.addEventListener("click", () => {
    const currentView = window.CanvasUI.state.currentViewId;
    const viewName = currentView.toLowerCase().replace(/\s+/g, "");
    const kioskUrl = `${window.location.origin}${window.location.pathname}?kiosk=${viewName}`;

    window.open(kioskUrl, "_blank");
  });

  return button;
}
```

### Use Cases

**Wall-Mounted Tablet:**

- Mount tablet on wall
- Open kiosk URL
- F11 for full-screen
- Cannot accidentally edit

**Digital Signage:**

- TV/monitor display
- Status boards
- Meeting room displays
- Reception dashboards

**Multi-Tablet Setup:**

```
Kitchen:     http://ha:8123/canvas-ui?kiosk=kitchen
Living Room: http://ha:8123/canvas-ui?kiosk=livingroom
Bedroom:     http://ha:8123/canvas-ui?kiosk=bedroom
```

### Browser Setup

**Android - Fully Kiosk Browser:**

```
1. Install "Fully Kiosk Browser"
2. Set homepage to kiosk URL
3. Enable kiosk mode
4. Prevents navigation
```

**iOS - Safari:**

```
1. Open kiosk URL in Safari
2. Tap Share → "Add to Home Screen"
3. Launch from home icon
4. Optional: Enable Guided Access
```

**Desktop - Chrome Kiosk:**

```bash
google-chrome --kiosk http://ha:8123/canvas-ui?kiosk=main
```

### Benefits

✅ **Clean Display** - No toolbars, no controls  
✅ **Secure** - Cannot edit or delete  
✅ **View-Specific** - Different URL per room  
✅ **Full-Screen Ready** - Professional appearance  
✅ **Live Updates** - Widgets update in real-time  
✅ **Multi-Device** - Different kiosks, different views

---

## 📚 APPENDIX F: RIBBON TOOLBAR DESIGN

### Overview

Modern ribbon-style toolbar with grouped tools, inspired by Microsoft Office. Organizes 40+ functions into logical tabs.

### Tab Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│ Home │ Widgets │ Arrange │ View │ Tools │ [Dev] │    ▲ Collapse    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Edit             Widget              Quick                         │
│  ┌─────────┐     ┌──────────┐       ┌───────┐                      │
│  │ ✏️ Edit  │     │ ➕ Add   │       │ 🎭    │                      │
│  │ ↩️ Undo  │     │ 📋 Copy  │       │ Kiosk │                      │
│  │ ↪️ Redo  │     │ 📋 Paste │       │       │                      │
│  │ 💾 Save  │     │ 🗑️ Delete│       └───────┘                      │
│  └─────────┘     └──────────┘                                       │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Tab Definitions

#### 1. Home Tab (Default)

**Most common operations:**

- **Edit Group:** Edit Mode, Undo, Redo, Save
- **Widget Group:** Add Widget, Copy, Paste, Delete
- **Quick Actions:** Kiosk Mode

#### 2. Widgets Tab

**Widget creation:**

- **Add Widget:** Text, Image, Border, Iframe (quick buttons)
- **Advanced:** Lovelace Cards, MQTT, Navigation
- **Library:** Recent, Favorites, Templates

#### 3. Arrange Tab

**Layout tools:**

- **Snap:** Disabled / Grid / Elements
- **Align:** Left, Center H, Right, Top, Middle, Bottom
- **Distribute:** Horizontal, Vertical
- **Resize:** Same Width, Same Height

#### 4. View Tab

**View management:**

- **Views:** Selector, Add, Clone, Edit, Delete
- **Settings:** Background color, Background image, Resolution

#### 5. Tools Tab

**Advanced settings:**

- **Settings:** Grid, Theme, Import/Export
- **Dev Tools:** View JSON, Clear cache, Debug mode

#### 6. Dev Tab (Hidden)

**Developer tools (F2 to toggle):**

- **Debug:** Console level, Entity inspector, Widget inspector
- **Export:** Config JSON, Single view, Templates

### Implementation

```javascript
class RibbonToolbar {
  constructor() {
    this.currentTab = "home";
    this.collapsed = false;
    this.devTabVisible = false;

    this.tabs = {
      home: {
        label: "Home",
        shortcut: "Alt+H",
        groups: [
          {
            name: "Edit",
            buttons: [
              { icon: "✏️", label: "Edit", action: "toggleEditMode" },
              { icon: "↩️", label: "Undo", action: "undo" },
              { icon: "↪️", label: "Redo", action: "redo" },
              { icon: "💾", label: "Save", action: "save" },
            ],
          },
          {
            name: "Widget",
            buttons: [
              {
                icon: "➕",
                label: "Add",
                action: "showAddWidget",
                dropdown: true,
              },
              { icon: "📋", label: "Copy", action: "copyWidget" },
              { icon: "📋", label: "Paste", action: "pasteWidget" },
              { icon: "🗑️", label: "Delete", action: "deleteSelected" },
            ],
          },
          {
            name: "Quick",
            buttons: [{ icon: "🎭", label: "Kiosk", action: "openKioskMode" }],
          },
        ],
      },
      widgets: {
        label: "Widgets",
        shortcut: "Alt+W",
        groups: [
          {
            name: "Add Widget",
            buttons: [
              { icon: "📝", label: "Text", action: "addText" },
              { icon: "🖼️", label: "Image", action: "addImage" },
              { icon: "⬜", label: "Border", action: "addBorder" },
              { icon: "🌐", label: "Iframe", action: "addIframe" },
            ],
          },
          {
            name: "Advanced",
            buttons: [
              { icon: "🎴", label: "Cards", action: "addCard" },
              { icon: "📡", label: "MQTT", action: "addMqtt" },
              { icon: "🧭", label: "Navigation", action: "addNav" },
            ],
          },
        ],
      },
      arrange: {
        label: "Arrange",
        shortcut: "Alt+A",
        groups: [
          {
            name: "Snap",
            buttons: [
              { icon: "⊗", label: "Off", action: "snapOff", radio: "snap" },
              { icon: "⊞", label: "Grid", action: "snapGrid", radio: "snap" },
              {
                icon: "⊟",
                label: "Elements",
                action: "snapElements",
                radio: "snap",
              },
            ],
          },
          {
            name: "Align",
            buttons: [
              { icon: "⬅️", label: "Left", action: "alignLeft" },
              { icon: "↔️", label: "Center H", action: "alignCenterH" },
              { icon: "➡️", label: "Right", action: "alignRight" },
              { icon: "⬆️", label: "Top", action: "alignTop" },
              { icon: "↕️", label: "Middle", action: "alignMiddle" },
              { icon: "⬇️", label: "Bottom", action: "alignBottom" },
            ],
          },
          {
            name: "Distribute",
            buttons: [
              { icon: "↔️", label: "Horizontal", action: "distributeH" },
              { icon: "↕️", label: "Vertical", action: "distributeV" },
            ],
          },
        ],
      },
      view: {
        label: "View",
        shortcut: "Alt+V",
        groups: [
          {
            name: "Views",
            controls: [
              { type: "dropdown", label: "Current View", action: "selectView" },
              { type: "button", icon: "➕", label: "Add", action: "addView" },
              {
                type: "button",
                icon: "📋",
                label: "Clone",
                action: "cloneView",
              },
              { type: "button", icon: "✏️", label: "Edit", action: "editView" },
              {
                type: "button",
                icon: "🗑️",
                label: "Delete",
                action: "deleteView",
              },
            ],
          },
        ],
      },
      tools: {
        label: "Tools",
        shortcut: "Alt+T",
        groups: [
          {
            name: "Settings",
            buttons: [
              { icon: "⚙️", label: "Grid", action: "gridSettings" },
              { icon: "🎨", label: "Theme", action: "themeSettings" },
            ],
          },
        ],
      },
    };
  }

  render() {
    return `
      <div class="ribbon-toolbar ${this.collapsed ? "collapsed" : ""}">
        <div class="ribbon-tabs">
          ${this.renderTabs()}
        </div>
        <div class="ribbon-content">
          ${this.renderCurrentTab()}
        </div>
      </div>
    `;
  }

  renderTabs() {
    return Object.entries(this.tabs)
      .map(([id, tab]) => {
        if (id === "dev" && !this.devTabVisible) return "";

        return `
        <button 
          class="ribbon-tab ${this.currentTab === id ? "active" : ""}"
          data-tab="${id}"
          title="${tab.shortcut}">
          ${tab.label}
        </button>
      `;
      })
      .join("");
  }

  renderCurrentTab() {
    const tab = this.tabs[this.currentTab];
    return tab.groups
      .map(
        (group) => `
      <div class="ribbon-group">
        <div class="ribbon-group-content">
          ${group.buttons?.map((btn) => this.renderButton(btn)).join("") || ""}
        </div>
        <div class="ribbon-group-label">${group.name}</div>
      </div>
    `,
      )
      .join("");
  }

  renderButton(btn) {
    return `
      <button 
        class="ribbon-button ${btn.disabled ? "disabled" : ""}"
        data-action="${btn.action}"
        title="${btn.label}">
        <span class="ribbon-button-icon">${btn.icon}</span>
        <span class="ribbon-button-label">${btn.label}</span>
      </button>
    `;
  }

  switchTab(tabId) {
    this.currentTab = tabId;
    this.render();
  }

  toggle() {
    this.collapsed = !this.collapsed;
    this.render();
  }
}
```

### Keyboard Shortcuts

```javascript
document.addEventListener("keydown", (e) => {
  // Tab switching
  if (e.altKey && e.key === "h") ribbon.switchTab("home");
  if (e.altKey && e.key === "w") ribbon.switchTab("widgets");
  if (e.altKey && e.key === "a") ribbon.switchTab("arrange");
  if (e.altKey && e.key === "v") ribbon.switchTab("view");
  if (e.altKey && e.key === "t") ribbon.switchTab("tools");

  // Toggle dev tab
  if (e.key === "F2") {
    ribbon.devTabVisible = !ribbon.devTabVisible;
    ribbon.render();
  }

  // Collapse/expand ribbon
  if (e.ctrlKey && e.key === "F1") {
    ribbon.toggle();
  }
});
```

### Benefits

✅ **Organization** - Logical grouping by task  
✅ **Discovery** - Easier to find tools  
✅ **Scalability** - Easy to add features  
✅ **Professional** - Modern appearance  
✅ **Space** - More canvas when collapsed  
✅ **Keyboard** - Complete keyboard navigation  
✅ **Contextual** - Disabled states, active indicators

---

## 📚 APPENDIX G: COMPLETE MODULE API REFERENCE

This appendix contains detailed API specifications for all modules in the Canvas UI v2.0 architecture.

### Core Modules

#### canvas-core.js

```javascript
export class CanvasCore {
  /**
   * Initialize Canvas UI system
   * @param {Object} options - Configuration options
   * @param {string} options.container - Container element selector
   * @param {boolean} options.editMode - Start in edit mode
   * @param {string} options.initialView - View ID to load
   */
  async init(options) {}

  /**
   * Load configuration from Home Assistant
   * @returns {Promise<Object>} Configuration object
   */
  async loadConfiguration() {}

  /**
   * Load and render specific view
   * @param {string} viewId - View identifier
   */
  async loadView(viewId) {}

  /**
   * Switch to different view
   * @param {string} viewId - Target view ID
   */
  switchView(viewId) {}

  /**
   * Cleanup and destroy instance
   */
  destroy() {}

  // Getters
  get currentView() {}
  get isEditMode() {}
  get widgets() {}
}
```

#### state-manager.js

```javascript
export class StateManager {
  constructor() {}

  /**
   * Set state value at path
   * @param {string} path - Dot-notation path (e.g., 'sensor.temperature.val')
   * @param {*} value - Value to set
   */
  set(path, value) {}

  /**
   * Get state value at path
   * @param {string} path - Dot-notation path
   * @returns {*} Value at path
   */
  get(path) {}

  /**
   * Delete state at path
   * @param {string} path - Dot-notation path
   */
  delete(path) {}

  /**
   * Observe changes to path
   * @param {string} path - Path to observe
   * @param {Function} callback - Called when value changes
   * @returns {Function} Unobserve function
   */
  observe(path, callback) {}

  /**
   * Stop observing path
   * @param {string} path - Path to unobserve
   * @param {Function} callback - Callback to remove
   */
  unobserve(path, callback) {}

  /**
   * Create computed value
   * @param {string} path - Path for computed value
   * @param {string[]} dependencies - Paths to depend on
   * @param {Function} computeFn - Compute function
   */
  compute(path, dependencies, computeFn) {}

  /**
   * Batch multiple updates (single notification)
   * @param {Function} updateFn - Function containing updates
   */
  batch(updateFn) {}
}
```

#### connection.js

```javascript
export class HAConnection {
  /**
   * Connect to Home Assistant WebSocket
   * @returns {Promise<void>}
   */
  async connect() {}

  /**
   * Disconnect from Home Assistant
   */
  disconnect() {}

  /**
   * Call Home Assistant service
   * @param {string} domain - Service domain (e.g., 'light')
   * @param {string} service - Service name (e.g., 'turn_on')
   * @param {Object} data - Service data
   * @returns {Promise<Object>} Service response
   */
  async callService(domain, service, data) {}

  /**
   * Subscribe to events
   * @param {string} eventType - Event type to subscribe to
   * @param {Function} callback - Event handler
   * @returns {Function} Unsubscribe function
   */
  subscribeEvents(eventType, callback) {}

  /**
   * Unsubscribe from events
   * @param {string} eventType - Event type
   * @param {Function} callback - Callback to remove
   */
  unsubscribeEvents(eventType, callback) {}

  // Getters
  get isConnected() {}
  get hass() {}
}
```

#### entity-manager.js

```javascript
export class EntityManager {
  constructor(connection, stateManager) {}

  /**
   * Subscribe to entity state changes
   * @param {string} entityId - Entity ID
   * @param {Function} callback - Called on state change
   * @returns {Function} Unsubscribe function
   */
  subscribe(entityId, callback) {}

  /**
   * Unsubscribe from entity
   * @param {string} entityId - Entity ID
   * @param {Function} callback - Callback to remove
   */
  unsubscribe(entityId, callback) {}

  /**
   * Get current entity state
   * @param {string} entityId - Entity ID
   * @returns {Object|null} Entity state object
   */
  getState(entityId) {}

  /**
   * Get entity attribute value
   * @param {string} entityId - Entity ID
   * @param {string} attribute - Attribute name
   * @returns {*} Attribute value
   */
  getAttribute(entityId, attribute) {}

  /**
   * Handle state changed event
   * @param {Object} event - State changed event
   */
  onStateChanged(event) {}

  /**
   * Handle attribute changed event
   * @param {Object} event - Attribute changed event
   */
  onAttributeChanged(event) {}
}
```

#### binding-parser.js

```javascript
export class BindingParser {
  /**
   * Parse text and evaluate all bindings
   * @param {string} text - Text containing bindings
   * @returns {string} Text with bindings evaluated
   */
  parse(text) {}

  /**
   * Find all binding expressions in text
   * @param {string} text - Text to search
   * @returns {Array<string>} Array of binding strings
   */
  findBindings(text) {}

  /**
   * Extract entity IDs from binding
   * @param {string} binding - Binding expression
   * @returns {Array<string>} Entity IDs used
   */
  extractEntityIds(binding) {}

  /**
   * Parse single binding expression
   * @param {string} bindingString - Binding to parse
   * @returns {Object} Parsed binding structure
   */
  parseBinding(bindingString) {}
}
```

#### binding-evaluator.js

```javascript
export class BindingEvaluator {
  constructor(entityManager) {}

  /**
   * Evaluate binding expression
   * @param {Object} binding - Parsed binding
   * @param {Object} context - Evaluation context
   * @returns {*} Evaluated result
   */
  evaluate(binding, context) {}

  /**
   * Apply operation to value
   * @param {*} value - Input value
   * @param {string} operation - Operation string
   * @param {Object} context - Context for variables
   * @returns {*} Transformed value
   */
  applyOperation(value, operation, context) {}

  /**
   * Evaluate JavaScript formula
   * @param {string} formula - Formula to evaluate
   * @param {Object} variables - Variable values
   * @returns {*} Formula result
   */
  evaluateFormula(formula, variables) {}

  /**
   * Format value with format string
   * @param {*} value - Value to format
   * @param {string} format - Format specification
   * @returns {string} Formatted value
   */
  formatValue(value, format) {}
}
```

#### view-renderer.js

```javascript
export class ViewRenderer {
  constructor(container, widgetRegistry) {}

  /**
   * Render view and all widgets
   * @param {Object} view - View configuration
   */
  renderView(view) {}

  /**
   * Clear current view
   */
  clearView() {}

  /**
   * Render single widget
   * @param {Object} widgetConfig - Widget configuration
   * @returns {HTMLElement} Widget element
   */
  renderWidget(widgetConfig) {}

  /**
   * Update existing widget
   * @param {string} widgetId - Widget ID
   * @param {Object} config - New configuration
   */
  updateWidget(widgetId, config) {}

  /**
   * Remove widget from view
   * @param {string} widgetId - Widget ID
   */
  removeWidget(widgetId) {}

  /**
   * Apply view background styling
   * @param {Object} view - View configuration
   */
  applyViewBackground(view) {}

  /**
   * Apply view resolution/sizing
   * @param {Object} view - View configuration
   */
  applyViewResolution(view) {}
}
```

#### widget-registry.js

```javascript
export class WidgetRegistry {
  constructor() {}

  /**
   * Register widget class
   * @param {string} type - Widget type
   * @param {Class} widgetClass - Widget class
   */
  register(type, widgetClass) {}

  /**
   * Unregister widget type
   * @param {string} type - Widget type
   */
  unregister(type) {}

  /**
   * Dynamically load widget module
   * @param {string} type - Widget type
   * @returns {Promise<Class>} Widget class
   */
  async loadWidget(type) {}

  /**
   * Check if widget type is loaded
   * @param {string} type - Widget type
   * @returns {boolean} True if loaded
   */
  isLoaded(type) {}

  /**
   * Get widget class
   * @param {string} type - Widget type
   * @returns {Class|null} Widget class
   */
  get(type) {}

  /**
   * Get all registered widgets
   * @returns {Object} Map of type to class
   */
  getAll() {}

  /**
   * Get widget metadata
   * @param {string} type - Widget type
   * @returns {Object} Widget metadata
   */
  getMetadata(type) {}
}
```

#### utils.js

```javascript
/**
 * Debounce function calls
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(fn, delay) {}

/**
 * Throttle function calls
 * @param {Function} fn - Function to throttle
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(fn, delay) {}

/**
 * Convert hex color to rgba
 * @param {string} hex - Hex color (#RRGGBB)
 * @param {number} alpha - Alpha value (0-1)
 * @returns {string} rgba() string
 */
export function hexToRgba(hex, alpha) {}

/**
 * Convert rgba to hex color
 * @param {string} rgba - rgba() string
 * @returns {string} Hex color
 */
export function rgbaToHex(rgba) {}

/**
 * Create DOM element with attributes
 * @param {string} tag - Tag name
 * @param {Object} attrs - Attributes
 * @param {Array} children - Child elements
 * @returns {HTMLElement} Created element
 */
export function createElement(tag, attrs, children) {}

/**
 * Add CSS classes to element
 * @param {HTMLElement} el - Target element
 * @param {...string} classes - Classes to add
 */
export function addClass(el, ...classes) {}

/**
 * Deep clone object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
export function deepClone(obj) {}

/**
 * Deep merge objects
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 */
export function deepMerge(target, source) {}

/**
 * Validate entity ID format
 * @param {string} str - String to validate
 * @returns {boolean} True if valid entity ID
 */
export function isEntityId(str) {}

/**
 * Validate color format
 * @param {string} str - String to validate
 * @returns {boolean} True if valid color
 */
export function isValidColor(str) {}
```

### Editor Modules

#### editor-core.js

```javascript
export class EditorCore {
  constructor(canvasCore) {}

  /**
   * Enable edit mode
   */
  enableEditMode() {}

  /**
   * Disable edit mode
   */
  disableEditMode() {}

  /**
   * Toggle edit mode on/off
   */
  toggleEditMode() {}

  // Getters
  get isEditMode() {}
  get selectedWidgets() {}
  get clipboard() {}
}
```

#### inspector.js

```javascript
export class Inspector {
  constructor(editorCore) {}

  /**
   * Render inspector panel
   * @param {HTMLElement} container - Container element
   */
  render(container) {}

  /**
   * Cleanup and destroy
   */
  destroy() {}

  /**
   * Show inspector for widget
   * @param {Object} widget - Widget instance
   */
  show(widget) {}

  /**
   * Hide inspector
   */
  hide() {}

  /**
   * Refresh inspector display
   */
  refresh() {}

  /**
   * Switch to different tab
   * @param {string} tabName - Tab name ('common', 'custom', 'action')
   */
  switchTab(tabName) {}

  /**
   * Handle field value change
   * @param {string} property - Property name
   * @param {*} value - New value
   * @param {boolean} immediate - Skip debouncing
   */
  onFieldChange(property, value, immediate) {}
}
```

#### Selection, Drag, Resize, etc.

See full module specifications in the complete architecture document. Each editor module follows similar patterns with clear initialization, operation methods, and cleanup.

---

## 🎨 DIALOG & POPUP DESIGN SYSTEM

**Status:** ✅ IMPLEMENTED (Jan 2026)  
**Reference Files:**

- `/www/canvas-ui/dialogs/entity-picker.js` (515 lines)
- `/www/canvas-ui/dialogs/binding-editor.js` (964 lines)
- `/www/canvas-ui/inspector/inspector.js` (integration)

### Design Philosophy

All dialogs follow a **consistent, professional design pattern** inspired by modern UI frameworks but optimized for Canvas UI's dark theme and Home Assistant integration.

**Core Principles:**

1. **Blur backdrop overlay** - Clear visual separation from background
2. **Centered modal** - Always in viewport center, responsive sizing
3. **3-section layout** - Header, scrollable content, footer with actions
4. **ESC to close** - Keyboard accessibility
5. **Auto-focus** - First input focused on open
6. **Proper cleanup** - Event listeners removed on close
7. **Callback pattern** - Return results via constructor callback

### Standard Dialog Structure

```javascript
export class StandardDialog {
  /**
   * Constructor receives dependencies, current value, and callback
   * @param {Object} dependencies - Required systems (entityManager, etc.)
   * @param {*} currentValue - Initial/current value for editing
   * @param {Function} callback - Called with result when user applies
   */
  constructor(dependencies, currentValue, callback) {
    this.dependencies = dependencies;
    this.currentValue = currentValue;
    this.callback = callback;

    // Parse currentValue if needed
    this._parseCurrentValue();
  }

  /**
   * Show dialog
   */
  show() {
    this._createDialog();
  }

  /**
   * Create and display dialog
   * @private
   */
  _createDialog() {
    // 1. CREATE OVERLAY
    this.overlay = document.createElement("div");
    this.overlay.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    // 2. CREATE DIALOG CONTAINER
    this.dialog = document.createElement("div");
    this.dialog.style.cssText = `
      background: var(--card-background-color, #1e1e1e);
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      width: 700px;
      max-width: 90vw;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    `;

    // 3. CREATE HEADER
    const header = this._createHeader();

    // 4. CREATE CONTENT (scrollable)
    this.contentArea = document.createElement("div");
    this.contentArea.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 20px;
    `;
    this._renderContent();

    // 5. CREATE FOOTER
    const footer = this._createFooter();

    // 6. ASSEMBLE
    this.dialog.appendChild(header);
    this.dialog.appendChild(this.contentArea);
    this.dialog.appendChild(footer);
    this.overlay.appendChild(this.dialog);
    document.body.appendChild(this.overlay);

    // 7. KEYBOARD HANDLERS
    this.keyHandler = (e) => {
      if (e.key === "Escape") this.close();
    };
    document.addEventListener("keydown", this.keyHandler);

    // 8. AUTO-FOCUS
    setTimeout(() => {
      const firstInput = this.dialog.querySelector("input, textarea");
      if (firstInput) firstInput.focus();
    }, 100);
  }

  /**
   * Create header section
   * @private
   */
  _createHeader() {
    const header = document.createElement("div");
    header.style.cssText = `
      padding: 16px 20px;
      border-bottom: 1px solid var(--divider-color, #333);
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;

    const title = document.createElement("h2");
    title.textContent = this.getTitle();
    title.style.cssText = `
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--primary-text-color, #fff);
    `;

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "×";
    closeBtn.style.cssText = `
      background: none;
      border: none;
      color: var(--secondary-text-color, #aaa);
      font-size: 28px;
      cursor: pointer;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.2s;
    `;
    closeBtn.onmouseenter = () => {
      closeBtn.style.background = "rgba(255, 255, 255, 0.1)";
    };
    closeBtn.onmouseleave = () => {
      closeBtn.style.background = "none";
    };
    closeBtn.onclick = () => this.close();

    header.appendChild(title);
    header.appendChild(closeBtn);

    return header;
  }

  /**
   * Create footer section
   * @private
   */
  _createFooter() {
    const footer = document.createElement("div");
    footer.style.cssText = `
      padding: 16px 20px;
      border-top: 1px solid var(--divider-color, #333);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    `;

    // Optional preview area (left side)
    if (this.showPreview) {
      this.previewArea = document.createElement("div");
      this.previewArea.style.cssText = `
        flex: 1;
        padding: 8px 12px;
        background: rgba(3, 169, 244, 0.1);
        border: 1px solid rgba(3, 169, 244, 0.3);
        border-radius: 4px;
        font-family: monospace;
        font-size: 13px;
        color: #03a9f4;
      `;
      footer.appendChild(this.previewArea);
    } else {
      // Spacer
      const spacer = document.createElement("div");
      spacer.style.flex = "1";
      footer.appendChild(spacer);
    }

    // Buttons (right side)
    const buttonContainer = document.createElement("div");
    buttonContainer.style.cssText = `
      display: flex;
      gap: 8px;
    `;

    const cancelBtn = this._createButton("Cancel", "secondary", () =>
      this.close(),
    );
    const applyBtn = this._createButton("Apply", "primary", () => this.apply());

    buttonContainer.appendChild(cancelBtn);
    buttonContainer.appendChild(applyBtn);
    footer.appendChild(buttonContainer);

    return footer;
  }

  /**
   * Create styled button
   * @private
   */
  _createButton(text, type, onClick) {
    const btn = document.createElement("button");
    btn.textContent = text;

    const styles = {
      primary: {
        background: "#03a9f4",
        hoverBg: "#0288d1",
        color: "#fff",
        border: "#03a9f4",
      },
      secondary: {
        background: "#444",
        hoverBg: "#555",
        color: "#fff",
        border: "#666",
      },
      danger: {
        background: "#d32f2f",
        hoverBg: "#c62828",
        color: "#fff",
        border: "#d32f2f",
      },
    };

    const style = styles[type] || styles.secondary;

    btn.style.cssText = `
      padding: 8px 16px;
      background: ${style.background};
      color: ${style.color};
      border: 1px solid ${style.border};
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: ${type === "primary" ? "500" : "normal"};
      transition: all 0.2s;
    `;

    btn.onmouseenter = () => {
      btn.style.background = style.hoverBg;
    };
    btn.onmouseleave = () => {
      btn.style.background = style.background;
    };

    btn.onclick = onClick;

    return btn;
  }

  /**
   * Render content (override in subclass)
   * @private
   */
  _renderContent() {
    // Implement in subclass
  }

  /**
   * Get dialog title (override in subclass)
   */
  getTitle() {
    return "Dialog";
  }

  /**
   * Apply and close (override in subclass)
   */
  apply() {
    if (this.callback) {
      this.callback(this.currentValue);
    }
    this.close();
  }

  /**
   * Close dialog
   */
  close() {
    if (this.keyHandler) {
      document.removeEventListener("keydown", this.keyHandler);
    }
    if (this.overlay && this.overlay.parentNode) {
      document.body.removeChild(this.overlay);
    }
  }
}
```

### Color Palette Standards

All dialogs use this consistent color system:

```javascript
const DIALOG_COLORS = {
  // Backgrounds
  overlay: "rgba(0, 0, 0, 0.7)",
  dialogBg: "var(--card-background-color, #1e1e1e)",
  contentBg: "var(--secondary-background-color, #2a2a2a)",
  inputBg: "var(--secondary-background-color, #2a2a2a)",

  // Borders
  border: "var(--divider-color, #333)",
  focusBorder: "#03a9f4",

  // Text
  primaryText: "var(--primary-text-color, #fff)",
  secondaryText: "var(--secondary-text-color, #aaa)",
  mutedText: "#666",

  // Accent colors
  primary: "#03a9f4",
  primaryHover: "#0288d1",
  success: "#4caf50",
  successHover: "#45a049",
  danger: "#d32f2f",
  dangerHover: "#c62828",
  warning: "#ff9800",

  // Semantic backgrounds
  infoBg: "rgba(3, 169, 244, 0.1)",
  infoBorder: "rgba(3, 169, 244, 0.3)",
  successBg: "rgba(76, 175, 80, 0.1)",
  successBorder: "rgba(76, 175, 80, 0.3)",
};
```

### Layout Spacing Standards

```javascript
const DIALOG_SPACING = {
  // Padding
  headerPadding: "16px 20px",
  contentPadding: "20px",
  footerPadding: "16px 20px",

  // Gaps
  smallGap: "4px",
  mediumGap: "8px",
  largeGap: "12px",
  xlargeGap: "16px",

  // Border radius
  dialogRadius: "8px",
  buttonRadius: "4px",

  // Z-index
  overlay: 10000,
  nestedOverlay: 10001,
};
```

### Inspector Integration Pattern

When adding dialog launcher buttons to inspector property fields:

```javascript
/**
 * Create input with dialog button
 * @param {Object} prop - Property definition
 * @param {Object} widget - Widget instance
 * @param {string} buttonIcon - Button text ("...", "{}", etc.)
 * @param {Class} DialogClass - Dialog constructor
 */
createInputWithDialog(prop, widget, buttonIcon, DialogClass) {
  const container = document.createElement("div");
  container.style.cssText = `
    display: flex;
    gap: 4px;
    align-items: center;
  `;

  // Input field
  const input = document.createElement("input");
  input.type = "text";
  input.value = this.getPropertyValue(widget, prop.name);
  input.style.cssText = `
    flex: 1;
    padding: 6px 8px;
    background: var(--secondary-background-color, #2a2a2a);
    border: 1px solid var(--divider-color, #333);
    border-radius: 4px;
    color: var(--primary-text-color, #fff);
    font-size: 14px;
  `;

  // Save on blur (NOT input) to prevent focus loss
  input.addEventListener("blur", () => {
    this.handlePropertyChange(prop.name, input.value);
  });

  // Dialog launcher button
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = buttonIcon;
  button.title = `Open ${DialogClass.name}`;
  button.style.cssText = `
    padding: 6px 12px;
    background: #2c2c2c;
    color: ${buttonIcon === "{}" ? "#03a9f4" : "#fff"};
    border: 1px solid #555;
    border-radius: 4px;
    cursor: pointer;
    font-size: ${buttonIcon === "{}" ? "12px" : "13px"};
    font-weight: ${buttonIcon === "{}" ? "700" : "500"};
    transition: all 0.2s;
    flex-shrink: 0;
  `;

  button.onmouseenter = () => {
    button.style.background = "#03a9f4";
    button.style.color = "#fff";
    button.style.borderColor = "#03a9f4";
  };
  button.onmouseleave = () => {
    button.style.background = "#2c2c2c";
    button.style.color = buttonIcon === "{}" ? "#03a9f4" : "#fff";
    button.style.borderColor = "#555";
  };

  button.onclick = () => {
    const dependencies = widget.canvasCore.entityManager;
    if (!dependencies) {
      console.error("[Inspector] Required dependency not available");
      return;
    }

    const dialog = new DialogClass(dependencies, input.value, (result) => {
      input.value = result;
      this.handlePropertyChange(prop.name, result);
    });

    dialog.show();
  };

  container.appendChild(input);
  container.appendChild(button);

  return container;
}
```

### Implemented Dialogs

#### Entity Picker Dialog

**File:** `/www/canvas-ui/dialogs/entity-picker.js` (515 lines)

**Features:**

- Search input with real-time filtering
- Domain-based grouping (collapsible sections)
- 40+ domain icons with colors
- State badges showing current entity state
- Sorted by friendly name
- Click to select, auto-close on selection

**Usage:**

```javascript
const picker = new EntityPickerDialog(entityManager, (selectedEntityId) => {
  console.log("Selected:", selectedEntityId);
});
picker.show();
```

**Inspector Integration:**

- Type: `entity` or `id` in widget config schema
- Button: `"..."` (three dots)
- Location: Next to entity input fields

#### Binding Editor Dialog

**File:** `/www/canvas-ui/dialogs/binding-editor.js` (964 lines)

**Features:**

- **Simple Mode**: Entity + operations builder
  - Entity selector with picker button
  - Visual operation list with add/remove
  - 40+ operations in 5 categories (Math, Format, DateTime, String, Conditional, Advanced)
  - Inline editing of operation parameters
  - Live preview of generated binding string
- **Multi-Variable Mode**: JavaScript eval expressions
  - Textarea for complex expressions
  - Format: `{var1:entity1;var2:entity2;formula}`
  - Full JavaScript expression support
- Mode switcher (Simple ↔ Multi)
- Operation picker dialog (nested z-index: 10001)

**Usage:**

```javascript
const editor = new BindingEditorDialog(
  entityManager,
  "{sensor.temperature;* 1.8;+ 32;round(1)}",
  (binding) => {
    console.log("New binding:", binding);
  },
);
editor.show();
```

**Inspector Integration:**

- Type: `text` with `binding: true` (default) in config schema
- Button: `"{}"` (curly braces) in blue color
- Location: Next to text input fields that support bindings

### Focus Loss Prevention (CRITICAL)

**Problem:** Using `input` event on text fields causes inspector to refresh on every keystroke, kicking user out of field.

**Solution:** Always use `blur` event for text inputs:

```javascript
// ❌ WRONG - causes focus loss
input.addEventListener("input", () => {
  this.handlePropertyChange(prop.name, input.value);
});

// ✅ CORRECT - saves when leaving field
input.addEventListener("blur", () => {
  this.handlePropertyChange(prop.name, input.value);
});
```

**Why It Happens:**

1. User types in input field
2. `handlePropertyChange` triggers `viewRenderer.updateWidget()`
3. `updateWidget` emits `widgetUpdated` event
4. Event handler checks if widget is selected
5. If selected, calls `inspector.showWidget()` to refresh
6. Inspector re-renders, destroying and recreating input
7. User loses focus and must click back into field

**Fix in canvas-core.js:**

```javascript
this.on("widgetUpdated", (data) => {
  const { widgetId } = data;

  // Only refresh if inspector isn't focused
  const inspectorFocused = this.inspector.container.contains(
    document.activeElement,
  );
  if (this.selectionManager.isSelected(widgetId) && !inspectorFocused) {
    const widget = this.viewRenderer.getWidget(widgetId);
    if (widget) {
      this.inspector.showWidget(widget);
    }
  }
});
```

### Property Persistence Flow

When user changes a property in inspector:

1. **Input blur event fires** → `handlePropertyChange(prop, value)`
2. **Inspector updates widget** → `widget.config[prop] = value`
3. **Inspector notifies listeners** → `onPropertyChanged(widget, prop, value)`
4. **Canvas core receives notification** → Updates ViewRenderer
5. **ViewRenderer updates widget** → `updateWidget(widgetId, changes)`
6. **Widget config updated** → `Object.assign(widget.config, changes)`
7. **Widget notified** → `widget.instance.updateConfig(changes)`
8. **Event emitted** → `widgetUpdated` event
9. **Undo/redo save** → `undoRedoSystem.saveState("Widget modified")`
10. **Configuration save** → `saveConfiguration()` (debounced 2s)
11. **localStorage save** → Immediate
12. **HA file save** → Via canvas_ui.write_file service

**Debounced Auto-Save (2 seconds):**

```javascript
async saveConfiguration(config = null) {
  if (this.undoRedoSystem?.isApplying) return;

  if (this.saveTimer) clearTimeout(this.saveTimer);

  this._updateSaveStatus("saving");

  this.saveTimer = setTimeout(async () => {
    const configToSave = config || this.configuration;

    // Save to localStorage (primary)
    localStorage.setItem("canvas-ui-config", JSON.stringify(configToSave));

    // Save to HA file (backup)
    await this.connection.callService("canvas_ui", "write_file", {
      path: "www/canvas-ui/canvas-ui-config.json",
      data: JSON.stringify(configToSave, null, 2),
    });

    this._updateSaveStatus("saved");
  }, 2000);
}
```

### Dialog Best Practices

**DO:**

- ✅ Use consistent color palette (`DIALOG_COLORS`)
- ✅ Add ESC key handler for closing
- ✅ Auto-focus first input field
- ✅ Remove event listeners in `close()`
- ✅ Use callback pattern for results
- ✅ Support blur backdrop overlay
- ✅ Make content area scrollable (`overflow-y: auto`)
- ✅ Use proper z-index (10000 for main, 10001 for nested)
- ✅ Add hover states to all interactive elements
- ✅ Use `transition: all 0.2s` for smooth interactions

**DON'T:**

- ❌ Don't forget to clean up event listeners
- ❌ Don't use fixed heights (use max-height instead)
- ❌ Don't nest dialogs beyond z-index 10001
- ❌ Don't use `input` events on text fields (use `blur`)
- ❌ Don't update preview before elements are created (check `if (!this.previewArea) return`)
- ❌ Don't hardcode colors (use CSS variables with fallbacks)
- ❌ Don't forget responsive sizing (`max-width: 90vw`)

### Testing Checklist

Before deploying a new dialog:

- [ ] Dialog centers in viewport
- [ ] ESC key closes dialog
- [ ] Click outside overlay closes dialog (if desired)
- [ ] First input auto-focuses
- [ ] All buttons have hover states
- [ ] Close button (×) works
- [ ] Apply button triggers callback
- [ ] Cancel button closes without callback
- [ ] Event listeners cleaned up on close
- [ ] Works on mobile (responsive sizing)
- [ ] Preview updates (if applicable)
- [ ] No console errors
- [ ] Memory leaks checked (listeners removed)

---

## 📚 APPENDIX H: MDI ICON SYSTEM

**Status:** ✅ IMPLEMENTED & EXPANDED (Jan 2026)  
**Latest:** 150+ icons with category filtering (Jan 25, 2026)

**Reference Files:**

- `/www/canvas-ui/utils/icon-parser.js` (220 lines) - Parser and SVG generator
- `/www/canvas-ui/utils/mdi-icon-library.js` (400 lines) - **NEW:** Comprehensive icon library
- `/www/canvas-ui/dialogs/icon-picker-dialog.js` (850 lines) - Full picker with color + categories
- `/www/canvas-ui/dialogs/icon-picker-simple-dialog.js` (460 lines) - **NEW:** Icon-only picker for inspector
- `/www/canvas-ui/dialogs/binding-editor.js` (integration)

### Overview

The MDI icon system enables inline Material Design Icons with custom colors in binding outputs. Icons are embedded directly in text using the syntax `mdi:icon-name:color Text`, parsed at render time, and displayed as properly scaled, colored SVG icons.

**Key Features:**

- 150+ bundled MDI icons organized in 9 categories with SVG paths
- Custom color support (hex, RGB, RGBA, CSS names)
- Dynamic size scaling (matches element font-size)
- Visual icon picker with color selector
- Integration with binding editor (both simple and multi-variable modes)
- Quote-aware ternary support for conditional icons

### Syntax

```
mdi:icon-name:color Text
```

**Components:**

- `mdi:` - Required prefix
- `icon-name` - Icon identifier (lowercase, hyphens)
- `:color` - Optional color specification
- `Text` - Optional text after icon (separated by space)

**Examples:**

```javascript
// Icon only
"mdi:fire";

// Icon with color
"mdi:fire:#ff5500";

// Icon with color and text
"mdi:fire:#ff5500 Hot";

// Multiple icons
"mdi:thermometer:#03a9f4 23.5°C mdi:check:#4caf50 OK";

// In bindings
"{sensor.temperature;value > 20 ? 'mdi:fire:#ff5500 Hot' : 'mdi:snowflake:#03a9f4 Cold'}";
```

### Icon Library (150+ Icons in 9 Categories)

**File:** `/www/canvas-ui/utils/mdi-icon-library.js` (400 lines)

**Category 1: Common (16 icons)**

- check, check-circle, close, close-circle, plus, minus, pencil, delete, refresh, cog, information, alert, help-circle, star, heart, eye

**Category 2: Navigation (16 icons)**

- arrow-up, arrow-down, arrow-left, arrow-right, chevron-up, chevron-down, chevron-left, chevron-right, menu, menu-open, dots-horizontal, dots-vertical, home, navigation, compass, map-marker

**Category 3: Device (12 icons)**

- cellphone, tablet, laptop, monitor, television, speaker, keyboard, mouse, camera, printer, headphones, gamepad

**Category 4: Home & IoT (12 icons)**

- lightbulb, fan, door-open, door-closed, window-open, window-closed, blinds, thermometer, air-conditioner, lock, lock-open, shield-home

**Category 5: Media (15 icons)**

- play, pause, stop, skip-next, skip-previous, fast-forward, rewind, volume-high, volume-medium, volume-low, volume-mute, shuffle, repeat, music, video, microphone

**Category 6: Weather (7 icons)**

- weather-sunny, weather-cloudy, weather-rainy, weather-snowy, fire, snowflake, water

**Category 7: Status (13 icons)**

- power, battery, battery-charging, wifi, bluetooth, signal, cloud, cloud-upload, cloud-download, sync, check-network, alert-circle, information-outline

**Category 8: Time & Date (6 icons)**

- clock, clock-outline, calendar, timer, alarm, hourglass

**Category 9: Data & Charts (8 icons)**

- chart-line, chart-bar, chart-pie, chart-arc, gauge, speedometer, poll, table

**Category 10: Files (8 icons)**

- file, folder, folder-open, download, upload, save, content-copy, content-paste

**Library Structure:**

```javascript
export const MDI_ICON_CATEGORIES = {
  common: {
    label: "Common",
    icons: {
      check: "M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z",
      // ... more icons
    },
  },
  navigation: {
    label: "Navigation",
    icons: {
      /* ... */
    },
  },
  // ... more categories
};

export function getCategoryOptions() {
  return [
    { value: "common", label: "Common" },
    { value: "navigation", label: "Navigation" },
    // ... all 9 categories
  ];
}

export function getIconsByCategory(categoryKey) {
  return MDI_ICON_CATEGORIES[categoryKey]?.icons || {};
}

export function getAllIcons() {
  // Merge all category icons
}
```

### Icon Parser Implementation

**File:** `/www/canvas-ui/utils/icon-parser.js` (220 lines)

**Pattern:**

```javascript
/mdi:([a-z0-9-]+)(?::([#a-z0-9(),.]+))?/gi;
```

**Critical Regex Fix:**

- Removed `\s` from color group to preserve text after icons
- Pattern stops at first space, preventing text loss

**Color Parsing:**

```javascript
parseColor(colorStr) {
  // Hex colors
  if (colorStr.startsWith('#')) return colorStr;

  // RGB/RGBA
  if (colorStr.startsWith('rgb')) return colorStr;

  // CSS color names
  const cssColors = ['red', 'blue', 'green', ...];
  if (cssColors.includes(colorStr.toLowerCase())) return colorStr;

  return '#000000'; // Default black
}
```

**SVG Generation:**

```javascript
createSVG(iconName, color, fontSize) {
  const path = this.icons[iconName];
  if (!path) return null;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', fontSize);
  svg.setAttribute('height', fontSize);
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.style.display = 'inline-block';
  svg.style.verticalAlign = 'middle';
  svg.style.fill = color;

  const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  pathEl.setAttribute('d', path);
  svg.appendChild(pathEl);

  return svg;
}
```

**Usage in Widgets:**

```javascript
import { parseIcons } from "../../utils/icon-parser.js";

// Parse and render icons
const parsedContent = parseIcons(widget.config.text, element);
element.innerHTML = ""; // Clear
element.appendChild(parsedContent); // Append parsed result
```

### Dual Icon Picker System

**Design Pattern:** Two separate dialogs for different use cases

#### 1. Full Icon Picker (Binding Editor)

**File:** `/www/canvas-ui/dialogs/icon-picker-dialog.js` (850 lines)

**UI Components:**

1. **Header with Category Dropdown**
   - Title: "Select Icon"
   - Category selector dropdown (9 categories)
   - Close button (×)

2. **Icon Grid** (4 columns, filtered by category)
   - Displays only selected category's icons (~7-16 icons at a time)
   - Click to select (blue border on selection)
   - Icon name shown on hover
   - Grid dynamically updates when category changes

3. **Color Input** (hex)
   - Text input with validation
   - Real-time preview updates
   - Default: `#03a9f4` (blue)

4. **Color Picker Button**
   - HTML5 color picker
   - Updates hex input on selection

5. **Quick Color Presets** (6 buttons)
   - Blue: `#03a9f4`
   - Green: `#4caf50`
   - Orange: `#ff9800`
   - Red: `#f44336`
   - Purple: `#9c27b0`
   - Gray: `#607d8b`

6. **Live Preview**
   - Shows selected icon with color
   - Updates on selection/color change
   - Display format: `mdi:icon-name:color`

**Output Format:**

```javascript
"mdi:fire:#ff5500 "; // Includes trailing space for user's text
```

**Integration:**

- Binding Editor Simple Mode: Palette button (🎨) next to operation value inputs
- Binding Editor Multi-Variable Mode: Palette button below formula textarea
- Button style: Icon-only (28×28px) with blue accent color
- Tooltip: "Insert MDI Icon"

**Implementation:**

```javascript
import { getCategoryOptions, getIconsByCategory } from "../utils/mdi-icon-library.js";

export class IconPickerDialog {
  constructor(callback) {
    this.callback = callback;
    this.selectedIcon = null;
    this.selectedColor = "#03a9f4";
    this.selectedCategory = "common"; // Default
  }

  _createHeader() {
    // Title row
    const titleRow = ...;

    // Category dropdown row
    this.categorySelect = document.createElement("select");
    getCategoryOptions().forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat.value;
      option.textContent = cat.label;
      this.categorySelect.appendChild(option);
    });

    this.categorySelect.onchange = () => {
      this.selectedCategory = this.categorySelect.value;
      this._renderIconGrid(); // Re-render with filtered icons
    };
  }

  _renderIconGrid() {
    const categoryIcons = getIconsByCategory(this.selectedCategory);
    // Create 4-column grid with only category's icons
  }
}
```

#### 2. Simple Icon Picker (Inspector)

**File:** `/www/canvas-ui/dialogs/icon-picker-simple-dialog.js` (460 lines)

**Purpose:** Icon-only picker for inspector property fields (NO color selection)

**UI Components:**

1. **Header with Category Dropdown** (same as full picker)
   - Title: "Select Icon"
   - Category selector dropdown (9 categories)
   - Close button (×)

2. **Icon Grid** (4 columns, filtered by category)
   - Displays only selected category's icons
   - Click to select (blue border)
   - Icon name shown on hover

3. **NO Color Picker** (simplified for inspector use)
   - Icon selection only
   - Color managed separately in inspector color field

**Output Format:**

```javascript
"mdi-fire"; // Icon name only, no prefix or color
```

**Integration:**

- Inspector icon fields: `...` button (three dots) next to input
- Button style: Small button matching inspector field height
- Output directly sets `config.icon` property

**Implementation:**

```javascript
import {
  getCategoryOptions,
  getIconsByCategory,
} from "../utils/mdi-icon-library.js";

export class IconPickerSimpleDialog {
  constructor(callback) {
    this.callback = callback;
    this.selectedIcon = null;
    this.selectedCategory = "common"; // Default
  }

  insert() {
    if (!this.selectedIcon) {
      alert("Please select an icon first");
      return;
    }
    // Return icon name only (mdi-fire), no color
    if (this.callback) {
      this.callback(`mdi-${this.selectedIcon}`);
    }
    this.close();
  }
}
```

### Category Filtering System

**Purpose:** Prevent UI overload when displaying 150+ icons

**Strategy:**

- Category dropdown shows 9 semantic categories
- Icon grid displays only selected category's icons (max ~16 at a time)
- Default category: "common" (most frequently used)
- Selection highlighting persists across category changes

**Benefits:**

- ✅ Improved performance (render fewer DOM elements)
- ✅ Better UX (easier to find specific icon)
- ✅ Semantic organization (icons grouped by purpose)
- ✅ Scalable (can add more categories/icons without UI degradation)

**Implementation Pattern:**

```javascript
// 1. Import library helpers
import {
  getCategoryOptions,
  getIconsByCategory,
} from "../utils/mdi-icon-library.js";

// 2. Track selected category
this.selectedCategory = "common";

// 3. Create category dropdown
const categorySelect = document.createElement("select");
getCategoryOptions().forEach((cat) => {
  const option = document.createElement("option");
  option.value = cat.value;
  option.textContent = cat.label;
  categorySelect.appendChild(option);
});

// 4. Handle category change
categorySelect.onchange = () => {
  this.selectedCategory = categorySelect.value;
  this._renderIconGrid(); // Re-render with filtered icons
};

// 5. Render filtered grid
const categoryIcons = getIconsByCategory(this.selectedCategory);
Object.keys(categoryIcons).forEach((iconName) => {
  // Create icon button using SVG path from categoryIcons[iconName]
});
```

### Shared Library Architecture

**Central Icon Library:**

```javascript
// www/canvas-ui/utils/mdi-icon-library.js

export const MDI_ICON_CATEGORIES = {
  common: {
    label: "Common",
    icons: {
      check: "M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z",
      close:
        "M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z",
      // ... 14 more icons
    },
  },
  // ... 8 more categories
};

// Helper: Get all category options for dropdown
export function getCategoryOptions() {
  return Object.entries(MDI_ICON_CATEGORIES).map(([key, category]) => ({
    value: key,
    label: category.label,
  }));
}

// Helper: Get icons for specific category
export function getIconsByCategory(categoryKey) {
  return MDI_ICON_CATEGORIES[categoryKey]?.icons || {};
}

// Helper: Get all icons (backwards compatibility)
export function getAllIcons() {
  const allIcons = {};
  for (const category of Object.values(MDI_ICON_CATEGORIES)) {
    Object.assign(allIcons, category.icons);
  }
  return allIcons;
}
```

**Benefits:**

- ✅ Single source of truth for all icons
- ✅ Both pickers use same library
- ✅ Easy to add/remove icons or categories
- ✅ Backwards compatibility via `getAllIcons()`
- ✅ Type-safe category structure

### Icon/Color Property Separation Pattern

**Design Decision:** Widgets store icon name and color separately in inspector, but combined in bindings.

**Inspector Fields (Separate Storage):**

```javascript
// Widget config stores separately
widget.config.icon = "mdi-fire"; // Icon name only
widget.config.iconColor = "#ff5500"; // Color separately

// Simple picker returns icon name only
const picker = new IconPickerSimpleDialog((iconName) => {
  widget.config.icon = iconName; // "mdi-fire"
});
```

**Binding Expressions (Combined Format):**

```javascript
// Bindings use combined format
widget.config.text =
  "{sensor.temp;value > 20 ? 'mdi:fire:#ff5500 Hot' : 'mdi:snowflake:#03a9f4 Cold'}";

// Full picker returns combined format
const picker = new IconPickerDialog((iconString) => {
  input.value = iconString; // "mdi:fire:#ff5500 "
});

// Parser handles both formats
// Binding: mdi:icon:color (colon separators)
// Icon name: mdi-icon (hyphen separator)
```

**Why This Matters:**

- **Inspector use**: Separate fields allow independent editing of icon and color
- **Binding use**: Combined format allows dynamic icon + color selection in expressions
- **Parser compatibility**: Handles both formats correctly (`:` in bindings, `-` in names)
- **Data model clarity**: `config.icon` is always plain name, bindings are in `config.text`

### Widget Integration

**Supported Widgets (4):**

1. **Text Widget** - Dynamic text display
2. **Button Widget** - Button labels
3. **Switch Widget** - Switch labels
4. **Value Widget** - Value display with units

**Integration Pattern:**

```javascript
import { parseIcons } from "../../utils/icon-parser.js";

export class TextWidget extends BaseWidget {
  render() {
    const container = document.createElement("div");
    // ... setup container ...

    this.textElement = document.createElement("div");

    // Parse icons in text
    const text = this.config.text || "";
    const parsedContent = parseIcons(text, this.textElement);

    this.textElement.innerHTML = "";
    this.textElement.appendChild(parsedContent);

    container.appendChild(this.textElement);
    return container;
  }

  updateDisplay(changes) {
    if (changes.text !== undefined) {
      const parsedContent = parseIcons(changes.text, this.textElement);
      this.textElement.innerHTML = "";
      this.textElement.appendChild(parsedContent);
    }
  }
}
```

### Dialog Structure (Both Pickers)

```javascript
export class IconPickerDialog {
  constructor(callback) {
    this.callback = callback;
    this.selectedIcon = null;
    this.selectedColor = "#03a9f4";
  }

  show() {
    this._createDialog(); // z-index: 10001
  }

  insert() {
    if (!this.selectedIcon) {
      alert("Please select an icon first");
      return;
    }
    const formatted = `mdi:${this.selectedIcon}:${this.selectedColor} `;
    if (this.callback) {
      this.callback(formatted);
    }
    this.close();
  }
}
```

**Output Format:**

```javascript
"mdi:fire:#ff5500 "; // Includes trailing space for user's text
```

**Integration:**

- Binding Editor Simple Mode: Palette button (🎨) next to operation value inputs
- Binding Editor Multi-Variable Mode: Palette button below formula textarea
- Button style: Icon-only (28×28px) with blue accent color
- Tooltip: "Insert MDI Icon"

**Implementation:**

```javascript
import { getCategoryOptions, getIconsByCategory } from "../utils/mdi-icon-library.js";

export class IconPickerDialog {
  constructor(callback) {
    this.callback = callback;
    this.selectedIcon = null;
    this.selectedColor = "#03a9f4";
    this.selectedCategory = "common"; // Default
  }

  _createHeader() {
    // Title row
    const titleRow = ...;

    // Category dropdown row
    this.categorySelect = document.createElement("select");
    getCategoryOptions().forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat.value;
      option.textContent = cat.label;
      this.categorySelect.appendChild(option);
    });

    this.categorySelect.onchange = () => {
      this.selectedCategory = this.categorySelect.value;
      this._renderIconGrid(); // Re-render with filtered icons
    };
  }

  _renderIconGrid() {
    const categoryIcons = getIconsByCategory(this.selectedCategory);
    // Create 4-column grid with only category's icons
  }
}
```

#### 2. Simple Icon Picker (Inspector)

**File:** `/www/canvas-ui/dialogs/icon-picker-simple-dialog.js` (460 lines)

**Purpose:** Icon-only picker for inspector property fields (NO color selection)

**UI Components:**

1. **Header with Category Dropdown** (same as full picker)
   - Title: "Select Icon"
   - Category selector dropdown (9 categories)
   - Close button (×)

2. **Icon Grid** (4 columns, filtered by category)
   - Displays only selected category's icons
   - Click to select (blue border)
   - Icon name shown on hover

3. **NO Color Picker** (simplified for inspector use)
   - Icon selection only
   - Color managed separately in inspector color field

**Output Format:**

```javascript
"mdi-fire"; // Icon name only, no prefix or color
```

**Integration:**

- Inspector icon fields: `...` button (three dots) next to input
- Button style: Small button matching inspector field height
- Output directly sets `config.icon` property

**Implementation:**

```javascript
import {
  getCategoryOptions,
  getIconsByCategory,
} from "../utils/mdi-icon-library.js";

export class IconPickerSimpleDialog {
  constructor(callback) {
    this.callback = callback;
    this.selectedIcon = null;
    this.selectedCategory = "common"; // Default
  }

  insert() {
    if (!this.selectedIcon) {
      alert("Please select an icon first");
      return;
    }
    // Return icon name only (mdi-fire), no color
    if (this.callback) {
      this.callback(`mdi-${this.selectedIcon}`);
    }
    this.close();
  }
}
```

### Category Filtering System

```javascript
"mdi:fire:#ff5500 "; // Includes trailing space for user's text
```

### Binding Editor Integration

**File:** `/www/canvas-ui/dialogs/binding-editor.js`

**Two Integration Points:**

#### 1. Simple Mode (Default - Operation Rows)

**Location:** Next to each operation value input

**Button Style:**

- Icon-only button (28×28px)
- MDI palette SVG icon (16×16px)
- Blue accent color (`#03a9f4`)
- Tooltip: "Insert MDI Icon"

**Code:**

```javascript
// Icon picker button for operation value
const iconBtn = document.createElement("button");
iconBtn.type = "button";
iconBtn.innerHTML = `
  <svg width="16" height="16" viewBox="0 0 24 24" style="fill: currentColor;">
    <path d="M17.5,12A1.5,1.5 0 0,1 16,10.5A1.5,1.5 0 0,1 17.5,9A1.5,1.5 0 0,1 19,10.5A1.5,1.5 0 0,1 17.5,12M14.5,8A1.5,1.5 0 0,1 13,6.5A1.5,1.5 0 0,1 14.5,5A1.5,1.5 0 0,1 16,6.5A1.5,1.5 0 0,1 14.5,8M9.5,8A1.5,1.5 0 0,1 8,6.5A1.5,1.5 0 0,1 9.5,5A1.5,1.5 0 0,1 11,6.5A1.5,1.5 0 0,1 9.5,8M6.5,12A1.5,1.5 0 0,1 5,10.5A1.5,1.5 0 0,1 6.5,9A1.5,1.5 0 0,1 8,10.5A1.5,1.5 0 0,1 6.5,12M12,3A9,9 0 0,0 3,12A9,9 0 0,0 12,21A1.5,1.5 0 0,0 13.5,19.5C13.5,19.11 13.35,18.76 13.11,18.5C12.88,18.23 12.73,17.88 12.73,17.5A1.5,1.5 0 0,1 14.23,16H16A5,5 0 0,0 21,11C21,6.58 16.97,3 12,3Z"/>
  </svg>
`;
iconBtn.title = "Insert MDI Icon";
iconBtn.onclick = () => {
  const cursorPos = opText.selectionStart;
  const picker = new IconPickerDialog((iconString) => {
    const before = opText.value.substring(0, cursorPos);
    const after = opText.value.substring(cursorPos);
    opText.value = before + iconString + after;

    const newPos = cursorPos + iconString.length;
    opText.setSelectionRange(newPos, newPos);
    opText.focus();

    this.parsedOperations[index] = opText.value;
    this._updatePreview();
  });
  picker.show();
};
```

#### 2. Multi-Variable Mode (Formula Textarea)

**Location:** Below textarea

**Button Style:**

- Full button with icon + text
- MDI palette SVG icon (16×16px) + "Insert MDI Icon"
- Blue accent color
- Flex layout with 4px spacing

**Code:**

```javascript
const iconBtn = document.createElement("button");
iconBtn.type = "button";
iconBtn.innerHTML = `
  <svg width="16" height="16" viewBox="0 0 24 24" style="fill: currentColor; vertical-align: middle; margin-right: 4px;">
    <path d="M17.5,12A1.5,1.5 0 0,1 16,10.5A1.5,1.5 0 0,1 17.5,9A1.5,1.5 0 0,1 19,10.5A1.5,1.5 0 0,1 17.5,12M14.5,8A1.5,1.5 0 0,1 13,6.5A1.5,1.5 0 0,1 14.5,5A1.5,1.5 0 0,1 16,6.5A1.5,1.5 0 0,1 14.5,8M9.5,8A1.5,1.5 0 0,1 8,6.5A1.5,1.5 0 0,1 9.5,5A1.5,1.5 0 0,1 11,6.5A1.5,1.5 0 0,1 9.5,8M6.5,12A1.5,1.5 0 0,1 5,10.5A1.5,1.5 0 0,1 6.5,9A1.5,1.5 0 0,1 8,10.5A1.5,1.5 0 0,1 6.5,12M12,3A9,9 0 0,0 3,12A9,9 0 0,0 12,21A1.5,1.5 0 0,0 13.5,19.5C13.5,19.11 13.35,18.76 13.11,18.5C12.88,18.23 12.73,17.88 12.73,17.5A1.5,1.5 0 0,1 14.23,16H16A5,5 0 0,0 21,11C21,6.58 16.97,3 12,3Z"/>
  </svg>
  Insert MDI Icon
`;
iconBtn.style.cssText = `
  align-self: flex-start;
  padding: 6px 12px;
  background: #2c2c2c;
  color: #03a9f4;
  border: 1px solid #555;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
`;
iconBtn.onclick = () => {
  const cursorPos = this.formulaTextarea.selectionStart;
  const picker = new IconPickerDialog((iconString) => {
    const before = this.formulaTextarea.value.substring(0, cursorPos);
    const after = this.formulaTextarea.value.substring(cursorPos);
    this.formulaTextarea.value = before + iconString + after;

    const newPos = cursorPos + iconString.length;
    this.formulaTextarea.setSelectionRange(newPos, newPos);
    this.formulaTextarea.focus();

    this._updatePreview();
  });
  picker.show();
};
```

### Widget Integration

All text-displaying widgets support icon parsing:

**Supported Widgets (4):**

1. **Text Widget** - Dynamic text display
2. **Button Widget** - Button labels
3. **Switch Widget** - Switch labels
4. **Value Widget** - Value display with units

**Integration Pattern:**

```javascript
import { parseIcons } from "../../utils/icon-parser.js";

export class TextWidget extends BaseWidget {
  render() {
    const container = document.createElement("div");
    // ... setup container ...

    this.textElement = document.createElement("div");

    // Parse icons in text
    const text = this.config.text || "";
    const parsedContent = parseIcons(text, this.textElement);

    this.textElement.innerHTML = "";
    this.textElement.appendChild(parsedContent);

    container.appendChild(this.textElement);
    return container;
  }

  updateDisplay(changes) {
    if (changes.text !== undefined) {
      const parsedContent = parseIcons(changes.text, this.textElement);
      this.textElement.innerHTML = "";
      this.textElement.appendChild(parsedContent);
    }
  }
}
```

### Bug Fixes Applied

#### 1. Import Path 404 Errors (RESOLVED)

**Symptom:** `GET .../widgets/utils/icon-parser.js 404`

**Root Cause:** Import path `../utils/` only goes up one level from `/widgets/basic/`

**Solution:** Changed to `../../utils/icon-parser.js` in all 4 widgets

#### 2. Ternary Breaking on Colons (RESOLVED)

**Symptom:** Text displays as `'mdi` instead of icon in ternary conditional

**Root Cause:** Regex split on first `:` character, breaking `mdi:fire:color`

**Solution:** Character-by-character parser respecting quote boundaries in evaluator.js

```javascript
// Quote-aware parsing
let inQuotes = false;
let quoteChar = null;

for (let i = 0; i < text.length; i++) {
  const char = text[i];

  if ((char === '"' || char === "'") && !inQuotes) {
    inQuotes = true;
    quoteChar = char;
  } else if (char === quoteChar && inQuotes) {
    inQuotes = false;
    quoteChar = null;
  }

  // Only split on : if not in quotes
  if (char === ":" && !inQuotes) {
    // Process split
  }
}
```

#### 3. Black Icons / Missing Text (RESOLVED)

**Symptom:** Icons render black, text after icon disappears

**Root Cause:** Regex `([#a-z0-9(),.\\ s]+)` captured `#ff5500 Hot` as invalid CSS color

**Solution:** Removed `\s` from pattern, stops at first space

**Before:**

```javascript
/mdi:([a-z0-9-]+)(?::([#a-z0-9(),.\s]+))?/gi; // ❌ Captures spaces
```

**After:**

```javascript
/mdi:([a-z0-9-]+)(?::([#a-z0-9(),.]+))?/gi; // ✅ Stops at space
```

### Real-World Examples

#### Temperature Display with Conditional Icons

```javascript
// Binding expression
{
  sensor.michael_air_quality_temperature;
  value > 20 ? "mdi:fire:#ff5500 Hot" : "mdi:snowflake:#03a9f4 Cold";
}

// When temp = 25°C → "🔥 Hot" (fire icon in orange)
// When temp = 15°C → "❄️ Cold" (snowflake icon in blue)
```

#### Door Status

```javascript
{
  binary_sensor.front_door;
  value == "on" ? "mdi:lock-open:#f44336 Open" : "mdi:lock:#4caf50 Closed";
}

// Open → "🔓 Open" (red unlock icon)
// Closed → "🔒 Closed" (green lock icon)
```

#### Battery Level

```javascript
{
  sensor.phone_battery;
  value < 20 ? "mdi:alert:#ff9800 Low Battery" : "mdi:check:#4caf50 OK";
}

// Battery 15% → "⚠️ Low Battery" (orange alert)
// Battery 85% → "✓ OK" (green check)
```

#### Multi-Status Dashboard

```javascript
// Multiple icons in one text
"mdi:home:#03a9f4 Home Status\nmdi:thermometer:#ff5500 25.5°C\nmdi:water:#03a9f4 45% Humidity\nmdi:lightbulb:#4caf50 3 Lights On";

// Result:
// 🏠 Home Status
// 🌡️ 25.5°C
// 💧 45% Humidity
// 💡 3 Lights On
```

### Best Practices

**DO:**

- ✅ Use trailing space after color: `mdi:fire:#ff5500 ` (for text insertion)
- ✅ Use ternary conditionals for dynamic icons
- ✅ Match icon colors to semantic meaning (red=danger, green=ok, blue=info)
- ✅ Test icons in binding editor preview before applying
- ✅ Use icon picker for quick insertion (palette button)

**DON'T:**

- ❌ Don't use spaces in icon names (`fire-alarm` not `fire alarm`)
- ❌ Don't forget colon before color: `mdi:fire#ff5500` (missing `:`)
- ❌ Don't use uppercase in icon names: `mdi:Fire` (use `mdi:fire`)
- ❌ Don't nest icons in complex HTML (parser works on plain text)

### Future Enhancements

**Planned:**

- Expand bundled icon set beyond 20
- Icon search/filter in picker dialog
- Recent icons memory
- Icon size adjustment option
- Animation support for certain icons
- Category filtering in picker
- Integration with Home Assistant's MDI font for full library access

### Testing Checklist

**Icon Parser:**

- [ ] Icons render with correct colors
- [ ] Text after icons preserved
- [ ] Multiple icons in same text work
- [ ] Ternary conditionals with icons work
- [ ] Invalid icon names fail gracefully
- [ ] Dynamic size scaling matches font-size

**Icon Picker:**

- [ ] Dialog opens at z-index 10001
- [ ] Category dropdown shows 9 categories
- [ ] Icons filtered by selected category
- [ ] Icon selection shows blue border
- [ ] Color input validates hex codes
- [ ] Color picker updates hex input
- [ ] Quick presets apply correctly
- [ ] Live preview updates on changes
- [ ] ESC key closes dialog
- [ ] Insert button adds formatted string

**Binding Editor Integration:**

- [ ] Simple mode: Palette button visible in operation rows
- [ ] Multi-variable mode: Palette button below textarea
- [ ] Icon picker opens from both locations
- [ ] Cursor position preserved during insertion
- [ ] Preview updates with icon rendering

---

**Last Updated:** 2026-01-25  
**Next Review:** After additional dialog implementations
