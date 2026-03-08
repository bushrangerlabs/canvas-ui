# Widget Development: Entity Bindings

How widgets subscribe to Home Assistant entity states and respond to changes.

## Binding Method Decision Tree

```
Need entity data in widget?
│
├── NO → Skip bindings entirely
│   └── Static display widgets (no entity dependency)
│
└── YES → Choose binding method:
    │
    ├── SIMPLE: Single entity, full state object
    │   └── Direct EntityManager.subscribe()
    │       ├── Subscribe to one entity
    │       ├── Get full state object
    │       └── Manually handle updates
    │
    ├── ADVANCED: Binding expressions, evaluated values
    │   └── BindingBinder.bindWidget()
    │       ├── Auto-detects {entity;.state} expressions
    │       ├── Evaluates expressions automatically
    │       ├── Handles multiple entities automatically
    │       └── Calls updateDisplay() with results
    │
    └── COMPLEX: Multiple specific entities
        └── Multi-Entity Pattern
            ├── Subscribe to each entity separately
            ├── Track subscriptions in array
            └── Aggregate data in widget
```

## Binding Methods Overview

| Method               | Use Case                   | Complexity | Auto-Eval | Multi-Entity |
| -------------------- | -------------------------- | ---------- | --------- | ------------ |
| Direct Subscription  | Single entity display      | Low        | ✗ No      | Manual       |
| BindingBinder        | Expression evaluation      | Medium     | ✓ Yes     | ✓ Auto       |
| Multi-Entity Pattern | Multiple specific entities | High       | ✗ No      | ✓ Manual     |

## Three Binding Methods

### [Method 1: Direct Entity Subscription](widget-dev-bindings-direct-entity.md)

Simple direct subscription to a single entity using EntityManager.

**Steps:**
1. Initialize subscription holder
2. Setup binding method
3. Handle entity updates
4. Cleanup method
5. Handle entity changes

**[Read Method 1 guide →](widget-dev-bindings-direct-entity.md)**

### [Method 2: Binding Expressions (BindingBinder)](widget-dev-bindings-expressions.md)

Automatic expression evaluation using BindingBinder for fields with `binding: true`.

**Features:**
- Automatic expression detection
- Auto-subscribe to entities
- Evaluates on state changes
- Calls updateDisplay() with results

**Expression Examples:**
```javascript
"{sensor.temperature;.state}"                    // → "72.5"
"{sensor.temp;.state;*1.8;+32;round}"           // → "163"
"{t:sensor.temp;h:sensor.humidity;t+' @ '+h+'%'}" // → "72 @ 65%"
```

**[Read Method 2 guide →](widget-dev-bindings-expressions.md)**

### [Method 3: Multi-Entity Subscription](widget-dev-bindings-multi-entity.md)

Manual subscription pattern for widgets needing multiple specific entities.

**Use for:**
- Multiple entity pickers in inspector
- Each entity has specific purpose
- Need different handling per entity

**[Read Method 3 guide →](widget-dev-bindings-multi-entity.md)**

## Binding Performance Comparison

| Aspect             | Direct Subscription | BindingBinder | Multi-Entity |
| ------------------ | ------------------- | ------------- | ------------ |
| Setup Complexity   | ⭐ Low              | ⭐⭐ Medium   | ⭐⭐⭐ High  |
| Update Speed       | ⭐⭐⭐ Fast         | ⭐⭐ Medium   | ⭐⭐ Medium  |
| Expression Support | ✗ No                | ✓ Yes         | ✗ No         |
| Multi-Entity       | Manual              | ✓ Automatic   | ✓ Manual     |
| Memory Usage       | ⭐⭐⭐ Low          | ⭐⭐ Medium   | ⭐ Higher    |
| Code Maintenance   | ⭐⭐⭐ Simple       | ⭐⭐ Medium   | ⭐ Complex   |

## Binding Best Practices

### ✅ DO

- [ ] Always cleanup subscriptions in unmount()
- [ ] Get initial state immediately (don't wait for first update)
- [ ] Handle missing entities gracefully
- [ ] Re-subscribe when entity changes in updateConfig()
- [ ] Use BindingBinder for expression evaluation
- [ ] Cache DOM references for frequent updates
- [ ] Check for EntityManager/BindingBinder availability

### ❌ DON'T

- [ ] Don't subscribe without cleanup
- [ ] Don't assume entity always exists
- [ ] Don't manually parse binding expressions (use BindingBinder)
- [ ] Don't forget to handle "unavailable" state
- [ ] Don't subscribe in constructor (wait for mount)
- [ ] Don't leak subscriptions on entity change

## Navigate

↑ **INDEX**: [widget-dev-INDEX.md](widget-dev-INDEX.md) - Widget development entry point
→ **Method 1**: [widget-dev-bindings-direct-entity.md](widget-dev-bindings-direct-entity.md) - Direct subscription
→ **Method 2**: [widget-dev-bindings-expressions.md](widget-dev-bindings-expressions.md) - BindingBinder
→ **Method 3**: [widget-dev-bindings-multi-entity.md](widget-dev-bindings-multi-entity.md) - Multi-entity pattern
→ **Metadata**: [widget-dev-metadata.md](widget-dev-metadata.md) - Define entity field with binding: true
→ **Lifecycle**: [widget-dev-lifecycle.md](widget-dev-lifecycle.md) - Setup bindings in mount()
→ **Rendering**: [widget-dev-rendering.md](widget-dev-rendering.md) - Update display on entity changes
→ **Example**: [widget-dev-complete-example.md](widget-dev-complete-example.md) - See bindings in action
⟲ **Class Structure**: [widget-dev-class-structure.md](widget-dev-class-structure.md) - Where bindings fit
⟲ **Canvas**: [canvas-flow-widget-rendering.md](canvas-flow-widget-rendering.md) - How canvas triggers updates
