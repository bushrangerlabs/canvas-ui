/**
 * Widget Catalog Generator
 * 
 * Auto-generates compact AI prompt catalog from widget metadata.
 * Single source of truth - reads directly from widget registry.
 */

import { WIDGET_REGISTRY } from '../../shared/registry/widgetRegistry';
import type { FieldMetadata } from '../../shared/types/metadata';

interface PropertyPattern {
  type: string;
  description: string;
  examples?: string[];
}

// Type patterns for the legend
const TYPE_PATTERNS: Record<string, PropertyPattern> = {
  text: { type: 'text', description: 'any string value' },
  textarea: { type: 'text', description: 'multi-line text' },
  number: { type: 'num', description: 'numeric value' },
  slider: { type: 'num', description: 'numeric value with min/max' },
  checkbox: { type: 'bool', description: 'true/false' },
  color: { type: 'color', description: 'hex color (#ff0000)' },
  entity: { type: 'entity', description: 'HA entity ID (light.bedroom)' },
  icon: { type: 'icon', description: 'mdi:calendar or MUIIconName' },
  select: { type: 'enum', description: 'pick one from options' },
  font: { type: 'font', description: 'font family name' },
};

// Universal properties that appear in many widgets
const UNIVERSAL_PROPERTIES = new Set([
  'backgroundColor',
  'backgroundImage',
  'backgroundSize',
  'backgroundPosition',
  'backgroundRepeat',
  'borderWidth',
  'borderColor',
  'borderRadius',
  'borderStyle',
  'boxShadow',
  'shadowColor',
  'shadowX',
  'shadowY',
  'shadowBlur',
  'opacity',
  'style',
]);

// Layout properties (always present)
const LAYOUT_PROPERTIES = new Set(['x', 'y', 'width', 'height', 'zIndex']);

/**
 * Format a field for the catalog
 */
function formatField(field: FieldMetadata): string {
  const typePattern = TYPE_PATTERNS[field.type] || { type: field.type, description: '' };
  
  let formatted = `  ${field.name}: ${typePattern.type}`;
  
  // Add default value if not empty/null
  if (field.default !== undefined && field.default !== '' && field.default !== null) {
    formatted += `(${field.default})`;
  }
  
  // Add options for enums
  if (field.type === 'select' && field.options) {
    const optionValues = field.options.map(opt => opt.value).join('|');
    formatted += ` [${optionValues}]`;
  }
  
  // Add range for sliders/numbers with min/max
  if ((field.type === 'slider' || field.type === 'number') && field.min !== undefined && field.max !== undefined) {
    formatted += ` {${field.min}-${field.max}}`;
  }
  
  // Add important notes
  const notes: string[] = [];
  if (field.type === 'checkbox' && field.name === 'showIcon') {
    notes.push('MUST be true to show icon!');
  }
  if (field.description && field.description.toLowerCase().includes('required')) {
    notes.push('REQUIRED');
  }
  
  if (notes.length > 0) {
    formatted += ` // ${notes.join(', ')}`;
  }
  
  return formatted;
}

/**
 * Generate the complete widget catalog from registry
 */
export function generateWidgetCatalog(): string {
  const sections: string[] = [];
  
  // === LEGEND ===
  sections.push('=== TYPE LEGEND ===');
  sections.push('text = string value');
  sections.push('num = numeric value');
  sections.push('bool = true/false');
  sections.push('color = hex color (#ff0000)');
  sections.push('entity = HA entity (light.bedroom, sensor.temp)');
  sections.push('icon = icon name (mdi:calendar, Event, Home)');
  sections.push('enum = pick one option [option1|option2|option3]');
  sections.push('font = font family (Arial, Roboto)');
  sections.push('');
  
  // === UNIVERSAL ===
  sections.push('=== UNIVERSAL (all widgets) ===');
  sections.push('Position: x, y, width, height, zIndex (always required)');
  sections.push('Background: backgroundColor(color), backgroundImage(text), backgroundSize(enum) [cover|contain|auto]');
  sections.push('Border: borderWidth(num), borderColor(color), borderRadius(num), borderStyle(enum) [solid|dashed|dotted]');
  sections.push('Shadow: boxShadow(text), shadowColor(color)');
  sections.push('');
  
  // === WIDGET-SPECIFIC ===
  sections.push('=== WIDGET-SPECIFIC PROPERTIES ===');
  
  // Process each widget
  const widgetNames = Object.keys(WIDGET_REGISTRY).sort();
  
  for (const widgetType of widgetNames) {
    const metadata = WIDGET_REGISTRY[widgetType];
    if (!metadata || !metadata.fields) continue;
    
    // Filter out universal and layout properties
    const specificFields = metadata.fields.filter(field => 
      !UNIVERSAL_PROPERTIES.has(field.name) && 
      !LAYOUT_PROPERTIES.has(field.name)
    );
    
    if (specificFields.length === 0) {
      // Widget only uses universal properties
      sections.push(`${widgetType}: (uses only universal properties)`);
      continue;
    }
    
    // Add widget section
    sections.push(`${widgetType}:`);
    
    // Group by category for readability
    const byCategory: Record<string, FieldMetadata[]> = {};
    for (const field of specificFields) {
      const cat = field.category || 'other';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(field);
    }
    
    // Prioritize behavior fields first, then style
    const categoryOrder = ['behavior', 'style', 'other'];
    for (const category of categoryOrder) {
      const fields = byCategory[category];
      if (!fields || fields.length === 0) continue;
      
      for (const field of fields) {
        // Skip conditional fields that are rarely used
        if (field.visibleWhen) continue;
        
        sections.push(formatField(field));
      }
    }
    
    sections.push(''); // Blank line between widgets
  }
  
  return sections.join('\n');
}

/**
 * Get the required output format structure
 */
export function generateWidgetExamples(): string {
  return `=== OUTPUT FORMAT ===

IMPORTANT: Position values are in PIXELS (not grid units)
- x, y: pixel coordinates (10, 20, 100, 200, etc.)
- width: typical 150-200px for buttons, 300-500px for borders  
- height: typical 80-100px for buttons, 200-300px for borders
- zIndex: 1-999 (borders usually 999)

STRUCTURE:
{
  "version": "2.0.0",
  "exportedAt": "{{timestamp}}",
  "view": {
    "id": "{{viewId}}",
    "name": "{{viewName}}",
    "widgets": [
      {"id": "btn-1", "type": "button", "name": "Monday Button", "position": {"x": 10, "y": 10, "width": 150, "height": 80, "zIndex": 1}, "config": {...}, "bindings": {}}
    ]
  }
}

CRITICAL RULES:
1. MUST include version, exportedAt, view wrapper
2. MUST use view.widgets array (NOT top-level widgets)
3. Each widget MUST have: id, type, name (descriptive), position, config, bindings
4. Widget names should be descriptive (e.g., "Monday Button", "Temperature Display", "Main Border")
5. ALL widgets (including borders) go in ONE "widgets" array
6. For icons on buttons: showIcon MUST be true + set iconColor for colored icons
7. RESPOND WITH ONLY THE JSON - NO explanatory text, NO examples, NO tutorials
8. FOLLOW THE EXACT NUMBERS AND SPECIFICATIONS from the user request (if they say 7 buttons, create 7 buttons)`;
}
