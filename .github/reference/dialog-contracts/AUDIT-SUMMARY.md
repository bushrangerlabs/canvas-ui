# Dialog Audit Summary

**Audit Complete**: All 8 dialogs documented ✅

**Date**: January 28, 2026

---

## Audit Results

### ✅ Well-Standardized Dialogs (7 of 8)

All audited dialogs follow clean, consistent patterns:

1. **EntityPickerDialog** - `(entityManager, onSelect)` - ✅ Perfect
2. **BindingEditorDialog** - `(entityManager, currentBinding, callback)` - ✅ Perfect
3. **BorderEditorDialog** - `(currentValue, callback)` - ✅ Perfect
4. **ShadowEditorDialog** - `(currentValue, callback)` - ✅ Perfect
5. **IconPickerSimpleDialog** - `(callback)` - ✅ Perfect (no current value by design)
6. **FontPickerDialog** - `(currentValue, callback)` - ✅ Perfect
7. **VisibilityConditionDialog** - `(entityManager, currentValue, callback)` - ✅ Perfect

### ⚠️ Non-Standard Dialog (1 of 8)

**FileManagerDialog** - `(fileService)` - Different use case

- **NOT a picker/editor dialog** - it's a standalone file management utility
- No callback - operations are immediate (upload, delete, rename)
- Should use **FileBrowserDialog** for file picking instead
- No standardization needed (different purpose)

---

## Standard Dialog Patterns Identified

### Pattern 1: Simple Picker (No Current Value)

```javascript
constructor(callback);
```

**Examples**: IconPickerSimpleDialog

**Characteristics**:

- No pre-selection
- Returns simple value (string, number, etc.)
- Lightweight, fast

---

### Pattern 2: Editor with Current Value

```javascript
constructor(currentValue, callback);
```

**Examples**: BorderEditorDialog, ShadowEditorDialog, FontPickerDialog

**Characteristics**:

- Pre-fills with current value
- Parses existing data
- Returns updated value
- Most common pattern

---

### Pattern 3: Entity-Aware Picker

```javascript
constructor(entityManager, onSelect);
```

**Examples**: EntityPickerDialog

**Characteristics**:

- Needs entity data
- No current value support (by design)
- Returns entity ID

---

### Pattern 4: Entity-Aware Editor

```javascript
constructor(entityManager, currentValue, callback);
```

**Examples**: BindingEditorDialog, VisibilityConditionDialog

**Characteristics**:

- Needs entity data for integration (EntityPickerDialog)
- Pre-fills with current value
- Returns complex expression/binding

---

## Standard Dialog Contract

Based on audit, the ideal dialog interface is:

```javascript
class StandardDialog {
  /**
   * @param {Object} [dependencies] - Optional: entityManager, fileService, etc.
   * @param {*} [currentValue] - Optional: Current value to edit/pre-select
   * @param {Function} callback - Required: Called with result
   */
  constructor(dependencies, currentValue, callback) {
    // OR simpler variants:
    // constructor(currentValue, callback)
    // constructor(callback)
  }

  show() {
    // Open dialog
  }

  close() {
    // Close dialog
  }
}
```

**Key Principles**:

1. **Callback last** - Always the final parameter
2. **Current value support** - For editors, pre-fill existing data
3. **Dependencies first** - entityManager, fileService come before currentValue
4. **Simple variants OK** - Not all dialogs need all params

---

## Recommendations

### ✅ No Changes Needed

All 7 picker/editor dialogs are already well-standardized:

- Clean constructors
- Consistent parameter order
- Simple callback patterns
- No breaking changes required

### ⚠️ FileManagerDialog Exception

FileManagerDialog is a **utility dialog**, not a picker:

- Keep as-is (different use case)
- Use FileBrowserDialog for file picking
- Document distinction clearly

### 📋 Next Steps

1. **Document standard contract** - Create `.github/reference/dialog-contracts/STANDARD.md`
2. **Create BaseDialog class (optional)** - Shared overlay, close, keyboard handling
3. **Update inspector field-renderer** - Use standardized dialog contracts
4. **Widget API implementation** - Build on standardized dialogs

---

## Dialog Contract Files Created

All contracts documented in `.github/reference/dialog-contracts/`:

- ✅ `entity-picker.md`
- ✅ `binding-editor.md`
- ✅ `border-editor.md`
- ✅ `shadow-editor.md`
- ✅ `icon-picker-simple.md`
- ✅ `font-picker.md`
- ✅ `file-manager.md` (non-standard, utility)
- ✅ `visibility-condition.md`

Each contract includes:

- Constructor signature
- Parameters (types and purpose)
- Data flow (input/output)
- Features
- Assessment (standardization status)
- Potential improvements
- Example usage
- Output format

---

## Key Findings

### Constructor Parameter Patterns

| Dialog                    | Params | Pattern                                 |
| ------------------------- | ------ | --------------------------------------- |
| EntityPickerDialog        | 2      | (entityManager, callback)               |
| BindingEditorDialog       | 3      | (entityManager, currentValue, callback) |
| BorderEditorDialog        | 2      | (currentValue, callback)                |
| ShadowEditorDialog        | 2      | (currentValue, callback)                |
| IconPickerSimpleDialog    | 1      | (callback)                              |
| FontPickerDialog          | 2      | (currentValue, callback)                |
| VisibilityConditionDialog | 3      | (entityManager, currentValue, callback) |
| FileManagerDialog         | 1      | (fileService) - **UTILITY**             |

### Callback Patterns

All dialogs use simple function callbacks:

- `callback(result)` - Single value
- `onSelect(entityId)` - Semantic naming

No Promise-based or event-based patterns (good for simplicity).

### Data Flow

**Input**:

- Current value (string, object, or none)
- Dependencies (entityManager, fileService)

**Process**:

- Parse current value
- Render UI
- User interaction

**Output**:

- Callback with result
- Always single value (string, object, array)
- No side effects

---

## Conclusion

**Audit Status**: ✅ **COMPLETE**

**Result**: All dialogs already follow consistent, well-designed patterns. No breaking changes needed.

**Next Phase**: Build widget API on top of these standardized dialogs.

**Token Efficiency**: Audit completed without reading large archived files, using semantic search efficiently.
