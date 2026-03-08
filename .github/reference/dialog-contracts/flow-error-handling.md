# Error Handling Flow

How dialogs handle invalid input and validation:

```
Parse Input
    │
    ├─ Valid ────────────→ Use value
    │
    └─ Invalid
         │
         ├─ Use defaults
         ├─ Log warning
         └─ Continue (graceful degradation)

User Interaction
    │
    └─ On Apply
         │
         ├─ Validate
         │
         ├─ Valid ──────→ Call callback
         │
         └─ Invalid
              │
              ├─ Show error message
              ├─ Highlight field
              └─ Stay in dialog (don't close)
```

**Philosophy**: Never block - always degrade gracefully

- Invalid input → Use sensible defaults
- Validation fails → Show error, let user fix
- No exceptions thrown to caller

---

## Navigate

↑ **Flow**: [parse-render-interact.md](parse-render-interact.md)
⟲ **Examples**: All [../\*.md](../) dialogs handle errors
