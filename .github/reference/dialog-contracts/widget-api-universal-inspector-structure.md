# Universal Inspector Structure

Every widget in Canvas UI has the same 5-section inspector layout:

## The 5 Standard Sections

```
┌─────────────────────────────────┐
│ 📋 Widget Name/ID               │ → identity-widget-name-id.md
├─────────────────────────────────┤
│ 📐 Position (⇄ bi-directional)  │ → position-*.md
├─────────────────────────────────┤
│ ⚙️ Custom                       │ → custom-section-overview.md
├─────────────────────────────────┤
│ 🎨 Styling                      │ → styling-*.md
├─────────────────────────────────┤
│ 👁️ Visibility                   │ → visibility-conditions.md
└─────────────────────────────────┘
```

## Order Matters

Sections always appear in this order:

1. **Identity** - What is this widget?
2. **Position** - Where is it and how big?
3. **Custom** - Widget-specific functionality
4. **Styling** - How does it look?
5. **Visibility** - When is it shown?

## Why This Order?

- **Identity first**: Must know what it is before configuring
- **Position second**: Layout before appearance
- **Custom middle**: Functionality is core to widget purpose
- **Styling late**: Appearance after structure
- **Visibility last**: Conditions apply after everything else is configured

---

## Navigate

↓ **Details**: Follow links to individual sections above
⟲ **Implementation**: [widget-api-INDEX.md](widget-api-INDEX.md) - All widget API docs
