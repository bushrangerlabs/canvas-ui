# Dialog Lifecycle Flow

Detailed flow from construction to cleanup:

```
┌─────────────────────┐
│ 1. CONSTRUCT        │
│ Store parameters    │
│ Parse currentValue  │
│ Initialize state    │
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│ 2. SHOW             │
│ Create overlay      │
│ Create dialog DOM   │
│ Render header       │
│ Render content      │
│ Attach events       │
│ Append to body      │
│ Focus input         │
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│ 3. USER INTERACTION │
│ Modify values       │
│ Live preview        │
│ Click Apply/Cancel  │
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│ 4. CLOSE            │
│ Remove from DOM     │
│ Remove listeners    │
│ Clear references    │
└──────────┬──────────┘
           ▼
    ┌──────┴───────┐
    │              │
    ▼              ▼
┌────────┐   ┌──────────┐
│ CANCEL │   │ CALLBACK │
│ No-op  │   │ (result) │
└────────┘   └──────────┘
```

---

## Navigate

↑ **Overview**: [../lifecycle.md](../lifecycle.md)
→ **Data Flow**: [parse-render-interact.md](parse-render-interact.md)
↓ **State**: [../concept-state-management.md](../concept-state-management.md)
