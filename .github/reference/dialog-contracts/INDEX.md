# Dialog Contracts - Knowledge Graph Entry Point

Start here to understand the Canvas UI dialog system.

## Core Concepts

- [lifecycle.md](lifecycle.md) - How all dialogs work (construct → show → interact → close)
- [patterns.md](patterns.md) - 4 standard patterns dialogs follow
- [dependencies.md](dependencies.md) - What each dialog needs to function

## Individual Dialogs

- [entity-picker.md](entity-picker.md) - Entity selection
- [binding-editor.md](binding-editor.md) - Binding expressions
- [border-editor.md](border-editor.md) - Border properties
- [shadow-editor.md](shadow-editor.md) - Box shadow
- [icon-picker-simple.md](icon-picker-simple.md) - Icon selection (no color)
- [font-picker.md](font-picker.md) - Font selection
- [visibility-condition.md](visibility-condition.md) - Visibility conditions
- [file-manager.md](file-manager.md) - File management (utility)

## Patterns

- [pattern-simple-picker.md](pattern-simple-picker.md) - Pattern 1: `(callback)`
- [pattern-editor-current-value.md](pattern-editor-current-value.md) - Pattern 2: `(currentValue, callback)`
- [pattern-entity-aware-picker.md](pattern-entity-aware-picker.md) - Pattern 3: `(entityManager, callback)`
- [pattern-entity-aware-editor.md](pattern-entity-aware-editor.md) - Pattern 4: `(entityManager, currentValue, callback)`

## Integration

- [integration-inspector-integration.md](integration-inspector-integration.md) - How inspector uses dialogs
- [integration-canvas-ui-dependencies.md](integration-canvas-ui-dependencies.md) - How to access EntityManager, FileService, etc.
- [integration-field-types.md](integration-field-types.md) - Field type → dialog mapping
- [integration-callback-patterns.md](integration-callback-patterns.md) - Standard callback usage

## Detailed Flows

- [flow-constructor-show-close.md](flow-constructor-show-close.md) - Dialog lifecycle flow
- [flow-parse-render-interact.md](flow-parse-render-interact.md) - Data flow through dialog
- [flow-nested-dialogs.md](flow-nested-dialogs.md) - Dialogs opening other dialogs
- [flow-error-handling.md](flow-error-handling.md) - Error and validation flow

## Supporting Concepts

- [concept-atomic-properties.md](concept-atomic-properties.md) - Why atomic properties matter
- [concept-z-index-stacking.md](concept-z-index-stacking.md) - Dialog layering
- [concept-state-management.md](concept-state-management.md) - Internal state handling

## Widget API

- [widget-api-INDEX.md](widget-api-INDEX.md) - Widget API documentation (universal inspector structure)

## Canvas Lifecycle

- [canvas-flow-widget-registration.md](canvas-flow-widget-registration.md) - Widget registration & loading
- [canvas-flow-toolbar-loading.md](canvas-flow-toolbar-loading.md) - Toolbar population
- [canvas-flow-widget-creation.md](canvas-flow-widget-creation.md) - Widget creation pipeline
- [canvas-flow-widget-rendering.md](canvas-flow-widget-rendering.md) - Render & update
- [canvas-flow-widget-dragging.md](canvas-flow-widget-dragging.md) - Drag operations
- [canvas-flow-widget-resizing.md](canvas-flow-widget-resizing.md) - Resize handles
- [canvas-flow-widget-selection.md](canvas-flow-widget-selection.md) - Selection system
- [canvas-flow-widget-deletion.md](canvas-flow-widget-deletion.md) - Widget removal
- [canvas-flow-save-load.md](canvas-flow-save-load.md) - Persistence
- [canvas-flow-undo-redo.md](canvas-flow-undo-redo.md) - Undo/redo
- [canvas-flow-inspector-updates.md](canvas-flow-inspector-updates.md) - Inspector ⇄ canvas sync

## Widget Development

- [widget-dev-INDEX.md](widget-dev-INDEX.md) - **START HERE** - Complete widget development guide
- [widget-dev-class-structure.md](widget-dev-class-structure.md) - Widget file anatomy
- [widget-dev-metadata.md](widget-dev-metadata.md) - getMetadata() and customFields
- [widget-dev-lifecycle.md](widget-dev-lifecycle.md) - mount(), unmount(), updateConfig()
- [widget-dev-entity-bindings.md](widget-dev-entity-bindings.md) - Entity subscriptions
- [widget-dev-rendering.md](widget-dev-rendering.md) - render() and updateDisplay()
- [widget-dev-complete-example.md](widget-dev-complete-example.md) - Full button widget

---

**Navigation**: This is the root - follow any link above to explore
