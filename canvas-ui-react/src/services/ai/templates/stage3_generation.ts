/**
 * Stage 3: JSON Generation
 * Model: CodeLlama (code generation model)
 * Purpose: Convert strategic plan to Canvas UI ExportedView JSON format
 */

import type { Stage2Output } from './stage2_planning';

export interface Stage3Input {
  stage2Plan: Stage2Output;
  previousAttempt?: string; // JSON from previous attempt (if validation failed)
  validationFeedback?: string[]; // Specific issues to fix
  attemptNumber?: number;
}

export interface Stage3Output {
  json: string; // ExportedView JSON string
  widgetCount: number;
}

export function buildStage3Prompt(input: Stage3Input): string {
  const { stage2Plan, previousAttempt, validationFeedback, attemptNumber = 1 } = input;

  // If this is a retry with feedback
  if (previousAttempt && validationFeedback && validationFeedback.length > 0) {
    return `
You previously generated this JSON:
\`\`\`json
${previousAttempt}
\`\`\`

The planning model identified these issues:
${validationFeedback.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}

**THIS IS ATTEMPT ${attemptNumber}**

Fix these issues and regenerate the JSON following the original plan:
${JSON.stringify(stage2Plan, null, 2)}

**CRITICAL RULES:**
• Fix ONLY the identified issues
• Keep everything else from the original plan
• Follow the plan's colors, sizes, positions, entities EXACTLY
• Output ONLY valid JSON, no explanations
• Use ExportedView format (see below)

**ExportedView JSON FORMAT:**
{
  "version": "2.0.0",
  "exportedAt": "${new Date().toISOString()}",
  "view": {
    "id": "temp-ai-view",
    "name": "AI Generated View",
    "style": {
      "backgroundColor": "#1a1a2e",
      "backgroundOpacity": 1
    },
    "widgets": [
      {
        "id": "widget-1",
        "type": "button",
        "position": { "x": 10, "y": 10, "width": 150, "height": 80 },
        "config": { /* widget-specific config */ }
      }
    ]
  },
  "metadata": {
    "widgetCount": 1,
    "exportedFrom": "ai-builder"
  }
}

Output the corrected JSON now:
`.trim();
  }

  // First attempt - generate from plan
  return `
You are generating Canvas UI widget definitions in **ExportedView JSON format**.

This is the EXACT SAME FORMAT as manual view export/import in Canvas UI.

**STRATEGIC PLAN:**
${JSON.stringify(stage2Plan, null, 2)}

**YOUR TASK:**
Generate valid ExportedView JSON that implements this plan EXACTLY.

**CRITICAL RULES:**
1. Follow the plan EXACTLY (colors, sizes, positions, entities)
2. Use sequential widget IDs: "widget-1", "widget-2", "widget-3", etc.
3. Use absolute pixel positions: \`position: { x, y, width, height }\`
4. Include ALL config fields specified in plan
5. Output ONLY the JSON, no explanations or markdown
6. Use proper JSON syntax (double quotes, no trailing commas)

**ExportedView JSON FORMAT:**
{
  "version": "2.0.0",
  "exportedAt": "${new Date().toISOString()}",
  "view": {
    "id": "temp-ai-view",
    "name": "AI Generated View",
    "style": {
      "backgroundColor": "#1a1a2e",
      "backgroundOpacity": 1
    },
    "widgets": [
      {
        "id": "widget-1",
        "type": "button",
        "position": { "x": 10, "y": 10, "width": 150, "height": 80 },
        "config": {
          "label": "Ceiling Light",
          "entity_id": "light.bedroom_ceiling",
          "backgroundColor": "#fbbf24",
          "textColor": "#000000",
          "action": "toggle"
        }
      },
      {
        "id": "widget-2",
        "type": "slider",
        "position": { "x": 10, "y": 100, "width": 320, "height": 60 },
        "config": {
          "entity_id": "light.bedroom_ceiling",
          "attribute": "brightness",
          "min": 0,
          "max": 255
        }
      }
    ]
  },
  "metadata": {
    "widgetCount": 2,
    "exportedFrom": "ai-builder"
  }
}

**WIDGET TYPES AND REQUIRED CONFIG:**

• **button**: label, entity_id, backgroundColor, textColor, action (toggle/on/off)
• **slider**: entity_id, attribute, min, max, step (optional)
• **gauge**: entity_id, min, max, unit, zones (optional)
• **switch**: entity_id, onColor, offColor, label
• **text**: text OR entity_id, fontSize, fontFamily, textColor, textAlign
• **image**: imageUrl OR entity_id, objectFit (cover/contain/fill)
• **icon**: icon (e.g., "mdi:lightbulb"), iconColor, iconSize
• **progressbar**: entity_id, min, max, barColor
• **progresscircle**: entity_id, min, max, circleColor
• **inputtext**: entity_id, placeholder, maxLength
• **value**: entity_id, unit, fontSize, textColor
• **knob**: entity_id, min, max, step, knobColor

**POSITIONING EXAMPLE (2-column grid, 10px spacing):**
Widget 1: x=10, y=10, w=150, h=80
Widget 2: x=170, y=10, w=150, h=80  (x = 10 + 150 + 10)
Widget 3: x=10, y=100, w=150, h=80  (y = 10 + 80 + 10)
Widget 4: x=170, y=100, w=150, h=80

**NOW GENERATE THE JSON:**
`.trim();
}
