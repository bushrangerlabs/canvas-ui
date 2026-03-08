/**
 * AI View Importer
 * 
 * Thin wrapper around existing viewExportImport utilities for AI-generated views.
 * Handles replace vs modify modes when importing AI-generated widget definitions.
 */

import { useConfigStore } from '../../shared/stores/useConfigStore';
import type { ExportedView } from '../../shared/utils/viewExportImport';
import { importView, validateImportedView } from '../../shared/utils/viewExportImport';

export type ImportMode = 'replace' | 'modify' | 'update';

export interface AIImportResult {
  success: boolean;
  error?: string;
  widgetCount?: number;
  updatedWidgetIds?: string[];
}

/**
 * Import AI-generated view (thin wrapper around existing importView)
 * 
 * @param aiGeneratedJSON - JSON in ExportedView format (same as manual export)
 * @param currentViewId - View to import into
 * @param mode - 'replace' (clear all), 'modify' (add widgets), or 'update' (change properties)
 * @returns Import result with success status
 * 
 * Note: This function modifies the config in memory but does NOT save to storage.
 * Caller must trigger save via: useConfigStore.getState().saveConfig(hass, config)
 */
export function importAIGeneratedView(
  aiGeneratedJSON: ExportedView,
  currentViewId: string,
  mode: ImportMode = 'replace'
): AIImportResult {
  try {
    // Get current config and view
    const currentConfig = useConfigStore.getState().config;
    if (!currentConfig) {
      return { success: false, error: 'Config not available' };
    }
    
    const currentView = currentConfig.views.find(v => v.id === currentViewId);
    
    if (!currentView) {
      return { success: false, error: 'Current view not found' };
    }

    // Handle UPDATE mode (partial widget updates)
    if (mode === 'update' && aiGeneratedJSON.metadata?.editMode === 'update') {
      const targetIds = aiGeneratedJSON.metadata.targetWidgetIds || [];
      const widgetUpdates = aiGeneratedJSON.metadata.widgetUpdates || {};
      
      console.log(`[AI Import] UPDATE mode - updating ${targetIds.length} widget(s)`);
      
      const updatedWidgetIds: string[] = [];
      
      for (const widgetId of targetIds) {
        const widget = currentView.widgets.find(w => w.id === widgetId);
        if (widget) {
          const updates = widgetUpdates[widgetId];
          if (updates) {
            // Merge updates into widget config
            if (updates.config) {
              widget.config = { ...widget.config, ...updates.config };
            }
            if (updates.position) {
              widget.position = { ...widget.position, ...updates.position };
            }
            updatedWidgetIds.push(widgetId);
            console.log(`[AI Import] Updated widget ${widgetId}:`, updates);
          }
        } else {
          console.warn(`[AI Import] Widget ${widgetId} not found, skipping update`);
        }
      }
      
      return { 
        success: true, 
        widgetCount: currentView.widgets.length,
        updatedWidgetIds
      };
    }
    
    // Validate using existing function (for add/replace modes)
    const validation = validateImportedView(aiGeneratedJSON);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    // Import using existing function (handles ID generation, normalization, everything)
    const { view: importedView } = importView(
      aiGeneratedJSON,
      currentConfig.views.map(v => v.id)
    );
    
    // Mode-specific logic
    let finalWidgetCount = 0;
    
    if (mode === 'replace') {
      // Replace: Clear all existing widgets, use AI widgets only
      console.log(`[AI Import] REPLACE mode - replacing ${currentView.widgets.length} widgets with ${importedView.widgets.length} new widgets`);
      currentView.widgets = importedView.widgets;
      finalWidgetCount = importedView.widgets.length;
    } else if (mode === 'modify') {
      // Modify: Add AI widgets to existing (merge)
      // AI widgets are added, existing widgets preserved unless ID matches
      const aiWidgetIds = new Set(importedView.widgets.map(w => w.id));
      const preservedWidgets = currentView.widgets.filter(w => !aiWidgetIds.has(w.id));
      console.log(`[AI Import] MODIFY mode - preserving ${preservedWidgets.length} widgets, adding ${importedView.widgets.length} new widgets`);
      currentView.widgets = [...preservedWidgets, ...importedView.widgets];
      finalWidgetCount = currentView.widgets.length;
    }
    
    // Note: Config is modified in memory. Caller should trigger save via ConfigStore.
    // Example: useConfigStore.getState().saveConfig(hass, currentConfig)
    
    return { 
      success: true, 
      widgetCount: finalWidgetCount 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown import error' 
    };
  }
}
