/**
 * useVisibility - React hook for evaluating visibility conditions
 * Determines if a widget should be visible based on entity states
 */

import { useEffect, useState } from 'react';
import { entitySubscriptionManager } from '../shared/managers/EntitySubscriptionManager';
import { useWebSocket } from '../shared/providers/WebSocketProvider';
import { BindingEvaluator } from '../shared/utils/BindingEvaluator';

/**
 * Hook to evaluate visibility conditions and subscribe to entity changes
 * @param visibilityCondition - Expression like "{light.living_room.state} == 'on'"
 * @returns boolean - true if widget should be visible
 */
export function useVisibility(visibilityCondition?: string): boolean {
  const { entities } = useWebSocket();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // If no condition, always visible
    if (!visibilityCondition || visibilityCondition.trim() === '') {
      setIsVisible(true);
      return;
    }

    // Extract entity IDs from condition
    const entityIds = BindingEvaluator.extractEntityIds(visibilityCondition);
    
    if (entityIds.length === 0) {
      // No entity references, evaluate as static expression
      try {
        const result = BindingEvaluator.evaluate(visibilityCondition, entities);
        setIsVisible(Boolean(result));
      } catch {
        setIsVisible(true);
      }
      return;
    }

    // Connect subscription manager to WebSocket (idempotent)
    entitySubscriptionManager.connect(() => entities);

    // Subscribe to entity changes
    const unsubscribe = entitySubscriptionManager.subscribe(entityIds, (updatedEntities) => {
      try {
        const result = BindingEvaluator.evaluate(visibilityCondition, updatedEntities);
        setIsVisible(Boolean(result));
      } catch (error) {
        console.error('Visibility evaluation error:', error, visibilityCondition);
        setIsVisible(true); // Show widget on error
      }
    });

    // Initial evaluation
    try {
      const result = BindingEvaluator.evaluate(visibilityCondition, entities);
      setIsVisible(Boolean(result));
    } catch (error) {
      console.error('Visibility evaluation error:', error, visibilityCondition);
      setIsVisible(true);
    }

    return unsubscribe;
  }, [visibilityCondition, entities]);

  return isVisible;
}
