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
/** Universal style properties writable on every widget via config.style.* */
const UNIVERSAL_STYLE_WRITABLE = [
  { value: 'config.style.backgroundColor', label: '🎨 Background Color',    description: 'Widget background color (CSS value or binding)' },
  { value: 'config.style.backgroundImage', label: '🖼️ Background Image',     description: 'CSS background-image value or URL' },
  { value: 'config.style.borderColor',     label: '🖊️ Border Color',         description: 'Border color (CSS value or binding)' },
  { value: 'config.style.borderStyle',     label: '═  Border Style',         description: 'solid | dashed | dotted | double | none' },
  { value: 'config.style.backgroundSize',  label: '⤢  Background Size',      description: 'cover | contain | 100% | auto' },
  { value: 'config.style.backgroundPosition', label: '⊹ Background Position', description: 'center | top left | 50% 50%' },
  { value: 'config.style.backgroundRepeat',   label: '⟳ Background Repeat',   description: 'no-repeat | repeat | repeat-x | repeat-y' },
];

/**
 * Returns all writable properties for a Set Widget node.
 * Includes widget-specific content props, universal style props, and layout props.
 */
export function getWritableWidgetProperties(widgetType: string): Array<{ value: string; label: string; description: string }> {
  const layoutProps = [
    { value: 'config.width',  label: 'Width',      description: 'Widget width in pixels' },
    { value: 'config.height', label: 'Height',     description: 'Widget height in pixels' },
    { value: 'config.x',     label: 'X Position', description: 'Horizontal position' },
    { value: 'config.y',     label: 'Y Position', description: 'Vertical position' },
  ];

  const specificProps: Record<string, Array<{ value: string; label: string; description: string }>> = {
    button: [
      { value: 'config.label',           label: 'Button Label',     description: 'Text shown on the button' },
      { value: 'config.backgroundColor', label: 'Background Color', description: 'Button background color' },
      { value: 'config.textColor',       label: 'Text Color',       description: 'Button label color' },
      { value: 'config.iconColor',       label: 'Icon Color',       description: 'Button icon tint color' },
      { value: 'config.icon',            label: 'Icon',             description: 'Icon identifier' },
    ],
    text: [
      { value: 'config.text',       label: 'Text Content', description: 'Display text (supports bindings)' },
      { value: 'config.fontSize',   label: 'Font Size',    description: 'Text size in pixels' },
      { value: 'config.color',      label: 'Text Color',   description: 'Text color' },
      { value: 'config.fontFamily', label: 'Font Family',  description: 'Font name' },
      { value: 'config.textAlign',  label: 'Text Align',   description: 'left | center | right' },
    ],
    value: [
      { value: 'config.entity_id', label: 'Entity ID',  description: 'Bound entity' },
      { value: 'config.unit',      label: 'Unit',       description: 'Unit suffix (e.g. °C, %)' },
      { value: 'config.fontSize',  label: 'Font Size',  description: 'Value text size' },
      { value: 'config.color',     label: 'Color',      description: 'Value text color' },
    ],
    gauge: [
      { value: 'config.entity_id', label: 'Entity ID', description: 'Bound entity (numeric)' },
      { value: 'config.min',       label: 'Minimum',   description: 'Gauge minimum' },
      { value: 'config.max',       label: 'Maximum',   description: 'Gauge maximum' },
      { value: 'config.title',     label: 'Title',     description: 'Gauge label' },
    ],
    slider: [
      { value: 'config.entity_id', label: 'Entity ID', description: 'Bound entity' },
      { value: 'config.label',     label: 'Label',     description: 'Slider label text' },
      { value: 'config.min',       label: 'Minimum',   description: 'Min value' },
      { value: 'config.max',       label: 'Maximum',   description: 'Max value' },
      { value: 'config.step',      label: 'Step',      description: 'Step increment' },
    ],
    switch: [
      { value: 'config.entity_id', label: 'Entity ID', description: 'Bound entity' },
      { value: 'config.label',     label: 'Label',     description: 'Switch label text' },
    ],
    icon: [
      { value: 'config.icon',      label: 'Icon',        description: 'Icon identifier' },
      { value: 'config.color',     label: 'Icon Color',  description: 'Icon tint color' },
      { value: 'config.iconSize',  label: 'Icon Size',   description: 'Icon size in pixels' },
      { value: 'config.entity_id', label: 'Entity ID',   description: 'Bound entity (controls active state)' },
    ],
    image: [
      { value: 'config.src',       label: 'Image URL',  description: 'Image source URL' },
      { value: 'config.entity_id', label: 'Entity ID',  description: 'Entity with entity_picture attribute' },
    ],
    inputtext: [
      { value: 'config.placeholder', label: 'Placeholder', description: 'Placeholder text' },
      { value: 'config.entity_id',   label: 'Entity ID',   description: 'Bound input_text entity' },
    ],
    progressbar: [
      { value: 'config.entity_id', label: 'Entity ID',  description: 'Bound entity' },
      { value: 'config.value',     label: 'Value',      description: 'Progress value (0–100)' },
      { value: 'config.min',       label: 'Minimum',    description: 'Min value' },
      { value: 'config.max',       label: 'Maximum',    description: 'Max value' },
      { value: 'config.color',     label: 'Bar Color',  description: 'Progress bar fill color' },
    ],
    progresscircle: [
      { value: 'config.entity_id', label: 'Entity ID',    description: 'Bound entity' },
      { value: 'config.value',     label: 'Value',        description: 'Progress value (0–100)' },
      { value: 'config.color',     label: 'Circle Color', description: 'Circle fill color' },
    ],
    knob: [
      { value: 'config.entity_id', label: 'Entity ID', description: 'Bound entity' },
      { value: 'config.min',       label: 'Minimum',   description: 'Min value' },
      { value: 'config.max',       label: 'Maximum',   description: 'Max value' },
      { value: 'config.value',     label: 'Value',     description: 'Knob position' },
    ],
    scrollingtext: [
      { value: 'config.text',     label: 'Text',      description: 'Scrolling text content' },
      { value: 'config.fontSize', label: 'Font Size', description: 'Text size in pixels' },
      { value: 'config.color',    label: 'Color',     description: 'Text color' },
    ],
    html: [
      { value: 'config.html', label: 'HTML Content', description: 'Raw HTML string' },
    ],
    iframe: [
      { value: 'config.src',       label: 'URL',       description: 'Iframe source URL' },
      { value: 'config.entity_id', label: 'Entity ID', description: 'Entity driving the URL' },
    ],
    graph: [
      { value: 'config.entity_id', label: 'Entity ID', description: 'Numeric sensor entity' },
    ],
    weather: [
      { value: 'config.entity_id', label: 'Entity ID', description: 'weather.* entity' },
    ],
    camera: [
      { value: 'config.entity_id', label: 'Entity ID', description: 'camera.* entity' },
    ],
    calendar: [
      { value: 'config.entity_id', label: 'Entity ID', description: 'calendar.* entity' },
    ],
    radiobutton: [
      { value: 'config.entity_id', label: 'Entity ID', description: 'Bound entity' },
    ],
    colorpicker: [
      { value: 'config.entity_id', label: 'Entity ID', description: 'Bound light or entity' },
    ],
    keyboard: [
      { value: 'config.target_entity', label: 'Target Entity', description: 'input_text entity to type into' },
    ],
  };

  return [
    ...(specificProps[widgetType] || []),
    ...UNIVERSAL_STYLE_WRITABLE,
    ...layoutProps,
  ];
}

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
