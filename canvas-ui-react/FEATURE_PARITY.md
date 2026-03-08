# React Inspector Feature Parity Audit

**Date:** February 2, 2025  
**Purpose:** Ensure React Inspector retains ALL functionality from vanilla inspector

---

## Field Types Inventory

### ✅ Implemented in React

| Field Type | React Component        | Status      | Notes                                     |
| ---------- | ---------------------- | ----------- | ----------------------------------------- |
| TEXT       | TextFieldComponent     | ✅ Complete | Material-UI TextField                     |
| NUMBER     | NumberFieldComponent   | ✅ Complete | TextField type="number" with min/max/step |
| CHECKBOX   | CheckboxFieldComponent | ✅ Complete | Material-UI Checkbox + FormControlLabel   |
| TOGGLE     | CheckboxFieldComponent | ✅ Complete | Same as checkbox (boolean)                |
| SELECT     | SelectFieldComponent   | ✅ Complete | Material-UI Select with options           |
| COLOR      | ColorFieldComponent    | ✅ Complete | react-colorful HexColorPicker             |
| ENTITY     | EntityPickerComponent  | ✅ Complete | Dialog with search (mock data currently)  |

### ⏳ Partially Implemented

| Field Type | React Component    | Status     | Notes                              |
| ---------- | ------------------ | ---------- | ---------------------------------- |
| TEXTAREA   | TextFieldComponent | ⚠️ Partial | Need to add multiline prop support |

### ❌ Missing from React

| Field Type  | React Component         | Priority  | Implementation Notes                             |
| ----------- | ----------------------- | --------- | ------------------------------------------------ |
| SLIDER      | SliderFieldComponent    | 🔴 HIGH   | Material-UI Slider with min/max/step             |
| RANGE       | SliderFieldComponent    | 🔴 HIGH   | Material-UI Slider range mode                    |
| RADIO       | RadioFieldComponent     | 🟡 MEDIUM | Material-UI RadioGroup                           |
| MULTISELECT | MultiSelectComponent    | 🟡 MEDIUM | Material-UI Select multiple={true}               |
| ICON        | IconPickerComponent     | 🔴 HIGH   | Dialog with icon library (mdi icons)             |
| IMAGE       | ImagePickerComponent    | 🟢 LOW    | File browser integration                         |
| DATE        | DateFieldComponent      | 🟡 MEDIUM | Material-UI DatePicker (@mui/x-date-pickers)     |
| TIME        | TimeFieldComponent      | 🟡 MEDIUM | Material-UI TimePicker                           |
| DATETIME    | DateTimeFieldComponent  | 🟡 MEDIUM | Material-UI DateTimePicker                       |
| JSON        | JsonEditorComponent     | 🟢 LOW    | Monaco Editor or JSONEditor                      |
| CODE        | CodeEditorComponent     | 🟢 LOW    | Monaco Editor with syntax highlighting           |
| VIEW        | ViewPickerComponent     | 🟢 LOW    | Select from available views                      |
| DIMENSION   | DimensionFieldComponent | 🟡 MEDIUM | Number input with unit dropdown (px, %, em, rem) |
| EMAIL       | TextFieldComponent      | 🟢 LOW    | TextField type="email"                           |
| PASSWORD    | TextFieldComponent      | 🟢 LOW    | TextField type="password"                        |

---

## Feature Comparison

### Form Generation

- **Vanilla:** Dynamic form from widget manifest `configSchema`
- **React:** ❌ Currently hardcoded sections (needs dynamic renderer)
- **Required:** Build `renderField(fieldDef)` that reads metadata and renders correct component

### Field Visibility/Conditions

- **Vanilla:** Supports `showIf` conditions on fields
- **React:** ❌ Not implemented
- **Required:** Add conditional rendering based on other field values

### Field Validation

- **Vanilla:** min/max/required/pattern validation
- **React:** ⚠️ Partial - Number fields have min/max, no pattern/required yet
- **Required:** Add React Hook Form validation with Zod schemas

### Entity Binding

- **Vanilla:** Full HA entity picker with live entity data
- **React:** ⚠️ Mock data only (functional but not connected to HA)
- **Required:** Connect to HA WebSocket API

### Category Grouping

- **Vanilla:** Auto-groups fields by category in collapsible sections
- **React:** ✅ Manual Accordion sections (functional equivalent)
- **Required:** Make dynamic based on manifest categories

### Field Properties Support

- **Vanilla:** Supports label, description, default, min, max, step, unit, options, placeholder
- **React:** ⚠️ Partial - label/min/max/step working, missing description/unit/placeholder on some fields

---

## Priority Implementation Plan

### Phase 1 - Critical Missing Components (Week 1)

1. **SliderFieldComponent** (HIGH - used by many widgets)
   - Material-UI Slider
   - Support min/max/step from field config
   - Display current value
   - Debounced updates

2. **IconPickerComponent** (HIGH - essential for appearance)
   - Dialog with icon library (Material Design Icons)
   - Search/filter functionality
   - Icon preview
   - Integrate with @mdi/js icon paths

3. **DimensionFieldComponent** (MEDIUM - layout critical)
   - Number input + unit dropdown (px, %, em, rem, vw, vh)
   - Validation based on unit
   - Common presets (auto, inherit)

### Phase 2 - Dynamic Rendering (Week 2)

4. **Dynamic Field Renderer**
   - `renderField(fieldDef, widgetConfig, onChange)` function
   - Reads field type from manifest
   - Returns appropriate React component
   - Handles all field properties (label, description, default, etc.)

5. **Enhanced TextFieldComponent**
   - Add multiline support for TEXTAREA type
   - Add type support (email, password, url)
   - Add placeholder, description tooltip
   - Add pattern validation

### Phase 3 - Advanced Fields (Week 3)

6. **RadioFieldComponent** (MEDIUM)
7. **MultiSelectComponent** (MEDIUM)
8. **DateFieldComponent** (MEDIUM - requires @mui/x-date-pickers dependency)
9. **TimeFieldComponent** (MEDIUM)

### Phase 4 - Specialized Fields (Week 4)

10. **CodeEditorComponent** (LOW - Monaco Editor integration)
11. **JsonEditorComponent** (LOW)
12. **ImagePickerComponent** (LOW - file browser)
13. **ViewPickerComponent** (LOW)

### Phase 5 - Feature Enhancements

14. **Conditional Field Visibility** (showIf support)
15. **Advanced Validation** (React Hook Form + Zod)
16. **Field Descriptions/Tooltips**
17. **Live HA Entity Data** (connect to WebSocket)

---

## React Dependencies Needed

```json
{
  "@mui/x-date-pickers": "^7.0.0", // Date/Time pickers
  "@monaco-editor/react": "^4.6.0", // Code editor
  "@mdi/js": "^7.4.47", // Material Design Icons
  "@mdi/react": "^1.6.1", // MDI React components
  "react-hook-form": "^7.49.3", // Already installed
  "zod": "^3.22.4" // Already installed
}
```

---

## Testing Checklist

- [ ] All existing field types work (Text, Number, Checkbox, Select, Color, Entity)
- [ ] New slider component with all widgets that use SLIDER type
- [ ] Icon picker integrates with existing icon system
- [ ] Dimension fields handle all CSS units correctly
- [ ] Dynamic renderer reads widget metadata correctly
- [ ] TEXTAREA multiline mode works
- [ ] Date/Time pickers integrate with Material-UI theme
- [ ] Radio and MultiSelect work with options arrays
- [ ] Code/JSON editors handle large content without lag
- [ ] All validation rules enforce correctly
- [ ] Conditional fields show/hide based on other values
- [ ] Entity picker connects to live HA data

---

## Notes

**Current State:**

- React Inspector proof-of-concept working with 7 field types
- Bridge communication proven reliable
- Material-UI integration solid
- Zustand state management ready

**Biggest Gap:**

- **Dynamic field rendering** - Currently hardcoded sections, needs to read widget metadata
- **Slider fields** - Very commonly used, high priority
- **Icon picker** - Essential for widget appearance customization

**Migration Strategy:**

1. Build missing high-priority components (Slider, Icon, Dimension)
2. Create dynamic field renderer that reads manifest
3. Test with progress-gauge and 2-3 other widgets
4. Integrate into main canvas
5. Add bridge to remaining widgets incrementally
6. Remove vanilla inspector only after all widgets verified
