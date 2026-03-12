/**
 * Node Registry - Metadata for all custom node types
 * Defines the 20 node types available in the palette
 */

import type { FlowNodeType, NodeCategory } from './flow';

export interface NodeMetadata {
  type: FlowNodeType;
  category: NodeCategory;
  label: string;
  description: string;
  icon: string; // MUI icon name
  color: string; // Node background color
  inputs: number; // Number of input handles
  outputs: number; // Number of output handles
}

/**
 * Complete registry of all 20 node types
 */
export const NODE_REGISTRY: Record<FlowNodeType, NodeMetadata> = {
  // INPUT NODES (6 types)
  'widget-property': {
    type: 'widget-property',
    category: 'input',
    label: 'Widget Property',
    description: 'Read widget config/state value',
    icon: 'Widgets',
    color: '#4CAF50',
    inputs: 0,
    outputs: 1,
  },
  'entity-state': {
    type: 'entity-state',
    category: 'input',
    label: 'Entity State',
    description: 'Read Home Assistant entity state/attributes',
    icon: 'Sensors',
    color: '#4CAF50',
    inputs: 0,
    outputs: 1,
  },
  'canvas-variable': {
    type: 'canvas-variable',
    category: 'input',
    label: 'Canvas Variable',
    description: 'Read global canvas variable',
    icon: 'DataObject',
    color: '#4CAF50',
    inputs: 0,
    outputs: 1,
  },
  'time-date': {
    type: 'time-date',
    category: 'input',
    label: 'Time/Date',
    description: 'Current time, date, day of week',
    icon: 'Schedule',
    color: '#4CAF50',
    inputs: 0,
    outputs: 1,
  },
  'user-input': {
    type: 'user-input',
    category: 'input',
    label: 'User Input',
    description: 'Static value entry',
    icon: 'Input',
    color: '#4CAF50',
    inputs: 0,
    outputs: 1,
  },
  'http-request': {
    type: 'http-request',
    category: 'input',
    label: 'HTTP Request',
    description: 'Fetch data from external API',
    icon: 'Http',
    color: '#4CAF50',
    inputs: 0,
    outputs: 1,
  },

  // PROCESSING NODES (8 types)
  'math': {
    type: 'math',
    category: 'processing',
    label: 'Math Operation',
    description: 'Arithmetic: +, -, *, /, %, ^',
    icon: 'Calculate',
    color: '#2196F3',
    inputs: 2,
    outputs: 1,
  },
  'string': {
    type: 'string',
    category: 'processing',
    label: 'String Operation',
    description: 'Concat, substring, replace, case',
    icon: 'TextFields',
    color: '#2196F3',
    inputs: 2,
    outputs: 1,
  },
  'comparison': {
    type: 'comparison',
    category: 'processing',
    label: 'Comparison',
    description: 'Compare values: >, <, >=, <=, ==, !=',
    icon: 'CompareArrows',
    color: '#2196F3',
    inputs: 2,
    outputs: 1,
  },
  'logic': {
    type: 'logic',
    category: 'processing',
    label: 'Logic Gate',
    description: 'Boolean: AND, OR, NOT, XOR',
    icon: 'AccountTree',
    color: '#2196F3',
    inputs: 2,
    outputs: 1,
  },
  'condition': {
    type: 'condition',
    category: 'processing',
    label: 'Condition',
    description: 'If-then-else branching',
    icon: 'CallSplit',
    color: '#2196F3',
    inputs: 3,
    outputs: 2,
  },
  'loop': {
    type: 'loop',
    category: 'processing',
    label: 'Loop',
    description: 'Iterate over arrays',
    icon: 'Loop',
    color: '#2196F3',
    inputs: 1,
    outputs: 1,
  },
  'delay': {
    type: 'delay',
    category: 'processing',
    label: 'Delay',
    description: 'Time delay in milliseconds',
    icon: 'Timer',
    color: '#2196F3',
    inputs: 1,
    outputs: 1,
  },
  'js-expression': {
    type: 'js-expression',
    category: 'processing',
    label: 'JavaScript',
    description: 'Custom JavaScript expression',
    icon: 'Code',
    color: '#2196F3',
    inputs: 1,
    outputs: 1,
  },

  // OUTPUT NODES (6 types)
  'set-widget': {
    type: 'set-widget',
    category: 'output',
    label: 'Set Widget',
    description: 'Update widget property (supports action names like set_text or direct property paths)',
    icon: 'Widgets',
    color: '#FF9800',
    inputs: 1,
    outputs: 0,
  },
  'call-service': {
    type: 'call-service',
    category: 'output',
    label: 'Call Service',
    description: 'Call Home Assistant service',
    icon: 'PlayArrow',
    color: '#FF9800',
    inputs: 1,
    outputs: 0,
  },
  'set-variable': {
    type: 'set-variable',
    category: 'output',
    label: 'Set Variable',
    description: 'Update canvas variable',
    icon: 'DataObject',
    color: '#FF9800',
    inputs: 1,
    outputs: 0,
  },
  'http-post': {
    type: 'http-post',
    category: 'output',
    label: 'HTTP Post',
    description: 'POST/PUT to external API',
    icon: 'Http',
    color: '#FF9800',
    inputs: 1,
    outputs: 1,
  },
  'local-storage': {
    type: 'local-storage',
    category: 'output',
    label: 'Local Storage',
    description: 'Store in browser storage',
    icon: 'Storage',
    color: '#FF9800',
    inputs: 1,
    outputs: 0,
  },
  'console-log': {
    type: 'console-log',
    category: 'output',
    label: 'Console Log',
    description: 'Debug output to console',
    icon: 'BugReport',
    color: '#FF9800',
    inputs: 1,
    outputs: 0,
  },
  'activate-screensaver': {
    type: 'activate-screensaver',
    category: 'output',
    label: 'Activate Screensaver',
    description: 'Trigger screensaver widget (dim overlay or view navigation)',
    icon: 'DarkMode',
    color: '#FF9800',
    inputs: 1,
    outputs: 0,
  },
  'dismiss-screensaver': {
    type: 'dismiss-screensaver',
    category: 'output',
    label: 'Dismiss Screensaver',
    description: 'Dismiss the active screensaver widget',
    icon: 'LightMode',
    color: '#FF9800',
    inputs: 1,
    outputs: 0,
  },
};

/**
 * Get nodes by category
 */
export const getNodesByCategory = (category: NodeCategory): NodeMetadata[] => {
  return Object.values(NODE_REGISTRY).filter((node) => node.category === category);
};

/**
 * Get node metadata by type
 */
export const getNodeMetadata = (type: FlowNodeType): NodeMetadata | undefined => {
  return NODE_REGISTRY[type];
};
