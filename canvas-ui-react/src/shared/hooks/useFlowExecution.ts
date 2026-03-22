/**
 * useFlowExecution Hook
 * 
 * React hook for flow execution management.
 * Integrates the execution engine with React components and Canvas UI state.
 */

import { useCallback, useEffect, useRef } from 'react';
import { FlowTriggerManager } from '../flows/triggers';
import { useWebSocket } from '../providers/WebSocketProvider';
import { setGlobalHass, useConfigStore } from '../stores/useConfigStore';
import { useWidgetRuntimeStore } from '../stores/widgetRuntimeStore';
import type { FlowDefinition } from '../types/flow';

/**
 * Hook for managing flow execution
 */
export function useFlowExecution() {
  const { config, setVariable, listVariables } = useConfigStore();
  const { entities, hass } = useWebSocket();

  // Keep the module-level hass reference current so setVariable / deleteVariable
  // can auto-save to HA without requiring hass to be threaded through every caller.
  useEffect(() => {
    setGlobalHass(hass ?? null);
  }, [hass]);
  const { getWidgetState } = useWidgetRuntimeStore();
  const triggerManagerRef = useRef<FlowTriggerManager | null>(null);
  // Ref so the trigger manager always calls the latest callService without stale closure
  const callServiceRef = useRef<((domain: string, service: string, data?: any) => Promise<any>) | null>(null);

  useEffect(() => {
    callServiceRef.current = hass?.callService ?? null;
  }, [hass]);

  // Stable setWidget implementation — reads live state via getState() so no stale closures.
  // Used by both the trigger manager and the cross-iframe postMessage listener.
  const setWidgetImpl = useRef(async (widgetId: string, property: string, value: any, skipBubble = false) => {
    const { config: currentConfig, updateWidget: storeUpdateWidget } = useConfigStore.getState();

    // Find the widget across all views in this canvas instance
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
      // Widget not found in this canvas instance.
      // If we're running inside an embedded iframe, delegate to the parent canvas instance
      // via postMessage so the parent can apply the update to its own store.
      // This enables menu iframes to control widgets (e.g. content iframes) on the main view.
      if (!skipBubble && window.parent !== window) {
        window.parent.postMessage(
          { type: 'CANVAS_UI_SET_WIDGET', widgetId, property, value },
          window.location.origin
        );
      } else {
        console.error(`[Flow] Widget not found: ${widgetId}`, {
          searchedWidgets: currentConfig?.views.flatMap(v => v.widgets.map(w => w.id)),
        });
      }
      return;
    }

    // Parse property path (e.g. "config.text", "config.style.color", "runtime.value")
    const parts = property.split('.');

    if (parts[0] === 'config' && parts.length > 1) {
      // Special case: config.url on an IFrame widget.
      // Store in widgetRuntimeStore (ephemeral, not persisted to HA) so that repeated
      // same-URL clicks still force an iframe reload via the runtimeUrlTs nonce.
      // ALSO bubble to window.parent when inside an iframe — the full canvas config is shared
      // across all kiosk instances, so the widget may be FOUND locally but only RENDERED in
      // the parent canvas (e.g. a menu iframe can see the main view's content IFrame widget
      // in the config, but it isn't rendered there).  The parent canvas applies the update to
      // its own widgetRuntimeStore, which triggers the actual re-render.
      if (property === 'config.url') {
        useWidgetRuntimeStore.getState().setWidgetState(widgetId, {
          metadata: { runtimeUrl: value, runtimeUrlTs: Date.now() },
        });
        if (!skipBubble && window.parent !== window) {
          window.parent.postMessage(
            { type: 'CANVAS_UI_SET_WIDGET', widgetId, property, value },
            window.location.origin
          );
        }
        return;
      }

      // Build a PARTIAL update object for the nested property path — no mutation of existing refs.
      // e.g. 'config.style.backgroundColor' → { style: { backgroundColor: value } }
      // updateWidget handles the deep-merge of style (and top-level config props).
      let configUpdate: any = {};
      let target = configUpdate;
      for (let i = 1; i < parts.length - 1; i++) {
        target[parts[i]] = {};
        target = target[parts[i]];
      }
      target[parts[parts.length - 1]] = value;
      storeUpdateWidget(targetViewId, targetWidget.id, { config: configUpdate });
      // When running inside an iframe (e.g. a menu view), the target widget may be
      // rendered on the parent canvas rather than here — bubble to parent so it can
      // apply the same update to its own store and trigger a re-render there.
      if (!skipBubble && window.parent !== window) {
        window.parent.postMessage(
          { type: 'CANVAS_UI_SET_WIDGET', widgetId, property, value },
          window.location.origin
        );
      }
    } else if (parts[0] === 'runtime') {
      console.warn(`[Flow] Cannot set runtime property via set-widget: ${property}`);
    } else {
      // Direct top-level config property
      const newConfig = { ...targetWidget.config, [property]: value };
      storeUpdateWidget(targetViewId, targetWidget.id, { config: newConfig });
      if (!skipBubble && window.parent !== window) {
        window.parent.postMessage(
          { type: 'CANVAS_UI_SET_WIDGET', widgetId, property, value },
          window.location.origin
        );
      }
    }
  });

  // Listen for cross-iframe CANVAS_UI_SET_WIDGET messages posted by child canvas instances
  // (e.g. a menu iframe navigating a content iframe on the main view).
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== 'CANVAS_UI_SET_WIDGET') return;
      const { widgetId, property, value, relayed } = event.data;
      // Process locally — if this is a relayed message, suppress further bubbling up
      setWidgetImpl.current(widgetId, property, value, relayed === true);
      // Only relay to child iframes when this is the FIRST hop (not already a relay).
      // Stamping relayed:true on the forwarded message prevents infinite loops where
      // child iframes bubble back up and the parent relays again indefinitely.
      if (!relayed) {
        document.querySelectorAll('iframe').forEach((frame) => {
          try {
            frame.contentWindow?.postMessage(
              { type: 'CANVAS_UI_SET_WIDGET', widgetId, property, value, relayed: true },
              window.location.origin
            );
          } catch {
            // cross-origin frame — skip silently
          }
        });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Initialize trigger manager
  useEffect(() => {
    if (!triggerManagerRef.current) {
      triggerManagerRef.current = new FlowTriggerManager({
        setWidget: async (widgetId: string, property: string, value: any) => {
          await setWidgetImpl.current(widgetId, property, value);
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
    
    // Unregister ALL currently-registered flows (not just the ones in the new config).
    // Prevents stale runtime watchers from lingering when flows are deleted or disabled.
    manager.getFlowIds().forEach(flowId => {
      manager.unregisterFlow(flowId);
    });
    
    // Register enabled flows
    Object.values(flows).forEach((flow: FlowDefinition) => {
      if (flow.enabled) {
        manager.registerFlow(flow);
      }
    });
    
    const enabledCount = Object.values(flows).filter((f: FlowDefinition) => f.enabled).length;
    console.log(`[Flow] ${enabledCount} enabled flow(s) registered`);
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
