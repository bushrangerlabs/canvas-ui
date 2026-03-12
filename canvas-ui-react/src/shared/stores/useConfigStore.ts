/**
 * Configuration Store - Dual-save system (localStorage + HA file)
 * 
 * Manages canvas configuration with multi-device sync:
 * - Load: HA file first (synced across devices), localStorage fallback
 * - Save: BOTH localStorage (instant) AND HA file (async sync)
 */

import { create } from 'zustand';
import type { CanvasConfig, CanvasVariable, HassConnection, ViewConfig } from '../types';
import type { FlowDefinition } from '../types/flow';

export type ViewMode = 'edit' | 'preview' | 'kiosk';

interface ConfigState {
  config: CanvasConfig | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  currentViewId: string | null;
  mode: ViewMode;
  
  // Undo/Redo
  history: CanvasConfig[];
  historyIndex: number;
  
  // Actions
  loadConfig: (hass: HassConnection | null) => Promise<void>;
  saveConfig: (hass: HassConnection | null, config?: CanvasConfig) => Promise<void>;
  setCurrentView: (viewId: string) => void;
  setMode: (mode: ViewMode) => void;
  addView: (view: ViewConfig) => void;
  deleteView: (viewId: string) => void;
  duplicateView: (viewId: string) => void;
  cloneView: (viewId: string, newName: string) => void;
  updateView: (viewId: string, updates: Partial<ViewConfig>) => void;
  addWidget: (viewId: string, widget: any) => void;
  updateWidget: (viewId: string, widgetId: string, updates: any) => void;
  deleteWidget: (viewId: string, widgetId: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  // Canvas Variables CRUD (Phase 2 - Flow System)
  getVariable: (name: string) => any;
  setVariable: (name: string, value: any, type?: CanvasVariable['type']) => void;
  deleteVariable: (name: string) => void;
  listVariables: () => Record<string, CanvasVariable>;
  
  // Flows CRUD (Phase 3 - Visual Programming)
  getFlow: (flowId: string) => FlowDefinition | undefined;
  setFlow: (flow: FlowDefinition) => void;
  deleteFlow: (flowId: string) => void;
  listFlows: () => Record<string, FlowDefinition>;
  
  // View Export/Import (Phase 41 - View Management)
  exportView: (viewId: string) => void;
  importView: (file: File) => Promise<void>;
  
  // Flow Export/Import (Phase 48 - Flow Management)
  exportFlow: (flowId: string) => void;
  exportAllFlows: () => void;
  importFlow: (file: File) => Promise<void>;
}

const LOCALSTORAGE_KEY = 'canvas-ui-react-config';  // Separate key

// Module-level hass reference — set by useFlowExecution (runs in both edit and runtime)
// Allows setVariable / deleteVariable to auto-save without needing hass passed as argument
let _hassRef: HassConnection | null = null;
let _variableSaveTimer: ReturnType<typeof setTimeout> | null = null;
let _widgetSaveTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Call this from any React context that has a hass reference.
 * useFlowExecution calls this automatically for both Edit and Runtime modes.
 */
export const setGlobalHass = (hass: HassConnection | null) => {
  _hassRef = hass;
};

// Universal style properties that AI may place flat in config (should be in style object)
const UNIVERSAL_STYLE_PROPS = new Set([
  'backgroundColor', 'backgroundImage', 'backgroundSize', 'backgroundPosition',
  'backgroundRepeat', 'borderWidth', 'borderColor', 'borderRadius', 'borderStyle',
  'boxShadow', 'shadowColor', 'shadowX', 'shadowY', 'shadowBlur', 'opacity',
]);

// Normalize config to ensure all widgets have style objects.
// Migrates flat universal style properties (from AI-generated configs) into widget.config.style.
const normalizeConfig = (config: CanvasConfig): CanvasConfig => {
  return {
    ...config,
    views: config.views.map(view => ({
      ...view,
      widgets: view.widgets.map(widget => {
        // Start with existing style object (inspector-set values take precedence)
        const existingStyle: Record<string, any> = widget.config.style || {};
        const migratedStyle: Record<string, any> = { ...existingStyle };
        // Migrate any flat universal props that aren't already in the style object
        for (const prop of UNIVERSAL_STYLE_PROPS) {
          if (!(prop in migratedStyle) && prop in widget.config) {
            migratedStyle[prop] = (widget.config as any)[prop];
          }
        }
        // Backward compatibility: older AI-generated configs used strokeColor/strokeWidth/dashStyle
        // for border widgets instead of the correct borderColor/borderWidth/borderStyle.
        if (!migratedStyle.borderColor && 'strokeColor' in widget.config) {
          migratedStyle.borderColor = (widget.config as any).strokeColor;
        }
        if (!migratedStyle.borderWidth && 'strokeWidth' in widget.config) {
          const sw = (widget.config as any).strokeWidth;
          migratedStyle.borderWidth = typeof sw === 'string' ? (parseInt(sw, 10) || 2) : sw;
        }
        if (!migratedStyle.borderStyle && 'dashStyle' in widget.config) {
          migratedStyle.borderStyle = (widget.config as any).dashStyle;
        }
        return {
          ...widget,
          config: {
            ...widget.config,
            style: migratedStyle,
          },
        };
      }),
    })),
  };
};

// URL hash utilities (hash-based routing for clean URLs)
export const getModeFromURL = (): ViewMode => {
  const hash = window.location.hash.substring(1); // Remove #
  if (hash.startsWith('edit=')) return 'edit';
  if (hash.startsWith('preview=')) return 'preview';
  if (hash.startsWith('kiosk=')) return 'kiosk';
  return 'edit'; // Default
};

export const getViewFromURL = (): string | null => {
  const hash = window.location.hash.substring(1); // Remove #
  const match = hash.match(/^(edit|preview|kiosk)=(.+)$/);
  return match ? match[2] : null;
};

export const syncURLToMode = (mode: ViewMode, viewId: string | null) => {
  if (viewId) {
    window.location.hash = `${mode}=${viewId}`;
  } else {
    window.location.hash = '';
  }
};

const getDefaultConfig = (): CanvasConfig => ({
  version: '2.0.0',
  views: [
    {
      id: 'demo-view',
      name: 'Demo View',
      style: {
        backgroundColor: '#1a1a1a',
        backgroundOpacity: 1,
      },
      widgets: [
        // Demo button widget
        {
          id: 'demo-button-1',
          type: 'button',
          position: { x: 50, y: 50, width: 200, height: 60, zIndex: 1 },
          config: {
            label: 'Toggle Light',
            service_domain: 'light',
            service_name: 'toggle',
            service_data: { entity_id: 'light.living_room' },
            backgroundColor: '#2196f3',
            textColor: '#ffffff',
            fontSize: '16px',
            borderRadius: '8px',
          },
          bindings: {},
        },
        // Demo text widget
        {
          id: 'demo-text-1',
          type: 'text',
          position: { x: 300, y: 50, width: 200, height: 60, zIndex: 1 },
          config: {
            text: 'React Canvas UI',
            entity: 'sensor.temperature',
            unit: '°C',
            fontSize: '24px',
            textColor: '#ffffff',
            textAlign: 'center',
          },
          bindings: {},
        },
        // Demo gauge widget
        {
          id: 'demo-gauge-1',
          type: 'gauge',
          position: { x: 550, y: 30, width: 300, height: 300, zIndex: 1 },
          config: {
            entity: 'sensor.temperature',
            min: 0,
            max: 100,
            unit: '°C',
            gaugeType: 'radial',
          },
          bindings: {},
        },
      ],
    },
  ],
  settings: {
    theme: 'dark',
    language: 'en',
  },
});

export const useConfigStore = create<ConfigState>((set, get) => ({
  config: null,
  loading: false,
  saving: false,
  error: null,
  currentViewId: null,
  mode: getModeFromURL(),
  history: [],
  historyIndex: -1,

  // Helper to save to localStorage
  _saveToLocalStorage: (config: CanvasConfig) => {
    try {
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('[ConfigStore] Failed to save to localStorage:', error);
    }
  },

  // Helper to add to history
  _addToHistory: (config: CanvasConfig) => {
    const { history, historyIndex } = get();
    // Remove any redo history when making a new change
    const newHistory = history.slice(0, historyIndex + 1);
    // Add new state
    newHistory.push(JSON.parse(JSON.stringify(config))); // Deep clone
    // Keep only last 50 states
    if (newHistory.length > 50) {
      newHistory.shift();
    }
    set({ 
      history: newHistory, 
      historyIndex: newHistory.length - 1 
    });
    // Save to localStorage immediately
    (get() as any)._saveToLocalStorage(config);
  },

  // Load config: localStorage first (fast), then sync from HA (authoritative)
  loadConfig: async (hass) => {
    set({ loading: true, error: null });

    try {
      // 1. Load from localStorage FIRST (instant, no waiting)
      const cached = localStorage.getItem(LOCALSTORAGE_KEY);
      if (cached) {
        const cachedConfig = normalizeConfig(JSON.parse(cached));
        
        // Debug: Check if any widgets have style properties (only on load)
        const widgetsWithStyles = cachedConfig.views.flatMap(v => v.widgets).filter(w => w.config.style && Object.keys(w.config.style).length > 0);
        if (widgetsWithStyles.length > 0) {
          if (import.meta.env.DEV) console.log('[ConfigStore] localStorage has widgets with styles:', widgetsWithStyles.map(w => ({ id: w.id, type: w.type, style: w.config.style })));
        }
        
        set({ 
          config: cachedConfig, 
          loading: false,
          currentViewId: cachedConfig.views[0]?.id || 'demo-view',
          history: [JSON.parse(JSON.stringify(cachedConfig))],
          historyIndex: 0,
        });
        console.log('[ConfigStore] ✅ Loaded from localStorage (fast)');
      }

      // 2. Then load from HA file (authoritative, syncs across devices)
      if (hass) {
        try {
          if (import.meta.env.DEV) console.log('[ConfigStore] 📡 Requesting config from HA file...');
          const response = await hass.callService('canvas_ui', 'read_file', {
            path: 'www/canvas-ui/canvas-ui-config.json',
            return_response: true,
          });

          if (import.meta.env.DEV) console.log('[ConfigStore] HA response:', response);

          // HA service returns: {success: true, result: {response: {data: "...", exists: true}}}
          const serviceResult = response?.result?.response || response?.response;
          if (import.meta.env.DEV) console.log('[ConfigStore] Service result:', serviceResult);
          
          if (serviceResult?.exists && serviceResult?.data) {
            const haConfig = normalizeConfig(JSON.parse(serviceResult.data));
            
            // Debug: Check if HA file has styles
            const haWidgetsWithStyles = haConfig.views.flatMap(v => v.widgets).filter(w => w.config.style && Object.keys(w.config.style).length > 0);
            if (haWidgetsWithStyles.length > 0) {
              if (import.meta.env.DEV) console.log('[ConfigStore] HA file has widgets with styles:', haWidgetsWithStyles.map(w => ({ id: w.id, type: w.type, style: w.config.style })));
            }
            
            // Update with HA config (authoritative)
            localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(haConfig));
            
            set({ 
              config: haConfig, 
              loading: false,
              currentViewId: haConfig.views[0]?.id || 'demo-view',
              history: [JSON.parse(JSON.stringify(haConfig))],
              historyIndex: 0,
            });
            console.log('[ConfigStore] ✅ Loaded from HA file (authoritative)');
            return;
          } else if (serviceResult?.exists === false) {
            if (import.meta.env.DEV) console.log('[ConfigStore] 📄 Config file does not exist yet - will be created on first save');
          } else {
            console.warn('[ConfigStore] ⚠️ Unexpected HA response structure:', response);
            console.warn('[ConfigStore] Service result was:', serviceResult);
          }
        } catch (error: any) {
          console.warn('[ConfigStore] ⚠️ Failed to load from HA file:', error.message || error);
          console.warn('[ConfigStore] ⚠️ This is normal if canvas_ui services are not yet available');
          console.warn('[ConfigStore] ⚠️ Please restart Home Assistant to activate canvas_ui custom component');
          // If we already loaded from localStorage, that's OK
          if (cached) {
            if (import.meta.env.DEV) console.log('[ConfigStore] ✅ Using localStorage version (HA file not available)');
            return;
          }
        }
      } else {
        if (import.meta.env.DEV) console.log('[ConfigStore] No HASS connection available');
      }

      // 3. If we have localStorage data but no HA, we're done
      if (cached) {
        return;
      }

      // 4. Last resort: Use default demo config
      const defaultConfig = getDefaultConfig();
      set({ 
        config: defaultConfig, 
        loading: false,
        currentViewId: 'demo-view',
        history: [JSON.parse(JSON.stringify(defaultConfig))],
        historyIndex: 0,
      });
      if (import.meta.env.DEV) console.log('[ConfigStore] Using default configuration');

    } catch (error: any) {
      console.error('[ConfigStore] Load error:', error);
      set({ error: error.message, loading: false });
      
      // Still try to use default
      const defaultConfig = getDefaultConfig();
      set({ config: defaultConfig, currentViewId: 'demo-view' });
    }
  },

  // Save config: BOTH localStorage (instant) AND HA file (syncs across devices)
  saveConfig: async (hass, configOverride) => {
    const currentConfig = configOverride || get().config;
    if (!currentConfig) {
      console.warn('[ConfigStore] No config to save');
      return;
    }

    set({ saving: true });

    try {
      // 1. Save to localStorage immediately (instant UX, offline support)
      if (import.meta.env.DEV) console.log('[ConfigStore] 💾 Saving to localStorage...');
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(currentConfig));
      console.log('[ConfigStore] ✅ Saved to localStorage successfully');

      // 2. Save to HA file (primary storage, syncs across browsers/devices)
      if (hass) {
        try {
          if (import.meta.env.DEV) console.log('[ConfigStore] 💾 Saving to HA file...');
          await hass.callService('canvas_ui', 'write_file', {
            path: 'www/canvas-ui/canvas-ui-config.json',
            data: JSON.stringify(currentConfig, null, 2),
          });
          console.log('[ConfigStore] ✅ Saved to HA file successfully');
        } catch (error: any) {
          console.error('[ConfigStore] ⚠️ Failed to save to HA file:', error.message || error);
          console.error('[ConfigStore] ⚠️ Config saved to localStorage only');
          console.error('[ConfigStore] ⚠️ To enable cross-device sync, restart Home Assistant');
          // Still successful locally - will retry on next save
        }
      } else {
        if (import.meta.env.DEV) console.log('[ConfigStore] No HASS connection - saved to localStorage only');
      }

      set({ saving: false, config: currentConfig });

    } catch (error: any) {
      console.error('[ConfigStore] Save error:', error);
      set({ error: error.message, saving: false });
    }
  },

  // Set current view
  setCurrentView: (viewId) => {
    set({ currentViewId: viewId });
    const { mode } = get();
    syncURLToMode(mode, viewId);
  },
  
  // Set mode
  setMode: (mode) => {
    set({ mode });
    const { currentViewId } = get();
    syncURLToMode(mode, currentViewId);
  },

  // Add new view
  addView: (view) => {
    const config = get().config;
    if (!config) return;

    const updatedConfig = {
      ...config,
      views: [...config.views, view],
    };

    set({ config: updatedConfig, currentViewId: view.id });
    (get() as any)._addToHistory(updatedConfig);
  },

  // Delete view
  deleteView: (viewId) => {
    const config = get().config;
    if (!config || config.views.length <= 1) return; // Can't delete last view

    const updatedViews = config.views.filter(v => v.id !== viewId);
    const updatedConfig = {
      ...config,
      views: updatedViews,
    };

    // If deleting current view, switch to first view
    const newCurrentViewId = get().currentViewId === viewId 
      ? updatedViews[0]?.id 
      : get().currentViewId;

    set({ config: updatedConfig, currentViewId: newCurrentViewId });
    (get() as any)._addToHistory(updatedConfig);
  },

  // Duplicate view
  duplicateView: (viewId) => {
    const config = get().config;
    if (!config) return;

    const sourceView = config.views.find(v => v.id === viewId);
    if (!sourceView) return;

    const newView: ViewConfig = {
      ...JSON.parse(JSON.stringify(sourceView)), // Deep clone
      id: `${viewId}-copy-${Date.now()}`,
      name: `${sourceView.name} (Copy)`,
      widgets: sourceView.widgets.map(w => ({
        ...w,
        id: `${w.id}-copy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      })),
    };

    const updatedConfig = {
      ...config,
      views: [...config.views, newView],
    };

    set({ config: updatedConfig, currentViewId: newView.id });
    (get() as any)._addToHistory(updatedConfig);
  },

  // Clone view with custom name
  cloneView: (viewId, newName) => {
    const config = get().config;
    if (!config) return;

    const sourceView = config.views.find(v => v.id === viewId);
    if (!sourceView) return;

    const newView: ViewConfig = {
      ...JSON.parse(JSON.stringify(sourceView)), // Deep clone
      id: `${viewId.replace(/[^a-zA-Z0-9-]/g, '-')}-${Date.now()}`,
      name: newName,
      widgets: sourceView.widgets.map(w => ({
        ...w,
        id: `${w.id}-clone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      })),
    };

    const updatedConfig = {
      ...config,
      views: [...config.views, newView],
    };

    set({ config: updatedConfig, currentViewId: newView.id });
    (get() as any)._addToHistory(updatedConfig);
  },

  // Update view settings
  updateView: (viewId, updates) => {
    const config = get().config;
    if (!config) return;
    
    const viewIndex = config.views.findIndex(v => v.id === viewId);
    if (viewIndex === -1) return;

    const updatedViews = [...config.views];
    updatedViews[viewIndex] = {
      ...updatedViews[viewIndex],
      ...updates,
    };

    const updatedConfig = {
      ...config,
      views: updatedViews,
    };

    set({ config: updatedConfig });
    (get() as any)._addToHistory(updatedConfig);
  },

  // Add widget
  addWidget: (viewId, widget) => {
    const config = get().config;
    if (!config) return;
    
    const viewIndex = config.views.findIndex(v => v.id === viewId);
    if (viewIndex === -1) return;

    const updatedViews = [...config.views];
    updatedViews[viewIndex] = {
      ...updatedViews[viewIndex],
      widgets: [...updatedViews[viewIndex].widgets, widget],
    };

    const updatedConfig = {
      ...config,
      views: updatedViews,
    };

    set({ config: updatedConfig });
    (get() as any)._addToHistory(updatedConfig);
  },

  // Update widget
  updateWidget: (viewId, widgetId, updates) => {
    const config = get().config;
    if (!config) return;
    
    const viewIndex = config.views.findIndex(v => v.id === viewId);
    if (viewIndex === -1) return;

    const updatedViews = [...config.views];
    updatedViews[viewIndex] = {
      ...updatedViews[viewIndex],
      widgets: updatedViews[viewIndex].widgets.map((w) =>
        w.id === widgetId ? {
          ...w,
          ...updates,
          // Deep merge config - handle nested objects
          config: updates.config ? { 
            ...w.config, 
            ...updates.config,
            // Deep merge style property if it exists in updates
            style: updates.config.style !== undefined ? {
              ...(w.config.style || {}),
              ...updates.config.style,
            } : w.config.style,
          } : w.config,
          position: updates.position ? { ...w.position, ...updates.position } : w.position,
        } : w
      ),
    };

    // Debug: Log style updates only when they happen
    if (updates.config?.style) {
      if (import.meta.env.DEV) console.log('[ConfigStore] Style updated for widget:', widgetId, updates.config.style);
    }

    const updatedConfig = {
      ...config,
      views: updatedViews,
    };

    set({ config: updatedConfig });
    // Save to localStorage immediately
    (get() as any)._saveToLocalStorage(updatedConfig);
    // Debounced HA file save — waits 2s after the last change before writing.
    // Ensures flow-driven widget updates (e.g. color picker → backgroundColor)
    // survive page reloads and sync across devices, without hammering the HA API
    // during rapid drag/resize or fast flows.
    if (_widgetSaveTimer) clearTimeout(_widgetSaveTimer);
    _widgetSaveTimer = setTimeout(() => {
      _widgetSaveTimer = null;
      (get() as any).saveConfig(_hassRef, updatedConfig);
    }, 2000);
  },

  // Delete widget
  deleteWidget: (viewId, widgetId) => {
    const config = get().config;
    if (!config) return;
    
    const viewIndex = config.views.findIndex(v => v.id === viewId);
    if (viewIndex === -1) return;

    const updatedViews = [...config.views];
    updatedViews[viewIndex] = {
      ...updatedViews[viewIndex],
      widgets: updatedViews[viewIndex].widgets.filter((w) => w.id !== widgetId),
    };

    const updatedConfig = {
      ...config,
      views: updatedViews,
    };

    set({ config: updatedConfig });
    (get() as any)._addToHistory(updatedConfig);
  },

  // Undo
  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const config = JSON.parse(JSON.stringify(history[newIndex]));
      set({ config, historyIndex: newIndex });
      // Save to localStorage
      (get() as any)._saveToLocalStorage(config);
    }
  },

  // Redo
  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const config = JSON.parse(JSON.stringify(history[newIndex]));
      set({ config, historyIndex: newIndex });
      // Save to localStorage
      (get() as any)._saveToLocalStorage(config);
    }
  },

  // Can undo?
  canUndo: () => {
    const { historyIndex } = get();
    return historyIndex > 0;
  },

  // Can redo?
  canRedo: () => {
    const { history, historyIndex } = get();
    return historyIndex < history.length - 1;
  },

  // Canvas Variables CRUD (Phase 2 - Flow System)
  getVariable: (name: string) => {
    const { config } = get();
    if (!config?.canvasVariables) return undefined;
    return config.canvasVariables[name]?.value;
  },

  setVariable: (name: string, value: any, type: CanvasVariable['type'] = 'string') => {
    const { config } = get();
    if (!config) return;

    const updatedConfig = {
      ...config,
      canvasVariables: {
        ...(config.canvasVariables || {}),
        [name]: {
          name,
          type,
          value,
          persistent: true,
        } as CanvasVariable,
      },
    };

    set({ config: updatedConfig });
    (get() as any)._addToHistory(updatedConfig);

    // Debounced HA file save — waits 2s after the last change before writing.
    // Keeps rapid flow-driven updates (e.g. calculator) from hammering the HA API
    // while still persisting values across browsers and page reloads.
    if (_variableSaveTimer) clearTimeout(_variableSaveTimer);
    _variableSaveTimer = setTimeout(() => {
      _variableSaveTimer = null;
      (get() as any).saveConfig(_hassRef, updatedConfig);
    }, 2000);
  },

  deleteVariable: (name: string) => {
    const { config } = get();
    if (!config?.canvasVariables) return;

    const { [name]: deleted, ...remaining } = config.canvasVariables;
    const updatedConfig = {
      ...config,
      canvasVariables: remaining,
    };

    set({ config: updatedConfig });
    (get() as any)._addToHistory(updatedConfig);

    // Immediate save — deletions are infrequent design-time operations
    if (_variableSaveTimer) { clearTimeout(_variableSaveTimer); _variableSaveTimer = null; }
    (get() as any).saveConfig(_hassRef, updatedConfig);
  },

  listVariables: () => {
    const { config } = get();
    return config?.canvasVariables || {};
  },

  // Flows CRUD (Phase 3 - Visual Programming)
  getFlow: (flowId: string) => {
    const { config } = get();
    return config?.flows?.[flowId];
  },

  setFlow: (flow: FlowDefinition) => {
    const { config } = get();
    if (!config) return;

    if (import.meta.env.DEV) console.log('[ConfigStore setFlow] Updating flow:', {
      flowId: flow.id,
      nodeCount: flow.nodes?.length,
      sampleNodeConfig: flow.nodes?.[0]?.data?.config
    });

    const updatedConfig = {
      ...config,
      flows: {
        ...(config.flows || {}),
        [flow.id]: {
          ...flow,
          metadata: {
            createdAt: flow.metadata?.createdAt || Date.now(),
            updatedAt: Date.now(),
            lastRun: flow.metadata?.lastRun,
            executionCount: flow.metadata?.executionCount,
          },
        },
      },
    };

    set({ config: updatedConfig });
    (get() as any)._addToHistory(updatedConfig);
    
    if (import.meta.env.DEV) console.log('[ConfigStore setFlow] Flow updated in store');
  },

  deleteFlow: (flowId: string) => {
    const { config } = get();
    if (!config?.flows) return;

    const { [flowId]: deleted, ...remaining } = config.flows;
    const updatedConfig = {
      ...config,
      flows: remaining,
    };

    set({ config: updatedConfig });
    (get() as any)._addToHistory(updatedConfig);
  },

  listFlows: () => {
    const { config } = get();
    return config?.flows || {};
  },

  // View Export/Import (Phase 41 - View Management)
  exportView: (viewId: string) => {
    const { config } = get();
    if (!config) return;

    const view = config.views.find(v => v.id === viewId);
    if (!view) {
      console.error(`View not found: ${viewId}`);
      return;
    }

    // Import utilities dynamically to avoid circular dependencies
    import('../utils/viewExportImport').then(({ downloadViewAsJson }) => {
      downloadViewAsJson(view);
    });
  },

  importView: async (file: File) => {
    const { config } = get();
    if (!config) return;

    try {
      // Import utilities dynamically
      const { readJsonFile, importView } = await import('../utils/viewExportImport');
      
      // Read and parse file
      const exportedData = await readJsonFile(file);
      
      // Get existing IDs
      const existingViewIds = config.views.map(v => v.id);
      
      // Import with ID regeneration (UI only)
      const { view: newView } = importView(
        exportedData,
        existingViewIds
      );
      
      // Add imported view to config
      const updatedConfig = {
        ...config,
        views: [...config.views, newView],
      };
      
      // Update config and switch to imported view atomically
      set({ config: updatedConfig, currentViewId: newView.id });
      (get() as any)._addToHistory(updatedConfig);
      
      console.log(`✅ Imported view: ${newView.name} (${newView.widgets.length} widgets)`);
    } catch (error) {
      console.error('Failed to import view:', error);
      throw error;
    }
  },

  // Flow Export/Import (Phase 48 - Flow Management)
  exportFlow: (flowId: string) => {
    const { config } = get();
    if (!config) return;

    const flow = config.flows?.[flowId];
    if (!flow) {
      console.error(`Flow not found: ${flowId}`);
      return;
    }

    // Import utilities dynamically to avoid circular dependencies
    import('../utils/flowExportImport').then(({ downloadFlowAsJson, exportFlow }) => {
      const exportedData = exportFlow(flow, config.views);
      downloadFlowAsJson(exportedData);
    });
  },

  exportAllFlows: () => {
    const { config } = get();
    if (!config || !config.flows) return;

    // Import utilities dynamically
    import('../utils/flowExportImport').then(({ downloadFlowAsJson, exportAllFlows }) => {
      const exportedData = exportAllFlows(config.flows || {}, config.views);
      downloadFlowAsJson(exportedData);
    });
  },

  importFlow: async (file: File) => {
    const { config } = get();
    if (!config) return;

    try {
      // Import utilities dynamically
      const { readJsonFile, importFlows } = await import('../utils/flowExportImport');
      
      // Read and parse file
      const exportedData = await readJsonFile(file);
      
      // Get existing flow IDs
      const existingFlowIds = Object.keys(config.flows || {});
      
      // Import with ID regeneration
      const { flows: newFlows, widgetDependencies } = importFlows(
        exportedData,
        existingFlowIds
      );
      
      // Check for missing widget dependencies
      if (widgetDependencies.length > 0) {
        const allWidgetIds = config.views.flatMap(v => v.widgets.map(w => w.id));
        const missingWidgets = widgetDependencies.filter(
          dep => !allWidgetIds.includes(dep.widgetId)
        );
        
        if (missingWidgets.length > 0) {
          const widgetList = missingWidgets
            .map(dep => `  - ${dep.widgetName || dep.widgetId} (in ${dep.nodeType} node)`)
            .join('\n');
          
          console.warn(
            `⚠️ Flow references ${missingWidgets.length} missing widget(s):\n${widgetList}\n` +
            `You may need to update widget references in the Flow Builder.`
          );
        }
      }
      
      // Merge imported flows into config
      const updatedConfig = {
        ...config,
        flows: {
          ...(config.flows || {}),
          ...newFlows,
        },
      };
      
      set({ config: updatedConfig });
      (get() as any)._addToHistory(updatedConfig);
      
      const flowNames = Object.values(newFlows).map(f => f.name).join(', ');
      console.log(`✅ Imported ${Object.keys(newFlows).length} flow(s): ${flowNames}`);
    } catch (error) {
      console.error('Failed to import flow:', error);
      throw error;
    }
  },
}));
