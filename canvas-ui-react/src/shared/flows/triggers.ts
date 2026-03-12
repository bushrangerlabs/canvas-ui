/**
 * Flow Trigger System
 * 
 * Monitors widget properties, entity states, and canvas variables for changes.
 * Automatically executes flows when trigger conditions are met.
 */

import type { WidgetRuntimeState } from '../stores/widgetRuntimeStore';
import type { FlowDefinition, FlowTriggerConfig } from '../types/flow';
import { executeFlow } from './executor';

/**
 * Runtime-toggleable debug logger for the flow system.
 * Enable in browser console: `(window as any).CANVAS_UI_FLOW_DEBUG = true`
 * Works in both dev and production HACS builds.
 */
const flowLog = (...args: any[]) => {
  if (import.meta.env.DEV || (window as any).CANVAS_UI_FLOW_DEBUG) {
    console.log(...args);
  }
};

/**
 * Trigger listener callback
 */
type TriggerListener = (flow: FlowDefinition) => void;

/**
 * Trigger manager class
 */
export class FlowTriggerManager {
  private flows: Map<string, FlowDefinition> = new Map();
  private listeners: Map<string, Set<TriggerListener>> = new Map();
  private intervalTimers: Map<string, number> = new Map();
  private runtimeWatchers: Map<string, number> = new Map(); // Polling timers for runtime property changes
  private flowDebounceTimers: Map<string, ReturnType<typeof setTimeout>> = new Map(); // Debounce: coalesces rapid successive fires
  
  // External dependencies
  private widgets: Record<string, any> = {};
  private entities: Record<string, any> = {};
  private variables: Record<string, any> = {};
  private previousWidgets: Record<string, any> = {};
  private previousEntities: Record<string, any> = {};
  private previousVariables: Record<string, any> = {};
  private previousRuntimeStates: Record<string, Record<string, any>> = {}; // Track previous runtime states per widget
  
  // Startup suppression: suppress trigger firing for 500ms after the most recent
  // flow registration. Reset on every registerFlow() call so that slow HA config
  // loads (arriving after the original timer would have expired) are still suppressed.
  // After the last registration + 500ms, all genuine changes fire normally.
  private _lastRegistrationTime: number = Date.now(); // treat construction as a registration
  private get _inStartupWindow(): boolean { return Date.now() < this._lastRegistrationTime + 500; }
  
  // Callbacks for flow execution
  private setWidget: (widgetId: string, property: string, value: any) => Promise<void>;
  private setVariable: (name: string, value: any) => void;
  private callService: (domain: string, service: string, data: any) => Promise<void>;
  private getRuntimeState: (widgetId: string) => WidgetRuntimeState | null;
  
  constructor(callbacks: {
    setWidget: (widgetId: string, property: string, value: any) => Promise<void>;
    setVariable: (name: string, value: any) => void;
    callService: (domain: string, service: string, data: any) => Promise<void>;
    getRuntimeState: (widgetId: string) => WidgetRuntimeState | null;
  }) {
    this.setWidget = callbacks.setWidget;
    this.setVariable = callbacks.setVariable;
    this.callService = callbacks.callService;
    this.getRuntimeState = callbacks.getRuntimeState;
  }
  
  /**
   * Register a flow with its triggers
   */
  registerFlow(flow: FlowDefinition): void {
    if (!flow.enabled) {
      flowLog(`[FlowTrigger] Skipping disabled flow: ${flow.name}`);
      return; // Don't register disabled flows
    }
    
    flowLog(`[FlowTrigger] Registering flow: "${flow.name}" (${flow.id}) with ${flow.triggers.length} trigger(s)`);
    // Reset startup window so that the React updateWidgets/updateVariables effects
    // which fire immediately after this registration are still suppressed (500ms).
    this._lastRegistrationTime = Date.now();
    console.log(`[Flow] Registered: "${flow.name}" (${this.flows.size + 1} total, window resets)`);
    this.flows.set(flow.id, flow);
    
    // Set up triggers
    flow.triggers.forEach(trigger => {
      flowLog(`[FlowTrigger] Setting up trigger type: ${trigger.type}`, trigger.config);
      this.setupTrigger(flow, trigger);
    });
  }
  
  /**
   * Unregister a flow and remove its triggers
   */
  unregisterFlow(flowId: string): void {
    const flow = this.flows.get(flowId);
    if (!flow) return;
    
    // Clean up interval timers
    const timer = this.intervalTimers.get(flowId);
    if (timer) {
      clearInterval(timer);
      this.intervalTimers.delete(flowId);
    }
    
    // Clean up runtime watchers for this flow
    flow.triggers.forEach(trigger => {
      if (trigger.type === 'widget-change' && trigger.config?.widgetId) {
        const watcherKey = `${flowId}:${trigger.config.widgetId}`;
        const timer = this.runtimeWatchers.get(watcherKey);
        if (timer) {
          clearInterval(timer);
          this.runtimeWatchers.delete(watcherKey);
        }
      }
    });
    
    // Remove listeners
    this.listeners.delete(flowId);
    this.flows.delete(flowId);
    
    // Clear any pending debounce timer for this flow
    const debounceTimer = this.flowDebounceTimers.get(flowId);
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      this.flowDebounceTimers.delete(flowId);
    }
  }
  
  /**
   * Set up a specific trigger
   */
  private setupTrigger(flow: FlowDefinition, trigger: FlowTriggerConfig): void {
    switch (trigger.type) {
      case 'time-interval': {
        const interval = trigger.config?.interval || 60000; // Default 1 minute
        
        const timer = setInterval(() => {
          this.executeFlow(flow);
        }, interval);
        
        this.intervalTimers.set(flow.id, timer);
        break;
      }
      
      case 'widget-change': {
        // Set up polling for runtime property changes
        const widgetId = trigger.config?.widgetId;
        const property = trigger.config?.property;
        
        flowLog(`[FlowTrigger] widget-change trigger: widgetId=${widgetId}, property=${property}`);
        
        if (widgetId && property?.startsWith('runtime.')) {
          // This is a runtime property (e.g., runtime.value)
          // Poll the runtime store periodically
          const watcherKey = `${flow.id}:${widgetId}`;
          
          flowLog(`[FlowTrigger] Starting runtime property monitoring for ${widgetId}.${property}`);
          
          // Initialize previous state
          if (!this.previousRuntimeStates[widgetId]) {
            const currentState = this.getRuntimeState(widgetId);
            flowLog(`[FlowTrigger] Initial runtime state for ${widgetId}:`, currentState);
            this.previousRuntimeStates[widgetId] = currentState ? { ...currentState } : {};
          }
          
          // Poll every 100ms for runtime changes
          const timer = setInterval(() => {
            const currentState = this.getRuntimeState(widgetId);
            const previousState = this.previousRuntimeStates[widgetId];
            
            if (currentState) {
              // Extract the runtime property name (e.g., "value" from "runtime.value")
              const runtimeProp = property.replace('runtime.', '');
              
              const oldValue = previousState?.[runtimeProp];
              const newValue = (currentState as any)[runtimeProp];
              
              if (newValue !== undefined && oldValue !== newValue) {
                if (oldValue === undefined) {
                  // Widget just initialized its runtime state for the first time —
                  // this is NOT a user-driven change, just seed the baseline silently.
                  flowLog(`[FlowTrigger] SEED (not firing): ${widgetId}.${property} initialized to ${newValue}`);
                } else {
                  // Genuine change from a known previous value → fire the flow
                  flowLog(`[FlowTrigger] FIRE: runtime change ${widgetId}.${property}: ${oldValue} → ${newValue}, triggering flow "${flow.name}"`);
                  this.debouncedExecuteFlow(flow);
                }
                // Either way, update previous state so next real change is detected
                this.previousRuntimeStates[widgetId] = { ...currentState };
              }
            }
          }, 100); // Poll every 100ms
          
          flowLog(`[FlowTrigger] Runtime watcher started for ${widgetId}.${property} (timer ${timer})`);
          this.runtimeWatchers.set(watcherKey, timer);
        } else {
          flowLog(`[FlowTrigger] widget-change: not a runtime property — config-level changes handled in updateWidgets()`);
        }
        break;
      }
      
      case 'manual':
        // Manual triggers are handled by explicit executeFlow calls
        break;
      
      default:
        // Other triggers (entity-change, variable-change) are handled by update methods
        break;
    }
  }
  
  /**
   * Update widget states and check for triggers
   */
  updateWidgets(newWidgets: Record<string, any>): void {
    this.widgets = newWidgets;
    
    // During startup window — just seed baseline, don't fire any triggers.
    // _inStartupWindow is true for 500ms after the last registerFlow() call, so
    // it extends automatically when HA config re-registers flows after a slow load.
    if (this._inStartupWindow) {
      flowLog('[FlowTrigger] updateWidgets: inside startup window — seeding baseline, NOT firing');
      this.previousWidgets = { ...newWidgets };
      return;
    }
    
    // Check each flow's widget-change triggers
    this.flows.forEach(flow => {
      flow.triggers.forEach(trigger => {
        if (trigger.type === 'widget-change') {
          const widgetId = trigger.config?.widgetId;
          const property = trigger.config?.property;
          
          if (!widgetId) return;
          
          const oldWidget = this.previousWidgets[widgetId];
          const newWidget = newWidgets[widgetId];
          
          if (!oldWidget || !newWidget) return;
          
          // Check if property changed
          if (property) {
            const oldValue = this.getPropertyValue(oldWidget, property);
            const newValue = this.getPropertyValue(newWidget, property);
            
            if (oldValue !== newValue) {
              flowLog(`[FlowTrigger] FIRE: widget-change (config) ${widgetId}.${property}: ${JSON.stringify(oldValue)} → ${JSON.stringify(newValue)}, triggering flow "${flow.name}"`);
              this.debouncedExecuteFlow(flow);
            }
          } else {
            // No specific property - trigger on any widget change
            if (JSON.stringify(oldWidget) !== JSON.stringify(newWidget)) {
              flowLog(`[FlowTrigger] FIRE: widget-change (any) ${widgetId}, triggering flow "${flow.name}"`);
              this.debouncedExecuteFlow(flow);
            }
          }
        }
      });
    });
    
    this.previousWidgets = { ...newWidgets };
  }
  
  /**
   * Update entity states and check for triggers
   */
  updateEntities(newEntities: Record<string, any>): void {
    this.entities = newEntities;
    
    // Check each flow's entity-change triggers
    this.flows.forEach(flow => {
      flow.triggers.forEach(trigger => {
        if (trigger.type === 'entity-change') {
          const entityId = trigger.config?.entityId;
          
          if (!entityId) return;
          
          const oldEntity = this.previousEntities[entityId];
          const newEntity = newEntities[entityId];
          
          if (!oldEntity || !newEntity) return;
          
          // Check if state changed
          if (oldEntity.state !== newEntity.state) {
            flowLog(`[FlowTrigger] FIRE: entity-change ${entityId}: "${oldEntity.state}" → "${newEntity.state}", triggering flow "${flow.name}"`);
            this.debouncedExecuteFlow(flow);
          }
        }
      });
    });
    
    this.previousEntities = { ...newEntities };
  }
  
  /**
   * Update canvas variables and check for triggers
   */
  updateVariables(newVariables: Record<string, any>): void {
    this.variables = newVariables;
    
    // During startup window — just seed baseline, don't fire any triggers.
    if (this._inStartupWindow) {
      flowLog('[FlowTrigger] updateVariables: inside startup window — seeding baseline, NOT firing');
      this.previousVariables = { ...newVariables };
      return;
    }
    
    // Check each flow's variable-change triggers
    this.flows.forEach(flow => {
      flow.triggers.forEach(trigger => {
        if (trigger.type === 'variable-change') {
          const variableName = trigger.config?.variableName;
          
          if (!variableName) return;
          
          const oldValue = this.previousVariables[variableName];
          const newValue = newVariables[variableName];
          
          if (oldValue !== newValue) {
            flowLog(`[FlowTrigger] FIRE: variable-change "${variableName}": ${JSON.stringify(oldValue)} → ${JSON.stringify(newValue)}, triggering flow "${flow.name}"`);
            this.debouncedExecuteFlow(flow);
          }
        }
      });
    });
    
    this.previousVariables = { ...newVariables };
  }
  
  /**
   * Manually execute a flow (for manual triggers)
   */
  async manualExecute(flowId: string): Promise<void> {
    const flow = this.flows.get(flowId);
    if (!flow) {
      console.error(`Flow not found: ${flowId}`);
      return;
    }
    
    await this.executeFlow(flow);
  }
  
  /** Returns IDs of all currently registered flows — useful for diagnostics. */
  getFlowIds(): string[] { return Array.from(this.flows.keys()); }

  /**
   * Schedule a debounced flow execution.
   * Multiple calls within DEBOUNCE_MS (50ms) are coalesced into one execution,
   * using the latest trigger context. This prevents rapid-fire widget state changes
   * (e.g. color picker initializing) from running the flow multiple times.
   */
  private static readonly DEBOUNCE_MS = 50;

  private debouncedExecuteFlow(flow: FlowDefinition): void {
    const existing = this.flowDebounceTimers.get(flow.id);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      this.flowDebounceTimers.delete(flow.id);
      this.executeFlow(flow);
    }, FlowTriggerManager.DEBOUNCE_MS);
    this.flowDebounceTimers.set(flow.id, timer);
  }

  /**
   * Execute a flow
   */
  private async executeFlow(flow: FlowDefinition): Promise<void> {
    try {
      console.log(`[Flow] FIRED: "${flow.name}" (${flow.id})`);
      flowLog(`[FlowTrigger] ▶ Executing flow: "${flow.name}" (${flow.id})`);
      
      const result = await executeFlow(flow, {
        widgets: this.widgets,
        entities: this.entities,
        variables: this.variables,
        getRuntimeState: this.getRuntimeState,
        setWidget: this.setWidget,
        setVariable: this.setVariable,
        callService: this.callService,
      });
      
      if (result.status === 'error') {
        console.error(`[FlowTrigger] ✗ Flow failed: "${flow.name}"`, result.error);
      } else {
        flowLog(`[FlowTrigger] ✓ Flow complete: "${flow.name}" (${result.duration}ms)`);
      }
    } catch (error) {
      console.error(`[FlowTrigger] ✗ Error executing flow "${flow.name}":`, error);
    }
  }
  
  /**
   * Get a property value from an object using dot notation
   */
  private getPropertyValue(obj: any, property: string): any {
    const parts = property.split('.');
    let value = obj;
    
    for (const part of parts) {
      value = value?.[part];
    }
    
    return value;
  }
  
  /**
   * Clean up all triggers
   */
  cleanup(): void {
    // Clear all interval timers
    this.intervalTimers.forEach(timer => clearInterval(timer));
    this.intervalTimers.clear();
    
    // Clear all runtime watchers (100ms polling timers for widget-change triggers)
    this.runtimeWatchers.forEach(timer => clearInterval(timer));
    this.runtimeWatchers.clear();
    
    // Clear all pending debounce timers
    this.flowDebounceTimers.forEach(timer => clearTimeout(timer));
    this.flowDebounceTimers.clear();
    
    // Clear all flows
    this.flows.clear();
    this.listeners.clear();
  }
}
