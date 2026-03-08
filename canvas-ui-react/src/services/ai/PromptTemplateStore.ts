/**
 * Prompt Template Store - Simplified Single-Pass Version
 * 
 * Manages customizable AI prompt templates with localStorage persistence.
 * Users can edit templates to customize AI behavior.
 */

import { generateWidgetCatalog, generateWidgetExamples } from './WidgetCatalogGenerator';

export interface PromptTemplates {
  systemPrompt: string;  // Legacy - defaults to systemPromptCreate
  systemPromptCreate: string;  // For creating new dashboards (empty canvas)
  systemPromptEdit: string;    // For editing existing dashboards (has widgets)
  widgetCatalog: string;
  outputFormat: string;
}

const TEMPLATE_VERSION = 30;  // Increment this when changing default templates

// Lazy generation - only create when first accessed
let cachedCatalog: string | null = null;
let cachedExamples: string | null = null;

function getDefaultTemplates(): PromptTemplates {
  if (!cachedCatalog) {
    cachedCatalog = generateWidgetCatalog();
  }
  if (!cachedExamples) {
    cachedExamples = generateWidgetExamples();
  }
  
  const createPrompt = `You are a Home Assistant dashboard expert creating a NEW dashboard from scratch.

FOLLOW LITERAL REQUIREMENTS:
- If they say "7 red buttons", create 7 buttons with backgroundColor: "#ff0000"
- If they say "days of the week", use labels: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday
- If they say "yellow calendar icon", use icon: "mdi:calendar" with iconColor: "#ffff00"
- If they say "white border", CREATE a border widget with borderColor: "#ffffff"
- Count correctly: "7 buttons + border" = 8 widgets total

COLOR CODES: red=#ff0000, blue=#0000ff, green=#00ff00, yellow=#ffff00, white=#ffffff, black=#000000

CIRCULAR WIDGETS: To make a widget circular/round:
- Set cornerRadius: 360 (all corners)
- Make it square: width = height (e.g., 200x200)
- Example: "round button" → {"width": 200, "height": 200, "cornerRadius": 360}

Respond with ONLY the JSON - no explanations, no examples, no text.`.trim();

  const editPrompt = `You are a Home Assistant dashboard expert EDITING an EXISTING dashboard.

⚠️ CRITICAL EDITING RULES ⚠️
1. The current dashboard widgets are shown below in JSON format
2. PRESERVE ALL existing widgets unless the user explicitly asks to change or remove them
3. When the user asks to modify ONE thing, keep EVERYTHING ELSE unchanged
4. Return the COMPLETE updated view with ALL widgets (unchanged + modified + new)
5. NEVER return partial responses - you must include every single widget

EXAMPLE EDIT REQUEST:
User: "change the border radius to 30"

Current widgets: [widget1, widget2, widget3, border]
Correct response: [widget1, widget2, widget3, border (with borderRadius: 30)]
WRONG response: [border (with borderRadius: 30)]  ❌ MISSING 3 widgets!

You MUST return ALL widgets, not just the ones being modified!

OUTPUT FORMAT: Return the complete view JSON with all widgets, matching the structure of the current widgets shown below.

COLOR CODES: red=#ff0000, blue=#0000ff, green=#00ff00, yellow=#ffff00, white=#ffffff, black=#000000

CIRCULAR WIDGETS: To make a widget circular/round:
- Set cornerRadius: 360 (all corners)
- Make it square: width = height (e.g., 200x200)
- Example: "round button" → {"width": 200, "height": 200, "cornerRadius": 360}

Respond with ONLY the JSON - no explanations, no examples, no text.`.trim();
  
  return {
    systemPrompt: createPrompt,  // Legacy - defaults to create
    systemPromptCreate: createPrompt,
    systemPromptEdit: editPrompt,
    widgetCatalog: cachedCatalog,
    outputFormat: cachedExamples,
  };
}

/**
 * Manages prompt templates with localStorage persistence and version management
 */
class PromptTemplateStore {
  private templates: PromptTemplates;
  private readonly storageKey = 'canvasui_prompt_templates';
  private readonly versionKey = 'canvasui_prompt_templates_version';

  constructor() {
    this.templates = this.loadTemplates();
  }

  private loadTemplates(): PromptTemplates {
    try {
      const storedVersion = parseInt(localStorage.getItem(this.versionKey) || '0', 10);
      
      if (storedVersion !== TEMPLATE_VERSION) {
        console.log(`[PromptTemplateStore] Upgrading templates from v${storedVersion} to v${TEMPLATE_VERSION}`);
        localStorage.removeItem(this.storageKey);
        localStorage.setItem(this.versionKey, TEMPLATE_VERSION.toString());
        return { ...getDefaultTemplates() };
      }

      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...getDefaultTemplates(), ...parsed };
      }
    } catch (error) {
      console.error('[PromptTemplateStore] Failed to load templates:', error);
    }

    return { ...getDefaultTemplates() };
  }

  public updateTemplate(key: keyof PromptTemplates, value: string): void {
    this.templates[key] = value;
    this.save();
  }

  public updateTemplates(updates: Partial<PromptTemplates>): void {
    this.templates = { ...this.templates, ...updates };
    this.save();
  }

  /** Legacy alias for updateTemplates */
  public saveTemplates(updates: Partial<PromptTemplates>): void {
    this.updateTemplates(updates);
  }

  private save(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.templates));
      localStorage.setItem(this.versionKey, TEMPLATE_VERSION.toString());
      console.log('[PromptTemplateStore] Templates saved');
    } catch (error) {
      console.error('[PromptTemplateStore] Failed to save templates:', error);
    }
  }

  public getTemplates(): PromptTemplates {
    return { ...this.templates };
  }

  public getTemplate(key: keyof PromptTemplates): string {
    return this.templates[key];
  }

  public resetToDefaults(): void {
    this.templates = { ...getDefaultTemplates() };
    try {
      localStorage.removeItem(this.storageKey);
      localStorage.setItem(this.versionKey, TEMPLATE_VERSION.toString());
      console.log('[PromptTemplateStore] Templates reset to defaults');
    } catch (error) {
      console.error('[PromptTemplateStore] Failed to reset templates:', error);
    }
  }

  public isCustomized(): boolean {
    const stored = localStorage.getItem(this.storageKey);
    return !!stored;
  }
}

export const promptTemplateStore = new PromptTemplateStore();
