# FileManagerDialog Contract

## Constructor

```javascript
constructor(fileService);
```

## Parameters

- **fileService** (Object) - FileService instance for file operations (browse, upload, delete, etc.)

## Data Flow

**Input**: FileService instance (provides file system access)

**Output**: No callback - this is a **management dialog** not a picker

- File operations performed directly through FileService
- No return value (not used for picking files)

## Features

- ✅ Dual view modes: List view / Thumbnail grid
- ✅ File operations:
  - Upload files (drag & drop or browse)
  - Download files
  - Rename files/folders
  - Delete files/folders
  - Create new folder
- ✅ Multi-select support (batch operations)
- ✅ Context menu (right-click operations)
- ✅ Sorting (by name, date, size, type)
- ✅ Filtering (images, videos, audio, all files)
- ✅ Upload progress tracking
- ✅ Directory navigation (breadcrumbs)
- ✅ Search/filter files
- ✅ Thumbnail previews for images
- ✅ File type icons (MDI icons)
- ✅ File size display
- ✅ Last modified date

## Use Cases

1. **File Management**: Upload, organize, delete files in /config/www
2. **NOT for picking**: Use FileBrowserDialog for file selection
3. **Batch operations**: Select multiple files, delete all at once
4. **Organization**: Create folders, move files, rename

## FileManagerDialog vs FileBrowserDialog

**FileManagerDialog** (Management):

- Constructor: `(fileService)`
- Purpose: Manage files (upload, delete, rename, organize)
- No callback - operations immediate
- Full-featured interface
- Multi-select support
- Used standalone

**FileBrowserDialog** (Picker):

- Constructor: `(fileService, currentValue, fileFilter, callback)`
- Purpose: Pick a file for widget property
- Returns file path via callback
- Simpler interface for selection
- Single-select only
- Used in inspector

## Assessment

⚠️ **Non-standard interface**

- Only takes 1 parameter (fileService)
- No callback - not a picker dialog
- This is a **utility dialog** for file management
- Should NOT be used for file picking in inspector
- Use FileBrowserDialog for picking files

## Recommendation

**For Dialog Audit**: This is not a "picker/editor" dialog in the standard sense.

- It's a **standalone utility** for file management
- Does not follow input → output pattern
- Should be treated as a separate tool, not a standardizable dialog

**For File Picking**: Use FileBrowserDialog instead:

```javascript
// For picking files (backgrounds, images, etc.)
const browser = new FileBrowserDialog(
  fileService,
  widget.config.backgroundImage, // Current value
  "images", // Filter
  (filePath) => {
    widget.config.backgroundImage = filePath;
    inspector.updateWidget(widget);
  },
);
browser.show();
```

## Example Usage (Management)

```javascript
// Open file manager for organizing files
const manager = new FileManagerDialog(canvasCore.fileService);
manager.show();

// User can upload, delete, organize files
// No return value - all operations immediate
```

## Operations

**Upload**:

- Drag & drop files onto dialog
- Click "Upload" button to browse
- Progress bar during upload
- Automatically refreshes file list

**Delete**:

- Select files (single or multi)
- Click delete button or context menu
- Confirmation prompt
- Permanently removes files

**Rename**:

- Right-click file → Rename
- Edit filename inline
- Validates new name

**Create Folder**:

- Click "New Folder" button
- Enter folder name
- Creates folder in current path

**Navigate**:

- Click folders to enter
- Breadcrumb trail to go back
- Up button to parent directory

## View Modes

1. **List View**: Compact rows with name, size, date
2. **Thumbnail View**: Grid of image previews (for images), icons for other files

## Sorting

- By name (A-Z, Z-A)
- By date (newest first, oldest first)
- By size (largest first, smallest first)
- By type (grouped by extension)

## Filtering

- All files
- Images only (.jpg, .png, .gif, .svg, etc.)
- Videos only (.mp4, .webm, etc.)
- Audio only (.mp3, .wav, etc.)
- Documents (.pdf, .txt, etc.)

## Notes

- **NOT a picker dialog** - do not use for file selection in inspector
- Use FileBrowserDialog for file picking
- FileManagerDialog is for organization/management only
- No standardization needed (different use case)

## Conclusion

FileManagerDialog is production-ready but serves a different purpose than other dialogs - it's a management utility, not a picker. For file picking in inspector fields, FileBrowserDialog should be created following Pattern 2 (editor with current value).

---
## Navigate
↑ **Not a Standard Pattern**: Utility dialog (file management, not picking)
⟲ **Dependencies**: [dependencies.md](dependencies.md) - Needs FileService
