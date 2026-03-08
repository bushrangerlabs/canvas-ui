import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Widget runtime state structure
 * Stores current live values independent of config or entity bindings
 */
export interface WidgetRuntimeState {
  value?: any; // Current value (slider position, input text, switch state, etc.)
  timestamp?: number; // Last update time
  type?: string; // Widget type for type safety
  metadata?: Record<string, any>; // Additional widget-specific data
}

/**
 * Runtime store interface
 */
interface WidgetRuntimeStore {
  // State
  widgetStates: Record<string, WidgetRuntimeState>;
  
  // Actions
  setWidgetState: (widgetId: string, state: Partial<WidgetRuntimeState>) => void;
  getWidgetState: (widgetId: string) => WidgetRuntimeState | null;
  clearWidgetState: (widgetId: string) => void;
  clearAllStates: () => void;
  
  // Subscriptions (for reactive updates)
  subscribeToWidget: (widgetId: string, callback: (state: WidgetRuntimeState | null) => void) => () => void;
}

/**
 * Widget Runtime Store
 * Centralized store for widget live values, accessible by widget ID
 * Enables:
 * - Flow system to read/write widget values
 * - Widget-to-widget data flow
 * - Inspector to show live values
 * - State persistence across view switches
 */
export const useWidgetRuntimeStore = create<WidgetRuntimeStore>()(
  persist(
    (set, get) => ({
      widgetStates: {},
      
      /**
       * Set or update widget runtime state
       * @param widgetId - Unique widget identifier
       * @param state - Partial state to merge (value, metadata, etc.)
       */
      setWidgetState: (widgetId, state) => {
        set((prev) => ({
          widgetStates: {
            ...prev.widgetStates,
            [widgetId]: {
              ...prev.widgetStates[widgetId],
              ...state,
              timestamp: Date.now(),
            },
          },
        }));
      },
      
      /**
       * Get current widget runtime state
       * @param widgetId - Unique widget identifier
       * @returns Widget state or null if not found
       */
      getWidgetState: (widgetId) => {
        const state = get().widgetStates[widgetId];
        return state !== undefined ? state : null;
      },
      
      /**
       * Clear runtime state for a specific widget
       * @param widgetId - Unique widget identifier
       */
      clearWidgetState: (widgetId) => {
        set((prev) => {
          const { [widgetId]: _, ...rest } = prev.widgetStates;
          return { widgetStates: rest };
        });
      },
      
      /**
       * Clear all widget runtime states
       * Useful when switching views or resetting canvas
       */
      clearAllStates: () => {
        set({ widgetStates: {} });
      },
      
      /**
       * Subscribe to widget state changes
       * @param widgetId - Widget to watch
       * @param callback - Called when widget state changes
       * @returns Unsubscribe function
       */
      subscribeToWidget: (widgetId: string, callback: (state: WidgetRuntimeState | null) => void): (() => void) => {
        // Simple subscription - call callback immediately with current state
        const currentState = get().widgetStates[widgetId];
        callback(currentState !== undefined ? currentState : null);
        
        // Return a no-op unsubscribe for now (advanced subscription can be added later)
        return () => {};
      },
    }),
    {
      name: 'canvas-ui-widget-runtime', // localStorage key
      partialize: (state) => ({
        // Only persist widget states, not functions
        widgetStates: state.widgetStates,
      }),
    }
  )
);
