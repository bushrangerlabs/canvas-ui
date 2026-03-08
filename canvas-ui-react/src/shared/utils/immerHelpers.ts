/**
 * Immer utilities for immutable state updates
 * 
 * Provides cleaner, safer state mutations using Immer's draft pattern
 */

import type { Draft } from 'immer';
import { produce } from 'immer';
import type { CanvasConfig, ViewConfig, WidgetConfig } from '../types';

/**
 * Update widget config immutably
 */
export function updateWidgetConfig(
  config: CanvasConfig,
  widgetId: string,
  changes: Partial<WidgetConfig>
): CanvasConfig {
  return produce(config, (draft: Draft<CanvasConfig>) => {
    for (const view of draft.views) {
      const widget = view.widgets.find((w: Draft<WidgetConfig>) => w.id === widgetId);
      if (widget) {
        Object.assign(widget.config, changes);
        break;
      }
    }
  });
}

/**
 * Add widget to view
 */
export function addWidget(
  config: CanvasConfig,
  viewId: string,
  widget: WidgetConfig
): CanvasConfig {
  return produce(config, (draft: Draft<CanvasConfig>) => {
    const view = draft.views.find((v: Draft<ViewConfig>) => v.id === viewId);
    if (view) {
      view.widgets.push(widget as Draft<WidgetConfig>);
    }
  });
}

/**
 * Remove widget from view
 */
export function removeWidget(
  config: CanvasConfig,
  widgetId: string
): CanvasConfig {
  return produce(config, (draft: Draft<CanvasConfig>) => {
    for (const view of draft.views) {
      const index = view.widgets.findIndex((w: Draft<WidgetConfig>) => w.id === widgetId);
      if (index !== -1) {
        view.widgets.splice(index, 1);
        break;
      }
    }
  });
}

/**
 * Update widget position
 */
export function updateWidgetPosition(
  config: CanvasConfig,
  widgetId: string,
  position: { x: number; y: number; width: number; height: number }
): CanvasConfig {
  return produce(config, (draft: Draft<CanvasConfig>) => {
    for (const view of draft.views) {
      const widget = view.widgets.find((w: Draft<WidgetConfig>) => w.id === widgetId);
      if (widget) {
        widget.position.x = position.x;
        widget.position.y = position.y;
        widget.position.width = position.width;
        widget.position.height = position.height;
        break;
      }
    }
  });
}

/**
 * Duplicate widget
 */
export function duplicateWidget(
  config: CanvasConfig,
  widgetId: string,
  offset: { x: number; y: number } = { x: 20, y: 20 }
): CanvasConfig {
  return produce(config, (draft: Draft<CanvasConfig>) => {
    for (const view of draft.views) {
      const widget = view.widgets.find((w: Draft<WidgetConfig>) => w.id === widgetId);
      if (widget) {
        const newWidget = {
          ...widget,
          id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          position: {
            ...widget.position,
            x: widget.position.x + offset.x,
            y: widget.position.y + offset.y,
          },
        };
        view.widgets.push(newWidget as Draft<WidgetConfig>);
        break;
      }
    }
  });
}

/**
 * Update view settings
 */
export function updateViewSettings(
  config: CanvasConfig,
  viewId: string,
  settings: Partial<ViewConfig>
): CanvasConfig {
  return produce(config, (draft: Draft<CanvasConfig>) => {
    const view = draft.views.find((v: Draft<ViewConfig>) => v.id === viewId);
    if (view) {
      Object.assign(view, settings);
    }
  });
}

/**
 * Bulk update widgets
 */
export function bulkUpdateWidgets(
  config: CanvasConfig,
  updates: Array<{ widgetId: string; changes: Partial<WidgetConfig> }>
): CanvasConfig {
  return produce(config, (draft: Draft<CanvasConfig>) => {
    for (const { widgetId, changes } of updates) {
      for (const view of draft.views) {
        const widget = view.widgets.find((w: Draft<WidgetConfig>) => w.id === widgetId);
        if (widget) {
          Object.assign(widget.config, changes);
          break;
        }
      }
    }
  });
}
