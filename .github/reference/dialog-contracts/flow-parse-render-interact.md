# Data Flow Through Dialog

How data moves through a dialog with currentValue:

```
INPUT (currentValue)
        ↓
┌───────────────────┐
│ PARSE             │
│ • CSS string?     │
│ • Object?         │
│ • Expression?     │
└────────┬──────────┘
         ▼
┌───────────────────┐
│ RENDER UI         │
│ • Pre-fill fields │
│ • Set sliders     │
│ • Select options  │
└────────┬──────────┘
         ▼
┌───────────────────┐
│ INTERACT          │
│ • User modifies   │
│ • Live preview    │
│ • Validate        │
└────────┬──────────┘
         ▼
┌───────────────────┐
│ BUILD OUTPUT      │
│ • Collect values  │
│ • Format result   │
│ • Return via cb   │
└────────┬──────────┘
         ▼
OUTPUT (callback)
```

---

## Navigate

↑ **Lifecycle**: [constructor-show-close.md](constructor-show-close.md)
→ **Errors**: [error-handling.md](error-handling.md)
⟲ **Example**: [../border-editor.md](../border-editor.md)
