# Dialogs & Pickers Reference

All dialogs preserved, invoked generically by field-renderer.js

## 1. EntityPickerDialog

**File:** `dialogs/entity-picker.js`
**Trigger:** `entity: true` or `type: 'entity'`
**Features:** Search, filter, 40+ domain icons, recent entities

## 2. BindingEditorDialog

**File:** `dialogs/binding-editor.js`
**Trigger:** `binding: true`
**Modes:** Simple (operation builder) + Multi-variable (JS eval)

## 3. IconPickerSimpleDialog

**File:** `dialogs/icon-picker-simple-dialog.js`
**Trigger:** `type: 'icon'`
**Features:** 150+ MDI icons, 9 categories, search

## 4. BorderEditorDialog

**File:** `dialogs/border-editor-dialog.js`
**Trigger:** `type: 'builder', builderType: 'border'`
**Output:** Atomic properties (borderWidth, borderStyle, borderColor, borderRadius)

## 5. ShadowEditorDialog

**File:** `dialogs/shadow-editor-dialog.js`
**Trigger:** `type: 'builder', builderType: 'shadow'`
**Output:** Atomic properties (shadowX, shadowY, shadowBlur, shadowSpread, shadowColor, shadowInset)

## 6. FontPickerDialog

**File:** `dialogs/font-picker-dialog.js`
**Trigger:** `type: 'font'`
**Features:** 12 web-safe + 15 Google Fonts, live preview

## 7. FileManager

**File:** `dialogs/file-manager.js`
**Usage:** Background image selection
**Features:** Navigate /local/, image preview

## 8. VisibilityConditionDialog

**File:** `dialogs/visibility-condition-dialog.js`
**Trigger:** visibilityCondition field
**Modes:** Simple builder (9 operators, AND/OR) + advanced expression
