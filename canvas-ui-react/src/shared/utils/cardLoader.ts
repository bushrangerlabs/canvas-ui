/**
 * Card Loader - Dynamically load Lovelace card custom elements in kiosk mode
 * 
 * Strategy:
 * 1. Detect if card element is already registered
 * 2. If not, fetch card definition from HA's frontend
 * 3. Register custom element in current window
 * 4. Cache loaded cards to avoid re-fetching
 */

// Cache of loaded card types
const loadedCards = new Set<string>();

// Track loading promises to avoid duplicate fetches
const loadingCards = new Map<string, Promise<void>>();

/**
 * Check if a custom element is registered
 * Checks both current window and parent window (for iframe scenarios)
 */
export function isCardRegistered(cardType: string): boolean {
  const elementName = normalizeCardName(cardType);
  
  // Check our own registry first
  if (customElements.get(elementName)) {
    return true;
  }
  
  // Check parent window's registry (if we're in iframe)
  if (window.parent !== window) {
    const parentRegistry = (window.parent as any).customElements;
    if (parentRegistry?.get(elementName)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Normalize card type to custom element name
 * e.g., "thermostat" -> "hui-thermostat-card"
 * e.g., "custom-mushroom-climate-card" -> "mushroom-climate-card"
 * e.g., "custom-button-card" -> "button-card"
 */
export function normalizeCardName(cardType: string): string {
  // Custom cards: strip "custom-" prefix (it's just a HA namespace convention)
  // custom-mushroom-climate-card -> mushroom-climate-card
  if (cardType.startsWith('custom-')) {
    const withoutPrefix = cardType.replace(/^custom-/, '');
    // Ensure it ends with -card
    return withoutPrefix.endsWith('-card') ? withoutPrefix : `${withoutPrefix}-card`;
  }
  
  // Built-in HA cards get hui- prefix
  const cleanType = cardType.replace(/^hui-/, '').replace(/-card$/, '');
  return `hui-${cleanType}-card`;
}

/**
 * Load a Lovelace card custom element dynamically
 * Works by copying the element definition from parent window (edit/preview mode)
 * or attempting to load from HA's frontend bundle
 */
export async function loadCard(cardType: string): Promise<void> {
  const elementName = normalizeCardName(cardType);

  // Already registered?
  if (isCardRegistered(cardType)) {
    console.log(`[CardLoader] ${elementName} already registered`);
    return;
  }

  // Already loading?
  if (loadingCards.has(elementName)) {
    console.log(`[CardLoader] ${elementName} already loading, waiting...`);
    return loadingCards.get(elementName)!;
  }

  // Start loading
  const loadPromise = (async () => {
    try {
      console.log(`[CardLoader] Loading ${elementName}...`);

      // Strategy 1: Try to get from parent window (if we're in iframe)
      if (window.parent !== window) {
        const parentElement = (window.parent as any).customElements?.get(elementName);
        if (parentElement) {
          console.log(`[CardLoader] Found ${elementName} in parent window, copying...`);
          customElements.define(elementName, parentElement);
          loadedCards.add(elementName);
          console.log(`[CardLoader] ✅ ${elementName} loaded from parent`);
          return;
        }
      }

      // Strategy 2: Try to load from HA's frontend chunks
      // HA frontend loads cards dynamically from /frontend_latest/chunk.*.js
      // We can try to load the specific chunk for this card
      await loadCardFromHAFrontend(elementName);

      loadedCards.add(elementName);
      console.log(`[CardLoader] ✅ ${elementName} loaded successfully`);
    } catch (error) {
      console.error(`[CardLoader] ❌ Failed to load ${elementName}:`, error);
      throw error;
    } finally {
      loadingCards.delete(elementName);
    }
  })();

  loadingCards.set(elementName, loadPromise);
  return loadPromise;
}

/**
 * Attempt to load card from HA's frontend
 * This is experimental and may not work for all cards
 */
async function loadCardFromHAFrontend(elementName: string): Promise<void> {
  // Try to access HA's loadCardHelpers from parent window
  const parentLoadCardHelpers = (window.parent as any).loadCardHelpers;
  
  if (!parentLoadCardHelpers) {
    throw new Error('loadCardHelpers not available - cannot load cards in standalone mode');
  }

  // Use HA's card helpers to create element (this registers it)
  const helpers = await parentLoadCardHelpers();
  
  // Convert element name back to config type
  let configType: string;
  
  // Check if this looks like a custom card (doesn't have hui- prefix)
  if (!elementName.startsWith('hui-')) {
    // Custom card: mushroom-climate-card -> custom:mushroom-climate-card
    const baseName = elementName.replace(/-card$/, '');
    configType = `custom:${baseName}`;
  } else {
    // Built-in card: hui-thermostat-card -> thermostat
    configType = elementName.replace('hui-', '').replace('-card', '');
  }
  
  const testConfig = { type: configType };
  
  // Creating the element should trigger registration
  await helpers.createCardElement(testConfig);
  
  // Wait a bit for registration to complete
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Check if it's now registered
  if (!customElements.get(elementName)) {
    throw new Error(`Failed to register ${elementName}`);
  }
}

/**
 * Load multiple cards at once
 */
export async function loadCards(cardTypes: string[]): Promise<void> {
  await Promise.all(cardTypes.map(type => loadCard(type)));
}

/**
 * Get list of all loaded cards
 */
export function getLoadedCards(): string[] {
  return Array.from(loadedCards);
}

/**
 * Clear loaded cards cache (for testing)
 */
export function clearLoadedCards(): void {
  loadedCards.clear();
  loadingCards.clear();
}
