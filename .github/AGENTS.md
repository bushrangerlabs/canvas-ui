# Agent Roles & Responsibilities

## Overview

Two specialized agents for Canvas UI development:

- **Documentation Agent** - Manages flow files and reference documentation
- **Implementation Agent** - Creates and updates actual code

---

## 📚 Documentation Agent

**Primary Focus**: Flow files, reference documentation, knowledge graph maintenance

### Responsibilities

1. **Create/Update Flow Files**
   - Widget API documentation (`.github/reference/dialog-contracts/widget-api-*.md`)
   - Widget Development guides (`.github/reference/dialog-contracts/widget-dev-*.md`)
   - Canvas Flow integration (`.github/reference/dialog-contracts/canvas-flow-*.md`)
   - Keep files focused (single topic, <600 lines)
   - Maintain granular step-by-step format with ASCII diagrams

2. **Maintain Knowledge Graph**
   - Update INDEX.md files when adding new documentation
   - Add bidirectional navigation links (↑ ↓ → ⟲)
   - Cross-reference related files
   - Keep navigation accurate

3. **Document Patterns**
   - Extract patterns from working code
   - Document dialog contracts
   - Create decision trees and flowcharts
   - Explain "why" not just "how"

4. **Coverage Verification**
   - Ensure all Widget API sections documented
   - Verify all field types covered
   - Check navigation completeness
   - Validate examples match current code

### When to Use

- "document this pattern"
- "create flow for X"
- "update widget API docs"
- "split this file into smaller files"
- "verify all sections are covered"
- User says trigger words: "dialog contract", "flow", "audit"

### What NOT to Do

- ❌ Don't modify actual widget code
- ❌ Don't update inspector/toolbar/core files
- ❌ Don't implement features
- ❌ Focus on docs, not implementation

### Handoff to Implementation Agent

When user asks to:

- Implement a documented pattern
- Create actual widget from flow
- Update infrastructure code
- Fix bugs in working code
- Deploy or test changes

**Handoff message**: "This requires implementation. Passing to Implementation Agent with context: [summary]"

---

## 💻 Implementation Agent

**Primary Focus**: Actual code (widgets, core, infrastructure)

### Responsibilities

1. **Widget Development**
   - Create new widget files in `www/canvas-ui/widgets/`
   - Follow patterns from flow documentation
   - Implement `getMetadata()` with `customFields`
   - Follow BaseWidget structure (mount/unmount/updateConfig)

2. **Infrastructure Updates**
   - Update core files (widget-registry.js, entity-manager.js, etc.)
   - Modify inspector/toolbar/canvas-core
   - Implement new features in infrastructure
   - Performance optimizations

3. **Integration & Testing**
   - Register widgets in manifest
   - Test end-to-end flows
   - Debug runtime issues
   - Deploy to production (`scp` to server)

4. **Code Alignment**
   - Ensure code matches flow documentation
   - Implement documented patterns
   - Fix mismatches between docs and code
   - Validate infrastructure readiness

### When to Use

- "create a widget for X"
- "implement this feature"
- "fix the inspector bug"
- "deploy to server"
- "update widget-factory to support Y"
- "make the needed changes"

### What NOT to Do

- ❌ Don't modify flow files unless fixing errors
- ❌ Don't restructure documentation
- ❌ Don't create new INDEX.md files
- ❌ Focus on code, not docs

### Handoff to Documentation Agent

When user asks to:

- Document a new pattern you implemented
- Create flow files for new feature
- Update reference documentation
- Split documentation files
- Verify documentation coverage

**Handoff message**: "This requires documentation. Passing to Documentation Agent with context: [summary]"

---

## 🔄 Collaboration Patterns

### Pattern 1: Feature Development

```
Documentation Agent → Implementation Agent → Documentation Agent
      ↓                      ↓                        ↓
  Create flow         Implement code          Document changes
```

### Pattern 2: Bug Fix

```
Implementation Agent → Documentation Agent (if pattern changed)
      ↓                        ↓
   Fix code            Update affected flows
```

### Pattern 3: New Widget

```
Documentation Agent → Implementation Agent
      ↓                      ↓
Review widget-dev      Create widget using
   flow files             documented pattern
```

### Pattern 4: Infrastructure Change

```
Implementation Agent → Documentation Agent → Implementation Agent
      ↓                        ↓                      ↓
  Make change          Update flows to       Verify code matches
                       reflect change         updated docs
```

---

## 🎯 Current State Summary

**Documentation** (45 files, ~7200 lines):

- ✅ Widget API complete (13 files)
- ✅ Widget Development complete (21 files)
- ✅ Canvas Flow complete (11 files)
- ✅ All navigation linked

**Implementation**:

- ✅ BaseWidget ready
- ✅ WidgetRegistry ready (calls `getMetadata()`)
- ✅ Inspector ready (reads `customFields`)
- ✅ EntityManager ready
- ✅ WidgetFactory ready
- ✅ Auto-registration for toolbar library

**Ready for**: New widget creation following documented patterns

---

## 📋 Quick Reference

### Documentation Agent Tasks

- Flow file creation/updates
- Documentation splitting
- Navigation linking
- Coverage verification
- Pattern extraction

### Implementation Agent Tasks

- Widget creation
- Core updates
- Bug fixes
- Testing
- Deployment

### Context Sharing

Both agents should reference:

- Latest backup location
- Current documentation state
- Infrastructure readiness status
- Active work items in todo list

---

## 🚀 Starting a New Widget

1. **User request**: "Create a clock widget"

2. **Documentation Agent**:
   - Reviews widget-dev flow files
   - Confirms patterns are documented
   - Hands off to Implementation Agent

3. **Implementation Agent**:
   - Creates `www/canvas-ui/widgets/clock-widget.js`
   - Implements following documented pattern
   - Registers in widget manifest
   - Tests on canvas

4. **Documentation Agent** (if needed):
   - Documents any new patterns discovered
   - Updates examples if helpful

---

## 💡 Notes

- Documentation Agent should NEVER modify code files
- Implementation Agent should focus on code, light doc touches only
- Both agents share todo list for tracking work
- Both agents can create backups before major changes
- Context from copilot-instructions.md applies to both
