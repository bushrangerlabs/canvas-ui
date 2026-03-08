/**
 * Flow Execution Engine
 * 
 * Executes flow nodes in topological order, passing data between connected nodes.
 * Handles async operations, error recovery, and state management.
 */

import type { FlowDefinition, FlowExecutionStatus, FlowNode } from '../types/flow';
import { topologicalSort } from './topologicalSort';

/**
 * Interpolate variables and entities in a string
 * Supports: {{variables.name}}, {{entities.entity_id.state}}, {{entities.entity_id.attributes.brightness}}
 */
function interpolateString(str: string, context: ExecutionContextInternal): string {
  if (typeof str !== 'string') return str;
  
  return str.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const trimmedPath = path.trim();
    const parts = trimmedPath.split('.');
    
    if (parts[0] === 'variables' && parts.length > 1) {
      const varName = parts.slice(1).join('.');
      const value = context.getVariable(varName);
      return value !== undefined ? String(value) : match;
    }
    
    if (parts[0] === 'entities' && parts.length > 1) {
      const entityId = parts[1];
      const entity = context.getEntity(entityId);
      if (!entity) return match;
      
      if (parts.length === 2) {
        return String(entity.state);
      } else {
        // Navigate nested properties (e.g., entities.light.living_room.attributes.brightness)
        let value: any = entity;
        for (let i = 2; i < parts.length; i++) {
          value = value?.[parts[i]];
        }
        return value !== undefined ? String(value) : match;
      }
    }
    
    return match;
  });
}

/**
 * Execution result for a single node
 */
export interface NodeExecutionResult {
  nodeId: string;
  success: boolean;
  value: any;
  error?: string;
  executionTime: number; // milliseconds
}

/**
 * Complete flow execution result
 */
export interface FlowExecutionResult {
  flowId: string;
  status: FlowExecutionStatus;
  duration: number; // milliseconds
  nodeResults: Record<string, NodeExecutionResult>;
  error?: string;
}



/**
 * Internal execution context with state and helpers
 */
interface ExecutionContextInternal {
  flowId: string;
  widgets: Record<string, any>; // Widget states
  entities: Record<string, any>; // Entity states
  variables: Record<string, any>; // Canvas variables
  nodeOutputs: Record<string, any>; // Outputs from executed nodes
  startTime: number;
  status: FlowExecutionStatus;
  // Helper functions
  getWidget: (widgetId: string) => any;
  getEntity: (entityId: string) => any;
  getVariable: (name: string) => any;  getRuntimeState: (widgetId: string) => any;  setWidget: (widgetId: string, property: string, value: any) => Promise<void>;
  setVariable: (name: string, value: any) => void;
  callService: (domain: string, service: string, data: any) => Promise<void>;
}

/**
 * Get inputs for a node from its connected source nodes
 */
function getNodeInputs(
  node: FlowNode,
  flow: FlowDefinition,
  nodeOutputs: Record<string, any>
): Record<string, any> {
  const inputs: Record<string, any> = {};
  
  // Find all edges that target this node
  const incomingEdges = flow.edges.filter(edge => edge.target === node.id);
  
  incomingEdges.forEach((edge, index) => {
    const sourceOutput = nodeOutputs[edge.source];
    
    // Use sourceHandle as input key, or default to index
    const inputKey = edge.sourceHandle || `input_${index}`;
    inputs[inputKey] = sourceOutput;
  });
  
  return inputs;
}

/**
 * Execute a single node based on its type
 */
async function executeNode(
  node: FlowNode,
  inputs: Record<string, any>,
  context: ExecutionContextInternal
): Promise<any> {
  const { nodeType, config } = node.data;
  
  try {
    switch (nodeType) {
      // INPUT NODES - Get data from sources
      case 'widget-property': {
        const widgetId = config?.widget_id || config?.widgetId;
        const property = config?.property;
        
        if (!widgetId || !property) {
          throw new Error('Widget ID and property required');
        }
        
        // Parse property path (e.g., "runtime.value" or "config.text")
        const parts = property.split('.');
        
        // For runtime properties, get from runtime store
        if (parts[0] === 'runtime') {
          const runtimeState = context.getRuntimeState(widgetId);
          if (!runtimeState) {
            console.warn(`No runtime state for widget: ${widgetId}`);
            return undefined;
          }
          
          // Navigate to nested property (e.g., runtime.value -> value)
          let value: any = runtimeState;
          for (let i = 1; i < parts.length; i++) {
            value = value?.[parts[i]];
          }
          return value;
        }
        
        // For config properties, get from widget object
        const widget = context.getWidget(widgetId);
        if (!widget) {
          throw new Error(`Widget not found: ${widgetId}`);
        }
        
        let value = widget;
        for (const part of parts) {
          value = value?.[part];
        }
        
        return value;
      }
      
      case 'entity-state': {
        const entityId = config?.entity_id || config?.entityId;
        
        if (!entityId) {
          throw new Error('Entity ID required');
        }
        
        const entity = context.getEntity(entityId);
        if (!entity) {
          throw new Error(`Entity not found: ${entityId}`);
        }
        
        return entity.state;
      }
      
      case 'canvas-variable': {
        const variableName = config?.variable_name || config?.variableName;
        
        if (!variableName) {
          throw new Error('Variable name required');
        }
        
        return context.getVariable(variableName);
      }
      
      case 'user-input': {
        return config?.value;
      }
      
      case 'time-date': {
        return new Date().toISOString();
      }
      
      // PROCESSING NODES - Transform data
      case 'math': {
        const operation = config?.operation || 'add';
        const configValue = config?.value ? parseFloat(config.value) : 0;
        const inputValues = Object.values(inputs);
        
        // Dual mode: if config.value > 0, use it as constant; otherwise require 2 inputs
        let a: number, b: number;
        
        if (configValue > 0) {
          // Constant mode: use config value as second operand
          if (inputValues.length < 1) {
            throw new Error('Math operation requires at least 1 input when using constant value');
          }
          a = parseFloat(inputValues[0]);
          b = configValue;
        } else {
          // Dynamic mode: require 2 connected inputs
          if (inputValues.length < 2) {
            throw new Error('Math operation requires 2 inputs (or set value > 0 for constant mode)');
          }
          [a, b] = inputValues.map(v => parseFloat(v));
        }
        
        switch (operation) {
          case 'add': return a + b;
          case 'subtract': return a - b;
          case 'multiply': return a * b;
          case 'divide': return b !== 0 ? a / b : 0;
          case 'modulo': return a % b;
          case 'power': return Math.pow(a, b);
          default: throw new Error(`Unknown operation: ${operation}`);
        }
      }
      
      case 'comparison': {
        const operator = config?.operator || 'equals';
        const inputValues = Object.values(inputs);
        
        if (inputValues.length < 2) {
          throw new Error('Comparison requires 2 inputs');
        }
        
        const [a, b] = inputValues;
        
        switch (operator) {
          case 'equals': return a === b;
          case 'not-equals': return a !== b;
          case 'greater-than': return parseFloat(a) > parseFloat(b);
          case 'less-than': return parseFloat(a) < parseFloat(b);
          case 'greater-or-equal': return parseFloat(a) >= parseFloat(b);
          case 'less-or-equal': return parseFloat(a) <= parseFloat(b);
          default: throw new Error(`Unknown operator: ${operator}`);
        }
      }
      
      case 'condition': {
        let condition: any;
        
        // Check if we have an expression string to evaluate
        if (config?.expression) {
          // Interpolate variables first
          const interpolatedExpr = interpolateString(config.expression, context);
          
          // Evaluate the expression
          try {
            // eslint-disable-next-line no-new-func
            const fn = new Function('return ' + interpolatedExpr);
            condition = fn();
          } catch (error) {
            console.error('[condition] Expression evaluation failed:', interpolatedExpr, error);
            condition = false;
          }
        } else {
          // Legacy mode: use input value
          condition = Object.values(inputs)[0];
        }
        
        const trueValue = config?.true_value ?? true;
        const falseValue = config?.false_value ?? false;
        
        return condition ? trueValue : falseValue;
      }
      
      case 'string': {
        const operation = config?.operation || 'concat';
        const inputValues = Object.values(inputs).map(v => String(v));
        
        switch (operation) {
          case 'concat': return inputValues.join('');
          case 'uppercase': return inputValues[0]?.toUpperCase();
          case 'lowercase': return inputValues[0]?.toLowerCase();
          case 'trim': return inputValues[0]?.trim();
          case 'replace': {
            const [text, search, replace] = inputValues;
            return text?.replace(new RegExp(search, 'g'), replace);
          }
          default: throw new Error(`Unknown operation: ${operation}`);
        }
      }
      
      case 'logic': {
        const gate = config?.gate || 'and';
        const inputValues = Object.values(inputs).map(v => Boolean(v));
        
        switch (gate) {
          case 'and': return inputValues.every(v => v);
          case 'or': return inputValues.some(v => v);
          case 'not': return !inputValues[0];
          case 'xor': return inputValues.filter(v => v).length === 1;
          default: throw new Error(`Unknown gate: ${gate}`);
        }
      }
      
      case 'delay': {
        const delayMs = parseFloat(config?.delay || 0);
        const inputValue = Object.values(inputs)[0];
        
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return inputValue;
      }
      
      case 'js-expression': {
        const expression = config?.expression || '';
        const inputValue = Object.values(inputs)[0];
        
        // Create a function from the expression
        // eslint-disable-next-line no-new-func
        const fn = new Function('input', `return ${expression}`);
        return fn(inputValue);
      }
      
      // OUTPUT NODES - Set values or trigger actions
      case 'set-widget': {
        const widgetId = config?.widget_id || config?.widgetId;
        const action = config?.action;
        const property = config?.property;
        let configValue = config?.value;
        const inputValue = Object.values(inputs)[0];
        
        if (!widgetId) {
          throw new Error('Widget ID required');
        }
        
        // Interpolate variables in config value if it's a string
        if (typeof configValue === 'string') {
          configValue = interpolateString(configValue, context);
        }
        
        // Get the value to use (prefer input, fallback to interpolated config)
        const value = inputValue !== undefined ? inputValue : configValue;
        
        // Determine property path
        let targetProperty: string;
        
        if (action) {
          // Action mode: map friendly names to property paths
          const actionPropertyMap: Record<string, string> = {
            'set_text': 'config.text',
            'set_value': 'config.value',
            'set_label': 'config.label',
            'set_color': 'config.color',
            'set_background': 'config.backgroundColor',
            'set_visible': 'config.visible',
          };
          targetProperty = actionPropertyMap[action] || `config.${action}`;
        } else if (property) {
          // Direct property mode
          targetProperty = property;
        } else {
          throw new Error('Either action or property field required');
        }
        
        await context.setWidget(widgetId, targetProperty, value);
        return value;
      }
      
      case 'call-service': {
        const domain = config?.domain;
        const service = config?.service;
        const serviceData = config?.data || {};
        
        if (!domain || !service) {
          throw new Error('Domain and service required');
        }
        
        // Merge inputs into service data
        const finalData = { ...serviceData, ...inputs };
        
        await context.callService(domain, service, finalData);
        return finalData; // Return the data that was sent
      }
      
      case 'set-variable': {
        const variableName = config?.variable_name || config?.variableName;
        const operation = config?.operation || 'set';
        const configValue = config?.value;
        const inputValue = Object.values(inputs)[0];
        
        if (!variableName) {
          throw new Error('Variable name required');
        }
        
        // Get current variable value
        const currentValue = context.getVariable(variableName);
        let newValue: any;
        
        switch (operation) {
          case 'set':
            // Direct set from input or config value
            newValue = inputValue !== undefined ? inputValue : configValue;
            break;
            
          case 'set_if_empty':
            // Only set if variable is currently empty/undefined
            newValue = (currentValue === undefined || currentValue === null || currentValue === '') 
              ? (configValue !== undefined ? configValue : inputValue)
              : currentValue;
            break;
            
          case 'set_from_variable':
            // Set from another variable
            const sourceVarName = configValue || inputValue;
            newValue = context.getVariable(sourceVarName);
            break;
            
          case 'append_digit':
            // Append digit to current value (for calculator)
            const digit = String(configValue || inputValue);
            const current = String(currentValue || '0');
            // If current is "0", replace it; otherwise append
            newValue = current === '0' ? digit : current + digit;
            break;
            
          case 'append_dot_once':
            // Append decimal point if not already present
            const currentStr = String(currentValue || '0');
            newValue = currentStr.includes('.') ? currentStr : currentStr + '.';
            break;
            
          case 'calc_binary':
            // Perform binary calculation (a op b)
            try {
              const calcData = typeof configValue === 'string' 
                ? JSON.parse(configValue) 
                : (configValue || inputValue);
              
              const a = parseFloat(calcData.a || 0);
              const b = parseFloat(calcData.b || 0);
              const op = calcData.op;
              
              switch (op) {
                case 'add': newValue = String(a + b); break;
                case 'sub': newValue = String(a - b); break;
                case 'mul': newValue = String(a * b); break;
                case 'div': newValue = b !== 0 ? String(a / b) : 'Error'; break;
                default: throw new Error(`Unknown calc operation: ${op}`);
              }
            } catch (error) {
              newValue = 'Error';
              console.error('[calc_binary] Error:', error);
            }
            break;
            
          case 'increment':
            // Increment numeric value
            newValue = parseFloat(currentValue || 0) + parseFloat(configValue || inputValue || 1);
            break;
            
          case 'decrement':
            // Decrement numeric value
            newValue = parseFloat(currentValue || 0) - parseFloat(configValue || inputValue || 1);
            break;
            
          default:
            throw new Error(`Unknown variable operation: ${operation}`);
        }
        
        context.setVariable(variableName, newValue);
        return newValue;
      }
      
      case 'http-request':
      case 'http-post': {
        const url = config?.url;
        const method = nodeType === 'http-post' ? 'POST' : 'GET';
        const body = config?.body || inputs;
        
        if (!url) {
          throw new Error('URL required');
        }
        
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: method !== 'GET' ? JSON.stringify(body) : undefined,
        });
        
        return await response.json();
      }
      
      case 'console-log': {
        const message = config?.message || '';
        const inputValue = Object.values(inputs)[0];
        
        console.log(`[Flow ${context.flowId}] ${message}`, inputValue);
        return inputValue;
      }
      
      default:
        throw new Error(`Unknown node type: ${nodeType}`);
    }
  } catch (error) {
    console.error(`Error executing node ${node.id} (${nodeType}):`, error);
    throw error;
  }
}

/**
 * Execute a complete flow
 */
export async function executeFlow(
  flow: FlowDefinition,
  externalContext: {
    widgets: Record<string, any>;
    entities: Record<string, any>;
    variables: Record<string, any>;
    getRuntimeState: (widgetId: string) => any;
    setWidget: (widgetId: string, property: string, value: any) => Promise<void>;
    setVariable: (name: string, value: any) => void;
    callService: (domain: string, service: string, data: any) => Promise<void>;
  }
): Promise<FlowExecutionResult> {
  const startTime = Date.now();
  const nodeResults: Record<string, NodeExecutionResult> = {};
  
  // Build execution context
  const context: ExecutionContextInternal = {
    flowId: flow.id,
    widgets: externalContext.widgets,
    entities: externalContext.entities,
    variables: { ...externalContext.variables },
    nodeOutputs: {},
    startTime,
    status: 'running',
    getWidget: (widgetId: string) => externalContext.widgets[widgetId],
    getEntity: (entityId: string) => externalContext.entities[entityId],
    getVariable: (name: string) => context.variables[name],
    getRuntimeState: externalContext.getRuntimeState,
    setWidget: externalContext.setWidget,
    setVariable: (name: string, value: any) => {
      context.variables[name] = value;
      externalContext.setVariable(name, value);
    },
    callService: externalContext.callService,
  };
  
  try {
    // Get execution order (topological sort)
    const sortedNodes = topologicalSort(flow.nodes, flow.edges);
    
    if (sortedNodes.length === 0) {
      throw new Error('Flow contains cycles or is invalid');
    }
    
    // Execute nodes in order
    for (const node of sortedNodes) {
      const nodeStartTime = Date.now();
      
      try {
        // Get inputs from connected nodes
        const inputs = getNodeInputs(node, flow, context.nodeOutputs);
        
        // Execute the node
        const result = await executeNode(node, inputs, context);
        
        // Store result
        context.nodeOutputs[node.id] = result;
        
        nodeResults[node.id] = {
          nodeId: node.id,
          success: true,
          value: result,
          executionTime: Date.now() - nodeStartTime,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        nodeResults[node.id] = {
          nodeId: node.id,
          success: false,
          value: undefined,
          error: errorMessage,
          executionTime: Date.now() - nodeStartTime,
        };
        
        // Stop execution on error
        throw new Error(`Node ${node.id} failed: ${errorMessage}`);
      }
    }
    
    context.status = 'success';
    
    return {
      flowId: flow.id,
      status: 'success',
      duration: Date.now() - startTime,
      nodeResults,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    context.status = 'error';
    
    return {
      flowId: flow.id,
      status: 'error',
      duration: Date.now() - startTime,
      nodeResults,
      error: errorMessage,
    };
  }
}
