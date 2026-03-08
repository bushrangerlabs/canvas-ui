# Binding System Reference

## Syntax

`{entity.attribute;operation1;operation2;...}`

## Operations (45+)

**Math:** `*`, `/`, `+`, `-`, `%`, `round()`, `floor()`, `ceil()`, `min()`, `max()`, `pow()`, `sqrt()`, `abs()`
**Format:** `value(decimals)`, `hex()`, `HEX()`, `date(format)`
**String:** `toLowerCase`, `toUpperCase`, `trim`, `replace()`, `substring()`, `split()`, `concat()`
**Array:** `array([val0,val1,val2])`
**Conditional:** Ternary `value > 20 ? 'Hot' : 'Cold'`

## Examples

```javascript
// Temperature conversion
{sensor.temperature;*1.8;+32;round(1)}°F

// Status mapping
{light.status;array(['Off','On','Unavailable'])}

// Conditional with icons
{sensor.battery;value < 20 ? 'mdi:battery-low:red Low' : 'mdi:battery:green OK'}
```

## MDI Icons

Inline syntax: `mdi:icon-name:color Text`
150+ bundled icons in 9 categories

## Dialogs

- **BindingEditorDialog** - Simple mode (operation builder) + Multi-variable mode (JS eval)
- **VisibilityConditionDialog** - Simple builder + advanced expressions
