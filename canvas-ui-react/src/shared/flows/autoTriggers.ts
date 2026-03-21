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
      // Content
      { value: 'config.label',          label: 'Button Label',        description: 'Text shown on the button' },
      // Behavior
      { value: 'config.entity_id',      label: 'Entity ID',           description: 'Target entity for the action' },
      { value: 'config.actionType',     label: 'Action Type',         description: 'auto | toggle | turn_on | turn_off | custom | navigation | url | mqtt' },
      { value: 'config.value',          label: 'Value',               description: 'Value to set (input_text, input_number, etc.)' },
      { value: 'config.customDomain',   label: 'Service Domain',      description: 'Custom service domain (e.g. light, switch)' },
      { value: 'config.customService',  label: 'Service Name',        description: 'Custom service name (e.g. turn_on, trigger)' },
      { value: 'config.serviceData',    label: 'Service Data (JSON)', description: 'Service data as a JSON string' },
      { value: 'config.targetView',     label: 'Target View',         description: 'View name to navigate to' },
      { value: 'config.url',            label: 'URL',                 description: 'URL to open' },
      { value: 'config.urlTarget',      label: 'URL Target',          description: '_blank (new tab) | _self (same tab)' },
      { value: 'config.mqttTopic',      label: 'MQTT Topic',          description: 'MQTT topic to publish to' },
      { value: 'config.mqttPayload',    label: 'MQTT Payload',        description: 'MQTT message payload' },
      { value: 'config.mqttQos',        label: 'MQTT QoS',            description: '0 | 1 | 2' },
      { value: 'config.mqttRetain',     label: 'MQTT Retain',         description: 'true | false — retain message on broker' },
      { value: 'config.confirmAction',  label: 'Require Confirmation',description: 'true | false — show confirmation dialog before action' },
      { value: 'config.confirmMessage', label: 'Confirmation Message',description: 'Text shown in the confirmation dialog' },
      // Feedback
      { value: 'config.clickFeedback',       label: 'Click Feedback',       description: 'none | scale | highlight | ripple | shadow | color' },
      { value: 'config.feedbackDuration',    label: 'Feedback Duration (ms)',description: 'How long the click effect lasts (50–1000)' },
      { value: 'config.feedbackIntensity',   label: 'Feedback Intensity',   description: 'Effect intensity 0.5–2.0' },
      { value: 'config.clickBackgroundColor',label: 'Click Background Color',description: 'Background color shown on click (color feedback mode)' },
      { value: 'config.clickBorderColor',    label: 'Click Border Color',   description: 'Border color shown on click (color feedback mode)' },
      { value: 'config.clickBorderWidth',    label: 'Click Border Width',   description: 'Border width during click (color feedback mode)' },
      { value: 'config.hapticFeedback',      label: 'Haptic Feedback',      description: 'true | false — vibrate on tap (mobile)' },
      // Icon
      { value: 'config.showIcon',       label: 'Show Icon',           description: 'true | false — show icon on button' },
      { value: 'config.icon',           label: 'Icon',                description: 'Icon identifier (e.g. mdi:lightbulb, Home)' },
      { value: 'config.iconPosition',   label: 'Icon Position',       description: 'left | right | top | bottom | only' },
      { value: 'config.iconSize',       label: 'Icon Size',           description: 'Icon size in pixels (12–96)' },
      { value: 'config.iconSpacing',    label: 'Icon Spacing',        description: 'Gap between icon and text in pixels' },
      { value: 'config.iconColor',      label: 'Icon Color',          description: 'Icon tint color (defaults to text color)' },
      // Typography
      { value: 'config.textColor',      label: 'Text Color',          description: 'Button label text color' },
      { value: 'config.fontFamily',     label: 'Font Family',         description: 'Font name (e.g. Arial, Roboto)' },
      { value: 'config.fontSize',       label: 'Font Size',           description: 'Label text size in pixels' },
      { value: 'config.fontWeight',     label: 'Font Weight',         description: 'normal | bold | 300 | 500' },
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
      { value: 'config.value',     label: 'Value',     description: 'Direct gauge value (overrides entity)' },
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
      { value: 'config.icon',        label: 'Icon',          description: 'Icon identifier' },
      { value: 'config.color',       label: 'Icon Color',    description: 'Icon tint color' },
      { value: 'config.size',        label: 'Icon Size',     description: 'Icon size (% of container)' },
      { value: 'config.fillValue',   label: 'Fill Value (%)', description: 'Static fill level 0–100 (overrides Fill Entity)' },
      { value: 'config.fillColor',   label: 'Fill Color',    description: 'Fill effect color' },
      { value: 'config.entity_id',   label: 'Entity ID',     description: 'Bound entity (controls active state)' },
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
    digitalclock: [
      { value: 'config.timeColor',     label: 'Time Color',           description: 'Clock digit color' },
      { value: 'config.dateColor',     label: 'Date Color',           description: 'Date/day text color' },
      { value: 'config.backgroundColor', label: 'Background Color',  description: 'Widget background color' },
      { value: 'config.fontSize',      label: 'Clock Font Size',      description: 'Clock digit size in pixels' },
      { value: 'config.dateFontSize',  label: 'Date Font Size',       description: 'Date text size in px (0 = auto)' },
      { value: 'config.dateGap',       label: 'Date Gap (px)',         description: 'Gap between clock and date text' },
      { value: 'config.showDate',      label: 'Show Date',            description: 'true | false' },
      { value: 'config.showDay',       label: 'Show Day',             description: 'true | false' },
      { value: 'config.glow',          label: 'Glow Effect',          description: 'true | false' },
    ],
    html: [
      { value: 'config.html', label: 'HTML Content', description: 'Raw HTML string' },
    ],
    iframe: [
      { value: 'config.url',       label: 'URL',       description: 'Iframe source URL' },
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
    button: [
      // Click event — add to a Widget Property node to auto-generate a widget-change trigger on click
      { value: 'runtime.value', label: '🖱️ Click Event (Timestamp)', description: 'Fires every time the button is clicked — value is the click timestamp' },
      // Content
      { value: 'config.label',               label: 'Button Label',         description: 'Current button text' },
      // Behavior
      { value: 'config.entity_id',           label: 'Entity ID',            description: 'Bound entity' },
      { value: 'config.actionType',          label: 'Action Type',          description: 'auto | toggle | turn_on | turn_off | custom | navigation | url | mqtt' },
      { value: 'config.value',               label: 'Value',                description: 'Value to set (input_text, input_number, etc.)' },
      { value: 'config.customDomain',        label: 'Service Domain',       description: 'Custom service domain (e.g. light, switch)' },
      { value: 'config.customService',       label: 'Service Name',         description: 'Custom service name (e.g. turn_on, trigger)' },
      { value: 'config.serviceData',         label: 'Service Data (JSON)',  description: 'Service data as a JSON string' },
      { value: 'config.targetView',          label: 'Target View',          description: 'Navigation target view name' },
      { value: 'config.url',                 label: 'URL',                  description: 'URL to open' },
      { value: 'config.urlTarget',           label: 'URL Target',           description: '_blank (new tab) | _self (same tab)' },
      { value: 'config.mqttTopic',           label: 'MQTT Topic',           description: 'MQTT topic' },
      { value: 'config.mqttPayload',         label: 'MQTT Payload',         description: 'MQTT message payload' },
      { value: 'config.mqttQos',             label: 'MQTT QoS',             description: '0 | 1 | 2' },
      { value: 'config.mqttRetain',          label: 'MQTT Retain',          description: 'Retain message on broker (true/false)' },
      { value: 'config.confirmAction',       label: 'Require Confirmation', description: 'Whether confirmation is enabled (true/false)' },
      { value: 'config.confirmMessage',      label: 'Confirmation Message', description: 'Confirmation dialog text' },
      // Feedback
      { value: 'config.clickFeedback',       label: 'Click Feedback',       description: 'none | scale | highlight | ripple | shadow | color' },
      { value: 'config.feedbackDuration',    label: 'Feedback Duration (ms)',description: 'Click effect duration in ms' },
      { value: 'config.feedbackIntensity',   label: 'Feedback Intensity',   description: 'Effect intensity 0.5–2.0' },
      { value: 'config.clickBackgroundColor',label: 'Click Background Color',description: 'Background color on click (color mode)' },
      { value: 'config.clickBorderColor',    label: 'Click Border Color',   description: 'Border color on click (color mode)' },
      { value: 'config.clickBorderWidth',    label: 'Click Border Width',   description: 'Border width on click (color mode)' },
      { value: 'config.hapticFeedback',      label: 'Haptic Feedback',      description: 'Vibrate on tap (true/false)' },
      // Icon
      { value: 'config.showIcon',            label: 'Show Icon',            description: 'Whether icon is visible (true/false)' },
      { value: 'config.icon',                label: 'Icon',                 description: 'Icon identifier (e.g. mdi:lightbulb)' },
      { value: 'config.iconPosition',        label: 'Icon Position',        description: 'left | right | top | bottom | only' },
      { value: 'config.iconSize',            label: 'Icon Size',            description: 'Icon size in pixels' },
      { value: 'config.iconSpacing',         label: 'Icon Spacing',         description: 'Gap between icon and text' },
      { value: 'config.iconColor',           label: 'Icon Color',           description: 'Icon tint color' },
      // Typography / Style
      { value: 'config.textColor',           label: 'Text Color',           description: 'Button text color' },
      { value: 'config.fontFamily',          label: 'Font Family',          description: 'Font name' },
      { value: 'config.fontSize',            label: 'Font Size',            description: 'Label text size in pixels' },
      { value: 'config.fontWeight',          label: 'Font Weight',          description: 'normal | bold | 300 | 500' },
      // Universal style
      { value: 'config.style.backgroundColor', label: 'Background Color',  description: 'Widget background color' },
      { value: 'config.style.borderColor',     label: 'Border Color',      description: 'Border color' },
      { value: 'config.style.borderStyle',     label: 'Border Style',      description: 'solid | dashed | dotted | double | none' },
    ],
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
