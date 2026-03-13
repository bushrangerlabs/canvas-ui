/**
 * Prompt Builder - Simplified Single-Pass Version
 * 
 * Builds a simple prompt for single-pass dashboard generation.
 */

import type { ExportedView } from '../../shared/utils/viewExportImport';
import { lovelaceCardDiscovery } from './LovelaceCardDiscovery';
import { promptTemplateStore } from './PromptTemplateStore';

export interface SelectedEntity {
  entity_id: string;
  friendly_name: string;
  domain: string;
  state?: string;
}

/**
 * Stage1Output (legacy - for UI compatibility)
 */
export interface Stage1Output {
  userIntent: string;
  requestType?: string;
}

/**
 * Parse user request and extract clear requirements
 */
function buildTaskBreakdown(userRequest: string): string {
  const lower = userRequest.toLowerCase();
  const breakdown: string[] = ['=== TASK BREAKDOWN ===', ''];
  
  // Extract number of widgets
  const numberMatch = userRequest.match(/(\d+)\s+(\w+)/);
  if (numberMatch) {
    const count = parseInt(numberMatch[1]);
    const widgetType = numberMatch[2];
    breakdown.push(`CREATE: ${count} ${widgetType} widgets`);
    breakdown.push('');
    
    // Show example config based on widget type
    if (widgetType.includes('button')) {
      breakdown.push('BUTTON CONFIG EXAMPLE:');
      breakdown.push('{');
      breakdown.push('  "id": "button-1",');
      breakdown.push('  "type": "button",');
      breakdown.push('  "position": {"x": 10, "y": 10, "width": 150, "height": 80, "zIndex": 1},');
      breakdown.push('  "config": {');
      breakdown.push('    "label": "LABEL_FROM_REQUEST",');
      breakdown.push('    "backgroundColor": "COLOR_FROM_REQUEST",');
      breakdown.push('    "showIcon": true,');
      breakdown.push('    "icon": "ICON_FROM_REQUEST",');
      breakdown.push('    "iconPosition": "top",');
      breakdown.push('    "iconColor": "ICON_COLOR_FROM_REQUEST"');
      breakdown.push('  }');
      breakdown.push('}');
      breakdown.push('');
    }
  }
  
  // Extract colors
  const colorMap: Record<string, string> = {
    'red': '#ff0000',
    'blue': '#0000ff',
    'green': '#00ff00',
    'yellow': '#ffff00',
    'white': '#ffffff',
    'black': '#000000'
  };
  
  for (const [colorName, hexCode] of Object.entries(colorMap)) {
    if (lower.includes(colorName)) {
      if (lower.includes(`${colorName} button`) || (colorName === 'red' && lower.includes('button'))) {
        breakdown.push(`BUTTON BACKGROUND: "backgroundColor": "${hexCode}"`);
      }
      if (lower.includes(`${colorName} icon`) || lower.includes(`${colorName} calendar`)) {
        breakdown.push(`ICON COLOR: "iconColor": "${hexCode}"`);
      }
      if (lower.includes(`${colorName} border`)) {
        breakdown.push(`BORDER COLOR: "borderColor": "${hexCode}"`);
      }
    }
  }
  
  // Extract specific patterns
  if (lower.includes('days of the week') || lower.includes('day of the week')) {
    breakdown.push('');
    breakdown.push('BUTTON LABELS (use these exact strings):');
    breakdown.push('Button 1: "Monday"');
    breakdown.push('Button 2: "Tuesday"');
    breakdown.push('Button 3: "Wednesday"');
    breakdown.push('Button 4: "Thursday"');
    breakdown.push('Button 5: "Friday"');
    breakdown.push('Button 6: "Saturday"');
    breakdown.push('Button 7: "Sunday"');
  }
  
  if (lower.includes('calendar icon')) {
    breakdown.push('');
    breakdown.push('ICON SETUP (required for icons to show):');
    breakdown.push('"icon": "mdi:calendar"');
    breakdown.push('"showIcon": true');
    breakdown.push('"iconPosition": "top"');
  }
  
  if (lower.includes('border')) {
    breakdown.push('');
    breakdown.push('BORDER WIDGET:');
    breakdown.push('{');
    breakdown.push('  "id": "border-1",');
    breakdown.push('  "type": "border",');
    breakdown.push('  "position": {"x": 0, "y": 0, "width": 500, "height": 300, "zIndex": 999},');
    breakdown.push('  "config": {"borderWidth": 3, "borderColor": "#ffffff", "borderRadius": 3}');
    breakdown.push('}');
  }
  
  breakdown.push('');
  return breakdown.join('\n');
}

/**
 * Build simple one-shot generation prompt
 */
export function buildGenerationPrompt(
  userRequest: string,
  selectedEntities: SelectedEntity[],
  viewId: string,
  viewName: string,
  skipWidgetCatalog: boolean = false,
  currentWidgets: any[] = [],  // Current widgets on canvas for edit mode
  viewWidth: number = 1920,
  viewHeight: number = 1080
): string {
  const entityList = selectedEntities.length > 0
    ? selectedEntities.map(e => `${e.entity_id} (${e.friendly_name})`).join(', ')
    : 'No entities selected';

  const timestamp = new Date().toISOString();
  const isEditMode = currentWidgets.length > 0;

  // Extract key requirements from user request
  const taskBreakdown = buildTaskBreakdown(userRequest);

  // Choose system prompt based on mode
  const systemPrompt = isEditMode 
    ? promptTemplateStore.getTemplate('systemPromptEdit')
    : promptTemplateStore.getTemplate('systemPromptCreate');

  // For Open WebUI with file attachment, skip embedded catalog to avoid conflicting context
  const widgetSection = skipWidgetCatalog
    ? 'AVAILABLE WIDGETS:\nRefer to attached CANVAS_UI_WIDGETS.md file for complete widget documentation.'
    : `AVAILABLE WIDGETS:\n${promptTemplateStore.getTemplate('widgetCatalog')}`;

  // If edit mode, show current widgets in JSON format (same format AI outputs)
  const currentWidgetsSection = isEditMode
    ? `
CURRENT WIDGETS ON CANVAS:
\`\`\`json
{
  "version": "2.0.0",
  "exportedAt": "${timestamp}",
  "view": {
    "id": "${viewId}",
    "name": "${viewName}",
    "widgets": ${JSON.stringify(currentWidgets, null, 2)}
  }
}
\`\`\`

The user wants to make changes to this dashboard. Return the COMPLETE updated view with ALL widgets (including unchanged ones).
`
    : '';

  // Generate Lovelace card section (auto-detects probable cards)
  const lovelaceSection = lovelaceCardDiscovery.generateLovelaceSection(userRequest, selectedEntities);

  const canvasBoundsSection = `CANVAS BOUNDS:
The view is ${viewWidth}px wide × ${viewHeight}px tall.
All widget positions must satisfy: x + width ≤ ${viewWidth} and y + height ≤ ${viewHeight}.
Start widgets at x ≥ 10, y ≥ 10. Do not place any widget outside these bounds.`;

  return `
${systemPrompt}

USER REQUEST:
${userRequest}

${taskBreakdown}

${canvasBoundsSection}

AVAILABLE ENTITIES:
${entityList}

${lovelaceSection}

${currentWidgetsSection}

${widgetSection}

${promptTemplateStore.getTemplate('outputFormat')
  .replace('{{timestamp}}', timestamp)
  .replace('{{viewId}}', viewId)
  .replace('{{viewName}}', viewName)}
`.trim();
}

/**
 * Escape literal control characters (0x00–0x1F) that appear inside JSON string
 * values.  LLMs sometimes emit bare newlines/tabs/etc. inside strings, which
 * JSON.parse rejects.  Structural whitespace outside strings is left untouched.
 */
function sanitizeJsonControlChars(json: string): string {
  const CTRL_ESCAPE: Record<number, string> = {
    0x08: '\\b', 0x09: '\\t', 0x0a: '\\n',
    0x0c: '\\f', 0x0d: '\\r',
  };
  let result = '';
  let inString = false;
  let escaped = false;

  for (let i = 0; i < json.length; i++) {
    const code = json.charCodeAt(i);
    const char = json[i];

    if (escaped) {
      result += char;
      escaped = false;
      continue;
    }

    if (char === '\\' && inString) {
      result += char;
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      result += char;
      continue;
    }

    if (inString && code < 0x20) {
      result += CTRL_ESCAPE[code] ?? `\\u${code.toString(16).padStart(4, '0')}`;
    } else {
      result += char;
    }
  }

  return result;
}

/**
 * Extract ExportedView JSON from AI response
 * Handles markdown code blocks and plain JSON
 */
export function extractExportedView(aiResponse: string): ExportedView | null {
  try {
    // Try to extract JSON from markdown code block
    const jsonMatch = aiResponse.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : aiResponse;

    // Find JSON object (starts with { and ends with })
    const startIdx = jsonStr.indexOf('{');
    const lastIdx = jsonStr.lastIndexOf('}');
    
    if (startIdx === -1 || lastIdx === -1) {
      return null;
    }

    let extracted = jsonStr.substring(startIdx, lastIdx + 1);
    
    // Remove JavaScript-style comments (AI sometimes adds them)
    // Remove single-line comments: // comment
    extracted = extracted.replace(/\/\/.*$/gm, '');
    // Remove multi-line comments: /* comment */
    extracted = extracted.replace(/\/\*[\s\S]*?\*\//g, '');
    // Remove trailing commas before closing braces/brackets (common AI mistake)
    extracted = extracted.replace(/,(\s*[}\]])/g, '$1');

    // Sanitize bare control characters inside JSON string values.
    // LLMs sometimes emit literal \n, \t, or other 0x00–0x1F bytes inside strings,
    // which JSON.parse rejects.  Walk char-by-char, escape only inside strings.
    extracted = sanitizeJsonControlChars(extracted);

    const parsed = JSON.parse(extracted);

    // Validate basic structure
    if (!parsed.view || !parsed.view.widgets || !Array.isArray(parsed.view.widgets)) {
      console.error('[extractExportedView] Invalid structure - missing view.widgets array');
      return null;
    }

    // Merge borders array into widgets array if it exists (AI sometimes creates separate arrays)
    if (parsed.view.borders && Array.isArray(parsed.view.borders)) {
      console.log('[extractExportedView] Merging', parsed.view.borders.length, 'border widgets into widgets array');
      parsed.view.widgets = [...parsed.view.widgets, ...parsed.view.borders];
      delete parsed.view.borders;
    }

    return parsed as ExportedView;
  } catch (error) {
    console.error('[extractExportedView] Failed to parse JSON:', error);
    return null;
  }
}
