# Widget Bindings: Method 1 - Direct Entity Subscription

Simple direct subscription to a single entity using EntityManager.

**Use for:** Simple widgets with single `entity` field

## Direct Subscription Flow

```
Widget Created
     ↓
mount() → setupBindings()
     ↓
EntityManager.subscribe(entityId, callback)
     ↓
Get initial state (EntityManager.getState)
     ↓
onEntityUpdate(state) called
     ↓
Widget updates display
     ↓
     ├─→ Entity state changes
     │        ↓
     │   callback → onEntityUpdate(newState)
     │        ↓
     │   Widget updates display
     │        ↓
     └─→ Loop back
     ↓
unmount() → cleanupBindings()
     ↓
Unsubscribe (entityUnsubscribe())
     ↓
Done
```

## Step 1: Initialize Subscription Holder

```javascript
constructor(canvasCore, config) {
  super(canvasCore, config);

  // STEP 1: Create unsubscribe holder
  this.entityUnsubscribe = null;
}
```

**Why:** Store the unsubscribe function for cleanup

## Step 2: Setup Binding Method

```javascript
setupBindings() {
  // STEP 2A: Cleanup existing subscription
  this.cleanupBindings();

  // STEP 2B: Check prerequisites
  if (!this.config.entity || !this.canvasCore?.entityManager) {
    return;
  }

  // STEP 2C: Subscribe to entity state changes
  this.entityUnsubscribe = this.canvasCore.entityManager.subscribe(
    this.config.entity,
    (newState, oldState) => {
      this.onEntityUpdate(newState, oldState);
    }
  );

  // STEP 2D: Get initial state (don't wait for first change)
  const initialState = this.canvasCore.entityManager.getState(
    this.config.entity
  );
  if (initialState) {
    this.onEntityUpdate(initialState);
  }
}
```

**Why Each Step:**

- 2A: Prevent duplicate subscriptions
- 2B: Guard against missing entity or EntityManager
- 2C: Subscribe and store unsubscribe function
- 2D: Immediate display (not blank until first update)

## Step 3: Handle Entity Updates

```javascript
onEntityUpdate(state, oldState) {
  // STEP 3A: Check if state exists
  if (!state) {
    this.showError("Entity not found");
    return;
  }

  // STEP 3B: Extract data from state
  const stateValue = state.state;
  const friendlyName = state.attributes?.friendly_name || this.config.entity;
  const unit = state.attributes?.unit_of_measurement || "";
  const icon = state.attributes?.icon;

  // STEP 3C: Update widget display
  const stateEl = this.element.querySelector(".state");
  const nameEl = this.element.querySelector(".name");

  if (stateEl) stateEl.textContent = `${stateValue} ${unit}`;
  if (nameEl) nameEl.textContent = friendlyName;
}
```

**State Object Structure:**

```javascript
{
  entity_id: "sensor.temperature",
  state: "72.5",
  attributes: {
    friendly_name: "Living Room Temperature",
    unit_of_measurement: "°F",
    device_class: "temperature",
    icon: "mdi-thermometer"
  },
  last_changed: "2026-01-29T12:34:56.789Z",
  last_updated: "2026-01-29T12:34:56.789Z"
}
```

## Step 4: Cleanup Method

```javascript
cleanupBindings() {
  // STEP 4: Unsubscribe if subscription exists
  if (this.entityUnsubscribe) {
    this.entityUnsubscribe();
    this.entityUnsubscribe = null;
  }
}
```

**Critical:** Must be called in unmount() to prevent memory leaks

## Step 5: Handle Entity Changes

```javascript
updateConfig(newConfig) {
  Object.assign(this.config, newConfig);

  // STEP 5: Re-subscribe if entity changed
  if (newConfig.entity !== undefined) {
    this.setupBindings();  // Calls cleanupBindings() internally
  }
}
```

## Complete Direct Subscription Example

```javascript
class EntityWidget extends BaseWidget {
  constructor(canvasCore, config) {
    super(canvasCore, config);
    this.entityUnsubscribe = null;
  }

  static getMetadata() {
    return {
      name: "Entity Display",
      icon: "mdi-database",
      category: "basic",
      defaultSize: { w: 200, h: 100 },
      customFields: [
        { name: "entity", type: "entity", label: "Entity", default: "" },
      ],
    };
  }

  mount(container) {
    this.element = document.createElement("div");
    this.element.innerHTML = `
      <div class="entity-widget">
        <div class="name">Loading...</div>
        <div class="state">—</div>
      </div>
    `;

    this.setupBindings();
    container.appendChild(this.element);
    this.mounted = true;
  }

  setupBindings() {
    this.cleanupBindings();

    if (!this.config.entity || !this.canvasCore?.entityManager) return;

    this.entityUnsubscribe = this.canvasCore.entityManager.subscribe(
      this.config.entity,
      (state) => this.onEntityUpdate(state),
    );

    const initialState = this.canvasCore.entityManager.getState(
      this.config.entity,
    );
    if (initialState) this.onEntityUpdate(initialState);
  }

  cleanupBindings() {
    if (this.entityUnsubscribe) {
      this.entityUnsubscribe();
      this.entityUnsubscribe = null;
    }
  }

  onEntityUpdate(state) {
    if (!state) {
      this.element.querySelector(".state").textContent = "Not found";
      return;
    }

    const stateValue = state.state;
    const name = state.attributes?.friendly_name || this.config.entity;

    this.element.querySelector(".name").textContent = name;
    this.element.querySelector(".state").textContent = stateValue;
  }

  updateConfig(newConfig) {
    Object.assign(this.config, newConfig);
    if (newConfig.entity !== undefined) {
      this.setupBindings();
    }
  }

  unmount() {
    this.cleanupBindings();
    this.element.remove();
    this.mounted = false;
  }
}
```

## Entity State Access Patterns

### Accessing State Values

```javascript
onEntityUpdate(state) {
  // Basic state
  const value = state.state;                              // "72.5"

  // Attributes
  const name = state.attributes.friendly_name;            // "Living Room"
  const unit = state.attributes.unit_of_measurement;      // "°F"
  const icon = state.attributes.icon;                     // "mdi-thermometer"
  const rgb = state.attributes.rgb_color;                 // [255, 120, 0]
  const brightness = state.attributes.brightness;         // 200

  // Type conversion
  const numValue = parseFloat(state.state);               // 72.5
  const intValue = parseInt(state.state);                 // 72

  // State checks
  const isOn = state.state === "on";
  const isOff = state.state === "off";
  const isUnavailable = state.state === "unavailable";

  // Safe attribute access
  const safeIcon = state.attributes?.icon || "mdi-help";
  const safeUnit = state.attributes?.unit_of_measurement || "";
}
```

### Common Entity Types

```javascript
// Light entity
{
  state: "on",  // "on" or "off"
  attributes: {
    brightness: 200,        // 0-255
    rgb_color: [255, 120, 0],
    color_temp: 400,
    supported_features: 63
  }
}

// Sensor entity
{
  state: "72.5",
  attributes: {
    unit_of_measurement: "°F",
    device_class: "temperature",
    friendly_name: "Living Room Temperature"
  }
}

// Binary sensor
{
  state: "on",  // "on" or "off"
  attributes: {
    device_class: "motion",  // motion, door, window, etc.
    friendly_name: "Front Door"
  }
}

// Switch entity
{
  state: "on",  // "on" or "off"
  attributes: {
    friendly_name: "Coffee Maker"
  }
}
```

## Navigate

↑ **Overview**: [widget-dev-entity-bindings.md](widget-dev-entity-bindings.md) - Binding method comparison
→ **Next**: [widget-dev-bindings-expressions.md](widget-dev-bindings-expressions.md) - BindingBinder method
→ **Multi-Entity**: [widget-dev-bindings-multi-entity.md](widget-dev-bindings-multi-entity.md) - Multiple entity pattern
⟲ **Lifecycle**: [widget-dev-lifecycle-mount.md](widget-dev-lifecycle-mount.md) - Setup bindings in mount()
⟲ **Class Structure**: [widget-dev-class-structure.md](widget-dev-class-structure.md) - Where bindings fit
