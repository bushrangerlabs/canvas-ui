# Canvas UI Dependencies

How to access required dependencies when creating dialogs in Canvas UI:

## EntityManager

**Location**: `canvasCore.entityManager`

```javascript
// In Inspector or Widget context:
const dialog = new EntityPickerDialog(
  canvasCore.entityManager, // ✓ Get from canvasCore
  (entityId) => {
    /* ... */
  },
);
```

**What it provides**:

- `getAllEntities()` - Returns all Home Assistant entities
- `getEntity(entityId)` - Get specific entity data
- `subscribe(callback)` - Listen for entity state changes

## FileService

**Location**: `canvasCore.fileService`

```javascript
// In FileManager or file-related dialogs:
const fileManager = new FileManagerDialog(
  canvasCore.fileService, // ✓ Get from canvasCore
);
```

**What it provides**:

- `listFiles(directory)` - List files in directory
- `uploadFile(file, path)` - Upload new file
- `deleteFile(path)` - Delete file
- `renameFile(oldPath, newPath)` - Rename/move file

## Inspector Context

**Location**: Available in Inspector methods

```javascript
class Inspector {
  renderField(fieldName, fieldType, currentValue) {
    // Create dialog with dependencies
    const dialog = new BorderEditorDialog(currentValue, (result) => {
      this.widget.config[fieldName] = result;
      this.updateWidget(this.widget);
    });
    dialog.show();
  }
}
```

**What Inspector provides**:

- `this.widget` - Current widget being edited
- `this.canvasCore` - Access to entityManager, fileService
- `updateWidget(widget)` - Trigger widget re-render

## Creating Dialogs in Widget Code

**From widget context**:

```javascript
class MyWidget {
  constructor(canvasCore, config) {
    this.canvasCore = canvasCore; // Store reference
    this.config = config;
  }

  openEntityPicker() {
    const dialog = new EntityPickerDialog(
      this.canvasCore.entityManager, // ✓ Use stored reference
      (entityId) => {
        this.config.entity = entityId;
        this.render();
      },
    );
    dialog.show();
  }
}
```

## Summary

| Dependency      | Source                     | Used By                   |
| --------------- | -------------------------- | ------------------------- |
| `entityManager` | `canvasCore.entityManager` | Entity-aware dialogs      |
| `fileService`   | `canvasCore.fileService`   | File-related dialogs      |
| `widget`        | `inspector.widget`         | Inspector field rendering |
| `canvasCore`    | Constructor param          | All widgets               |

---

## Navigate

↑ **Integration**: [inspector-integration.md](inspector-integration.md) - How inspector uses dialogs
⟲ **Dependencies**: [../dependencies.md](../dependencies.md) - What each dialog needs
