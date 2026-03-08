/**
 * Visibility Evaluation Hook
 * Evaluates complex visibility conditions and returns boolean
 */

import { useEffect, useState } from 'react';
import type { EntityState } from '../types';
import type { Condition, VisibilityConfig } from '../types/visibility';

interface WindowSize {
  width: number;
  height: number;
}

/**
 * Hook to track window size for screen conditions
 */
function useWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}

/**
 * Main visibility hook
 * Returns true if widget should be visible, false if hidden
 */
export function useVisibility(
  config: VisibilityConfig | undefined,
  entities: Record<string, EntityState>
): boolean {
  const [isVisible, setIsVisible] = useState(true);
  const windowSize = useWindowSize();

  useEffect(() => {
    if (!config || !config.conditions || config.conditions.length === 0) {
      setIsVisible(true);
      return;
    }

    const result = evaluateConditions(config.conditions, entities, windowSize, config.mode);
    setIsVisible(result);
  }, [config, entities, windowSize]);

  return isVisible;
}

/**
 * Evaluate array of conditions based on mode (all=AND, any=OR)
 */
function evaluateConditions(
  conditions: Condition[],
  entities: Record<string, EntityState>,
  windowSize: WindowSize,
  mode: 'all' | 'any' = 'all'
): boolean {
  if (conditions.length === 0) return true;

  if (mode === 'all') {
    // AND - all conditions must be true
    return conditions.every(condition => evaluateCondition(condition, entities, windowSize));
  } else {
    // OR - at least one condition must be true
    return conditions.some(condition => evaluateCondition(condition, entities, windowSize));
  }
}

/**
 * Evaluate single condition
 */
function evaluateCondition(
  condition: Condition,
  entities: Record<string, EntityState>,
  windowSize: WindowSize
): boolean {
  switch (condition.type) {
    case 'state':
      return evaluateStateCondition(condition, entities);

    case 'numeric_state':
      return evaluateNumericCondition(condition, entities);

    case 'screen':
      return evaluateScreenCondition(condition, windowSize);

    case 'time':
      return evaluateTimeCondition(condition);

    case 'and':
      // Nested AND - all subconditions must be true
      return condition.conditions.every(c => evaluateCondition(c, entities, windowSize));

    case 'or':
      // Nested OR - at least one subcondition must be true
      return condition.conditions.some(c => evaluateCondition(c, entities, windowSize));

    default:
      console.warn('[useVisibility] Unknown condition type:', (condition as any).type);
      return true;
  }
}

/**
 * Evaluate state condition
 */
function evaluateStateCondition(
  condition: Extract<Condition, { type: 'state' }>,
  entities: Record<string, EntityState>
): boolean {
  const entity = entities[condition.entity];
  if (!entity) {
    console.warn(`[useVisibility] Entity not found: ${condition.entity}`);
    return false;
  }

  const matches = entity.state?.toString() === condition.state;
  return condition.not ? !matches : matches;
}

/**
 * Evaluate numeric state condition
 */
function evaluateNumericCondition(
  condition: Extract<Condition, { type: 'numeric_state' }>,
  entities: Record<string, EntityState>
): boolean {
  const entity = entities[condition.entity];
  if (!entity) {
    console.warn(`[useVisibility] Entity not found: ${condition.entity}`);
    return false;
  }

  const value = parseFloat(entity.state);
  if (isNaN(value)) {
    console.warn(`[useVisibility] Entity ${condition.entity} is not numeric: ${entity.state}`);
    return false;
  }

  if (condition.above !== undefined && value <= condition.above) return false;
  if (condition.below !== undefined && value >= condition.below) return false;

  return true;
}

/**
 * Evaluate screen condition
 */
function evaluateScreenCondition(
  condition: Extract<Condition, { type: 'screen' }>,
  windowSize: WindowSize
): boolean {
  if (condition.minWidth !== undefined && windowSize.width < condition.minWidth) return false;
  if (condition.maxWidth !== undefined && windowSize.width > condition.maxWidth) return false;
  if (condition.minHeight !== undefined && windowSize.height < condition.minHeight) return false;
  if (condition.maxHeight !== undefined && windowSize.height > condition.maxHeight) return false;

  return true;
}

/**
 * Evaluate time condition
 */
function evaluateTimeCondition(
  condition: Extract<Condition, { type: 'time' }>
): boolean {
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const currentDay = now.getDay(); // 0=Sunday, 1=Monday, etc.

  // Check time range
  if (condition.after && currentTime < condition.after) return false;
  if (condition.before && currentTime > condition.before) return false;

  // Check weekday
  if (condition.weekday && !condition.weekday.includes(currentDay)) return false;

  return true;
}
