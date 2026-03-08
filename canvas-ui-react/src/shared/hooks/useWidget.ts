/**
 * Common widget hook
 * 
 * Provides shared functionality for all widgets:
 * - Auto-subscribes to entity data
 * - Provides update helpers
 * - Handles common widget state
 */

import { useCallback, useMemo } from 'react';
import { useWebSocket } from '../providers/WebSocketProvider';
import type { WidgetConfig } from '../types';

export interface UseWidgetReturn {
  /**
   * Entity data for all entity fields in the widget config
   * Key is the config field name (e.g., 'entity_id', 'target_entity')
   * Value is the entity state object
   */
  entityData: Record<string, any>;
  
  /**
   * Update widget config (partial update)
   */
  updateConfig: (changes: Partial<WidgetConfig>) => void;
  
  /**
   * Get entity state by config field name
   */
  getEntity: (fieldName: string) => any;
  
  /**
   * Get entity state value by config field name
   */
  getEntityState: (fieldName: string) => string | undefined;
  
  /**
   * Check if entity is available
   */
  isEntityAvailable: (fieldName: string) => boolean;
}

/**
 * Hook for common widget functionality
 * 
 * @example
 * ```tsx
 * const MyWidget: React.FC<WidgetProps> = ({ config }) => {
 *   const { entityData, updateConfig, getEntityState } = useWidget(config);
 *   
 *   const state = getEntityState('entity_id');
 *   const isOn = state === 'on';
 *   
 *   return <div onClick={() => updateConfig({ text: 'Clicked!' })}>{state}</div>;
 * };
 * ```
 */
export function useWidget(config: WidgetConfig): UseWidgetReturn {
  const { entities } = useWebSocket();
  
  // Auto-subscribe to all entity fields in config.config
  const entityData = useMemo(() => {
    const entityFields = Object.entries(config.config).filter(([key, value]) => 
      key.toLowerCase().includes('entity') && typeof value === 'string' && value.length > 0
    );
    
    return Object.fromEntries(
      entityFields.map(([fieldName, entityId]) => [
        fieldName,
        entities?.[entityId as string] || null
      ])
    );
  }, [config, entities]);
  
  // Update config helper - widgets should use their own state management
  // This is a placeholder for future integration
  const updateConfig = useCallback((_changes: Partial<WidgetConfig>) => {
    console.warn('updateConfig called but not implemented - widgets should manage their own state');
  }, []);
  
  // Get entity by field name
  const getEntity = useCallback((fieldName: string) => {
    return entityData[fieldName] || null;
  }, [entityData]);
  
  // Get entity state value
  const getEntityState = useCallback((fieldName: string) => {
    return entityData[fieldName]?.state;
  }, [entityData]);
  
  // Check if entity is available
  const isEntityAvailable = useCallback((fieldName: string) => {
    const entity = entityData[fieldName];
    return entity && entity.state !== 'unavailable' && entity.state !== 'unknown';
  }, [entityData]);
  
  return {
    entityData,
    updateConfig,
    getEntity,
    getEntityState,
    isEntityAvailable,
  };
}
