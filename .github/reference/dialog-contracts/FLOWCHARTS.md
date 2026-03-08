# Dialog System Flowcharts

Textual flow diagrams showing dialog patterns, data flow, and integration points.

---

## Standard Dialog Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│ CALLER (Inspector, Toolbar, Widget)                        │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. CONSTRUCT DIALOG                                         │
│    new Dialog(dependencies, currentValue, callback)         │
│    • Store parameters                                       │
│    • Initialize state                                       │
│    • Parse currentValue (if provided)                       │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. SHOW DIALOG                                              │
│    dialog.show()                                            │
│    • Create overlay (backdrop)                              │
│    • Create dialog container                                │
│    • Render header                                          │
│    • Render content                                         │
│    • Attach to DOM                                          │
│    • Focus input                                            │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. USER INTERACTION                                         │
│    • Modify values                                          │
│    • Click buttons                                          │
│    • Open nested dialogs                                    │
│    • Preview changes                                        │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
                    ┌─────┴─────┐
                    │           │
            ┌───────▼──┐   ┌────▼─────┐
            │ CANCEL   │   │  APPLY   │
            └───────┬──┘   └────┬─────┘
                    │           │
                    ▼           ▼
        ┌───────────────────────────────┐
        │ 4. CLOSE DIALOG               │
        │    dialog.close()             │
        │    • Remove from DOM          │
        │    • Clean up listeners       │
        └───────────┬───────────────────┘
                    │
            ┌───────┴────────┐
            │                │
            ▼                ▼
    ┌───────────┐    ┌──────────────┐
    │ No Action │    │ 5. CALLBACK  │
    └───────────┘    │ callback(result) │
                     └───────┬──────────┘
                             │
                             ▼
                     ┌───────────────┐
                     │ CALLER        │
                     │ Updates state │
                     └───────────────┘
```

---

## Pattern 1: Simple Picker (No Current Value)

**Example**: IconPickerSimpleDialog

```
INPUT                    DIALOG                         OUTPUT
─────                    ──────                         ──────

                    ┌─────────────────┐
                    │  Constructor    │
None ──────────────▶│  (callback)     │
                    │                 │
                    │  • callback     │
                    │  • selectedIcon │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  show()         │
                    │                 │
                    │  • Render UI    │
                    │  • Icon grid    │
                    │  • Category tabs│
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  User selects   │
                    │  icon from grid │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Insert button  │
                    │  clicked        │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
callback(iconName) ◀│  callback()     │
"mdi-fire"          │                 │
                    │  Returns:       │
                    │  "mdi-iconname" │
                    └─────────────────┘
```

**Key Characteristics**:

- ✅ No pre-selection
- ✅ Simplest pattern
- ✅ Returns single value

---

## Pattern 2: Editor with Current Value

**Example**: BorderEditorDialog, ShadowEditorDialog, FontPickerDialog

```
INPUT                    DIALOG                         OUTPUT
─────                    ──────                         ──────

currentValue        ┌─────────────────┐
"2px solid #03a9f4" │  Constructor    │
        │           │  (currentValue, │
        └──────────▶│   callback)     │
                    │                 │
callback ──────────▶│  • currentValue │
                    │  • callback     │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  _parseValue()  │
                    │                 │
                    │  CSS string?    │
                    │  ├─ Yes → parse │
                    │  └─ No → object │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  show()         │
                    │                 │
                    │  • Pre-fill UI  │
                    │  • Enable       │
                    │  • Width: 2px   │
                    │  • Color: blue  │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  User modifies  │
                    │  • Width slider │
                    │  • Color picker │
                    │  • Live preview │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Apply button   │
                    │  clicked        │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
callback(result) ◀──│  callback()     │
{                   │                 │
  border: "3px...", │  Returns:       │
  borderRadius: "8" │  Object with    │
}                   │  atomic props   │
                    └─────────────────┘
```

**Key Characteristics**:

- ✅ Pre-fills with current value
- ✅ Parses multiple formats
- ✅ Returns structured data
- ✅ Live preview

---

## Pattern 3: Entity-Aware Picker

**Example**: EntityPickerDialog

```
INPUT                    DIALOG                         OUTPUT
─────                    ──────                         ──────

entityManager       ┌─────────────────┐
  │                 │  Constructor    │
  └────────────────▶│  (entityManager,│
                    │   onSelect)     │
onSelect ──────────▶│                 │
                    │  • entityManager│
                    │  • onSelect     │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  show()         │
                    │                 │
                    │  Load entities  │
                    │  getAllEntities()│
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Render list    │
                    │                 │
                    │  Group by domain│
                    │  • light (12)   │
                    │  • sensor (45)  │
                    │  • switch (8)   │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  User searches  │
                    │  & filters      │
                    │                 │
                    │  "living room"  │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  User clicks    │
                    │  entity         │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
onSelect(entityId)◀─│  onSelect()     │
"light.living_room" │                 │
                    │  Returns:       │
                    │  Entity ID      │
                    │  (string)       │
                    └─────────────────┘
```

**Key Characteristics**:

- ✅ Requires EntityManager dependency
- ✅ No current value support (by design)
- ✅ Returns entity ID string
- ✅ Real-time entity data

---

## Pattern 4: Entity-Aware Editor

**Example**: BindingEditorDialog, VisibilityConditionDialog

```
INPUT                    DIALOG                              OUTPUT
─────                    ──────                              ──────

entityManager       ┌──────────────────────┐
  │                 │  Constructor         │
  └────────────────▶│  (entityManager,     │
                    │   currentBinding,    │
currentBinding ────▶│   callback)          │
"{sensor.temp;*1.8}"│                      │
                    │  • entityManager     │
callback ──────────▶│  • currentBinding    │
                    │  • callback          │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  _parseBinding()     │
                    │                      │
                    │  Extract:            │
                    │  • Entity: sensor.temp│
                    │  • Ops: [*1.8]       │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  show()              │
                    │                      │
                    │  • Pre-fill entity   │
                    │  • Pre-fill ops      │
                    │  • Mode: simple      │
                    └──────────┬───────────┘
                               │
                               ▼
            ┌──────────────────┴─────────────────┐
            │                                    │
            ▼                                    ▼
    ┌───────────────┐                  ┌────────────────┐
    │ Simple Mode   │                  │ Advanced Mode  │
    │               │                  │                │
    │ • Entity btn ─┼──┐               │ • Free-form    │
    │ • Op builder  │  │               │   expression   │
    └───────────────┘  │               │ • Multi-entity │
                       │               └────────────────┘
                       ▼
            ┌──────────────────┐
            │ EntityPickerDialog│ (Nested)
            │                  │
            │ User selects     │
            │ sensor.temperature│
            └──────────┬───────┘
                       │
                       ▼
            ┌──────────────────┐
            │ Operation builder│
            │                  │
            │ User adds:       │
            │ • * 1.8          │
            │ • + 32           │
            │ • round(1)       │
            └──────────┬───────┘
                       │
                       ▼
            ┌──────────────────┐
            │ Live preview     │
            │                  │
            │ Current: 20°C    │
            │ Result: 68.0°F   │
            └──────────┬───────┘
                       │
                       ▼
            ┌──────────────────┐
            │ Apply clicked    │
            └──────────┬───────┘
                       │
                       ▼
            ┌──────────────────┐
callback(expr) ◀─│ callback()      │
"{sensor.temp;   │                 │
*1.8;+32;        │ Returns:        │
round(1)}"       │ Expression      │
                 │ (string)        │
                 └─────────────────┘
```

**Key Characteristics**:

- ✅ Requires EntityManager
- ✅ Pre-fills current value
- ✅ Dual modes (simple + advanced)
- ✅ Integrates EntityPickerDialog
- ✅ Live preview with entity data
- ✅ Returns binding expression

---

## Dialog Dependencies Map

```
┌────────────────────────────────────────────────────────────┐
│ STANDALONE DIALOGS (No Dependencies)                      │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  BorderEditorDialog          Pure UI, CSS parsing         │
│  ShadowEditorDialog          Pure UI, CSS parsing         │
│  FontPickerDialog            Pure UI, font loading        │
│  IconPickerSimpleDialog      Pure UI, icon library        │
│                                                            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ ENTITY-AWARE DIALOGS (EntityManager)                      │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  EntityPickerDialog          EntityManager only           │
│      ↑                                                     │
│      │ (used by)                                          │
│      │                                                     │
│  BindingEditorDialog         EntityManager                │
│      └─ Opens → EntityPickerDialog                        │
│                                                            │
│  VisibilityConditionDialog   EntityManager                │
│      └─ Opens → EntityPickerDialog                        │
│                                                            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ UTILITY DIALOG (FileService)                              │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  FileManagerDialog           FileService                  │
│      (Not a picker - management utility)                  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Integration Points

### Inspector → Dialog Flow

```
┌─────────────────────────────────────────────────────────────┐
│ INSPECTOR                                                   │
│                                                             │
│  Field Type                 Opens Dialog                    │
│  ──────────                 ────────────                    │
│                                                             │
│  border     ────────────▶   BorderEditorDialog             │
│  shadow     ────────────▶   ShadowEditorDialog             │
│  font       ────────────▶   FontPickerDialog               │
│  icon       ────────────▶   IconPickerSimpleDialog         │
│  entity     ────────────▶   EntityPickerDialog             │
│  text+{} btn ───────────▶   BindingEditorDialog            │
│  visibility ─────────────▶   VisibilityConditionDialog     │
│                                                             │
└─────────────┬───────────────────────────────────────────────┘
              │
              │ (after dialog completes)
              ▼
┌─────────────────────────────────────────────────────────────┐
│ INSPECTOR CALLBACK                                          │
│                                                             │
│  (result) => {                                              │
│    widget.config[propertyName] = result;                   │
│    inspector.updateWidget(widget);                          │
│  }                                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Nested Dialog Flow

```
┌─────────────────────────────────────────────────────────────┐
│ BindingEditorDialog                                         │
│                                                             │
│  ┌──────────────┐                                          │
│  │ Simple Mode  │                                          │
│  │              │                                          │
│  │ Entity: ___  │                                          │
│  │   [📋 Pick] ◀┼──────────┐                              │
│  └──────────────┘           │                              │
│                             │ (click)                      │
│                             ▼                              │
│                  ┌────────────────────┐                    │
│                  │ EntityPickerDialog │                    │
│                  │                    │                    │
│                  │ • Search entities  │                    │
│                  │ • Filter by domain │                    │
│                  │ • Select entity    │                    │
│                  └──────────┬─────────┘                    │
│                             │                              │
│                             │ onSelect(entityId)           │
│                             ▼                              │
│  ┌──────────────┐                                          │
│  │ Simple Mode  │                                          │
│  │              │                                          │
│  │ Entity: sensor.temperature ✓                           │
│  │   [📋 Pick]  │                                          │
│  └──────────────┘                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## State Management Flow

```
Dialog Lifecycle States:
──────────────────────────

CONSTRUCTED ──────▶ VISIBLE ──────▶ INTERACTING ──────▶ CLOSED
    │                  │                 │                  │
    │                  │                 │                  │
    ▼                  ▼                 ▼                  ▼
Store params      Render UI       Update state       Clean up
Parse current     Attach DOM      Preview live       Remove DOM
Init state        Focus input     Validate data      Call callback


State Preservation:
───────────────────

Mode Switching (BindingEditorDialog):
────────────────────────────────────

Simple Mode ◀───────────▶ Advanced Mode
    │                         │
    │ (switch mode)           │
    ▼                         ▼
Save current            Save current
simple state            expression
    │                         │
    │ (attempt parse)         │
    ▼                         ▼
Try restore ────────────▶ Show expression
from expression         (always works)


Dialog z-index Stack:
─────────────────────

Base Page       z-index: 0
Inspector       z-index: 1000
Dialog Overlay  z-index: 10000
Dialog          z-index: 10001
Nested Dialog   z-index: 10002 (EntityPickerDialog)
```

---

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Dialog Operation                                            │
└───────────────┬─────────────────────────────────────────────┘
                │
                ▼
        ┌───────────────┐
        │ Parse Input   │
        └───────┬───────┘
                │
        ┌───────┴────────┐
        │                │
        ▼                ▼
  ┌──────────┐    ┌──────────┐
  │ Valid    │    │ Invalid  │
  └────┬─────┘    └────┬─────┘
       │               │
       │               ▼
       │         ┌──────────────┐
       │         │ Use defaults │
       │         │ Log warning  │
       │         └──────┬───────┘
       │                │
       └────────┬───────┘
                ▼
        ┌───────────────┐
        │ Render UI     │
        └───────┬───────┘
                │
                ▼
        ┌───────────────┐
        │ User Edits    │
        └───────┬───────┘
                │
                ▼
        ┌───────────────┐
        │ Validate      │
        └───────┬───────┘
                │
        ┌───────┴────────┐
        │                │
        ▼                ▼
  ┌──────────┐    ┌──────────────┐
  │ Valid    │    │ Show error   │
  │ Apply ✓  │    │ Stay in UI   │
  └──────────┘    └──────────────┘
```

---

## Performance Considerations

```
Dialog Creation Performance:
────────────────────────────

Lazy Render Pattern:
───────────────────

Constructor()           ← Fast (store params only)
    │
    │ (wait for show())
    │
    ▼
show()                  ← Deferred work
    │
    ├─ Create DOM       ← Heavy operation
    ├─ Render content   ← Heavy operation
    ├─ Attach events    ← Many listeners
    └─ Focus input      ← UI operation


Optimization:
────────────

Cache expensive operations:
• Icon library (load once)
• Font list (build once)
• Entity list (refresh on show)

Destroy on close:
• Remove DOM
• Clear listeners
• Free memory


Reuse pattern (NOT currently used):
───────────────────────────────────

DialogPool.get('BorderEditor')  ← Reuse instance
    │
    ├─ If exists: reset state
    └─ If not: create new

Currently: Create fresh each time (simpler, safer)
```

---

## Testing Checklist Flow

```
For Each Dialog:
───────────────

┌─────────────────────────────────────┐
│ 1. Constructor Tests               │
│    ✓ Valid params                  │
│    ✓ Missing optional params       │
│    ✓ Invalid params (graceful)     │
└─────────────────┬───────────────────┘
                  ▼
┌─────────────────────────────────────┐
│ 2. Parsing Tests                   │
│    ✓ Valid current value           │
│    ✓ Invalid current value         │
│    ✓ Empty/null current value      │
│    ✓ Multiple formats              │
└─────────────────┬───────────────────┘
                  ▼
┌─────────────────────────────────────┐
│ 3. UI Render Tests                 │
│    ✓ Shows overlay                 │
│    ✓ Shows dialog                  │
│    ✓ Pre-fills values              │
│    ✓ All controls present          │
└─────────────────┬───────────────────┘
                  ▼
┌─────────────────────────────────────┐
│ 4. Interaction Tests               │
│    ✓ Modify values                 │
│    ✓ Preview updates               │
│    ✓ Keyboard navigation           │
│    ✓ Cancel works                  │
│    ✓ Apply works                   │
└─────────────────┬───────────────────┘
                  ▼
┌─────────────────────────────────────┐
│ 5. Output Tests                    │
│    ✓ Callback called               │
│    ✓ Correct data type             │
│    ✓ Correct format                │
│    ✓ All properties present        │
└─────────────────┬───────────────────┘
                  ▼
┌─────────────────────────────────────┐
│ 6. Cleanup Tests                   │
│    ✓ DOM removed                   │
│    ✓ No memory leaks               │
│    ✓ Events cleaned up             │
└─────────────────────────────────────┘
```

---

## Future Patterns

### Config Object Pattern (Future Enhancement)

```
Current:
────────
new Dialog(entityManager, currentValue, callback)

Proposed:
─────────
new Dialog({
  entityManager: canvasCore.entityManager,
  currentValue: widget.config.text,
  onComplete: (result) => { ... },
  onCancel: () => { ... },
  options: {
    mode: 'simple',
    showPreview: true
  }
})

Benefits:
─────────
✓ Self-documenting
✓ Easy to extend
✓ Optional parameters clear
✓ Better for 3+ params
```

### BaseDialog Class (Future Enhancement)

```
┌─────────────────────────────────────┐
│ BaseDialog                          │
│                                     │
│ • overlay creation                  │
│ • dialog container                  │
│ • close handling                    │
│ • keyboard handling (ESC)           │
│ • z-index management                │
└─────────────────┬───────────────────┘
                  │ (extends)
                  │
      ┌───────────┴──────────┐
      │                      │
      ▼                      ▼
┌──────────────┐      ┌──────────────┐
│ BorderEditor │      │ FontPicker   │
│              │      │              │
│ _renderUI()  │      │ _renderUI()  │
│ _buildResult()│     │ _buildResult()│
└──────────────┘      └──────────────┘

Shared:
───────
• Overlay backdrop
• ESC key closes
• Click outside closes
• z-index stacking

Custom:
───────
• Content rendering
• State management
• Result building
```
