/**
 * Auto-Trigger Generation
 * 
 * Automatically generates flow triggers based on node connections.
 * Eliminates manual trigger configuration by analyzing the flow structure.
 */

import type { Node } from 'reactflow';
import type { FlowDefinition, FlowTriggerConfig } from '../types/flow';

/**
 * Analyze a flow and generate required triggers automatically
 * 
 * Rules:
 * - widget-property nodes with runtime.* properties → widget-change trigger
 * - entity-state nodes → entity-change trigger
 * - canvas-variable nodes → variable-change trigger
 * 
 * @param flow - Flow definition to analyze
 * @returns Array of auto-generated triggers
 */
export function generateAutoTriggers(flow: FlowDefinition): FlowTriggerConfig[] {
  if (import.meta.env.DEV) console.log('[AutoTrigger] Scanning flow:', flow.name, 'with', flow.nodes.length, 'nodes');
  
  const triggers: FlowTriggerConfig[] = [];
  const processedNodes = new Set<string>(); // Avoid duplicate triggers
  
  flow.nodes.forEach((node: Node) => {
    const nodeId = node.id;
    const nodeType = node.type;
    const nodeData = node.data as any;
    
    if (import.meta.env.DEV) console.log('[AutoTrigger] Checking node:', {
      id: nodeId,
      type: nodeType,
      data: nodeData,
      config: nodeData?.config
    });
    
    // Skip if already processed
    if (processedNodes.has(nodeId)) return;
    
    // React Flow wraps all custom nodes in 'custom-node' type
    // The actual node type is stored in data.nodeType
    const actualNodeType = nodeData?.nodeType || nodeType;
    
    if (import.meta.env.DEV) console.log('[AutoTrigger] Actual node type:', actualNodeType);
    
    switch (actualNodeType) {
      case 'widget-property': {
        const widgetId = nodeData?.config?.widgetId || nodeData?.config?.widget_id;
        const property = nodeData?.config?.property;
        
        if (import.meta.env.DEV) console.log('[AutoTrigger] widget-property node found:', { widgetId, property });
        
        if (!widgetId || !property) {
          console.warn('[AutoTrigger] Missing widgetId or property:', { widgetId, property });
          break;
        }
        
        // Only create triggers for runtime properties (live values that change)
        if (property.startsWith('runtime.')) {
          // Check if trigger already exists
          if (!triggers.some(t => 
            t.type === 'widget-change' && 
            t.config?.widgetId === widgetId && 
            t.config?.property === property
          )) {
            triggers.push({
              type: 'widget-change',
              config: {
                widgetId,
                property,
              },
            });
            
            console.log(`[AutoTrigger] ✅ Generated widget-change trigger: ${widgetId}.${property}`);
          }
          
          processedNodes.add(nodeId);
        } else {
          if (import.meta.env.DEV) console.log('[AutoTrigger] Property is not runtime, skipping:', property);
        }
        break;
      }
      
      case 'entity-state': {
        const entityId = nodeData?.config?.entityId;
        
        if (!entityId) break;
        
        // Check if trigger already exists
        if (!triggers.some(t => 
          t.type === 'entity-change' && 
          t.config?.entityId === entityId
        )) {
          triggers.push({
            type: 'entity-change',
            config: {
              entityId,
            },
          });
          
          if (import.meta.env.DEV) console.log(`[AutoTrigger] Generated entity-change trigger: ${entityId}`);
        }
        
        processedNodes.add(nodeId);
        break;
      }
      
      case 'canvas-variable': {
        const variableName = nodeData?.config?.variableName;
        
        if (!variableName) break;
        
        // Check if trigger already exists
        if (!triggers.some(t => 
          t.type === 'variable-change' && 
          t.config?.variableName === variableName
        )) {
          triggers.push({
            type: 'variable-change',
            config: {
              variableName,
            },
          });
          
          if (import.meta.env.DEV) console.log(`[AutoTrigger] Generated variable-change trigger: ${variableName}`);
        }
        
        processedNodes.add(nodeId);
        break;
      }
    }
  });
  
  // Always keep manual triggers if they exist
  const manualTriggers = flow.triggers.filter(t => t.type === 'manual' || t.type === 'time-interval');
  
  if (import.meta.env.DEV) console.log(`[AutoTrigger] Generated ${triggers.length} auto-trigger(s), keeping ${manualTriggers.length} manual trigger(s)`);
  
  return [...triggers, ...manualTriggers];
}

/**
 * Get available properties for a widget based on its type
 * Used for smart property dropdowns in node configuration
 */
export function getWidgetProperties(widgetType: string): Array<{ value: string; label: string; description: string }> {
  const commonConfigProps = [
    { value: 'config.width', label: 'Width', description: 'Widget width in pixels' },
    { value: 'config.height', label: 'Height', description: 'Widget height in pixels' },
    { value: 'config.x', label: 'X Position', description: 'Horizontal position' },
    { value: 'config.y', label: 'Y Position', description: 'Vertical position' },
  ];
  
  // Widget-specific properties
  const specificProps: Record<string, Array<{ value: string; label: string; description: string }>> = {
    slider: [
      { value: 'runtime.value', label: 'Current Value (Live)', description: 'Live slider value (changes as user drags)' },
      { value: 'config.min', label: 'Minimum', description: 'Minimum slider value' },
      { value: 'config.max', label: 'Maximum', description: 'Maximum slider value' },
      { value: 'config.step', label: 'Step', description: 'Slider step increment' },
    ],
    text: [
      { value: 'config.text', label: 'Text Content', description: 'Display text' },
      { value: 'config.fontSize', label: 'Font Size', description: 'Text size in pixels' },
      { value: 'config.color', label: 'Color', description: 'Text color' },
    ],
    switch: [
      { value: 'runtime.value', label: 'Switch State (Live)', description: 'Current on/off state' },
      { value: 'config.entity_id', label: 'Entity ID', description: 'Bound entity' },
    ],
    inputtext: [
      { value: 'runtime.value', label: 'Input Value (Live)', description: 'Current text input value' },
      { value: 'config.placeholder', label: 'Placeholder', description: 'Placeholder text' },
    ],
    gauge: [
      { value: 'runtime.value', label: 'Gauge Value (Live)', description: 'Current gauge reading' },
      { value: 'config.min', label: 'Minimum', description: 'Gauge minimum value' },
      { value: 'config.max', label: 'Maximum', description: 'Gauge maximum value' },
    ],
    knob: [
      { value: 'runtime.value', label: 'Knob Value (Live)', description: 'Current knob position' },
      { value: 'config.min', label: 'Minimum', description: 'Knob minimum value' },
      { value: 'config.max', label: 'Maximum', description: 'Knob maximum value' },
    ],
    colorpicker: [
      { value: 'runtime.value', label: 'Selected Color (Hex)', description: 'Current color as hex string, e.g. #ff8000' },
      { value: 'config.entity_id', label: 'Entity ID', description: 'Bound light or entity' },
    ],
  };
  
  return [
    ...(specificProps[widgetType] || []),
    ...commonConfigProps,
  ];
}
