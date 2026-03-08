/**
 * Stage 4: Validation Loop
 * Model: Llama3 (SAME model that created the plan in Stage 2)
 * Purpose: Self-validate - did CodeLlama follow the plan correctly?
 */

import type { Stage1Output } from './stage1_understanding';
import type { Stage2Output } from './stage2_planning';

export interface Stage4Input {
  stage1Understanding: Stage1Output;
  stage2Plan: Stage2Output;
  stage3JSON: any; // Parsed JSON from Stage 3
  attemptNumber: number;
}

export interface ValidationIssue {
  severity: 'critical' | 'warning' | 'minor';
  message: string;
  fix: string;
}

export interface Stage4Output {
  satisfied: boolean;
  score: number; // 0-100
  issues: ValidationIssue[];
  feedback?: string[]; // Text feedback for Stage 3 retry
}

export function buildStage4Prompt(input: Stage4Input): string {
  const { stage1Understanding: _stage1Understanding, stage2Plan, stage3JSON, attemptNumber } = input;

  return `
**CRITICAL: YOU MUST RESPOND WITH ONLY VALID JSON. NO EXPLANATIONS. NO PROSE. ONLY JSON.**

You created this strategic plan in Stage 2:
${JSON.stringify(stage2Plan, null, 2)}

The code generation model (CodeLlama) generated this JSON in Stage 3:
${JSON.stringify(stage3JSON, null, 2)}

**THIS IS VALIDATION ATTEMPT ${attemptNumber}**

**YOUR TASK:**
Did CodeLlama follow YOUR plan correctly? Validate against YOUR expectations.

**IMPORTANT: Your response MUST be ONLY the JSON validation object below. DO NOT include any explanations, analysis, or prose. ONLY output the JSON structure.**

**CHECK THESE REQUIREMENTS:**

1. **Widget Count**: Expected ${stage2Plan.expectations?.widgetCount || stage2Plan.widgets?.length || 'unknown'}, got ${stage3JSON.view?.widgets?.length || 0}?

2. **Widget Types**: Expected ${Array.isArray(stage2Plan.expectations?.widgetTypes) ? stage2Plan.expectations.widgetTypes.join(', ') : (stage2Plan.widgets || []).map((w: any) => w.type).join(', ')}
   Got: ${(stage3JSON.view?.widgets || []).map((w: any) => w.type).join(', ')}
   Do they match?

3. **Entity Bindings**: Expected entities ${Array.isArray(stage2Plan.expectations?.entities) ? stage2Plan.expectations.entities.join(', ') : (stage2Plan.widgets || []).map((w: any) => w.entity).filter(Boolean).join(', ')}
   Got entities: ${(stage3JSON.view?.widgets || [])
     .map((w: any) => w.config?.entity_id)
     .filter(Boolean)
     .join(', ')}
   Are the right entities bound to the right widgets?

4. **Colors**: Expected ${stage2Plan.expectations?.colors || 'as specified in plan widgets'}
   Got colors: ${(stage3JSON.view?.widgets || [])
     .map((w: any, i: number) => `widget-${i + 1}: ${w.config?.backgroundColor || 'none'}`)
     .join(', ')}
   Do colors match the plan?

5. **Positions & Sizes**: Expected layout: ${stage2Plan.layout?.type || 'custom'} with ${stage2Plan.layout?.columns || 'N/A'} columns
   Check if widgets have correct x, y, width, height from plan

6. **Config Fields**: Does each widget have ALL required config fields from plan?
   - Buttons: label, entity_id, backgroundColor, textColor, action
   - Sliders: entity_id, attribute, min, max
   - Gauges: entity_id, min, max, unit
   - etc.

7. **Layout Consistency**: Expected ${stage2Plan.expectations?.gridSize || 'as specified in plan'}
   Are widgets properly spaced? No overlaps? Within bounds?

**SEVERITY LEVELS:**
• **critical**: Wrong widget count, missing entities, wrong widget types, missing required config
• **warning**: Wrong colors (minor), inexact sizes (±20px), layout issues
• **minor**: Missing optional fields, slight position differences

**APPROVAL CRITERIA:**
• satisfied = true: Score >= 90 AND no critical issues
• satisfied = false: Any critical issues OR score < 90

**CRITICAL: OUTPUT FORMAT - YOU MUST RESPOND WITH ONLY JSON**

**DO NOT OUTPUT:**
- Explanations of your validation process
- Prose descriptions or commentary  
- Analysis or reasoning text
- Any text before the opening {
- Any text after the closing }

**OUTPUT ONLY THIS JSON STRUCTURE:**
{
  "satisfied": true/false,
  "score": 0-100,
  "issues": [
    {
      "severity": "critical",
      "message": "widget-1 has wrong color #3b82f6, plan specified #fbbf24",
      "fix": "Change widget-1.config.backgroundColor from '#3b82f6' to '#fbbf24'"
    },
    {
      "severity": "warning",
      "message": "widget-3 width is 300px, plan specified 320px",
      "fix": "Change widget-3.position.width from 300 to 320"
    }
  ]
}

**REMEMBER: Your response must start with { and end with }. Nothing else.**

**EXAMPLES:**

**Example 1 (APPROVED):**
Plan: 2 buttons, 1 slider, #fbbf24 color
JSON: 2 buttons, 1 slider, all #fbbf24
Output:
{
  "satisfied": true,
  "score": 100,
  "issues": []
}

**Example 2 (REJECTED - Critical Issue):**
Plan: 3 widgets (2 buttons, 1 slider)
JSON: 2 widgets (2 buttons only - slider missing)
Output:
{
  "satisfied": false,
  "score": 60,
  "issues": [
    {
      "severity": "critical",
      "message": "Missing widget-3 (slider for brightness control)",
      "fix": "Add slider widget with entity_id: light.bedroom_ceiling, attribute: brightness, min: 0, max: 255"
    }
  ]
}

**Example 3 (REJECTED - Wrong Color):**
Plan: Button color #fbbf24 (yellow for lights)
JSON: Button color #3b82f6 (blue for climate)
Output:
{
  "satisfied": false,
  "score": 75,
  "issues": [
    {
      "severity": "critical",
      "message": "widget-1 uses climate color (#3b82f6) instead of light color (#fbbf24)",
      "fix": "Change widget-1.config.backgroundColor from '#3b82f6' to '#fbbf24'"
    }
  ]
}

**NOW VALIDATE:**
Compare the generated JSON from Stage 3 against YOUR Stage 2 plan.

**OUTPUT THE VALIDATION JSON OBJECT NOW.**

**CRITICAL REMINDERS:**
- DO NOT include explanations, reasoning, or commentary
- DO NOT write "The validation process..." or similar prose
- DO NOT include any text before { or after }
- START your response with {
- END your response with }
- Output ONLY the JSON validation object

**BEGIN YOUR JSON RESPONSE:**
`.trim();
}
