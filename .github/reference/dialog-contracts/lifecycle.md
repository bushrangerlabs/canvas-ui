# Dialog Lifecycle

Every dialog follows this lifecycle:

```
CONSTRUCT → SHOW → INTERACT → CLOSE → CALLBACK
```

**1. Construct**: Store params, parse currentValue, init state
**2. Show**: Create DOM, render UI, attach events, focus input
**3. Interact**: User modifies values, previews changes
**4. Close**: Remove DOM, cleanup listeners, free memory
**5. Callback**: Return result to caller (only on Apply, not Cancel)

## Key Points

- Constructor is lightweight (store params only)
- Heavy work happens in `show()` (lazy render)
- Dialog is destroyed on close (no reuse)
- No side effects - pure input/output

---

## Navigate

↓ **Details**: [flow-constructor-show-close.md](flow-constructor-show-close.md) - Detailed lifecycle flow
→ **Related**: [patterns.md](patterns.md) - How patterns vary the lifecycle
⟲ **Uses**: [concept-state-management.md](concept-state-management.md) - Internal state
