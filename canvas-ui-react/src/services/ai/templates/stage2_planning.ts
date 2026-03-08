/**
 * Stage 2: Strategic Planning
 * Model: Llama3 (reasoning/planning model)
 * Purpose: Create complete detailed blueprint for JSON generation
 */

import type { Stage1Output } from './stage1_understanding';

export interface Stage2Input {
  stage1Understanding: Stage1Output;
  widgetTypes: Array<{
    type: string;
    name: string;
    description: string;
    defaultSize: { width: number; height: number };
    category: string;
  }>;
  selectedEntities: Array<{
    entity_id: string;
    friendly_name: string;
    domain: string;
    state?: string;
    attributes?: Record<string, any>;
  }>;
  canvasState?: {
    existingWidgets: Array<{
      id: string;
      type: string;
      entity_id?: string;
      position: { x: number; y: number; width: number; height: number };
    }>;
    viewWidth: number;
    viewHeight: number;
  };
}

export interface WidgetPlan {
  type: string;
  purpose: string;
  entity?: string;
  label?: string;
  backgroundColor?: string;
  textColor?: string;
  size: { width: number; height: number };
  position: { x: number; y: number }; // Absolute pixels
  config: Record<string, any>; // Widget-specific config
}

export interface Stage2Output {
  understanding: string; // Echo from Stage 1
  widgets: WidgetPlan[];
  layout: {
    type: 'grid' | 'vertical' | 'horizontal' | 'custom';
    columns?: number;
    spacing?: number;
    padding?: number;
  };
  expectations: {
    widgetCount: number;
    widgetTypes: string[];
    entities: string[];
    colors?: string;
    gridSize?: string;
  };
}

export function buildStage2Prompt(input: Stage2Input): string {
  const { stage1Understanding, widgetTypes, selectedEntities, canvasState } = input;

  const widgetTypesText = widgetTypes
    .map(w => `• ${w.type}: ${w.description} (${w.defaultSize.width}x${w.defaultSize.height} default)`)
    .join('\n');

  const entitiesText = selectedEntities.length > 0
    ? selectedEntities
        .map(e => `• ${e.entity_id} | ${e.friendly_name} | ${e.domain} | ${e.state || 'unknown'}`)
        .join('\n')
    : '**No entities selected** - Create layout-only widgets or generic examples';

  const canvasContext = canvasState
    ? `\n**Current Canvas State:**
• Existing widgets: ${canvasState.existingWidgets.length}
• Canvas size: ${canvasState.viewWidth}x${canvasState.viewHeight}px
• Existing widgets:
${canvasState.existingWidgets
  .slice(0, 10)
  .map(w => `  - ${w.type} at (${w.position.x}, ${w.position.y}) ${w.position.width}x${w.position.height}`)
  .join('\n')}
${canvasState.existingWidgets.length > 10 ? `  ... and ${canvasState.existingWidgets.length - 10} more` : ''}`
    : '';

  return `
You are an expert Home Assistant dashboard designer. Create a COMPLETE DETAILED PLAN for widget placement.

**USER WANTS:**
${stage1Understanding.understanding}

**Structured Intent:** ${stage1Understanding.userIntent}
**Scope:** ${stage1Understanding.scope}
**Confidence:** ${stage1Understanding.confidence}

**AVAILABLE WIDGET TYPES:**
${widgetTypesText}

**SELECTED ENTITIES:**
${entitiesText}
${canvasContext}

**YOUR TASK:**
Create a complete, detailed plan including:

1. **Widget Selection**: Which widget types to use and why
2. **Entity Binding**: Which entity goes with which widget
3. **Visual Design**: Colors for each widget (use domain defaults below)
4. **Sizing**: Exact width and height in pixels for each widget
5. **Positioning**: Absolute x, y coordinates in pixels
6. **Configuration**: All widget-specific settings (labels, min/max, actions, etc.)
7. **Layout**: Overall arrangement strategy

**COLOR GUIDELINES (Home Assistant defaults):**
• Lights: #fbbf24 (yellow/amber)
• Switches: #10b981 (green)
• Climate: #3b82f6 (blue)
• Sensors: #8b5cf6 (purple)
• Covers/Blinds: #f59e0b (orange)
• Media: #ec4899 (pink)
• Locks: #ef4444 (red)

**POSITIONING GUIDELINES:**
• Start at (10, 10) for first widget
• Add 10px spacing between widgets
• Use grid layout: columns with consistent spacing
• Avoid overlaps
• Keep widgets within canvas bounds (default 1920x1080)

**OUTPUT FORMAT (JSON):**
{
  "understanding": "${stage1Understanding.userIntent}",
  "widgets": [
    {
      "type": "button",
      "purpose": "ceiling light toggle",
      "entity": "light.bedroom_ceiling",
      "label": "Ceiling Light",
      "backgroundColor": "#fbbf24",
      "textColor": "#000000",
      "size": { "width": 150, "height": 80 },
      "position": { "x": 10, "y": 10 },
      "config": {
        "action": "toggle",
        "icon": "lightbulb"
      }
    },
    {
      "type": "slider",
      "purpose": "brightness control for ceiling light",
      "entity": "light.bedroom_ceiling",
      "size": { "width": 320, "height": 60 },
      "position": { "x": 10, "y": 100 },
      "config": {
        "attribute": "brightness",
        "min": 0,
        "max": 255,
        "step": 1
      }
    }
  ],
  "layout": {
    "type": "grid",
    "columns": 2,
    "spacing": 10,
    "padding": 10
  },
  "expectations": {
    "widgetCount": 2,
    "widgetTypes": ["button", "slider"],
    "entities": ["light.bedroom_ceiling"],
    "colors": "#fbbf24 for buttons (lights)",
    "gridSize": "2 columns, 10px spacing"
  }
}

**IMPORTANT:**
• Calculate EXACT pixel positions (x, y)
• Include ALL required config fields for each widget type
• Use selected entities when available
• Be specific about colors, sizes, positions
• Add clear expectations for validation stage

Now create the complete plan.
`.trim();
}
