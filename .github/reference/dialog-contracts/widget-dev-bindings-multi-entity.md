# Widget Bindings: Method 3 - Multi-Entity Subscription

Manual subscription pattern for widgets needing multiple specific entities.

**Use for:** Widgets needing multiple specific entities (not expressions)

## Multi-Entity Flow

```
Widget with 3 entity fields:
├── temperature
├── humidity
└── pressure
     ↓
setupBindings() iterates entities
     ↓
Subscribe to temperature → store unsubscribe
Subscribe to humidity → store unsubscribe
Subscribe to pressure → store unsubscribe
     ↓
Store all unsubscribe functions in array
     ↓
On any entity update:
     ├─→ onEntityUpdate(fieldName, state)
     └─→ Update specific field in UI
     ↓
cleanupBindings() unsubscribes all
```

## Step 1: Initialize Subscription Array

```javascript
constructor(canvasCore, config) {
  super(canvasCore, config);

  // STEP 1: Array to hold all unsubscribe functions
  this.subscriptions = [];
}
```

## Step 2: Define Multiple Entity Fields

```javascript
static getMetadata() {
  return {
    name: "Multi Sensor",
    icon: "mdi-gauge",
    category: "advanced",
    defaultSize: { w: 400, h: 200 },

    customFields: [
      { name: "temperature", type: "entity", label: "Temperature", default: "" },
      { name: "humidity", type: "entity", label: "Humidity", default: "" },
      { name: "pressure", type: "entity", label: "Pressure", default: "" }
    ]
  };
}
```

## Step 3: Subscribe to All Entities

```javascript
setupBindings() {
  // STEP 3A: Cleanup existing subscriptions
  this.cleanupBindings();

  if (!this.canvasCore?.entityManager) return;

  // STEP 3B: Define entity-field pairs
  const entities = [
    { id: this.config.temperature, field: "temperature" },
    { id: this.config.humidity, field: "humidity" },
    { id: this.config.pressure, field: "pressure" }
  ];

  // STEP 3C: Subscribe to each entity
  entities.forEach(({ id, field }) => {
    if (!id) return;  // Skip if no entity selected

    const unsubscribe = this.canvasCore.entityManager.subscribe(
      id,
      (state) => this.onEntityUpdate(field, state)
    );

    // Store unsubscribe function
    this.subscriptions.push(unsubscribe);

    // Get initial state
    const initialState = this.canvasCore.entityManager.getState(id);
    if (initialState) {
      this.onEntityUpdate(field, initialState);
    }
  });
}
```

## Step 4: Handle Field-Specific Updates

```javascript
onEntityUpdate(field, state) {
  // STEP 4A: Extract value and unit
  const value = state?.state || "—";
  const unit = state?.attributes?.unit_of_measurement || "";

  // STEP 4B: Find element for this field
  const element = this.element.querySelector(`[data-field="${field}"]`);

  // STEP 4C: Update display
  if (element) {
    element.textContent = `${value} ${unit}`;
  }
}
```

## Step 5: Cleanup All Subscriptions

```javascript
cleanupBindings() {
  // Unsubscribe from ALL entities
  this.subscriptions.forEach(unsub => unsub());
  this.subscriptions = [];
}
```

## Step 6: Handle Entity Changes

```javascript
updateConfig(newConfig) {
  Object.assign(this.config, newConfig);

  // Re-subscribe if any entity changed
  if (
    newConfig.temperature !== undefined ||
    newConfig.humidity !== undefined ||
    newConfig.pressure !== undefined
  ) {
    this.setupBindings();
  }
}
```

## Complete Multi-Entity Example

```javascript
class MultiSensorWidget extends BaseWidget {
  constructor(canvasCore, config) {
    super(canvasCore, config);
    this.subscriptions = [];
  }

  static getMetadata() {
    return {
      name: "Multi Sensor",
      icon: "mdi-gauge-empty",
      category: "advanced",
      defaultSize: { w: 400, h: 200 },

      customFields: [
        {
          name: "temperature",
          type: "entity",
          label: "Temperature",
          default: "",
        },
        { name: "humidity", type: "entity", label: "Humidity", default: "" },
        { name: "pressure", type: "entity", label: "Pressure", default: "" },
      ],
    };
  }

  mount(container) {
    this.element = document.createElement("div");
    this.element.innerHTML = `
      <div class="multi-sensor">
        <div class="sensor">
          <span class="label">Temperature:</span>
          <span class="value" data-field="temperature">—</span>
        </div>
        <div class="sensor">
          <span class="label">Humidity:</span>
          <span class="value" data-field="humidity">—</span>
        </div>
        <div class="sensor">
          <span class="label">Pressure:</span>
          <span class="value" data-field="pressure">—</span>
        </div>
      </div>
    `;

    this.setupBindings();
    container.appendChild(this.element);
    this.mounted = true;
  }

  setupBindings() {
    this.cleanupBindings();

    if (!this.canvasCore?.entityManager) return;

    const entities = [
      { id: this.config.temperature, field: "temperature" },
      { id: this.config.humidity, field: "humidity" },
      { id: this.config.pressure, field: "pressure" },
    ];

    entities.forEach(({ id, field }) => {
      if (!id) return;

      const unsubscribe = this.canvasCore.entityManager.subscribe(id, (state) =>
        this.onEntityUpdate(field, state),
      );

      this.subscriptions.push(unsubscribe);

      const initialState = this.canvasCore.entityManager.getState(id);
      if (initialState) {
        this.onEntityUpdate(field, initialState);
      }
    });
  }

  cleanupBindings() {
    this.subscriptions.forEach((unsub) => unsub());
    this.subscriptions = [];
  }

  onEntityUpdate(field, state) {
    const value = state?.state || "—";
    const unit = state?.attributes?.unit_of_measurement || "";

    const element = this.element.querySelector(`[data-field="${field}"]`);
    if (element) {
      element.textContent = `${value} ${unit}`;
    }
  }

  updateConfig(newConfig) {
    Object.assign(this.config, newConfig);

    if (
      newConfig.temperature !== undefined ||
      newConfig.humidity !== undefined ||
      newConfig.pressure !== undefined
    ) {
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

## Multi-Entity Patterns

### Pattern 1: Fixed Entity List

```javascript
// Defined set of entities in metadata
customFields: [
  { name: "entity1", type: "entity", label: "Entity 1" },
  { name: "entity2", type: "entity", label: "Entity 2" },
  { name: "entity3", type: "entity", label: "Entity 3" },
];
```

### Pattern 2: Dynamic Entity List

```javascript
// Array of entities (advanced)
customFields: [
  {
    name: "entities",
    type: "entityList",  // Custom field type
    label: "Entities",
    default: []
  }
]

setupBindings() {
  this.cleanupBindings();

  (this.config.entities || []).forEach(entityId => {
    const unsub = this.canvasCore.entityManager.subscribe(
      entityId,
      (state) => this.onEntityUpdate(entityId, state)
    );
    this.subscriptions.push(unsub);
  });
}
```

### Pattern 3: Entity Groups

```javascript
// Grouped entities by category
customFields: [
  { name: "lightEntities", type: "entityList", label: "Lights" },
  { name: "sensorEntities", type: "entityList", label: "Sensors" },
  { name: "switchEntities", type: "entityList", label: "Switches" },
];
```

## When to Use Multi-Entity Pattern

### ✅ Use Multi-Entity When:

- Widget displays multiple distinct entity values
- Each entity field has a specific purpose
- Need different handling for each entity
- Entities are not part of expressions
- Want separate UI controls for each entity

### ❌ Don't Use Multi-Entity When:

- Single entity is sufficient
- Using binding expressions (use BindingBinder)
- Entities are in computed expressions
- Need dynamic entity lists (consider entity groups)

## Navigate

↑ **Overview**: [widget-dev-entity-bindings.md](widget-dev-entity-bindings.md) - Binding method comparison
← **Previous**: [widget-dev-bindings-expressions.md](widget-dev-bindings-expressions.md) - BindingBinder method
← **Direct**: [widget-dev-bindings-direct-entity.md](widget-dev-bindings-direct-entity.md) - Single entity method
⟲ **Lifecycle**: [widget-dev-lifecycle-unmount.md](widget-dev-lifecycle-unmount.md) - Cleanup all subscriptions
⟲ **Class Structure**: [widget-dev-class-structure.md](widget-dev-class-structure.md) - Where bindings fit
