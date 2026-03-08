/**
 * Lovelace Card Discovery Service
 * 
 * Provides smart auto-detection of Lovelace cards for AI context:
 * 1. Loads card database from LOVELACE_CARDS.json
 * 2. Detects probable cards from user request and entities
 * 3. Formats card information for AI prompts
 */

export interface LovelaceCardSchema {
  name: string;
  description: string;
  domains: string[];
  keywords: string[];
  example: any;
  schema: Record<string, string>;
}

export interface LovelaceCardDatabase {
  cards: Record<string, LovelaceCardSchema>;
}

export interface DetectedCard {
  type: string;
  name: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

class LovelaceCardDiscoveryService {
  private cardDatabase: LovelaceCardDatabase | null = null;
  private loadPromise: Promise<void> | null = null;

  /**
   * Load card database from JSON file
   */
  async loadCardDatabase(): Promise<void> {
    if (this.cardDatabase) {
      return; // Already loaded
    }

    if (this.loadPromise) {
      return this.loadPromise; // Loading in progress
    }

    this.loadPromise = (async () => {
      try {
        const response = await fetch('/canvas-ui-static/LOVELACE_CARDS.json');
        if (!response.ok) {
          console.warn('[LovelaceCardDiscovery] Failed to load LOVELACE_CARDS.json, using empty database');
          this.cardDatabase = { cards: {} };
          return;
        }
        this.cardDatabase = await response.json();
        console.log(`[LovelaceCardDiscovery] Loaded ${Object.keys(this.cardDatabase?.cards || {}).length} card definitions`);
      } catch (error) {
        console.error('[LovelaceCardDiscovery] Error loading card database:', error);
        this.cardDatabase = { cards: {} };
      }
    })();

    return this.loadPromise;
  }

  /**
   * Get all available card types
   */
  getAvailableCards(): string[] {
    if (!this.cardDatabase) {
      return [];
    }
    return Object.keys(this.cardDatabase.cards);
  }

  /**
   * Get card information
   */
  getCardInfo(cardType: string): LovelaceCardSchema | null {
    if (!this.cardDatabase) {
      return null;
    }
    return this.cardDatabase.cards[cardType] || null;
  }

  /**
   * Detect probable cards from user request and entities
   */
  detectProbableCards(userRequest: string, selectedEntities: any[]): DetectedCard[] {
    if (!this.cardDatabase) {
      return [];
    }

    const detected: DetectedCard[] = [];
    const requestLower = userRequest.toLowerCase();
    
    // Extract entity domains
    const entityDomains = selectedEntities.map(e => {
      const parts = e.entity_id?.split('.') || [];
      return parts[0];
    }).filter(Boolean);

    const uniqueDomains = [...new Set(entityDomains)];

    // Check each card for matches
    for (const [cardType, cardInfo] of Object.entries(this.cardDatabase.cards)) {
      let confidence: 'high' | 'medium' | 'low' | null = null;
      let reason = '';

      // High confidence: Exact card type mentioned
      if (requestLower.includes(cardType.replace('custom:', ''))) {
        confidence = 'high';
        reason = `Card type "${cardType}" mentioned in request`;
      }
      // High confidence: Keywords match + domain match
      else if (cardInfo.keywords.some(kw => requestLower.includes(kw))) {
        const keywordMatch = cardInfo.keywords.find(kw => requestLower.includes(kw));
        
        // Check domain match
        const domainMatch = uniqueDomains.some(domain => 
          cardInfo.domains.includes(domain) || cardInfo.domains.includes('*')
        );

        if (domainMatch) {
          confidence = 'high';
          reason = `Keyword "${keywordMatch}" + entity domain match`;
        } else if (uniqueDomains.length === 0) {
          confidence = 'medium';
          reason = `Keyword "${keywordMatch}" match`;
        }
      }
      // Medium confidence: Domain match only
      else if (uniqueDomains.length > 0) {
        const domainMatch = uniqueDomains.find(domain => cardInfo.domains.includes(domain));
        if (domainMatch) {
          confidence = 'medium';
          reason = `Entity domain "${domainMatch}" matches card`;
        }
      }

      if (confidence) {
        detected.push({
          type: cardType,
          name: cardInfo.name,
          description: cardInfo.description,
          confidence,
          reason
        });
      }
    }

    // Sort by confidence (high > medium > low)
    detected.sort((a, b) => {
      const order = { high: 3, medium: 2, low: 1 };
      return order[b.confidence] - order[a.confidence];
    });

    console.log(`[LovelaceCardDiscovery] Detected ${detected.length} probable cards:`, detected);
    return detected;
  }

  /**
   * Generate compact card list for AI prompt
   */
  generateCardList(): string {
    if (!this.cardDatabase) {
      return 'No Lovelace cards available';
    }

    const cards = Object.entries(this.cardDatabase.cards).map(([type, info]) => {
      return `- ${type} - ${info.description}`;
    });

    return `AVAILABLE LOVELACE CARDS (${cards.length} total):\n${cards.join('\n')}`;
  }

  /**
   * Generate detailed schemas for specific cards
   */
  generateDetailedSchemas(cardTypes: string[]): string {
    if (!this.cardDatabase) {
      return '';
    }

    const schemas: string[] = [];

    for (const cardType of cardTypes) {
      const cardInfo = this.cardDatabase.cards[cardType];
      if (!cardInfo) continue;

      const schemaLines = Object.entries(cardInfo.schema).map(([key, desc]) => {
        return `  - ${key}: ${desc}`;
      });

      // Convert example config to YAML string for the widget
      const cardConfigYaml = Object.entries(cardInfo.example)
        .filter(([key]) => key !== 'type') // Skip 'type' as it's in cardType
        .map(([key, value]) => {
          if (typeof value === 'object') {
            return `${key}:\n  ${JSON.stringify(value, null, 2).split('\n').join('\n  ')}`;
          }
          return `${key}: ${value}`;
        })
        .join('\n');

      schemas.push(`
=== ${cardType} ===
${cardInfo.description}

WIDGET USAGE (Copy this format!):
\`\`\`json
{
  "type": "lovelacecard",
  "config": {
    "cardType": "${cardType}",
    "cardConfig": "${cardConfigYaml.replace(/\n/g, '\\n').replace(/"/g, '\\"')}"
  }
}
\`\`\`

Card Properties:
${schemaLines.join('\n')}
`);
    }

    if (schemas.length === 0) {
      return '';
    }

    return `
DETAILED LOVELACE CARD SCHEMAS (for probable cards):
${schemas.join('\n---\n')}
`;
  }

  /**
   * Generate complete Lovelace section for AI prompt
   */
  generateLovelaceSection(userRequest: string, selectedEntities: any[]): string {
    if (!this.cardDatabase) {
      return '';
    }

    // Get all cards
    const cardList = this.generateCardList();

    // Detect probable cards
    const probableCards = this.detectProbableCards(userRequest, selectedEntities);
    
    // Generate detailed schemas for high-confidence cards (max 3)
    const highConfidenceCards = probableCards
      .filter(c => c.confidence === 'high')
      .slice(0, 3)
      .map(c => c.type);

    const detailedSchemas = highConfidenceCards.length > 0
      ? this.generateDetailedSchemas(highConfidenceCards)
      : '';

    return `
⚠️ WIDGET TYPE SELECTION - CRITICAL RULES ⚠️

DEFAULT: Use regular canvas widgets (button, text, icon, slider, gauge, etc.)
ONLY use Lovelace cards when:
  1. User explicitly requests "lovelace card" or "home assistant card"
  2. Request needs entity control (toggle light, adjust thermostat, play media)
  3. Request needs entity state display (weather card, sensor history graph)

EXAMPLES OF WHEN TO USE REGULAR WIDGETS (NOT LOVELACE):
  ✅ "create a red button" → Use button widget
  ✅ "add a text label saying Hello" → Use text widget  
  ✅ "show a temperature icon" → Use icon widget
  ✅ "make a slider" → Use slider widget
  ✅ "create round buttons for days of the week" → Use button widgets
  
EXAMPLES OF WHEN TO USE LOVELACE CARDS:
  ✅ "add a light control card for bedroom lights" → Use custom:mushroom-light-card
  ✅ "show thermostat control" → Use thermostat card
  ✅ "add a weather forecast" → Use weather-forecast card
  ✅ "graph the temperature sensor" → Use custom:mini-graph-card

If the user just wants buttons, text, icons, or visual elements → USE REGULAR WIDGETS!

${cardList}
${detailedSchemas}

CRITICAL - LOVELACE CARD FORMAT:
When using Lovelace cards, you MUST use this exact widget structure:
{
  "type": "lovelacecard",
  "config": {
    "cardType": "card-type-here",
    "cardConfig": "entity: entity.id\\nname: Display Name\\nother_property: value"
  }
}

DO NOT put entity or other card properties directly in config!
PUT ALL CARD PROPERTIES IN cardConfig AS YAML STRING!

STYLING LOVELACE CARDS (background, colors, borders, etc.):
⚠️ CRITICAL: The lovelacecard widget has built-in style properties that automatically generate card-mod CSS!

✅ CORRECT - Use widget config properties for card styling:

EXAMPLE 1 - Red background:
{
  "type": "lovelacecard",
  "config": {
    "cardType": "light",
    "cardConfig": "entity: light.bedroom\\nname: Bedroom Light",
    "backgroundColor": "#ff0000"
  }
}

EXAMPLE 2 - Multiple styles (background + border + rounded corners):
{
  "type": "lovelacecard",
  "config": {
    "cardType": "light",
    "cardConfig": "entity: light.bedroom\\nname: Bedroom Light",
    "backgroundColor": "#ff0000",
    "borderWidth": 3,
    "borderColor": "#ffffff",
    "borderStyle": "solid",
    "cornerRadius": 15
  }
}

AVAILABLE LOVELACE CARD STYLING PROPERTIES (in config, NOT cardConfig):
- backgroundColor: "#ff0000" (color hex or CSS color)
- backgroundOpacity: 100 (0-100, for transparency)
- cornerRadius: 15 (pixels, default: 12)
- borderWidth: 2 (pixels, 0 = no border)
- borderStyle: "solid" | "dashed" | "dotted" | "double"
- borderColor: "#ffffff" (color hex or CSS color)
- padding: 20 (pixels, default: 0)
- boxShadow: "0 2px 5px rgba(0,0,0,0.3)" (CSS box-shadow)
- gradientEnabled: "yes" | "no"
- gradientColor: "#2c2c2c" (second color for gradient)
- gradientDirection: "180deg" (gradient angle)
- backgroundImage: "url" (background image URL)

❌ WRONG - DO NOT manually add card_mod to cardConfig YAML:
"cardConfig": "entity: light.bedroom\\ncard_mod:\\n  style: |\\n    ha-card { ... }"  ✗ Don't do this!

The widget automatically generates card-mod CSS from the config properties above!
`.trim();
  }
}

// Singleton instance
export const lovelaceCardDiscovery = new LovelaceCardDiscoveryService();
