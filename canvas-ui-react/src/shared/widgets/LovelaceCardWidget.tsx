import yaml from 'js-yaml';
import React, { useEffect, useRef, useState } from 'react';
import { useWebSocket } from '../providers/WebSocketProvider';
import type { WidgetProps } from '../types';
import type { WidgetMetadata } from '../types/metadata';
import { isCardRegistered, loadCard, normalizeCardName } from '../utils/cardLoader';

// Extend Window interface for HA card helpers
declare global {
  interface Window {
    loadCardHelpers?: () => Promise<{
      createCardElement: (config: any) => Promise<HTMLElement>;
    }>;
  }
}

/**
 * Lovelace Card Widget
 * Embeds any Home Assistant Lovelace card (built-in or custom)
 * NOTE: Only works when embedded inside Home Assistant (edit/view modes)
 * Standalone kiosk mode cannot access HA frontend infrastructure
 */
const LovelaceCardWidget: React.FC<WidgetProps> = ({ config }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardElementRef = useRef<HTMLElement | null>(null);
  const { hass, entities } = useWebSocket();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Parse card configuration from YAML or JSON
  const parseCardConfig = (configText: string): any => {
    if (!configText.trim()) {
      // Return example configs based on card type
      const cardType = config.config.cardType || 'entities';
      
      if (cardType === 'thermostat' || cardType === 'hui-thermostat-card') {
        return { entity: 'climate.thermostat' };
      } else if (cardType === 'entities' || cardType === 'hui-entities-card') {
        return { entities: ['sun.sun'] };
      } else if (cardType === 'button' || cardType === 'hui-button-card') {
        return { entity: 'sun.sun', show_name: true, show_icon: true };
      }
      
      return {};
    }

    try {
      // Try JSON first
      return JSON.parse(configText);
    } catch {
      try {
        // Use js-yaml for proper YAML parsing
        return yaml.load(configText);
      } catch (yamlError) {
        console.error('[LovelaceCardWidget] Failed to parse config:', yamlError);
        return null;
      }
    }
  };


  // Get config type (without hui- prefix for config object)
  const getConfigType = (cardType: string): string => {
    if (cardType.includes(':')) {
      return cardType;
    }
    
    return cardType.replace(/^hui-/, '').replace(/-card$/, '');
  };

  // Generate card-mod CSS from styling settings
  const generateCardModFromSettings = (): string => {
    const cfg = config.config;
    const styles: string[] = [];
    
    // Skip card-mod entirely for layout cards (they have no ha-card of their own)
    const layoutCards = ['vertical-stack', 'horizontal-stack', 'grid', 'masonry'];
    const resolvedCardType = cfg.cardType === 'other'
      ? (cfg.cardConfig || '').match(/^\s*type:\s*(\S+)/m)?.[1] || ''
      : cfg.cardType || '';
    if (layoutCards.includes(resolvedCardType)) {
      return '';
    }

    // Gradient takes precedence (uses background shorthand)
    if (cfg.gradientEnabled === 'yes' && cfg.gradientColor) {
      const direction = cfg.gradientDirection || '180deg';
      const bgColor = cfg.backgroundColor || 'var(--ha-card-background, #1c1c1c)';
      styles.push(`background: linear-gradient(${direction}, ${bgColor}, ${cfg.gradientColor}) !important;`);
    } else {
      // Handle backgroundColor + backgroundImage layering
      const hasBackgroundColor = cfg.backgroundColor && cfg.backgroundColor !== 'var(--ha-card-background, #1c1c1c)';
      const hasBackgroundImage = cfg.backgroundImage?.trim();
      
      if (hasBackgroundColor && hasBackgroundImage) {
        // Layer color OVER image using linear-gradient
        const opacity = (cfg.backgroundOpacity ?? 100) / 100;
        let finalColor = cfg.backgroundColor;
        
        // Convert hex to rgba if opacity is applied
        if (opacity < 1 && finalColor.startsWith('#')) {
          const r = parseInt(finalColor.slice(1, 3), 16);
          const g = parseInt(finalColor.slice(3, 5), 16);
          const b = parseInt(finalColor.slice(5, 7), 16);
          finalColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
        }
        
        // Layer color over image
        styles.push(`background-image: linear-gradient(${finalColor}, ${finalColor}), url('${cfg.backgroundImage}') !important;`);
        styles.push(`background-size: cover !important;`);
        styles.push(`background-position: center !important;`);
      } else if (hasBackgroundColor) {
        // Only background color
        const opacity = (cfg.backgroundOpacity ?? 100) / 100;
        if (opacity < 1) {
          const color = cfg.backgroundColor;
          if (color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            styles.push(`background-color: rgba(${r}, ${g}, ${b}, ${opacity}) !important;`);
          } else {
            styles.push(`background-color: ${color} !important;`);
            styles.push(`opacity: ${opacity};`);
          }
        } else {
          styles.push(`background-color: ${cfg.backgroundColor} !important;`);
        }
      } else if (hasBackgroundImage) {
        // Only background image
        styles.push(`background-image: url('${cfg.backgroundImage}') !important;`);
        styles.push(`background-size: cover !important;`);
        styles.push(`background-position: center !important;`);
      }
    }

    // Corner radius
    if (cfg.cornerRadius !== undefined && cfg.cornerRadius !== 12) {
      styles.push(`border-radius: ${cfg.cornerRadius}px !important;`);
    }

    // Border
    if (cfg.borderWidth && cfg.borderWidth > 0) {
      const borderStyle = cfg.borderStyle || 'solid';
      const borderColor = cfg.borderColor || '#444444';
      styles.push(`border: ${cfg.borderWidth}px ${borderStyle} ${borderColor} !important;`);
      
      // Ensure background stays inside border area
      const hasBackground = (cfg.backgroundColor && cfg.backgroundColor !== 'var(--ha-card-background, #1c1c1c)') || 
                           cfg.backgroundImage?.trim() ||
                           (cfg.gradientEnabled === 'yes' && cfg.gradientColor);
      if (hasBackground) {
        styles.push(`background-clip: padding-box !important;`);
        styles.push(`background-origin: padding-box !important;`);
      }
    }

    // Padding
    if (cfg.padding !== undefined && cfg.padding !== 0) {
      styles.push(`padding: ${cfg.padding}px !important;`);
    }

    // Box shadow
    if (cfg.boxShadow && cfg.boxShadow !== 'none') {
      styles.push(`box-shadow: ${cfg.boxShadow} !important;`);
    }

    // Z-index
    if (cfg.zIndex !== undefined && cfg.zIndex !== 1) {
      styles.push(`z-index: ${cfg.zIndex} !important;`);
    }

    if (styles.length === 0) {
      return '';
    }

    // Only add box-sizing when there are real style overrides
    styles.unshift(`box-sizing: border-box !important;`);

    return `ha-card {\n  ${styles.join('\n  ')}\n}`;
  };

  // Apply card-mod styling to card config
  const applyCardModToConfig = (cardConfig: any, cardModYaml: string): any => {
    // Generate CSS from styling settings
    const autoGeneratedCSS = generateCardModFromSettings();
    
    // Combine manual YAML with auto-generated CSS
    let finalCSS = '';
    if (autoGeneratedCSS) {
      finalCSS = autoGeneratedCSS;
    }
    if (cardModYaml.trim()) {
      if (finalCSS) {
        finalCSS += '\n\n' + cardModYaml;
      } else {
        finalCSS = cardModYaml;
      }
    }

    if (!finalCSS.trim()) {
      return cardConfig;
    }

    return {
      ...cardConfig,
      card_mod: { style: finalCSS },
    };
  };

  // Load external script (for card-mod)
  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-src="${src}"]`);
      if (existing) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.type = 'module';
      script.src = src;
      script.setAttribute('data-src', src);
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  };

  // Ensure card-mod is loaded
  const ensureCardModLoaded = async (): Promise<boolean> => {
    if (window.customElements?.get('card-mod')) {
      return true;
    }

    const candidateUrls = [
      '/hacsfiles/lovelace-card-mod/card-mod.js',
      '/local/card-mod.js',
      '/local/community/lovelace-card-mod/card-mod.js',
    ];

    for (const url of candidateUrls) {
      try {
        await loadScript(url);
        if (window.customElements?.get('card-mod')) {
          console.log('[LovelaceCardWidget] card-mod loaded from:', url);
          return true;
        }
      } catch (e) {
        // Try next URL
      }
    }

    console.warn('[LovelaceCardWidget] card-mod not found');
    return false;
  };

  // Create the Lovelace card
  useEffect(() => {
    if (!hass || !containerRef.current) return;

    let cleanupFn: (() => void) | undefined;

    const createCard = async () => {
      setIsLoading(true);
      setError('');
      
      // Only block if using standalone kiosk.html (outside HA)
      // Allow HA panel kiosk mode (/canvas-kiosk) which has HA frontend
      const isStandaloneKiosk = window.location.pathname.includes('kiosk.html') && window.self === window.top;
      
      if (isStandaloneKiosk) {
        setError('Lovelace cards only work inside Home Assistant. Use /canvas-kiosk panel for kiosk mode with lovelace support.');
        setIsLoading(false);
        return;
      }
      
      // Check if HA frontend is available (either in same window or parent iframe)
      const hasHAFrontend = !!(window as any).customElements?.get('ha-card') || 
                            (window.parent !== window.self && !!(window.parent as any).customElements?.get('ha-card'));
      
      if (!hasHAFrontend) {
        setError('Home Assistant frontend not detected. Lovelace cards require HA custom elements.');
        setIsLoading(false);
        return;
      }

      const cardType = config.config.cardType || 'entities';
      const cardConfigText = config.config.cardConfig || '';
      const cardModYaml = config.config.cardModYaml || '';

      // Parse card configuration
      const parsedConfig = parseCardConfig(cardConfigText);
      if (!parsedConfig) {
        setError('Invalid card configuration');
        setIsLoading(false);
        return;
      }

      // Add type to config — when 'other', honour the type: field in the YAML itself
      if (cardType !== 'other') {
        const configType = getConfigType(cardType);
        parsedConfig.type = configType;
      } else if (!parsedConfig.type) {
        setError('Card type "Other" requires a type: field in the Card Configuration YAML (e.g. type: custom:apexcharts-card)');
        setIsLoading(false);
        return;
      }

      // Check if card-mod is needed (either from manual YAML or styling settings)
      const autoGeneratedCSS = generateCardModFromSettings();
      const hasCardMod = !!cardModYaml.trim() || !!autoGeneratedCSS;
      if (hasCardMod) {
        await ensureCardModLoaded();
      }

      const styledConfig = applyCardModToConfig(parsedConfig, cardModYaml);

      try {
        // PHASE 1: Ensure card element is loaded in kiosk mode
        const resolvedType = cardType === 'other' ? parsedConfig.type : getConfigType(cardType);
        const normalizedType = resolvedType.replace(':', '-');
        
        // Check if card is registered, if not try to load it
        if (!isCardRegistered(normalizedType)) {
          console.log(`[LovelaceCardWidget] Card ${normalizedType} not registered, attempting to load...`);
          try {
            await loadCard(normalizedType);
            console.log(`[LovelaceCardWidget] ✅ Card ${normalizedType} loaded successfully`);
          } catch (loadError) {
            console.warn(`[LovelaceCardWidget] ⚠️ Failed to load card ${normalizedType}:`, loadError);
            // Continue anyway - might still work if in edit/preview mode
          }
        }
        
        // Direct card creation (now that we're in same document context as HA)
        let cardElement: any;
        
        // Wait for hass to be available with states
        // Prefer the full HA hass (has localize, themes, callService, formatEntityState, etc.)
        // The full hass is set by canvas-ui-panel.js before React boots, or by <home-assistant> element.
        const getFullHass = () => {
          // 1. Check <home-assistant> element (most reliable - always has full hass in panel mode)
          const homeAssistant = document.querySelector('home-assistant');
          if (homeAssistant && (homeAssistant as any).hass && typeof (homeAssistant as any).hass.localize === 'function') {
            return (homeAssistant as any).hass;
          }
          // 2. window.hass - could be full HA hass (set by canvas-ui-panel.js) or partial (set by WebSocketProvider)
          const windowHass = (window as any).hass;
          if (windowHass && typeof windowHass.localize === 'function') {
            return windowHass; // Full HA hass
          }
          // 3. Fall back to partial hass (WebSocketProvider's hassConnection) if that's all we have
          return windowHass;
        };

        const waitForHass = () => {
          return new Promise<any>((resolve) => {
            const checkHass = () => {
              const hass = getFullHass();
              if (hass && hass.states && Object.keys(hass.states).length > 0) {
                resolve(hass);
              } else {
                setTimeout(checkHass, 100);
              }
            };
            checkHass();
          });
        };

        const initialHass = await waitForHass();
        
        console.log('[LovelaceCardWidget] Creating card:', {
          cardType: resolvedType,
          hasLoadCardHelpers: !!(window as any).loadCardHelpers,
          hasParentLoadCardHelpers: !!(window.parent as any).loadCardHelpers,
          windowHasCustomElements: !!window.customElements,
          parentHasCustomElements: !!(window.parent as any).customElements,
          hasHaCard: !!window.customElements?.get('ha-card'),
          parentHasHaCard: !!(window.parent as any).customElements?.get('ha-card'),
        });
        
        // Determine which window has the HA custom elements
        const haWindow = (window.parent !== window.self && (window.parent as any).customElements?.get('ha-card')) 
          ? window.parent 
          : window;
        
        // Try using loadCardHelpers first (for built-in cards)
        if ((haWindow as any).loadCardHelpers) {
          console.log('[LovelaceCardWidget] Using loadCardHelpers');
          const helpers = await (haWindow as any).loadCardHelpers();
          cardElement = await helpers.createCardElement(styledConfig);
        } else {
          // Fallback to direct element creation using parent window's custom elements.
          // normalizeCardName maps config type → registered element name:
          //   'thermostat'                  → 'hui-thermostat-card'
          //   'custom-mushroom-climate-card' → 'mushroom-climate-card'
          const elementName = normalizeCardName(resolvedType.replace(':', '-'));
          console.log('[LovelaceCardWidget] Direct element creation:', resolvedType, '→', elementName);
          cardElement = (haWindow as any).document.createElement(elementName);
          
          // Verify the element is actually a registered custom element in either window
          const isRegistered = !!(haWindow as any).customElements?.get(elementName)
            || !!window.customElements?.get(elementName);
          if (!isRegistered) {
            throw new Error(`Card '${resolvedType}' is not registered in Home Assistant. Make sure it is installed and loaded.`);
          }
        }

        // Set initial hass - use full HA hass (has localize, themes, callService, etc.)
        // IMPORTANT: Only set hass if states object exists to prevent undefined errors
        if (initialHass.states && typeof initialHass.states === 'object') {
          cardElement.hass = initialHass;
        } else {
          console.warn('[LovelaceCardWidget] initialHass.states is undefined, waiting...');
        }
        
        // Wait for element to be ready, then set config
        let configSetAttempts = 0;
        const maxAttempts = 50;
        
        const trySetConfig = () => {
          if (cardElement.setConfig) {
            cardElement.setConfig(styledConfig);
            setIsLoading(false);
          } else if (configSetAttempts < maxAttempts) {
            configSetAttempts++;
            setTimeout(trySetConfig, 100);
          } else {
            setError('Card element did not initialize properly');
            setIsLoading(false);
          }
        };
        
        trySetConfig();
        
        if (containerRef.current) {
          // Append card element (container is now empty since loading state is separate)
          containerRef.current.appendChild(cardElement);
          cardElementRef.current = cardElement;
        }
        
        cleanupFn = () => {
          // Cleanup handled in main useEffect return
        };
        
      } catch (err: any) {
        console.error('[LovelaceCardWidget] Error creating card:', err);
        setError(`Error: ${err.message}`);
        setIsLoading(false);
      }
    };

    createCard();

    // Cleanup - using .remove() method like old Canvas UI
    return () => {
      if (cleanupFn) cleanupFn();
      
      // Remove card element - check if still in DOM first to prevent removeChild errors
      if (cardElementRef.current && cardElementRef.current.parentNode) {
        try {
          cardElementRef.current.remove();
        } catch (e) {
          // Element may already be removed
        }
      }
      cardElementRef.current = null;
    };
  }, [
    // NOTE: 'hass' intentionally excluded - the 1s interval keeps card hass current.
    // Including hass here would recreate the card on every entity state change.
    config.config.cardType, 
    config.config.cardConfig, 
    config.config.cardModYaml,
    // Styling fields that affect card-mod generation
    config.config.backgroundColor,
    config.config.backgroundOpacity,
    config.config.gradientEnabled,
    config.config.gradientColor,
    config.config.gradientDirection,
    config.config.backgroundImage,
    config.config.cornerRadius,
    config.config.borderWidth,
    config.config.borderStyle,
    config.config.borderColor,
    config.config.padding,
    config.config.boxShadow,
    config.config.zIndex,
  ]);

  // Update hass on the card element whenever entity states change via WebSocket.
  // This is event-driven (no polling) so cards reflect state changes instantly.
  useEffect(() => {
    if (!cardElementRef.current) return;
    // Prefer full HA hass from <home-assistant> element (has localize, themes, callService, etc.)
    // Fall back to window.hass
    const homeAssistant = document.querySelector('home-assistant');
    const haHass = homeAssistant && (homeAssistant as any).hass;
    const windowHass = (window as any).hass;
    const fullHass = (haHass && typeof haHass.localize === 'function') ? haHass
      : (windowHass && typeof windowHass.localize === 'function') ? windowHass
      : windowHass;
    if (fullHass && fullHass.states && typeof fullHass.states === 'object') {
      (cardElementRef.current as any).hass = fullHass;
    }
  }, [entities]); // Re-runs whenever WebSocket pushes entity state changes

  // Notify cards of container size changes so graph/chart cards reflow correctly.
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      window.dispatchEvent(new Event('resize'));
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Note: Card-mod CSS generation available if needed in future
  // Can generate CSS from config.config styling options (cornerRadius, backgroundColor, etc.)
  // Currently using card-mod YAML field instead

  // Apply container styling
  const containerStyle: React.CSSProperties = {
    width: config.config.width,
    height: config.config.height,
    position: 'relative',
    overflow: 'hidden',
    zIndex: parseInt(config.config.zIndex || '1'),
  };

  return (
    <div style={containerStyle}>
      {/* Loading/error states shown on top of container */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'inherit',
          color: '#888',
          zIndex: 10,
        }}>
          Loading card...
        </div>
      )}
      {error && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          padding: '20px',
          boxSizing: 'border-box',
          backgroundColor: 'rgba(40, 40, 40, 0.95)',
          color: error.includes('only work inside') ? '#ffa726' : '#ff5555',
          fontSize: '14px',
          lineHeight: '1.5',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>
          <strong>{error.includes('only work inside') ? '⚠️ Kiosk Mode Limitation' : 'Error:'}</strong>
          <div style={{ marginTop: '8px' }}>{error}</div>
          {error.includes('only work inside') && (
            <div style={{ marginTop: '12px', fontSize: '12px', opacity: 0.8 }}>
              💡 Use Button, Text, Gauge, or other native widgets for kiosk displays.
            </div>
          )}
        </div>
      )}
      {/* Container for card - always exists, card appended manually */}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export const lovelaceCardWidgetMetadata: WidgetMetadata = {
  name: 'Lovelace Card',
  description: 'Embed any Home Assistant Lovelace card (built-in or custom)',
  icon: 'DashboardOutlined',
  category: 'display',
  defaultSize: { w: 300, h: 200 },
  fields: [
    { name: 'width', type: 'number', label: 'Width', default: 300, category: 'layout' },
    { name: 'height', type: 'number', label: 'Height', default: 200, category: 'layout' },
    {
      name: 'cardType',
      type: 'select',
      label: 'Card Type',
      default: 'entities',
      category: 'behavior',
      options: [
        { value: 'entities', label: 'Entities' },
        { value: 'button', label: 'Button' },
        { value: 'glance', label: 'Glance' },
        { value: 'picture-entity', label: 'Picture Entity' },
        { value: 'thermostat', label: 'Thermostat' },
        { value: 'sensor', label: 'Sensor' },
        { value: 'gauge', label: 'Gauge' },
        { value: 'light', label: 'Light' },
        { value: 'media-control', label: 'Media Control' },
        { value: 'weather-forecast', label: 'Weather Forecast' },
        { value: 'alarm-panel', label: 'Alarm Panel' },
        { value: 'custom:mushroom-entity-card', label: 'Mushroom Entity' },
        { value: 'custom:mushroom-light-card', label: 'Mushroom Light' },
        { value: 'custom:mushroom-thermostat-card', label: 'Mushroom Thermostat' },
        { value: 'custom:button-card', label: 'Custom Button Card' },
        { value: 'custom:mini-graph-card', label: 'Mini Graph Card' },
        { value: 'other', label: 'Other / Custom (specify type: in YAML)' },
      ],
    },
    {
      name: 'cardConfig',
      type: 'code-editor',
      label: 'Card Configuration (YAML/JSON)',
      default: 'entities:\n  - sun.sun\ntitle: Example',
      category: 'behavior',
    },
    {
      name: 'cardModYaml',
      type: 'code-editor',
      label: 'Card-Mod Styling (Optional)',
      default: '',
      category: 'style',
    },
    // Styling options
    { name: 'cornerRadius', type: 'number', label: 'Corner Radius', default: 12, category: 'style' },
    {
      name: 'backgroundColor',
      type: 'color',
      label: 'Background Color',
      default: 'var(--ha-card-background, #1c1c1c)',
      category: 'style',
    },
    { name: 'backgroundOpacity', type: 'number', label: 'Background Opacity (0-100)', default: 100, category: 'style', min: 0, max: 100 },
    {
      name: 'gradientEnabled',
      type: 'select',
      label: 'Enable Gradient',
      default: 'no',
      category: 'style',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
      ],
    },
    { name: 'gradientColor', type: 'color', label: 'Gradient Color', default: '#2c2c2c', category: 'style' },
    { name: 'gradientDirection', type: 'text', label: 'Gradient Direction', default: '180deg', category: 'style' },
    { name: 'backgroundImage', type: 'text', label: 'Background Image URL', default: '', category: 'style' },
    { name: 'borderWidth', type: 'number', label: 'Border Width', default: 0, category: 'style', min: 0, max: 10 },
    {
      name: 'borderStyle',
      type: 'select',
      label: 'Border Style',
      default: 'solid',
      category: 'style',
      options: [
        { value: 'solid', label: 'Solid' },
        { value: 'dashed', label: 'Dashed' },
        { value: 'dotted', label: 'Dotted' },
        { value: 'double', label: 'Double' },
      ],
    },
    { name: 'borderColor', type: 'color', label: 'Border Color', default: '#444444', category: 'style' },
    { name: 'padding', type: 'number', label: 'Padding', default: 0, category: 'style', min: 0, max: 50 },
    { name: 'boxShadow', type: 'text', label: 'Box Shadow', default: 'none', category: 'style' },
    { name: 'zIndex', type: 'number', label: 'Z-Index', default: 1, category: 'style' },
  ],
};

export default LovelaceCardWidget;
