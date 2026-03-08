/**
 * useFlowExecution Hook
 * 
 * React hook for flow execution management.
 * Integrates the execution engine with React components and Canvas UI state.
 */

import { useCallback, useEffect, useRef } from 'react';
import { FlowTriggerManager } from '../flows/triggers';
import { useWebSocket } from '../providers/WebSocketProvider';
import { useConfigStore } from '../stores/useConfigStore';
import { useWidgetRuntimeStore } from '../stores/widgetRuntimeStore';
import type { FlowDefinition } from '../types/flow';

/**
 * Hook for managing flow execution
 */
export function useFlowExecution() {
  const { config, updateWidget, setVariable, listVariables } = useConfigStore();
  const { entities, hass } = useWebSocket();
  const { getWidgetState } = useWidgetRuntimeStore();
  const triggerManagerRef = useRef<FlowTriggerManager | null>(null);
  // Ref so the trigger manager always calls the latest callService without stale closure
  const callServiceRef = useRef<((domain: string, service: string, data?: any) => Promise<any>) | null>(null);

  useEffect(() => {
    callServiceRef.current = hass?.callService ?? null;
  }, [hass]);

  // Initialize trigger manager
  useEffect(() => {
    if (!triggerManagerRef.current) {
      triggerManagerRef.current = new FlowTriggerManager({
        setWidget: async (widgetId: string, property: string, value: any) => {
          // Get current config from store (not from closure)
          const currentConfig = useConfigStore.getState().config;
          
          // Find the widget across all views
          let targetWidget: any = null;
          let targetViewId: string | null = null;
          
          currentConfig?.views.forEach(view => {
            const widget = view.widgets.find(w => w.id === widgetId || w.config?.name === widgetId);
            if (widget) {
              targetWidget = widget;
              targetViewId = view.id;
            }
          });
          
          if (!targetWidget || !targetViewId) {
            console.error(`Widget not found: ${widgetId}`, { 
              searchedWidgets: currentConfig?.views.flatMap(v => v.widgets.map(w => w.id)) 
            });
            return;
          }
          
          // Parse property path (e.g., "config.text" or "runtime.value")
          const parts = property.split('.');
          
          if (parts[0] === 'config' && parts.length > 1) {
            // Update widget config property
            const newConfig = { ...targetWidget.config };
            
            // Set nested property
            let target: any = newConfig;
            for (let i = 1; i < parts.length - 1; i++) {
              if (!target[parts[i]]) target[parts[i]] = {};
              target = target[parts[i]];
            }
            target[parts[parts.length - 1]] = value;
            
            updateWidget(targetViewId, targetWidget.id, { config: newConfig });
          } else if (parts[0] === 'runtime') {
            // Runtime properties can't be directly set - they're computed
            console.warn(`Cannot set runtime property: ${property}`);
          } else {
            // Direct config property
            const newConfig = { ...targetWidget.config, [property]: value };
            updateWidget(targetViewId, targetWidget.id, { config: newConfig });
          }
        },
        setVariable: (name: string, value: any) => {
          setVariable(name, value);
        },
        callService: async (domain: string, service: string, data: any) => {
          if (callServiceRef.current) {
            await callServiceRef.current(domain, service, data);
          } else {
            console.warn('[Flow] callService not available (WebSocket not connected)');
          }
        },
        getRuntimeState: (widgetId: string) => {
          return getWidgetState(widgetId);
        },
      });
    }
    
    return () => {
      triggerManagerRef.current?.cleanup();
      triggerManagerRef.current = null;
    };
  }, []);
  
  // Register all enabled flows
  useEffect(() => {
    const flows = config?.flows || {};
    const manager = triggerManagerRef.current;
    
    if (!manager) return;
    
    // Unregister all flows
    Object.keys(flows).forEach(flowId => {
      manager.unregisterFlow(flowId);
    });
    
    // Register enabled flows
    Object.values(flows).forEach((flow: FlowDefinition) => {
      if (flow.enabled) {
        manager.registerFlow(flow);
      }
    });
  }, [config?.flows]);
  
  // Update trigger manager when widgets change
  useEffect(() => {
    const manager = triggerManagerRef.current;
    if (!manager || !config) return;
    
    // Convert widgets array to record by ID and name
    const widgetRecord: Record<string, any> = {};
    config.views.forEach(view => {
      view.widgets.forEach(widget => {
        widgetRecord[widget.id] = widget;
        if (widget.config?.name) {
          widgetRecord[widget.config.name] = widget;
        }
      });
    });
    
    console.log('[useFlowExecution] Updating widgets, total:', Object.keys(widgetRecord).length);
    // console.log('[useFlowExecution] Widget IDs:', Object.keys(widgetRecord).filter(k => k.startsWith('widget-')));
    
    manager.updateWidgets(widgetRecord);
  }, [config?.views]);
  
  // Update trigger manager when entities change
  useEffect(() => {
    const manager = triggerManagerRef.current;
    if (!manager) return;
    
    manager.updateEntities(entities || {});
  }, [entities]);
  
  // Update trigger manager when variables change
  useEffect(() => {
    const manager = triggerManagerRef.current;
    if (!manager) return;
    
    const variables = listVariables();
    manager.updateVariables(variables || {});
  }, [listVariables]);
  
  // Manual flow execution
  const executeFlow = useCallback(async (flowId: string) => {
    const manager = triggerManagerRef.current;
    if (!manager) {
      console.error('Trigger manager not initialized');
      return;
    }
    
    await manager.manualExecute(flowId);
  }, []);
  
  return {
    executeFlow,
  };
}
