/**
 * useEntityBinding - React hook for evaluating and subscribing to entity bindings
 * Automatically re-evaluates when entity states change
 */

import { useEffect, useState } from 'react';
import { entitySubscriptionManager } from '../shared/managers/EntitySubscriptionManager';
import { useWebSocket } from '../shared/providers/WebSocketProvider';
import { BindingEvaluator } from '../shared/utils/BindingEvaluator';

/**
 * Hook to evaluate a binding expression and subscribe to entity changes
 * @param expression - The binding expression (e.g., "{light.living_room.state}" or "Hello {sensor.temperature.state}°C")
 * @param defaultValue - Value to return if expression is not a binding
 * @returns Evaluated value that updates when entities change
 */
export function useEntityBinding<T = any>(expression: any, defaultValue?: T): T {
  const { entities } = useWebSocket();
  const [value, setValue] = useState<T>(() => {
    if (!BindingEvaluator.hasBinding(expression)) {
      return (expression ?? defaultValue) as T;
    }
    return BindingEvaluator.evaluate(expression, entities) as T;
  });

  useEffect(() => {
    // If no binding syntax, just return the value
    if (!BindingEvaluator.hasBinding(expression)) {
      setValue((expression ?? defaultValue) as T);
      return;
    }

    // Extract entity IDs from expression
    const entityIds = BindingEvaluator.extractEntityIds(expression);
    
    if (entityIds.length === 0) {
      setValue((expression ?? defaultValue) as T);
      return;
    }

    // Connect subscription manager to WebSocket (idempotent)
    entitySubscriptionManager.connect(() => entities);

    // Subscribe to entity changes
    const unsubscribe = entitySubscriptionManager.subscribe(entityIds, (updatedEntities) => {
      const newValue = BindingEvaluator.evaluate(expression, updatedEntities);
      setValue(newValue as T);
    });

    // Initial evaluation
    setValue(BindingEvaluator.evaluate(expression, entities) as T);

    return unsubscribe;
  }, [expression, entities, defaultValue]);

  return value;
}

/**
 * Hook to check if a value contains binding syntax
 */
export function useHasBinding(value: any): boolean {
  return BindingEvaluator.hasBinding(value);
}

/**
 * Hook to get display format of binding
 */
export function useBindingDisplay(expression: string): string {
  return BindingEvaluator.formatBindingDisplay(expression);
}
