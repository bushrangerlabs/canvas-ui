# Inspector Standards Reference

## Required Categories

1. **Position** - x, y, w, h, z-index
2. **Custom** - Widget-specific fields
3. **Typography** - fontSize, fontWeight, fontFamily
4. **Styling** - backgroundColor, border*, shadow*
5. **Visibility** - visibilityCondition

## Universal Properties

All widgets share: x, y, w, h, z-index, backgroundColor, backgroundImage, border properties, shadow properties, visibilityCondition

## Atomic Border Properties

`borderWidth`, `borderStyle`, `borderColor`, `borderRadius`

- Smart parsing: "10" or "10,5,10,5" (TL,TR,BR,BL)
- **CRITICAL:** Add to `noConvertProps` in inspector.js AND canvas-core.js

## Atomic Shadow Properties

`shadowX`, `shadowY`, `shadowBlur`, `shadowSpread`, `shadowColor`, `shadowInset`

## Property Persistence

**Use blur events NOT input events** (prevents focus loss):

```javascript
// ✅ CORRECT
input.addEventListener('blur', () => {
  this.handlePropertyChange(prop.name, input.value);
});

// ❌ WRONG - causes focus loss
input.addEventListener('input', () => { ... });
```

## Dual Button Support

```javascript
{
  text: {
    entity: true,   // Adds "..." button
    binding: true,  // Adds "{}" button
    maxWidth: 140   // Prevents overflow
  }
}
```
