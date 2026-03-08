# Atomic Properties

Why dialogs return atomic (individual) properties instead of CSS shorthand:

## Problem with CSS Shorthand

```javascript
// CSS shorthand loses information
border: "2px solid red";
// Can't get individual values: width? style? color?
```

## Atomic Properties Solution

```javascript
{
  borderWidth: "2px",
  borderStyle: "solid",
  borderColor: "red",
  borderOpacity: 1.0
}
// Each property independent, can modify individually
```

## Benefits

- ✅ Inspector can show/edit each property separately
- ✅ Widgets can override individual properties
- ✅ Bindings can target specific properties
- ✅ No parsing CSS strings repeatedly

**Used by**: BorderEditor, ShadowEditor (returns atomic shadow properties)

---

## Navigate

↑ **Usage**: [../integration-callback-patterns.md](../integration-callback-patterns.md)
⟲ **Examples**: [../border-editor.md](../border-editor.md), [../shadow-editor.md](../shadow-editor.md)
