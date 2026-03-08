# Visibility Conditions

Control when widgets are shown/hidden using VisibilityConditionDialog.

## Purpose

Conditionally show/hide widgets based on:

- Entity states
- Time of day
- User presence
- Custom expressions

## Dialog Integration

```javascript
const dialog = new VisibilityConditionDialog(
  canvasCore.entityManager,
  widget.config.visibilityCondition, // Current condition
  (expression) => {
    widget.config.visibilityCondition = expression;
    widget.setupVisibility(); // Re-evaluate condition
    inspector.updateWidget(widget);
  },
);
dialog.show();
```

## Expression Format

VisibilityConditionDialog returns boolean expression:

```javascript
"{light.living_room.state} == 'on'";
"{sensor.temperature} > 20";
"{binary_sensor.motion} == 'on' && {sun.sun.state} == 'below_horizon'";
```

## Widget Implementation

**Setup:**

```javascript
setupVisibility() {
  if (!this.config.visibilityCondition) {
    this.element.style.display = ''; // Always visible
    return;
  }

  this.evaluateVisibility();
  this.subscribeToVisibilityEntities();
}
```

**Evaluation:**

```javascript
evaluateVisibility() {
  const result = evaluateExpression(this.config.visibilityCondition);
  this.element.style.display = result ? '' : 'none';
}
```

**Real-time Updates:**

- Subscribe to entities mentioned in expression
- Re-evaluate when entity states change
- Show/hide widget instantly

---

## Navigate

↑ **Styling**: [widget-api-styling-background-image.md](widget-api-styling-background-image.md)
↑ **Overview**: [widget-api-universal-inspector-structure.md](widget-api-universal-inspector-structure.md)
⟲ **Dialog**: [visibility-condition.md](visibility-condition.md)
