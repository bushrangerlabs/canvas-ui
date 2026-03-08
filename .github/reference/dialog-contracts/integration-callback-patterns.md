# Callback Patterns

Standard ways dialogs return data:

## Simple Value Callback

```javascript
(result) => {
  widget.config.property = result;
  inspector.updateWidget(widget);
};
```

Used by: IconPickerSimple, FontPicker, EntityPicker

## Object Callback (Atomic Properties)

```javascript
(resultObject) => {
  Object.assign(widget.config, resultObject);
  inspector.updateWidget(widget);
};
```

Used by: BorderEditor, ShadowEditor

## Expression Callback

```javascript
(expression) => {
  widget.config.text = expression;
  widget.setupBindings(); // Re-parse bindings
  inspector.updateWidget(widget);
};
```

Used by: BindingEditor, VisibilityCondition

**Pattern**: Callback always receives complete, ready-to-use result (no post-processing needed)

---

## Navigate

↑ **Integration**: [inspector-integration.md](inspector-integration.md)
↓ **Concepts**: [../concept-atomic-properties.md](../concept-atomic-properties.md)
