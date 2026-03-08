# Custom Section Overview

Widget-specific options that vary by widget type.

## Purpose

The Custom section is where each widget adds its unique functionality:

- **Button Widget** → Tap actions, icon, text
- **Text Widget** → Text content, bindings, font
- **Gauge Widget** → Entity, min/max, units
- **Image Widget** → Image source, fit mode

## How Widgets Extend

Each widget provides a `getMetadata()` method:

```javascript
class ButtonWidget {
  static getMetadata() {
    return {
      custom: [
        { name: "text", type: "text", label: "Button Text" },
        { name: "icon", type: "icon", label: "Icon" },
        { name: "tapAction", type: "tapAction", label: "Tap Action" },
      ],
    };
  }
}
```

## Field Types

Common custom field types:

- `text` - Text input
- `icon` - Icon picker (IconPickerSimpleDialog)
- `entity` - Entity picker (EntityPickerDialog)
- `binding` - Binding editor (BindingEditorDialog)
- `tapAction` - Tap action configurator
- `number` - Numeric input
- `select` - Dropdown

## Rendering

Inspector renders custom fields dynamically:

```javascript
metadata.custom.forEach((field) => {
  renderField(field.name, field.type, widget.config[field.name]);
});
```

---

## Navigate

↑ **Structure**: [widget-api-universal-inspector-structure.md](widget-api-universal-inspector-structure.md)
→ **Next Section**: [widget-api-styling-background-color.md](widget-api-styling-background-color.md)
⟲ **Field Rendering**: Coming soon - field-renderer.md
⟲ **Widget Dev**: [widget-dev-metadata.md](widget-dev-metadata.md) - How to define customFields array
