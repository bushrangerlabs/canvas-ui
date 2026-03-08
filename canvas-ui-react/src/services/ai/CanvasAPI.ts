/**
 * Canvas API - JavaScript API for AI-generated code
 * Provides a clean, chainable interface for widget/view manipulation
 */

import { WIDGET_REGISTRY } from '../../shared/registry/widgetRegistry';
import type { ViewConfig, WidgetConfig } from '../../shared/types';
import type { WidgetMetadata } from '../../shared/types/metadata';

export interface CanvasAPIContext {
  currentViewId: string | null;
  addWidget: (viewId: string, widget: WidgetConfig) => void;
  updateWidget: (viewId: string, widgetId: string, updates: Partial<WidgetConfig>) => void;
  deleteWidget: (viewId: string, widgetId: string) => void;
  addView: (view: ViewConfig) => void;
  updateView: (viewId: string, updates: Partial<ViewConfig>) => void;
  getView: (viewId: string) => ViewConfig | undefined;
  config: any; // Full config access
}

export class CanvasAPI {
  private context: CanvasAPIContext;
  private createdWidgets: WidgetConfig[] = [];

  constructor(context: CanvasAPIContext) {
    this.context = context;
  }

  /**
   * Generate unique widget ID
   */
  private generateId(prefix: string = 'ai'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique widget name based on type and existing widgets
   */
  private generateWidgetName(type: string): string {
    // Get all existing widgets from all views
    const allWidgets: WidgetConfig[] = [];
    if (this.context.config?.views) {
      this.context.config.views.forEach((view: ViewConfig) => {
        if (view.widgets) {
          allWidgets.push(...view.widgets);
        }
      });
    }

    // Get existing names
    const existingNames = new Set(allWidgets.map(w => w.name).filter(Boolean));

    // Generate name with counter (e.g., button_1, button_2, etc.)
    let counter = 1;
    let name = `${type}_${counter}`;
    while (existingNames.has(name)) {
      counter++;
      name = `${type}_${counter}`;
    }

    return name;
  }

  /**
   * Get widget metadata from registry
   */
  private getWidgetMetadata(type: string): WidgetMetadata | null {
    return WIDGET_REGISTRY[type] || null;
  }

  /**
   * Apply default config from widget metadata
   */
  private applyDefaults(type: string, config: Record<string, any>): Record<string, any> {
    const metadata = this.getWidgetMetadata(type);
    if (!metadata) return config;

    const defaults: Record<string, any> = {};
    metadata.fields.forEach(field => {
      if (field.default !== undefined && config[field.name] === undefined) {
        defaults[field.name] = field.default;
      }
    });

    return { ...defaults, ...config };
  }

  /**
   * Create a new widget
   * @param type Widget type (e.g., 'button', 'gauge', 'text')
   * @param config Widget configuration
   * @param position Optional position {x, y, width, height}
   * @returns Widget config for reference
   */
  addWidget(
    type: string,
    config: Record<string, any>,
    position?: { x: number; y: number; width?: number; height?: number }
  ): WidgetConfig {
    if (!this.context.currentViewId) {
      throw new Error('No active view. Use createView() first.');
    }

    // Validate widget type exists
    const metadata = this.getWidgetMetadata(type);
    if (!metadata) {
      const available = Object.keys(WIDGET_REGISTRY).join(', ');
      throw new Error(`Unknown widget type: ${type}. Available: ${available}`);
    }

    // Apply metadata defaults
    const configWithDefaults = this.applyDefaults(type, config);

    // Use metadata default size if not specified
    const defaultSize = metadata.defaultSize || { w: 200, h: 100 };
    const finalPosition = {
      x: position?.x ?? 0,
      y: position?.y ?? 0,
      width: position?.width ?? defaultSize.w,
      height: position?.height ?? defaultSize.h,
      zIndex: 1,
    };

    const widget: WidgetConfig = {
      id: this.generateId(type),
      type,
      name: this.generateWidgetName(type), // Auto-generate unique name
      position: finalPosition,
      config: configWithDefaults,
      bindings: {},
    };

    this.context.addWidget(this.context.currentViewId, widget);
    this.createdWidgets.push(widget);

    return widget;
  }

  /**
   * Update existing widget
   * @param widgetId Widget ID to update
   * @param updates Partial updates to apply
   */
  updateWidget(widgetId: string, updates: Partial<WidgetConfig>): void {
    if (!this.context.currentViewId) {
      throw new Error('No active view');
    }

    this.context.updateWidget(this.context.currentViewId, widgetId, updates);
  }

  /**
   * Delete widget
   * @param widgetId Widget ID to delete
   */
  deleteWidget(widgetId: string): void {
    if (!this.context.currentViewId) {
      throw new Error('No active view');
    }

    this.context.deleteWidget(this.context.currentViewId, widgetId);
  }

  /**
   * Get all created widgets (from this API session)
   */
  getCreatedWidgets(): WidgetConfig[] {
    return this.createdWidgets;
  }

  /**
   * Clear created widgets cache
   */
  clearCreatedWidgets(): void {
    this.createdWidgets = [];
  }

  /**
   * Auto-layout widgets in a grid
   * @param widgets Widgets to layout
   * @param columns Number of columns (default: 3)
   * @param startX Starting X position (default: 20)
   * @param startY Starting Y position (default: 20)
   * @param gapX Horizontal gap between widgets (default: 20)
   * @param gapY Vertical gap between widgets (default: 20)
   */
  gridLayout(
    widgets: WidgetConfig[],
    columns: number = 3,
    startX: number = 20,
    startY: number = 20,
    gapX: number = 20,
    gapY: number = 20
  ): void {
    let row = 0;
    let col = 0;
    let maxHeightInRow = 0;
    let currentY = startY;

    widgets.forEach((widget) => {
      const x = startX + col * (widget.position.width + gapX);
      const y = currentY;

      this.updateWidget(widget.id, {
        position: {
          ...widget.position,
          x,
          y,
        },
      });

      maxHeightInRow = Math.max(maxHeightInRow, widget.position.height);

      col++;
      if (col >= columns) {
        col = 0;
        row++;
        currentY += maxHeightInRow + gapY;
        maxHeightInRow = 0;
      }
    });
  }

  /**
   * Create vertical stack layout
   * @param widgets Widgets to layout
   * @param startX Starting X position (default: 20)
   * @param startY Starting Y position (default: 20)
   * @param gap Gap between widgets (default: 10)
   */
  verticalStack(
    widgets: WidgetConfig[],
    startX: number = 20,
    startY: number = 20,
    gap: number = 10
  ): void {
    let currentY = startY;

    widgets.forEach((widget) => {
      this.updateWidget(widget.id, {
        position: {
          ...widget.position,
          x: startX,
          y: currentY,
        },
      });

      currentY += widget.position.height + gap;
    });
  }

  /**
   * Create horizontal stack layout
   * @param widgets Widgets to layout
   * @param startX Starting X position (default: 20)
   * @param startY Starting Y position (default: 20)
   * @param gap Gap between widgets (default: 10)
   */
  horizontalStack(
    widgets: WidgetConfig[],
    startX: number = 20,
    startY: number = 20,
    gap: number = 10
  ): void {
    let currentX = startX;

    widgets.forEach((widget) => {
      this.updateWidget(widget.id, {
        position: {
          ...widget.position,
          x: currentX,
          y: startY,
        },
      });

      currentX += widget.position.width + gap;
    });
  }

  /**
   * Get list of available widget types
   */
  getAvailableWidgets(): string[] {
    return Object.keys(WIDGET_REGISTRY);
  }

  /**
   * Get widget metadata (for AI reference)
   */
  getWidgetInfo(type: string): WidgetMetadata | null {
    return this.getWidgetMetadata(type);
  }

  /**
   * Create a new view
   * @param name View name
   * @param style Optional view style
   * @returns View ID
   */
  createView(
    name: string,
    style?: { backgroundColor?: string; backgroundOpacity?: number; backgroundImage?: string }
  ): string {
    const viewId = this.generateId('view');
    const view: ViewConfig = {
      id: viewId,
      name,
      style: {
        backgroundColor: style?.backgroundColor ?? '#1a1a1a',
        backgroundOpacity: style?.backgroundOpacity ?? 1,
        backgroundImage: style?.backgroundImage,
      },
      widgets: [],
    };

    this.context.addView(view);
    return viewId;
  }

  /**
   * Update view settings
   * @param viewId View ID (optional, uses current view if not specified)
   * @param updates Partial view updates
   */
  updateView(viewId?: string, updates?: Partial<ViewConfig>): void {
    const targetViewId = viewId || this.context.currentViewId;
    if (!targetViewId) {
      throw new Error('No view specified');
    }

    this.context.updateView(targetViewId, updates || {});
  }

  /**
   * Get current view ID
   */
  getCurrentViewId(): string | null {
    return this.context.currentViewId;
  }

  /**
   * Get view configuration
   */
  getView(viewId?: string): ViewConfig | undefined {
    const targetViewId = viewId || this.context.currentViewId;
    if (!targetViewId) return undefined;

    return this.context.getView(targetViewId);
  }

  /**
   * Capture current canvas state for AI context
   * ONLY captures current view widgets (not all views)
   */
  captureState(): CanvasState {
    const view = this.getView();
    if (!view) {
      console.warn('[CanvasAPI] captureState: No current view found');
      return {
        widgets: [],
        widgetCount: 0,
        isEmpty: true,
        layout: {
          pattern: 'empty',
          spacing: 'none',
          alignment: 'none'
        },
        currentViewId: undefined,
        viewWidth: 1920,
        viewHeight: 1080
      };
    }

    const widgets = view.widgets.map(w => ({
      id: w.id,
      type: w.type,
      x: w.position.x,
      y: w.position.y,
      width: w.position.width,
      height: w.position.height,
      config: w.config
    }));

    console.log(`[CanvasAPI] captureState: View "${view.name}" (${view.id}) has ${widgets.length} widgets`);

    return {
      widgets,
      widgetCount: widgets.length,
      isEmpty: widgets.length === 0,
      layout: this.analyzeLayout(widgets),
      currentViewId: view.id,
      viewWidth: 1920,  // Default canvas dimensions
      viewHeight: 1080
    };
  }

  /**
   * Analyze layout pattern from widget positions
   */
  private analyzeLayout(widgets: CanvasWidget[]): LayoutAnalysis {
    if (widgets.length === 0) return { pattern: 'empty', spacing: 'none', alignment: 'none' };
    if (widgets.length === 1) return { pattern: 'single', spacing: 'none', alignment: 'none' };

    // Check for vertical stack (similar X positions)
    const xPositions = widgets.map(w => w.x);
    const xVariance = this.calculateVariance(xPositions);
    
    if (xVariance < 100) { // Similar X positions
      const sorted = [...widgets].sort((a, b) => a.y - b.y);
      const spacing = this.analyzeSpacing(sorted, 'y');
      return { pattern: 'vertical-stack', spacing, alignment: 'left' };
    }

    // Check for horizontal row (similar Y positions)
    const yPositions = widgets.map(w => w.y);
    const yVariance = this.calculateVariance(yPositions);
    
    if (yVariance < 100) { // Similar Y positions
      const sorted = [...widgets].sort((a, b) => a.x - b.x);
      const spacing = this.analyzeSpacing(sorted, 'x');
      return { pattern: 'horizontal-row', spacing, alignment: 'top' };
    }

    // Check for grid
    const uniqueX = new Set(widgets.map(w => Math.round(w.x / 50) * 50)).size;
    const uniqueY = new Set(widgets.map(w => Math.round(w.y / 50) * 50)).size;
    
    if (uniqueX >= 2 && uniqueY >= 2) {
      return { pattern: 'grid', spacing: 'varied', alignment: 'mixed' };
    }

    return { pattern: 'custom', spacing: 'varied', alignment: 'mixed' };
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private analyzeSpacing(sorted: CanvasWidget[], axis: 'x' | 'y'): string {
    if (sorted.length < 2) return 'none';

    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      const gap = axis === 'x'
        ? curr.x - (prev.x + prev.width)
        : curr.y - (prev.y + prev.height);
      gaps.push(gap);
    }

    const avgGap = gaps.reduce((sum, g) => sum + g, 0) / gaps.length;
    const consistent = gaps.every(g => Math.abs(g - avgGap) < 20);

    if (consistent) {
      return avgGap < 15 ? 'tight' : avgGap < 30 ? 'normal' : 'loose';
    }
    return 'varied';
  }

  /**
   * Calculate pixel position from grid coordinates
   * Helper for Stage 2 (Planning) to convert grid layout to absolute pixels
   * 
   * @param gridRow - Row number (1-based)
   * @param gridCol - Column number (1-based)
   * @param layout - Layout config {columns, spacing, padding, cellWidth?, cellHeight?}
   * @returns Object with x, y pixel coordinates
   */
  calculateGridPosition(
    gridRow: number,
    gridCol: number,
    layout: {
      columns: number;
      spacing?: number;
      padding?: number;
      cellWidth?: number;
      cellHeight?: number;
    }
  ): { x: number; y: number } {
    const { columns, spacing = 10, padding = 10, cellWidth = 150, cellHeight = 80 } = layout;

    // Calculate position (1-based grid)
    const col = ((gridCol - 1) % columns);
    const row = Math.floor((gridCol - 1) / columns) + (gridRow - 1);

    const x = padding + col * (cellWidth + spacing);
    const y = padding + row * (cellHeight + spacing);

    return { x, y };
  }
}

interface CanvasWidget {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  config: Record<string, any>;
}

interface CanvasState {
  widgets: CanvasWidget[];
  widgetCount: number;
  isEmpty: boolean;
  layout: LayoutAnalysis;
  currentViewId?: string;
  viewWidth?: number;
  viewHeight?: number;
}

interface LayoutAnalysis {
  pattern: string;
  spacing: string;
  alignment: string;
}

/**
 * Create Canvas API instance for code execution context
 */
export function createCanvasAPI(context: CanvasAPIContext): CanvasAPI {
  return new CanvasAPI(context);
}
