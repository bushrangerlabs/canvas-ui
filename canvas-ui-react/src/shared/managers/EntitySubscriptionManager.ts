/**
 * EntitySubscriptionManager - Manages WebSocket subscriptions to entity state changes
 * Allows multiple components to subscribe to same entities efficiently
 */

import type { EntityState } from '../utils/BindingEvaluator';

type SubscriptionCallback = (entities: Record<string, EntityState>) => void;

interface Subscription {
  id: string;
  entityIds: string[];
  callback: SubscriptionCallback;
}

export class EntitySubscriptionManager {
  private subscriptions: Map<string, Subscription> = new Map();
  private entities: Record<string, EntityState> = {};
  private unsubscribeWebSocket: (() => void) | null = null;

  /**
   * Subscribe to entity state changes
   * @param entityIds - Array of entity IDs to watch
   * @param callback - Called when any subscribed entity changes
   * @returns Unsubscribe function
   */
  subscribe(entityIds: string[], callback: SubscriptionCallback): () => void {
    const id = this.generateId();
    
    this.subscriptions.set(id, {
      id,
      entityIds,
      callback,
    });

    // Initial callback with current state
    callback(this.entities);

    // Return unsubscribe function
    return () => this.unsubscribe(id);
  }

  /**
   * Unsubscribe from entity changes
   */
  unsubscribe(id: string): void {
    this.subscriptions.delete(id);
  }

  /**
   * Connect to WebSocket provider
   * @param wsCallback - Function to get entities from WebSocket context
   */
  connect(wsCallback: () => Record<string, EntityState>): void {
    // Get initial entities
    this.entities = wsCallback();

    // Set up polling (in real implementation, this would be WebSocket listener)
    // For now, we'll poll every 1 second to detect changes
    const intervalId = setInterval(() => {
      const newEntities = wsCallback();
      
      // Check if any subscribed entities changed
      const changedEntityIds = new Set<string>();
      
      for (const [, subscription] of this.subscriptions) {
        for (const entityId of subscription.entityIds) {
          const oldState = this.entities[entityId]?.state;
          const newState = newEntities[entityId]?.state;
          
          if (oldState !== newState) {
            changedEntityIds.add(entityId);
          }
        }
      }

      // Update entities
      this.entities = newEntities;

      // Notify subscribers if their entities changed
      if (changedEntityIds.size > 0) {
        for (const [, subscription] of this.subscriptions) {
          const hasChangedEntity = subscription.entityIds.some(entityId => 
            changedEntityIds.has(entityId)
          );
          
          if (hasChangedEntity) {
            subscription.callback(this.entities);
          }
        }
      }
    }, 1000);

    this.unsubscribeWebSocket = () => clearInterval(intervalId);
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.unsubscribeWebSocket) {
      this.unsubscribeWebSocket();
      this.unsubscribeWebSocket = null;
    }
    this.subscriptions.clear();
  }

  /**
   * Get current entity states
   */
  getEntities(): Record<string, EntityState> {
    return this.entities;
  }

  private generateId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Global singleton instance
export const entitySubscriptionManager = new EntitySubscriptionManager();
