# Widget Lifecycle: unmount() Method

Complete cleanup checklist for destroying widgets and preventing memory leaks.

## unmount() Flow Diagram

```
unmount() called
        ↓
Check: Is widget mounted?
        ├── NO → Return early
        └── YES → Continue
                ↓
        Step 1: Cleanup Bindings
                ↓
        Step 2: Remove Event Listeners
                ↓
        Step 3: Cancel Timers/Animations
                ↓
        Step 4: Remove from DOM
                ↓
        Step 5: Clear References
                ↓
        Step 6: Mark as Unmounted
                ↓
        Widget Destroyed
```

## Unmount Implementation Pattern

```javascript
unmount() {
  // ============================================================
  // STEP 1: CHECK IF MOUNTED
  // ============================================================
  if (!this.mounted) return;

  // ============================================================
  // STEP 2: CLEANUP BINDINGS
  // ============================================================
  this.cleanupBindings();

  // ============================================================
  // STEP 3: REMOVE EVENT LISTENERS
  // ============================================================
  this.removeEventListeners();

  // ============================================================
  // STEP 4: CANCEL ANIMATIONS/TIMERS
  // ============================================================
  if (this.animationFrame) {
    cancelAnimationFrame(this.animationFrame);
    this.animationFrame = null;
  }

  if (this.updateInterval) {
    clearInterval(this.updateInterval);
    this.updateInterval = null;
  }

  // ============================================================
  // STEP 5: REMOVE FROM DOM
  // ============================================================
  if (this.element && this.element.parentNode) {
    this.element.parentNode.removeChild(this.element);
  }

  // ============================================================
  // STEP 6: CLEAR REFERENCES
  // ============================================================
  this.element = null;
  this.container = null;

  // ============================================================
  // STEP 7: MARK AS UNMOUNTED
  // ============================================================
  this.mounted = false;

  console.log(`[${this.config.type}] Unmounted:`, this.config.id);
}
```

## Cleanup Methods

### cleanupBindings() Patterns

**Pattern 1: Single Entity Subscription**

```javascript
cleanupBindings() {
  if (this.entityUnsubscribe) {
    this.entityUnsubscribe();
    this.entityUnsubscribe = null;
  }
}
```

**Pattern 2: Multiple Subscriptions**

```javascript
cleanupBindings() {
  if (this.subscriptions) {
    this.subscriptions.forEach(unsub => unsub());
    this.subscriptions = [];
  }
}
```

**Pattern 3: BindingBinder**

```javascript
cleanupBindings() {
  if (this.canvasCore?.bindingBinder) {
    this.canvasCore.bindingBinder.unbindWidget(this.config.id);
  }
}
```

**Pattern 4: Combined**

```javascript
cleanupBindings() {
  // Single entity
  if (this.entityUnsubscribe) {
    this.entityUnsubscribe();
    this.entityUnsubscribe = null;
  }

  // Multiple entities
  if (this.subscriptions) {
    this.subscriptions.forEach(unsub => unsub());
    this.subscriptions = [];
  }

  // BindingBinder
  if (this.canvasCore?.bindingBinder) {
    this.canvasCore.bindingBinder.unbindWidget(this.config.id);
  }
}
```

### removeEventListeners() Patterns

**Pattern 1: Specific Listeners**

```javascript
removeEventListeners() {
  if (!this.element) return;

  this.element.removeEventListener("click", this.handleClick);
  this.element.removeEventListener("mouseover", this.handleMouseOver);
  this.element.removeEventListener("mouseout", this.handleMouseOut);
}
```

**Pattern 2: Clone & Replace (removes ALL listeners)**

```javascript
removeEventListeners() {
  if (!this.element || !this.element.parentNode) return;

  const newElement = this.element.cloneNode(true);
  this.element.parentNode.replaceChild(newElement, this.element);
  this.element = newElement;
}
```

**When to use Clone & Replace:**

- Many event listeners
- Dynamic listeners (added conditionally)
- Third-party library listeners
- Unsure which listeners exist

## Cleanup Best Practices

### ✅ DO

- [ ] Always call `super()` in constructor
- [ ] Bind event handlers in constructor
- [ ] Check `this.mounted` in unmount()
- [ ] Clean up ALL subscriptions in unmount()
- [ ] Remove ALL event listeners in unmount()
- [ ] Clear timers/intervals in unmount()
- [ ] Set `this.mounted = false` in unmount()
- [ ] Log unmount for debugging

### ❌ DON'T

- [ ] Don't forget to bind event handlers
- [ ] Don't subscribe without cleanup
- [ ] Don't add listeners without removal
- [ ] Don't leave timers running after unmount
- [ ] Don't forget ResizeObserver cleanup
- [ ] Don't forget MutationObserver cleanup
- [ ] Don't leak memory with uncleaned references

## Complete Unmount Examples

### Minimal Widget

```javascript
unmount() {
  if (!this.mounted) return;

  if (this.element && this.element.parentNode) {
    this.element.parentNode.removeChild(this.element);
  }

  this.element = null;
  this.mounted = false;
}
```

### Entity Widget

```javascript
unmount() {
  if (!this.mounted) return;

  // Cleanup entity subscription
  if (this.entityUnsubscribe) {
    this.entityUnsubscribe();
    this.entityUnsubscribe = null;
  }

  // Remove from DOM
  if (this.element && this.element.parentNode) {
    this.element.parentNode.removeChild(this.element);
  }

  this.element = null;
  this.container = null;
  this.mounted = false;
}
```

### Advanced Widget

```javascript
unmount() {
  if (!this.mounted) return;

  // Cleanup bindings
  this.cleanupBindings();

  // Remove event listeners
  this.removeEventListeners();

  // Cancel animations
  if (this.animationFrame) {
    cancelAnimationFrame(this.animationFrame);
    this.animationFrame = null;
  }

  // Clear intervals
  if (this.updateInterval) {
    clearInterval(this.updateInterval);
    this.updateInterval = null;
  }

  // Disconnect observers
  if (this.resizeObserver) {
    this.resizeObserver.disconnect();
    this.resizeObserver = null;
  }

  // Remove from DOM
  if (this.element && this.element.parentNode) {
    this.element.parentNode.removeChild(this.element);
  }

  // Clear references
  this.element = null;
  this.container = null;

  this.mounted = false;
  console.log(`[${this.config.type}] Unmounted:`, this.config.id);
}
```

## Memory Leak Prevention

### Common Memory Leak Sources

1. **Unreleased subscriptions**

   ```javascript
   // ❌ BAD
   this.canvasCore.entityManager.subscribe(entity, callback);
   // No cleanup!

   // ✓ GOOD
   this.entityUnsubscribe = this.canvasCore.entityManager.subscribe(...);
   // Later in unmount():
   this.entityUnsubscribe();
   ```

2. **Event listeners not removed**

   ```javascript
   // ❌ BAD
   this.element.addEventListener("click", this.handleClick);
   // No removal!

   // ✓ GOOD
   this.element.removeEventListener("click", this.handleClick);
   ```

3. **Timers still running**

   ```javascript
   // ❌ BAD
   setInterval(() => this.update(), 1000);
   // Never cleared!

   // ✓ GOOD
   this.interval = setInterval(() => this.update(), 1000);
   // Later in unmount():
   clearInterval(this.interval);
   ```

4. **Observers not disconnected**

   ```javascript
   // ❌ BAD
   this.observer = new ResizeObserver(...);
   // Never disconnected!

   // ✓ GOOD
   this.observer.disconnect();
   ```

## Navigate

↑ **Overview**: [widget-dev-lifecycle.md](widget-dev-lifecycle.md) - Lifecycle state machine and timing
← **Previous**: [widget-dev-lifecycle-mount.md](widget-dev-lifecycle-mount.md) - Widget initialization
→ **Next**: [widget-dev-lifecycle-updateConfig.md](widget-dev-lifecycle-updateConfig.md) - Configuration updates
⟲ **Bindings**: [widget-dev-entity-bindings.md](widget-dev-entity-bindings.md) - Cleanup binding subscriptions
⟲ **Class Structure**: [widget-dev-class-structure.md](widget-dev-class-structure.md) - Where unmount() fits
