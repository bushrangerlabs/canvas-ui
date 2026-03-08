/**
 * View Export/Import Utilities
 * 
 * Handles exporting views to JSON files and importing them back with ID regeneration.
 * Views are UI-only (no flow logic) for clean separation of concerns.
 */

import type { ViewConfig, WidgetConfig } from '../types';

/**
 * Generate a unique ID for widgets, views, and flows
 */
const generateUniqueId = (prefix: string = 'widget'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

/**
 * Generate a descriptive name for a widget based on its type and config
 */
const generateWidgetName = (widget: WidgetConfig): string => {
  const type = widget.type.charAt(0).toUpperCase() + widget.type.slice(1);
  
  // Extract meaningful identifiers from config
  const config = widget.config;
  
  // Try to get a label or entity_id for better naming
  if (config.label) {
    return `${config.label} ${type}`;
  }
  
  if (config.entity_id) {
    const entityName = config.entity_id.split('.')[1]?.replace(/_/g, ' ');
    if (entityName) {
      return `${entityName.charAt(0).toUpperCase() + entityName.slice(1)} ${type}`;
    }
  }
  
  // Fallback to type-based names
  return type;
};

/**
 * Export view data structure (UI only)
 */
export interface ExportedView {
  version: string;
  exportedAt: string;
  view: ViewConfig;
  metadata: {
    widgetCount: number;
    exportedFrom: string;
    // AI Builder extensions (optional)
    editMode?: 'update' | 'add' | 'replace';
    targetWidgetIds?: string[];
    widgetUpdates?: Record<string, Partial<WidgetConfig>>;
    generatedAt?: string;
  };
}

/**
 * Export a view to JSON format (UI only, no flows)
 */
export const exportView = (view: ViewConfig): ExportedView => {
  return {
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    view,
    metadata: {
      widgetCount: view.widgets.length,
      exportedFrom: window.location.hostname || 'canvas-ui',
    },
  };
};

/**
 * Download exported view as JSON file
 */
export const downloadViewAsJson = (view: ViewConfig): void => {
  const exportData = exportView(view);
  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `canvas-ui-view-${view.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Validate imported view data
 */
export const validateImportedView = (data: any): { valid: boolean; error?: string } => {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid JSON data' };
  }
  
  if (!data.view) {
    return { valid: false, error: 'Missing view data' };
  }
  
  if (!data.view.id || !data.view.name || !Array.isArray(data.view.widgets)) {
    return { valid: false, error: 'Invalid view structure' };
  }
  
  return { valid: true };
};

/**
 * Normalize widget structure (handle old format with x/y/width/height at root)
 */
const normalizeWidget = (widget: any): WidgetConfig => {
  // If widget has x, y, width, height at root level (old format), move to position
  if ('x' in widget && 'y' in widget && 'width' in widget && 'height' in widget) {
    const { x, y, width, height, ...rest } = widget;
    return {
      ...rest,
      position: {
        x: x ?? 0,
        y: y ?? 0,
        width: width ?? 100,
        height: height ?? 100,
      },
    } as WidgetConfig;
  }
  
  // Already in correct format
  return widget as WidgetConfig;
};

/**
 * Import a view from exported JSON with ID regeneration
 */
export const importView = (
  exportedData: ExportedView,
  existingViewIds: string[]
): {
  view: ViewConfig;
  idMap: { widgets: Record<string, string> };
} => {
  // Create ID mappings (old ID -> new ID)
  const widgetIdMap: Record<string, string> = {};
  
  // Generate new view ID if it conflicts
  let newViewId = exportedData.view.id;
  if (existingViewIds.includes(newViewId)) {
    newViewId = generateUniqueId('view');
  }
  
  // Generate new widget IDs and normalize structure
  const newWidgets: WidgetConfig[] = exportedData.view.widgets.map(widget => {
    const newId = generateUniqueId('widget');
    widgetIdMap[widget.id] = newId;
    
    // Normalize widget structure (handle old format)
    const normalized = normalizeWidget(widget);
    
    // Generate name if not provided (AI should provide it, but fallback for safety)
    const name = normalized.name || generateWidgetName(normalized);
    
    return {
      ...normalized,
      id: newId,
      name,
    };
  });
  
  // Normalize view structure (handle old backgroundColor at root)
  const viewStyle = exportedData.view.style || {
    backgroundColor: (exportedData.view as any).backgroundColor || '#1a1a2e',
  };
  
  // Create new view with regenerated IDs
  const newView: ViewConfig = {
    ...exportedData.view,
    id: newViewId,
    name: existingViewIds.includes(exportedData.view.id) 
      ? `${exportedData.view.name} (Imported)` 
      : exportedData.view.name,
    style: viewStyle,
    widgets: newWidgets,
  };
  
  return {
    view: newView,
    idMap: {
      widgets: widgetIdMap,
    },
  };
};

/**
 * Read and parse JSON file from file input
 */
export const readJsonFile = (file: File): Promise<ExportedView> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        const validation = validateImportedView(json);
        
        if (!validation.valid) {
          reject(new Error(validation.error));
          return;
        }
        
        resolve(json);
      } catch (error) {
        reject(new Error('Failed to parse JSON file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
};
