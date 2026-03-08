import { create } from 'zustand';
import { useConfigStore } from '../shared/stores/useConfigStore';

/**
 * Widget Configuration State
 * 
 * Manages the selected widget and its configuration.
 * Direct integration with ConfigStore for saves.
 */

export interface WidgetConfig {
  id: string;
  type: string;
  config: Record<string, any>;
  metadata?: any; // Widget manifest from getMetadata()
}

interface WidgetStore {
  // Selected widget
  selectedWidget: WidgetConfig | null;
  
  // Update selected widget
  selectWidget: (widget: WidgetConfig | null) => void;
  
  // Update widget config property
  updateConfig: (property: string, value: any) => void;
  
  // Update multiple properties at once
  updateMultipleConfig: (updates: Record<string, any>) => void;
}

export const useWidgetStore = create<WidgetStore>((set, get) => ({
  selectedWidget: null,
  
  selectWidget: (widget) => set({ selectedWidget: widget }),
  
  updateConfig: (property, value) => {
    console.log('[widgetStore.updateConfig] Called with:', property, '=', value);
    const state = get();
    console.log('[widgetStore.updateConfig] Current selectedWidget:', state.selectedWidget?.id);
    
    if (!state.selectedWidget) {
      console.warn('[widgetStore.updateConfig] No selected widget!');
      return;
    }
    
    // Update local state
    set({
      selectedWidget: {
        ...state.selectedWidget,
        config: {
          ...state.selectedWidget.config,
          [property]: value,
        },
      },
    });
    
    // Update ConfigStore to trigger save
    const configStore = useConfigStore.getState();
    const currentViewId = configStore.currentViewId;
    if (currentViewId) {
      configStore.updateWidget(currentViewId, state.selectedWidget.id, {
        config: {
          [property]: value,
        },
      });
      
      // Debounced save to Home Assistant
      setTimeout(() => {
        const hass = (window as any).hass;
        if (hass) {
          configStore.saveConfig(hass);
        }
      }, 500);
    }
    
    console.log('[widgetStore] Updated config:', property, '=', value);
  },
  
  updateMultipleConfig: (updates) => {
    const state = get();
    if (!state.selectedWidget) return;
    
    // Update local state
    set({
      selectedWidget: {
        ...state.selectedWidget,
        config: {
          ...state.selectedWidget.config,
          ...updates,
        },
      },
    });
    
    // Update ConfigStore to trigger save
    const configStore = useConfigStore.getState();
    const currentViewId = configStore.currentViewId;
    if (currentViewId) {
      configStore.updateWidget(currentViewId, state.selectedWidget.id, {
        config: updates,
      });
      
      // Debounced save to Home Assistant
      setTimeout(() => {
        const hass = (window as any).hass;
        if (hass) {
          configStore.saveConfig(hass);
        }
      }, 500);
    }
    
    console.log('[widgetStore] Updated multiple configs:', updates);
  },
}));
