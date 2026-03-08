/**
 * Shared TypeScript types for Canvas UI
 */

import type { FlowDefinition } from './flow';
import type { VisibilityConfig } from './visibility';

export interface CanvasConfig {
  version: string;
  views: ViewConfig[];  // Array, not Record
  settings: CanvasSettings;
  canvasVariables?: Record<string, CanvasVariable>; // Global variables for flows/bindings
  flows?: Record<string, FlowDefinition>; // Visual programming flows (Phase 3)
}

export interface ViewConfig {
  id: string;
  name: string;
  style: ViewStyle;
  widgets: WidgetConfig[];
  // View sizing (optional - for boundary guide in edit mode)
  resolution?: 'none' | 'user' | string;  // 'none', 'user', or preset like '1920x1080'
  sizex?: number;  // Width in pixels
  sizey?: number;  // Height in pixels
}

export interface ViewStyle {
  backgroundColor: string;
  backgroundOpacity: number;
  backgroundImage?: string;
}

export interface WidgetConfig {
  id: string;
  type: string;
  name?: string; // User-friendly name for flow/binding references (optional)
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
    zIndex?: number;
  };
  config: Record<string, any>;
  bindings?: Record<string, string>;
  hiddenInEdit?: boolean; // Hide widget in edit mode (for working with overlapping layers)
  visibility?: VisibilityConfig; // Advanced conditional visibility (Phase 46)
}

export interface CanvasSettings {
  theme: 'light' | 'dark';
  language: string;
  gridSize?: number;
  snapToGrid?: boolean;
}

export interface EntityState {
  entity_id: string;
  state: string;
  attributes: Record<string, any>;
  last_changed: string;
  last_updated: string;
}

export interface HassConnection {
  callService: (domain: string, service: string, data?: any) => Promise<any>;
  subscribeEntities: (callback: (entities: Record<string, EntityState>) => void) => () => void;
  getStates: () => Promise<EntityState[]>;
  states: Record<string, EntityState>; // For lovelace card compatibility
  sendMessage?: (message: any) => Promise<any>; // For AI and other raw WebSocket calls
}

export interface WidgetProps {
  config: WidgetConfig;
  entityState?: EntityState;
  isEditMode: boolean;
  onUpdate?: (updates: Partial<WidgetConfig>) => void;
}

export interface CanvasVariable {
  name: string;
  type: 'number' | 'string' | 'boolean' | 'color' | 'datetime';
  value: any;
  persistent?: boolean; // Save across reloads (default: true)
  default?: any; // Default value if undefined
}

// Re-export visibility types
export type { Condition, LogicCondition, NumericStateCondition, ScreenCondition, StateCondition, TimeCondition, VisibilityConfig } from './visibility';

