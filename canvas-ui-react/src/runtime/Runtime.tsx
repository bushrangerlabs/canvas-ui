/**
 * Runtime Component - Shared by Preview and Kiosk modes
 * Displays canvas in read-only mode with entity updates
 */

import React, { useEffect, useState } from 'react';
import { Canvas } from '../shared/components/Canvas';
import { useFlowExecution } from '../shared/hooks/useFlowExecution';
import { useWebSocket } from '../shared/providers/WebSocketProvider';
import { useConfigStore } from '../shared/stores/useConfigStore';

const Runtime: React.FC = () => {
  const { connected, authenticated, hass } = useWebSocket();
  const store = useConfigStore();
  const { config, loadConfig } = store;
  
  // Initialize flow execution engine
  useFlowExecution();
  const [loading, setLoading] = useState(true);
  // Track active view locally (don't use store's currentViewId to avoid URL sync)
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  // Track whether we've set an initial view (for hash handler's "no hash" fallback)
  const viewInitializedRef = React.useRef(false);
  
  // Helper to update both local state and store without triggering URL sync
  const updateActiveView = (viewId: string) => {
    setActiveViewId(viewId);
    // Also update store silently (for any code that reads currentViewId)
    // Use setState directly to bypass setCurrentView action which triggers URL sync
    useConfigStore.setState({ currentViewId: viewId }, false);
  };

  // Keep a stable ref so event listeners never capture a stale closure
  const updateActiveViewRef = React.useRef(updateActiveView);
  useEffect(() => { updateActiveViewRef.current = updateActiveView; });

  // Helper: resolve a name/slug/id to a real view id using always-fresh store config
  const resolveViewId = (raw: string): string | null => {
    const cfg = useConfigStore.getState().config;
    if (!cfg) return null;
    const normalized = raw.toLowerCase().replace(/[-_]/g, ' ');
    const found = cfg.views.find(v =>
      v.id === raw ||
      v.name === raw ||
      v.name.toLowerCase() === normalized ||
      v.name.toLowerCase().replace(/\s+/g, '-') === raw.toLowerCase()
    );
    return found ? found.id : null;
  };

  // Handle canvas-navigate-view (generic view navigation from buttons, iframes, flows, etc.)
  useEffect(() => {
    const handleNavigate = (e: Event) => {
      const raw = (e as CustomEvent<{ viewId: string }>).detail?.viewId;
      if (!raw) return;
      const resolved = resolveViewId(raw);
      updateActiveViewRef.current(resolved ?? raw);
    };
    window.addEventListener('canvas-navigate-view', handleNavigate);
    return () => window.removeEventListener('canvas-navigate-view', handleNavigate);
  }, []);

  // Screensaver navigate mode: owns BOTH forward AND return navigation so the
  // screensaver widget can unmount without breaking the return trip.
  const screensaverOriginRef = React.useRef<string | null>(null);
  const screensaverActivityHandlerRef = React.useRef<(() => void) | null>(null);

  const clearScreensaverReturn = () => {
    if (screensaverActivityHandlerRef.current) {
      const events = ['mousedown', 'touchstart', 'keydown'] as const;
      events.forEach(e => document.removeEventListener(e, screensaverActivityHandlerRef.current!));
      screensaverActivityHandlerRef.current = null;
    }
    screensaverOriginRef.current = null;
  };

  useEffect(() => {
    // canvas-screensaver-navigate: { targetViewId, originViewId }
    const handleScreensaverNavigate = (e: Event) => {
      const { targetViewId, originViewId } = (e as CustomEvent<{ targetViewId: string; originViewId: string }>).detail || {};
      if (!targetViewId) return;

      // Clear any previous screensaver return handler
      clearScreensaverReturn();

      // Navigate forward
      const resolvedTarget = resolveViewId(targetViewId);
      if (!resolvedTarget) return; // target view not found — abort
      updateActiveViewRef.current(resolvedTarget);

      // Store origin and wire up return-on-activity
      screensaverOriginRef.current = originViewId || null;
      if (originViewId) {
        const returnHandler = () => {
          clearScreensaverReturn();
          const resolvedOrigin = resolveViewId(originViewId) ?? originViewId;
          updateActiveViewRef.current(resolvedOrigin);
        };
        screensaverActivityHandlerRef.current = returnHandler;
        const events = ['mousedown', 'touchstart', 'keydown'] as const;
        // Small delay so the navigation itself doesn't immediately dismiss
        setTimeout(() => {
          if (screensaverActivityHandlerRef.current === returnHandler) {
            events.forEach(e => document.addEventListener(e, returnHandler, { once: true, passive: true }));
          }
        }, 500);
      }
    };

    // canvas-screensaver-dismiss: programmatic dismiss (flow node, etc.)
    const handleScreensaverDismiss = () => {
      if (!screensaverOriginRef.current) return;
      const origin = screensaverOriginRef.current;
      clearScreensaverReturn();
      const resolvedOrigin = resolveViewId(origin) ?? origin;
      updateActiveViewRef.current(resolvedOrigin);
    };

    window.addEventListener('canvas-screensaver-navigate', handleScreensaverNavigate);
    window.addEventListener('canvas-screensaver-dismiss', handleScreensaverDismiss);
    return () => {
      window.removeEventListener('canvas-screensaver-navigate', handleScreensaverNavigate);
      window.removeEventListener('canvas-screensaver-dismiss', handleScreensaverDismiss);
    };
  }, []);

  // Expose hass to window for Lovelace cards in kiosk/view mode
  useEffect(() => {
    if (hass && authenticated) {
      // Try to find HA's real hass object from <home-assistant> element.
      // This works in ALL panel modes (edit, kiosk, preview) since Canvas UI always
      // runs as an HA panel in the same document. The <home-assistant> element always
      // has the full hass (localize, themes, callService, formatEntityState, etc.)
      let haHass: any = null;
      
      // Try <home-assistant> element first (most reliable in panel mode)
      const homeAssistant = document.querySelector('home-assistant');
      if (homeAssistant && (homeAssistant as any).hass && typeof (homeAssistant as any).hass.localize === 'function') {
        haHass = (homeAssistant as any).hass;
        console.log('[Runtime] Found full hass on <home-assistant> element');
      }
      // Fallback: check if window.hass already has the full object (set by canvas-ui-panel.js)
      if (!haHass) {
        const existingHass = (window as any).hass;
        if (existingHass && typeof existingHass.localize === 'function') {
          haHass = existingHass;
          console.log('[Runtime] Found full hass already on window.hass');
        }
      }
      // Fallback: window.hassConnection
      if (!haHass && (window as any).hassConnection) {
        haHass = (window as any).hassConnection;
        console.log('[Runtime] Found hass on window.hassConnection');
      }

      if (haHass && typeof haHass.localize === 'function') {
        // Use HA's full hass object (has localize, formatNumber, themes, etc.)
        console.log('[Runtime] ✅ Using full HA hass (panel mode)');
        (window as any).hass = haHass;
        // Make sure loadCardHelpers is available
        if (!(window as any).loadCardHelpers && (window.parent as any).loadCardHelpers) {
          (window as any).loadCardHelpers = (window.parent as any).loadCardHelpers;
        }
      } else {
        // Standalone mode (dev server, etc.) - use our WebSocket hass
        console.log('[Runtime] Using WebSocket hass (standalone mode)');
        (window as any).hass = hass;
        // Basic card helper for standalone
        if (!(window as any).loadCardHelpers) {
          (window as any).loadCardHelpers = async () => {
            return {
              createCardElement: async (config: any) => {
                const cardType = config.type.replace(/^hui-/, '').replace(/-card$/, '');
                const element = document.createElement(`hui-${cardType}-card`);
                return element;
              }
            };
          };
        }
      }
    }
    return () => {
      // Don't cleanup window.hass - other components might still need it
    };
  }, [hass, authenticated]);

  // Load config on mount
  useEffect(() => {
    if (hass && authenticated) {
      loadConfig(hass).finally(() => setLoading(false));
    }
  }, [hass, authenticated, loadConfig]);

  // Handle hash-based navigation (like ioBroker: #viewName)
  useEffect(() => {
    const handleHashChange = () => {
      let hash = window.location.hash.slice(1); // Remove #
      
      // Strip kiosk= prefix if present (e.g., #kiosk=demo-view → demo-view)
      if (hash.startsWith('kiosk=')) {
        hash = hash.substring(6); // Remove 'kiosk='
        console.log('[Runtime] Stripped kiosk prefix, view:', hash);
      }
      
      // Strip any escape characters or backslashes
      hash = hash.replace(/\\/g, '');
      console.log('[Runtime] Hash changed:', hash);
      if (hash && config) {
        console.log('[Runtime] Available views:', config.views.map(v => `"${v.name}" (id: ${v.id})`));
        // Try exact match first, then normalized match (spaces vs hyphens)
        const normalizedHash = hash.toLowerCase().replace(/[-_]/g, ' ');
        console.log('[Runtime] Normalized hash:', normalizedHash);
        const view = config.views.find(v => {
          const exactName = v.name === hash;
          const exactId = v.id === hash;
          const normalizedName = v.name.toLowerCase() === normalizedHash;
          const hyphenatedMatch = v.name.toLowerCase().replace(/\s+/g, '-') === hash.toLowerCase();
          console.log(`[Runtime] Checking view "${v.name}": exactName=${exactName}, exactId=${exactId}, normalizedName=${normalizedName}, hyphenatedMatch=${hyphenatedMatch}`);
          return exactName || exactId || normalizedName || hyphenatedMatch;
        });
        if (view) {
          console.log('[Runtime] Found matching view:', view.name, '(id:', view.id, ')');
          viewInitializedRef.current = true;
          updateActiveView(view.id);
        } else {
          console.warn('[Runtime] No matching view found for hash:', hash);
        }
      } else if (config && !viewInitializedRef.current && config.views.length > 0) {
        // Only set default view once (no hash present)
        console.log('[Runtime] No hash, setting default view:', config.views[0].name);
        viewInitializedRef.current = true;
        updateActiveView(config.views[0].id);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Initial load

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [config]);

  if (loading) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a1a1a',
        color: '#ffffff',
      }}>
        <div>
          <div>Loading Canvas UI...</div>
          <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>
            {!connected && 'Connecting to Home Assistant...'}
            {connected && !authenticated && 'Authenticating...'}
          </div>
        </div>
      </div>
    );
  }

  if (!config || !activeViewId) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a1a1a',
        color: '#ffffff',
      }}>
        No view configured
      </div>
    );
  }

  const currentView = config.views.find(v => v.id === activeViewId);

  if (!currentView) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a1a1a',
        color: '#ffffff',
      }}>
        View not found
      </div>
    );
  }

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      overflow: 'auto', // Allow scrolling if view exceeds viewport
      backgroundColor: '#000000' // Black background fills remaining space
    }}>
      <Canvas view={currentView} isEditMode={false} zoom={100} />
    </div>
  );
};

export default Runtime;
