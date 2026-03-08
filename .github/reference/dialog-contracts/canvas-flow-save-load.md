# Canvas Flow: Save & Load

How widget configurations are persisted and loaded from storage.

## Save Flow Overview

```
Widget Change        ViewManager          SaveSystem           Storage
      ↓                   ↓                    ↓                  ↓
Config update   →   updateWidget()   →   save()          →   localStorage
(any change)        debounced save       serialize data      or HA API
      ↓                   ↓                    ↓                  ↓
Auto-save       →   Collect all      →   JSON.stringify  →   Store with
after 500ms         view data            entire config       timestamp
```

## Storage Structure

```javascript
{
  "version": "1.0.0",
  "views": [
    {
      "id": "view_123",
      "name": "Living Room",
      "background": "#1a1a1a",
      "widgets": [
        {
          "id": "widget_456",
          "type": "button",
          "x": 100,
          "y": 50,
          "w": 120,
          "h": 60,
          "z": 1674567890,
          "config": {
            // Identity (NEW API)
            "name": "Living Room Light",

            // Custom section
            "text": "Toggle Light",
            "icon": "mdi-lightbulb",
            "entity": "light.living_room",

            // Styling section (NEW API)
            "backgroundColor": "#03a9f4",
            "border": "2px solid #0288d1",
            "borderRadius": "8px",
            "boxShadow": "0 2px 4px rgba(0,0,0,0.2)",
            "paddingTop": 8,
            "paddingRight": 16,
            "paddingBottom": 8,
            "paddingLeft": 16,

            // Visibility section (NEW API)
            "visibilityCondition": "{sun.sun.state} == 'below_horizon'"
          }
        }
      ]
    }
  ],
  "activeViewId": "view_123",
  "modified": "2026-01-29T10:30:00Z"
}
```

## ViewManager Save

```javascript
async save() {
  // Collect all data
  const data = {
    version: "1.0.0",
    views: this.views,
    activeViewId: this.activeViewId,
    modified: new Date().toISOString()
  };

  // Delegate to SaveSystem
  await this.saveSystem.save(data);

  console.log('[ViewManager] Configuration saved');
}
```

## SaveSystem (Two Backends)

### Option 1: localStorage (Default)

```javascript
class LocalStorageSaveSystem {
  constructor(storageKey = "canvas_ui_config") {
    this.storageKey = storageKey;
  }

  async save(data) {
    try {
      const json = JSON.stringify(data, null, 2);
      localStorage.setItem(this.storageKey, json);
      console.log("[SaveSystem] Saved to localStorage");
    } catch (error) {
      console.error("[SaveSystem] Save failed:", error);
      throw error;
    }
  }

  async load() {
    try {
      const json = localStorage.getItem(this.storageKey);
      if (!json) return null;

      const data = JSON.parse(json);
      console.log("[SaveSystem] Loaded from localStorage");
      return data;
    } catch (error) {
      console.error("[SaveSystem] Load failed:", error);
      return null;
    }
  }
}
```

### Option 2: Home Assistant API

```javascript
class HomeAssistantSaveSystem {
  constructor(connection, storageKey = "canvas_ui_config") {
    this.connection = connection;
    this.storageKey = storageKey;
  }

  async save(data) {
    try {
      await this.connection.sendMessagePromise({
        type: "config/area_registry/update",
        entity_id: this.storageKey,
        config: data,
      });
      console.log("[SaveSystem] Saved to Home Assistant");
    } catch (error) {
      console.error("[SaveSystem] HA save failed:", error);
      // Fallback to localStorage
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    }
  }

  async load() {
    try {
      const result = await this.connection.sendMessagePromise({
        type: "config/area_registry/get",
        entity_id: this.storageKey,
      });
      console.log("[SaveSystem] Loaded from Home Assistant");
      return result.config;
    } catch (error) {
      console.error("[SaveSystem] HA load failed:", error);
      // Fallback to localStorage
      const json = localStorage.getItem(this.storageKey);
      return json ? JSON.parse(json) : null;
    }
  }
}
```

## Auto-Save (Debounced)

```javascript
class ViewManager {
  constructor() {
    this.saveTimer = null;
    this.saveDebounceMs = 500; // Wait 500ms after last change
  }

  async updateWidget(viewId, widgetId, changes) {
    const view = this.getView(viewId);
    const widget = view.widgets.find((w) => w.id === widgetId);

    // Update data
    Object.assign(widget, changes);
    view.modified = new Date().toISOString();

    // Debounced save
    this.debouncedSave();
  }

  debouncedSave() {
    // Clear existing timer
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }

    // Set new timer
    this.saveTimer = setTimeout(() => {
      this.save();
      this.saveTimer = null;
    }, this.saveDebounceMs);
  }
}
```

## Load Flow

```
App Startup          ViewManager          SaveSystem           ViewRenderer
     ↓                    ↓                    ↓                    ↓
init()          →   loadConfiguration  →   load()          →   renderView()
                    from storage           parse JSON          render widgets
     ↓                    ↓                    ↓                    ↓
Connect to HA   →   Restore views      →   Validate data   →   Mount widgets
                    set active view        check version       setup bindings
```

### ViewManager Load

```javascript
async loadConfiguration() {
  try {
    // Load from storage
    const data = await this.saveSystem.load();

    if (!data) {
      console.log('[ViewManager] No saved config, using defaults');
      await this.createDefaultView();
      return;
    }

    // Validate version
    if (data.version !== '1.0.0') {
      console.warn('[ViewManager] Config version mismatch, migrating...');
      data = await this.migrateConfig(data);
    }

    // Restore views
    this.views = data.views || [];
    this.activeViewId = data.activeViewId || this.views[0]?.id;

    console.log(`[ViewManager] Loaded ${this.views.length} views`);

    // Render active view
    if (this.activeViewId) {
      await this.switchView(this.activeViewId);
    }

  } catch (error) {
    console.error('[ViewManager] Load failed:', error);
    await this.createDefaultView();
  }
}
```

## Export/Import

### Export Configuration

```javascript
exportConfiguration() {
  const data = {
    version: "1.0.0",
    views: this.views,
    activeViewId: this.activeViewId,
    exported: new Date().toISOString()
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `canvas-ui-config-${Date.now()}.json`;
  a.click();

  URL.revokeObjectURL(url);
  console.log('[ViewManager] Configuration exported');
}
```

### Import Configuration

```javascript
async importConfiguration(file) {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    // Validate
    if (!data.version || !data.views) {
      throw new Error('Invalid configuration file');
    }

    // Confirm overwrite
    const confirmed = await showConfirmDialog(
      'Import Configuration?',
      'This will replace your current configuration.'
    );

    if (!confirmed) return;

    // Save undo state
    undoRedoSystem.snapshot('importConfig');

    // Apply configuration
    this.views = data.views;
    this.activeViewId = data.activeViewId || this.views[0]?.id;

    // Save
    await this.save();

    // Reload view
    await this.switchView(this.activeViewId);

    console.log('[ViewManager] Configuration imported');

  } catch (error) {
    console.error('[ViewManager] Import failed:', error);
    alert('Failed to import configuration: ' + error.message);
  }
}
```

## Migration

```javascript
async migrateConfig(oldData) {
  console.log(`[ViewManager] Migrating from version ${oldData.version}`);

  // Example: Add new Widget API fields
  for (const view of oldData.views) {
    for (const widget of view.widgets) {
      // Add identity section
      if (!widget.config.name) {
        widget.config.name = `${widget.type} ${widget.id.substr(-4)}`;
      }

      // Add visibility section
      if (!widget.config.visibilityCondition) {
        widget.config.visibilityCondition = null;  // Always visible
      }

      // Migrate old border format to new
      if (widget.config.borderWidth && !widget.config.border) {
        widget.config.border =
          `${widget.config.borderWidth}px solid ${widget.config.borderColor}`;
        delete widget.config.borderWidth;
        delete widget.config.borderColor;
      }
    }
  }

  // Update version
  oldData.version = '1.0.0';

  return oldData;
}
```

## Backup/Recovery

```javascript
// Create backup before major changes
async createBackup() {
  const data = {
    version: "1.0.0",
    views: this.views,
    activeViewId: this.activeViewId,
    backup: new Date().toISOString()
  };

  const backupKey = `${this.saveSystem.storageKey}_backup_${Date.now()}`;
  localStorage.setItem(backupKey, JSON.stringify(data));

  console.log(`[ViewManager] Backup created: ${backupKey}`);
}

// List available backups
listBackups() {
  const backups = [];
  const prefix = `${this.saveSystem.storageKey}_backup_`;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith(prefix)) {
      const timestamp = key.substring(prefix.length);
      backups.push({ key, timestamp });
    }
  }

  return backups.sort((a, b) => b.timestamp - a.timestamp);
}
```

---

## Navigate

↑ **Deletion**: [canvas-flow-widget-deletion.md](canvas-flow-widget-deletion.md) - Delete widgets
→ **Undo**: [canvas-flow-undo-redo.md](canvas-flow-undo-redo.md) - Undo/redo system
⟲ **Code**: `www/canvas-ui/editor/view-manager.js`
