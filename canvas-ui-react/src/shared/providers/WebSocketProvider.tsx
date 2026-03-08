/**
 * Home Assistant WebSocket Provider
 * 
 * Connects to HA WebSocket API and provides connection context to all components
 */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { EntityState, HassConnection } from '../types';
import { loadCoreIcons, loadIconCache } from '../utils/iconCache';

interface WebSocketContextType {
  connected: boolean;
  authenticated: boolean;
  hass: HassConnection | null;
  entities: Record<string, EntityState>;
  error: string | null;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: React.ReactNode;
  url?: string;
  token?: string;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children, url, token }) => {
  const [connected, setConnected] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [entities, setEntities] = useState<Record<string, EntityState>>({});
  const [error, setError] = useState<string | null>(null);
  const [hass, setHass] = useState<HassConnection | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const messageIdRef = useRef(1);
  const pendingRequests = useRef<Map<number, {resolve: Function, reject: Function}>>(new Map());
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttempts = useRef(0);

  // Get WebSocket URL
  const getWebSocketUrl = useCallback(() => {
    if (url) return url;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/api/websocket`;
  }, [url]);

  // Get access token
  const getAccessToken = useCallback(() => {
    if (token) return token;
    
    // Try Canvas UI specific token
    const canvasToken = localStorage.getItem('canvas_ui_access_token');
    if (canvasToken) return canvasToken;
    
    // Try HA tokens
    const hassTokens = localStorage.getItem('hassTokens');
    if (hassTokens) {
      try {
        const tokens = JSON.parse(hassTokens);
        return tokens.access_token;
      } catch (e) {
        console.error('Failed to parse hassTokens:', e);
      }
    }
    
    // Try parent window tokens (if in iframe)
    try {
      const parentTokens = window.parent.localStorage.getItem('hassTokens');
      if (parentTokens) {
        const tokens = JSON.parse(parentTokens);
        return tokens.access_token;
      }
    } catch (e) {
      // Cross-origin, can't access parent
    }
    
    return null;
  }, [token]);

  // Send message to WebSocket
  const sendMessage = useCallback((message: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const id = messageIdRef.current++;
      const msg = { ...message, id };
      
      pendingRequests.current.set(id, { resolve, reject });
      wsRef.current.send(JSON.stringify(msg));
      
      // Timeout after 5 minutes (long timeout for AI requests with large models like Qwen 2.5 Coder 14B)
      setTimeout(() => {
        if (pendingRequests.current.has(id)) {
          pendingRequests.current.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 300000);
    });
  }, []);

  // Call HA service
  const callService = useCallback(async (domain: string, service: string, data?: any) => {
    // Extract return_response flag if present
    const { return_response, ...serviceData } = data || {};
    
    const response = await sendMessage({
      type: 'call_service',
      domain,
      service,
      service_data: serviceData,
      return_response: return_response || false,
    });
    return response;
  }, [sendMessage]);

  // Subscribe to entity states
  const subscribeEntities = useCallback((_callback: (entities: Record<string, EntityState>) => void) => {
    const unsubscribePromise = sendMessage({
      type: 'subscribe_events',
      event_type: 'state_changed',
    });

    // Return unsubscribe function
    return () => {
      unsubscribePromise.then((result) => {
        sendMessage({
          type: 'unsubscribe_events',
          subscription: result.id,
        });
      });
    };
  }, [sendMessage]);

  // Get all states
  const getStates = useCallback(async (): Promise<EntityState[]> => {
    const response = await sendMessage({ type: 'get_states' });
    return response.result;
  }, [sendMessage]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    const wsUrl = getWebSocketUrl();
    let accessToken = getAccessToken();

    if (!accessToken) {
      // Prompt user for long-lived access token
      const promptedToken = window.prompt(
        'Enter your Home Assistant Long-Lived Access Token:\n\n' +
        'Create one at:\n' +
        'Settings → People → Your User → Security → Long-Lived Access Tokens'
      );
      
      if (!promptedToken) {
        setError('No access token provided');
        console.error('[WebSocket] No access token found');
        return;
      }
      
      // Save the token for future use
      localStorage.setItem('canvas_ui_access_token', promptedToken);
      accessToken = promptedToken;
    }

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      // Connected
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      // Handle auth_required
      if (message.type === 'auth_required') {
        ws.send(JSON.stringify({
          type: 'auth',
          access_token: accessToken,
        }));
      }
      
      // Handle auth_ok
      else if (message.type === 'auth_ok') {
        setConnected(true);
        setAuthenticated(true);
        setError(null);
        reconnectAttempts.current = 0;

        // Create hass connection object with states for lovelace compatibility
        const hassConnection: HassConnection = {
          callService,
          subscribeEntities,
          getStates,
          sendMessage, // Add sendMessage for AI and raw WebSocket calls
          states: {}, // Will be populated below
        };
        setHass(hassConnection);
        
        // Expose hass globally for Lovelace cards (same as old Canvas UI)
        if (typeof window !== 'undefined') {
          (window as any).hass = hassConnection;
          
          // Load card helpers on first connection
          if (!(window as any).cardHelpers && (window as any).loadCardHelpers) {
            (window as any).loadCardHelpers()
              .then((helpers: any) => {
                (window as any).cardHelpers = helpers;
                console.log('✅ [WebSocketProvider] Card helpers loaded');
              })
              .catch((err: any) => {
                console.warn('[WebSocketProvider] Failed to load card helpers:', err);
              });
          }
        }

        // Load initial states and populate hass.states
        getStates().then((states) => {
          const entitiesMap: Record<string, EntityState> = {};
          states.forEach((state) => {
            entitiesMap[state.entity_id] = state;
          });
          setEntities(entitiesMap);
          // Update hass.states for lovelace cards
          hassConnection.states = entitiesMap;
          if (typeof window !== 'undefined') {
            (window as any).hass.states = entitiesMap;
          }
        });

        // Subscribe to state changes and keep hass.states in sync
        subscribeEntities((newEntities) => {
          setEntities(newEntities);
          // Update hass.states for lovelace cards
          if (hass) {
            hass.states = newEntities;
          }
          if (typeof window !== 'undefined' && (window as any).hass) {
            (window as any).hass.states = newEntities;
          }
        });
      }
      
      // Handle auth_invalid
      else if (message.type === 'auth_invalid') {
        console.error('[WebSocket] Authentication failed:', message.message);
        setError('Authentication failed: ' + message.message);
        setAuthenticated(false);
      }
      
      // Handle responses to our requests
      else if (message.id && pendingRequests.current.has(message.id)) {
        const { resolve, reject } = pendingRequests.current.get(message.id)!;
        pendingRequests.current.delete(message.id);
        
        if (message.type === 'result') {
          if (message.success) {
            resolve(message);
          } else {
            reject(new Error(message.error?.message || 'Request failed'));
          }
        }
      }
      
      // Handle events
      else if (message.type === 'event') {
        if (message.event.event_type === 'state_changed') {
          const { entity_id, new_state } = message.event.data;
          if (new_state) {
            setEntities((prev) => ({
              ...prev,
              [entity_id]: new_state,
            }));
          }
        }
      }
    };

    ws.onerror = (err) => {
      console.error('[WebSocket] Error:', err);
      setError('WebSocket connection error');
    };

    ws.onclose = () => {
      setConnected(false);
      setAuthenticated(false);
      setHass(null);
      
      // Attempt reconnection
      if (reconnectAttempts.current < 10) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        reconnectAttempts.current++;
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      } else {
        setError('Max reconnection attempts reached');
      }
    };
  }, [getWebSocketUrl, getAccessToken, callService, subscribeEntities, getStates]);

  // Load core icons and icon cache on app startup
  useEffect(() => {
    const loadIcons = async () => {
      console.log('[WebSocket] Loading icon system...');
      
      // Load core icons (critical UI icons)
      await loadCoreIcons();
      
      // Load cached icons from server
      await loadIconCache();
      
      console.log('[WebSocket] Icon system ready');
    };

    // Load icons immediately (don't wait for WebSocket)
    loadIcons();
  }, []);

  // Load custom fonts on app startup
  useEffect(() => {
    const loadCustomFonts = async () => {
      if (!hass) return;

      try {
        const result = await callService('canvas_ui', 'list_files_op', {
          path: '/config/www/fonts',
          recursive: false,
          return_response: true,
        });

        const serviceResult = result?.result?.response || result?.response || result;
        const files = serviceResult.files || [];

        // Ensure files is an array before filtering
        if (!Array.isArray(files)) {
          console.warn('[WebSocket] Expected files array, got:', typeof files, files);
          return;
        }

        // Filter for font files
        const fontFiles = files.filter((f: any) => 
          f.type === 'file' && 
          /\.(ttf|otf|woff|woff2)$/i.test(f.name)
        );

        // Load all fonts in parallel
        const fontLoadPromises = fontFiles.map(async (f: any) => {
          try {
            const nameWithoutExt = f.name.replace(/\.(ttf|otf|woff|woff2)$/i, '');
            const fontPath = `/local/fonts/${f.name}`;
            
            // Determine format based on file extension
            const ext = f.name.match(/\.(ttf|otf|woff|woff2)$/i)?.[1]?.toLowerCase();
            const formatMap: Record<string, string> = {
              'ttf': 'truetype',
              'otf': 'opentype',
              'woff': 'woff',
              'woff2': 'woff2'
            };
            const format = formatMap[ext || 'ttf'];
            
            // Load font with format specified
            const fontFace = new FontFace(nameWithoutExt, `url('${fontPath}') format('${format}')`);
            const loadedFace = await fontFace.load();
            document.fonts.add(loadedFace);
            console.log(`[WebSocket] Loaded custom font: ${nameWithoutExt} (${loadedFace.family})`);
          } catch (error) {
            console.error(`[WebSocket] Failed to load font ${f.name}:`, error);
          }
        });

        await Promise.all(fontLoadPromises);
        console.log(`[WebSocket] Loaded ${fontFiles.length} custom fonts`);
      } catch (error) {
        console.error('[WebSocket] Failed to load custom fonts:', error);
      }
    };

    if (authenticated && hass) {
      loadCustomFonts();
    }
  }, [authenticated, hass, callService]);

  // Initial connection
  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const value = {
    connected,
    authenticated,
    hass,
    entities,
    error,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
