/**
 * Widget Bridge - Communication layer between React Inspector and vanilla widgets
 * 
 * This allows the React inspector to control existing vanilla JS widgets
 * until we migrate them to React.
 * 
 * Communication flow:
 * 1. React Inspector changes config → Bridge dispatches event
 * 2. Vanilla widget listens for event → Updates its config
 * 3. Vanilla widget changes → Dispatches event → Bridge updates React state
 */

export interface WidgetMessage {
  type: 'widget-selected' | 'config-updated' | 'widget-updated';
  widgetId?: string;
  widgetType?: string;
  config?: Record<string, any>;
  property?: string;
  value?: any;
}

class WidgetBridge {
  private listeners: Map<string, Set<(message: WidgetMessage) => void>> = new Map();

  /**
   * Send message to vanilla widgets
   */
  send(message: WidgetMessage) {
    console.log('[WidgetBridge] Sending:', message);
    console.log('[WidgetBridge] In iframe?', window.parent !== window);
    
    // Check if we're in an iframe
    if (window.parent !== window) {
      // Send to parent window via postMessage
      console.log('[WidgetBridge] Sending to parent via postMessage');
      window.parent.postMessage({
        source: 'react-inspector',
        ...message,
      }, '*');
    } else {
      // Dispatch custom event for same-window communication
      console.log('[WidgetBridge] Sending via custom event (same window)');
      window.dispatchEvent(
        new CustomEvent('react-inspector-message', {
          detail: message,
        })
      );
    }
  }

  /**
   * Listen for messages from vanilla widgets
   */
  on(type: string, callback: (message: WidgetMessage) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);

    // Return cleanup function
    return () => {
      this.listeners.get(type)?.delete(callback);
    };
  }

  /**
   * Receive message from vanilla widgets
   */
  receive(message: WidgetMessage) {
    console.log('[WidgetBridge] Received:', message);
    
    const listeners = this.listeners.get(message.type);
    if (listeners) {
      listeners.forEach((callback) => callback(message));
    }
  }

  /**
   * Update widget configuration
   */
  updateWidgetConfig(widgetId: string, property: string, value: any) {
    this.send({
      type: 'config-updated',
      widgetId,
      property,
      value,
    });
  }

  /**
   * Notify that widget was selected
   */
  selectWidget(widgetId: string, widgetType: string, config: Record<string, any>) {
    this.send({
      type: 'widget-selected',
      widgetId,
      widgetType,
      config,
    });
  }
}

// Singleton instance
export const widgetBridge = new WidgetBridge();

// Listen for messages from vanilla widgets via postMessage (iframe communication)
window.addEventListener('message', (event) => {
  // Accept messages from any origin for now (tighten security in production)
  if (event.data && event.data.source === 'vanilla-widget') {
    const message: WidgetMessage = event.data;
    widgetBridge.receive(message);
  }
});

// Also listen for same-window custom events (for non-iframe setups)
window.addEventListener('vanilla-widget-message', ((event: CustomEvent<WidgetMessage>) => {
  widgetBridge.receive(event.detail);
}) as EventListener);

// For debugging
(window as any).widgetBridge = widgetBridge;
