/**
 * Flow Export/Import Utilities
 * 
 * Handles exporting flows to JSON files and importing them back with widget dependency tracking.
 * Flows are global logic that can reference widgets across multiple views.
 */

import type { ViewConfig } from '../types';
import type { FlowDefinition } from '../types/flow';

/**
 * Generate a unique ID for flows
 */
const generateUniqueId = (prefix: string = 'flow'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

/**
 * Widget dependency information
 */
export interface WidgetDependency {
  widgetId: string;
  widgetName?: string;
  nodeId: string;
  nodeType: string;
}

/**
 * Export flow data structure
 */
export interface ExportedFlow {
  version: string;
  exportedAt: string;
  flow: FlowDefinition;
  metadata: {
    widgetDependencies: WidgetDependency[];
    nodeCount: number;
    edgeCount: number;
    triggerCount: number;
    exportedFrom: string;
  };
}

/**
 * Multiple flows export structure
 */
export interface ExportedFlows {
  version: string;
  exportedAt: string;
  flows: Record<string, FlowDefinition>;
  metadata: {
    flowCount: number;
    totalWidgetDependencies: WidgetDependency[];
    exportedFrom: string;
  };
}

/**
 * Extract widget dependencies from a flow
 */
export const extractWidgetDependencies = (
  flow: FlowDefinition,
  allViews: ViewConfig[] = []
): WidgetDependency[] => {
  const dependencies: WidgetDependency[] = [];
  
  // Create a map of widget IDs to widget names across all views
  const widgetMap = new Map<string, string>();
  allViews.forEach(view => {
    view.widgets.forEach(widget => {
      widgetMap.set(widget.id, widget.name || `Widget in ${view.name}`);
    });
  });
  
  // Scan flow nodes for widget references
  flow.nodes?.forEach(node => {
    const widgetId = node.data?.config?.widget_id;
    
    if (widgetId) {
      dependencies.push({
        widgetId,
        widgetName: widgetMap.get(widgetId),
        nodeId: node.id,
        nodeType: node.type || 'unknown',
      });
    }
  });
  
  return dependencies;
};

/**
 * Export a single flow to JSON format
 */
export const exportFlow = (
  flow: FlowDefinition,
  allViews: ViewConfig[] = []
): ExportedFlow => {
  const dependencies = extractWidgetDependencies(flow, allViews);
  
  return {
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    flow,
    metadata: {
      widgetDependencies: dependencies,
      nodeCount: flow.nodes?.length || 0,
      edgeCount: flow.edges?.length || 0,
      triggerCount: flow.triggers?.length || 0,
      exportedFrom: window.location.hostname || 'canvas-ui',
    },
  };
};

/**
 * Export all flows to JSON format
 */
export const exportAllFlows = (
  flows: Record<string, FlowDefinition>,
  allViews: ViewConfig[] = []
): ExportedFlows => {
  // Collect all widget dependencies across all flows
  const allDependencies: WidgetDependency[] = [];
  
  Object.values(flows).forEach(flow => {
    const deps = extractWidgetDependencies(flow, allViews);
    allDependencies.push(...deps);
  });
  
  // Deduplicate dependencies by widgetId
  const uniqueDependencies = Array.from(
    new Map(allDependencies.map(dep => [dep.widgetId, dep])).values()
  );
  
  return {
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    flows,
    metadata: {
      flowCount: Object.keys(flows).length,
      totalWidgetDependencies: uniqueDependencies,
      exportedFrom: window.location.hostname || 'canvas-ui',
    },
  };
};

/**
 * Download exported flow(s) as JSON file
 */
export const downloadFlowAsJson = (
  data: ExportedFlow | ExportedFlows,
  filename?: string
): void => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  
  if (filename) {
    link.download = filename;
  } else if ('flow' in data) {
    // Single flow export
    link.download = `canvas-ui-flow-${data.flow.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
  } else {
    // Multiple flows export
    link.download = `canvas-ui-flows-all-${Date.now()}.json`;
  }
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Validate imported flow data
 */
export const validateImportedFlow = (data: any): { valid: boolean; error?: string } => {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid JSON data' };
  }
  
  // Check if it's a single flow or multiple flows
  const isSingleFlow = 'flow' in data;
  const isMultipleFlows = 'flows' in data;
  
  if (!isSingleFlow && !isMultipleFlows) {
    return { valid: false, error: 'Missing flow or flows data' };
  }
  
  if (isSingleFlow) {
    if (!data.flow.id || !data.flow.name) {
      return { valid: false, error: 'Invalid flow structure (missing id or name)' };
    }
  }
  
  if (isMultipleFlows) {
    if (typeof data.flows !== 'object') {
      return { valid: false, error: 'Invalid flows structure' };
    }
  }
  
  return { valid: true };
};

/**
 * Import flow(s) from exported JSON with ID regeneration
 */
export const importFlows = (
  exportedData: ExportedFlow | ExportedFlows,
  existingFlowIds: string[]
): {
  flows: Record<string, FlowDefinition>;
  idMap: Record<string, string>;
  widgetDependencies: WidgetDependency[];
} => {
  const flowIdMap: Record<string, string> = {};
  const newFlows: Record<string, FlowDefinition> = {};
  let allDependencies: WidgetDependency[] = [];
  
  // Determine if single or multiple flows
  const flowsToImport: Record<string, FlowDefinition> = 'flow' in exportedData
    ? { [exportedData.flow.id]: exportedData.flow }
    : exportedData.flows;
  
  // Collect dependencies
  if ('flow' in exportedData) {
    allDependencies = exportedData.metadata.widgetDependencies || [];
  } else {
    allDependencies = exportedData.metadata.totalWidgetDependencies || [];
  }
  
  // Process each flow
  Object.entries(flowsToImport).forEach(([oldFlowId, flow]) => {
    // Generate new flow ID if it conflicts
    let newFlowId = oldFlowId;
    if (existingFlowIds.includes(newFlowId)) {
      newFlowId = generateUniqueId('flow');
    }
    flowIdMap[oldFlowId] = newFlowId;
    
    // Create new flow with regenerated ID
    newFlows[newFlowId] = {
      ...flow,
      id: newFlowId,
      name: existingFlowIds.includes(oldFlowId) 
        ? `${flow.name} (Imported)` 
        : flow.name,
      metadata: {
        ...flow.metadata,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    };
  });
  
  return {
    flows: newFlows,
    idMap: flowIdMap,
    widgetDependencies: allDependencies,
  };
};

/**
 * Read and parse JSON file from file input
 */
export const readJsonFile = (file: File): Promise<ExportedFlow | ExportedFlows> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        const validation = validateImportedFlow(json);
        
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
