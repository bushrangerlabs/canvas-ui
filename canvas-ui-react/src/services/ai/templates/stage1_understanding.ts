/**
 * Stage 1: Understanding + User Confirmation
 * Model: Phi3-mini (fast chat model)
 * Purpose: Interpret user intent and confirm understanding
 */

export interface Stage1Input {
  userPrompt: string;
  requestType: 'new' | 'edit';
  widgetCount: number;
  selectedEntities?: Array<{
    entity_id: string;
    friendly_name: string;
    domain: string;
    state?: string;
  }>;
  previousUnderstanding?: string; // For clarification loops
  userClarification?: string; // What user said after clicking "No"
}

export interface Stage1Output {
  understanding: string; // What we understood (for display to user)
  userIntent: string; // Structured intent (for next stages)
  scope: string; // e.g., "bedroom", "living room", "whole house"
  widgets: string[]; // Widget types needed
  layout: string; // Layout description
  confidence: 'high' | 'medium' | 'low';
}

export function buildStage1Prompt(input: Stage1Input): string {
  const { 
    userPrompt, 
    requestType, 
    widgetCount, 
    selectedEntities = [],
    previousUnderstanding,
    userClarification
  } = input;

  // If this is a clarification loop
  if (previousUnderstanding && userClarification) {
    return `
You previously understood the user's request as:
"${previousUnderstanding}"

The user said this is NOT correct and provided clarification:
"${userClarification}"

Reinterpret what the user wants based on this clarification.

Respond in conversational format:
"I understand you want:
• [bullet list of requirements]
• [be specific about what changed]"

Output as JSON:
{
  "understanding": "Conversational text to show user",
  "userIntent": "Structured summary for AI planning",
  "scope": "area/room name or 'general'",
  "widgets": ["widget types needed"],
  "layout": "layout description",
  "confidence": "high" | "medium" | "low"
}
`.trim();
  }

  // First-time understanding
  const entityContext = selectedEntities.length > 0
    ? `\n**Selected Entities (${selectedEntities.length}):**
${selectedEntities
  .map(e => `• ${e.entity_id} | ${e.friendly_name} | ${e.domain} | ${e.state || 'unknown'}`)
  .join('\n')}`
    : '\n**No entities selected** - User may want layout-only or will specify entities in prompt.';

  return `
**CRITICAL INSTRUCTION: You MUST respond with ONLY a JSON object. Do NOT include any explanatory text, markdown, or other content before or after the JSON. Start your response with { and end with }.**

You are helping a user create a Home Assistant dashboard using Canvas UI.

**User Request:**
"${userPrompt}"

**Request Type:** ${requestType === 'new' ? 'Creating new view (empty canvas)' : `Editing existing view (${widgetCount} widgets)`}
${entityContext}

**Your Task:**
Interpret what the user wants and respond in a conversational, friendly way.

**Response Format:**
Start with "I understand you want:" then bullet points covering:
• What type of dashboard/controls
• Which entities or areas (be specific)
• What widget types might be needed
• Layout preferences (if mentioned)

If anything is unclear or ambiguous, note it in your understanding.

**CRITICAL - Keep Response CONCISE:**
• "understanding" field: 2-4 bullet points, under 200 chars total
• Always close JSON with all braces properly

**Output Format - JSON ONLY:**
{
  "understanding": "Conversational text starting with 'I understand you want:'\\n• bullet 1\\n• bullet 2\\n...",
  "userIntent": "One-sentence structured summary for planning stage",
  "scope": "bedroom|living_room|security|climate|whole_house|general",
  "widgets": ["button", "slider", "gauge", etc.],
  "layout": "grid|vertical|horizontal|dashboard|custom",
  "confidence": "high|medium|low"
}

**Example 1:**
User: "create bedroom control panel"
Output:
{
  "understanding": "I understand you want:\\n• Control panel for bedroom\\n• Light controls (switches, brightness)\\n• Climate controls if available\\n• Grid layout with 2 columns",
  "userIntent": "Create bedroom control panel with lights and climate",
  "scope": "bedroom",
  "widgets": ["button", "slider", "gauge"],
  "layout": "grid",
  "confidence": "high"
}

**Example 2:**
User: "add a few lights"
Output:
{
  "understanding": "I understand you want:\\n• Add light controls to current view\\n• Multiple lights (you said 'a few')\\n• Not sure which lights - I'll use selected entities or all bedroom lights",
  "userIntent": "Add multiple light controls to existing view",
  "scope": "general",
  "widgets": ["button"],
  "layout": "grid",
  "confidence": "medium"
}

**REMINDER: Return ONLY the JSON object. No other text. Start with { and end with }.**

Now interpret the user's request.
`.trim();
}
