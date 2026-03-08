/**
 * Advanced Conditional Visibility System
 * Support for state, numeric, screen, time conditions with AND/OR logic
 */

export interface VisibilityConfig {
  conditions: Condition[];
  mode?: 'all' | 'any'; // AND vs OR (default: 'all' = AND)
}

export type Condition = 
  | StateCondition
  | NumericStateCondition
  | ScreenCondition
  | TimeCondition
  | LogicCondition;

/**
 * Entity State Condition
 * Check if entity matches specific state
 */
export interface StateCondition {
  id: string;
  type: 'state';
  entity: string;
  state: string;
  not?: boolean; // Invert condition (default: false)
}

/**
 * Numeric State Condition
 * Check if numeric entity is within range
 */
export interface NumericStateCondition {
  id: string;
  type: 'numeric_state';
  entity: string;
  above?: number;
  below?: number;
}

/**
 * Screen Size Condition
 * Responsive visibility based on viewport
 */
export interface ScreenCondition {
  id: string;
  type: 'screen';
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
}

/**
 * Time-Based Condition
 * Show widget during specific time periods
 */
export interface TimeCondition {
  id: string;
  type: 'time';
  after?: string; // '06:00' format
  before?: string; // '22:00' format
  weekday?: number[]; // [1,2,3,4,5] = Mon-Fri, 0=Sunday, 6=Saturday
}

/**
 * Logic Gate Condition
 * Combine multiple conditions with AND/OR
 */
export interface LogicCondition {
  id: string;
  type: 'and' | 'or';
  conditions: Condition[];
}
