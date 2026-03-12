/**
 * Flow Type Definitions - React Flow Visual Programming System
 * Phase 3: Core types for flows, nodes, and edges
 */

import type { Node } from 'reactflow';

/**
 * Node categories for organization and validation
 */
export type NodeCategory = 'input' | 'processing' | 'output';

/**
 * Input node types - Data sources
 */
export type InputNodeType =
  | 'widget-property'    // Read widget config/state
  | 'entity-state'       // Read HA entity state/attributes
  | 'canvas-variable'    // Read global canvas variable
  | 'time-date'          // Current time/date
  | 'user-input'         // Static value entry
  | 'http-request';      // HTTP GET request

/**
 * Processing node types - Data transformation
 */
export type ProcessingNodeType =
  | 'math'               // Arithmetic operations
  | 'string'             // String manipulation
  | 'comparison'         // Compare values
  | 'logic'              // AND/OR/NOT operations
  | 'condition'          // IF/THEN/ELSE branching
  | 'loop'               // Iterate over arrays
  | 'delay'              // Time delay
  | 'js-expression';     // Custom JavaScript

/**
 * Output node types - Actions and side effects
 */
export type OutputNodeType =
  | 'set-widget'         // Update widget property (supports both action names and direct paths)
  | 'call-service'       // Call HA service
  | 'set-variable'       // Update canvas variable
  | 'http-post'          // HTTP POST request
  | 'local-storage'          // Browser localStorage
  | 'console-log'            // Debug output
  | 'activate-screensaver'   // Trigger screensaver widget
  | 'dismiss-screensaver';   // Dismiss screensaver widget

/**
 * All supported node types
 */
export type FlowNodeType = InputNodeType | ProcessingNodeType | OutputNodeType;

/**
 * Custom node data structure
 */
export interface FlowNodeData {
  label: string;
  category: NodeCategory;
  nodeType: FlowNodeType;
  config?: Record<string, any>; // Node-specific configuration
  outputs?: Record<string, any>; // Output values (runtime)
}

/**
 * Extended React Flow node with our custom data
 */
export interface FlowNode extends Node<FlowNodeData> {
  id: string;
  type: string; // React Flow node type (for custom rendering)
  data: FlowNodeData;
  position: { x: number; y: number };
}

/**
 * Extended React Flow edge with metadata
 */
export interface FlowEdge {
  id: string;
  source: string;      // Source node ID
  target: string;      // Target node ID
  sourceHandle?: string; // Source handle ID (for multiple outputs)
  targetHandle?: string; // Target handle ID (for multiple inputs)
  animated?: boolean;    // Animate edge (for active flows)
  label?: string;        // Edge label (optional)
}

/**
 * Flow trigger types
 */
export type FlowTrigger =
  | 'manual'           // User clicks "Run" button
  | 'widget-change'    // Widget property changes
  | 'entity-change'    // Entity state changes
  | 'time-interval'    // Every N seconds/minutes
  | 'time-schedule'    // Cron-like schedule
  | 'variable-change'; // Canvas variable changes

/**
 * Flow trigger configuration
 */
export interface FlowTriggerConfig {
  type: FlowTrigger;
  config?: {
    // For widget-change
    widgetId?: string;
    widgetName?: string;
    property?: string;
    
    // For entity-change
    entityId?: string;
    
    // For time-interval
    interval?: number; // milliseconds
    
    // For time-schedule
    cron?: string; // Cron expression
    
    // For variable-change
    variableName?: string;
  };
}

/**
 * Flow execution status
 */
export type FlowExecutionStatus = 'idle' | 'running' | 'success' | 'error';

/**
 * Flow execution history entry
 */
export interface FlowExecutionLog {
  timestamp: number;
  status: FlowExecutionStatus;
  duration: number; // milliseconds
  error?: string;
  nodeResults?: Record<string, any>; // Results from each node
}

/**
 * Complete flow definition
 */
export interface FlowDefinition {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  nodes: FlowNode[];
  edges: FlowEdge[];
  triggers: FlowTriggerConfig[];
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
  metadata?: {
    createdAt: number;
    updatedAt: number;
    lastRun?: number;
    executionCount?: number;
  };
}

/**
 * Flow execution context
 */
export interface FlowExecutionContext {
  flowId: string;
  variables: Record<string, any>; // Temporary flow variables
  nodeOutputs: Record<string, any>; // Output from each node
  startTime: number;
  status: FlowExecutionStatus;
}
