// ...existing code...
/**
 * ConversationService - Simplified Single-Pass Version
 * 
 * Single-pass dashboard generation with multiple provider support.
 * No stages, no confirmations - just simple generation.
 */

import { useConfigStore } from '../../shared/stores/useConfigStore';
import type { ExportedView } from '../../shared/utils/viewExportImport';
import { getCopilotProxyClient, type CopilotProxyMessage } from './CopilotProxyClient';
import { getGitHubClient, type GitHubMessage } from './GitHubClient';
import { getGroqClient } from './GroqClient';
import { ollamaClient, type OllamaMessage } from './OllamaClient';
import { getOpenAIClient, type OpenAIMessage, type VisionContent } from './OpenAIClient';
import { getOpenWebUIClient, type OpenWebUIMessage } from './OpenWebUIClient';
import {
    buildGenerationPrompt,
    extractExportedView,
    type SelectedEntity,
} from './PromptBuilder';

/**
 * AI Provider type
 */
export type AIProvider = 'ollama' | 'openai' | 'github' | 'groq' | 'openwebui' | 'copilotproxy';

/**
 * AI Agent from HA (legacy - not used in v19)
 */
export interface ConversationAgent {
  id: string;
  name: string;
  supported_languages?: string[];
}

/**
 * Creation mode (legacy - not used in v19)
 */
export type CreationMode = 'automatic' | 'prompt' | 'controlled';

/**
 * Progress callback (legacy - not used in v19)
 */
export type ProgressCallback = (update: { 
  stage: string; 
  message: string;
  attempt?: number;
  maxAttempts?: number;
  score?: number;
  issues?: Array<{ severity: string; message: string; fix?: string }>;
  satisfied?: boolean;
}) => void;

/**
 * User decision callback (legacy - not used in v19)
 */
export type UserDecisionCallback = (data: any) => Promise<'accept' | 'retry'>;

/**
 * Chat message
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: {
    stage?: string;
    attemptNumber?: number;
    validationScore?: number;
  };
}

/**
 * Generation result
 */
export interface GenerationResult {
  success: boolean;
  exportedView?: ExportedView;
  error?: string;
}

/**
 * ConversationService - Handles AI interaction for dashboard generation
 */
export class ConversationService {
    /**
     * Fetch available models from external Open WebUI endpoint
     */
    async fetchOpenWebUIModels(): Promise<string[]> {
      try {
        if (!this.openWebUIUrl) throw new Error('Open WebUI URL not configured');
        const response = await fetch(`${this.openWebUIUrl}/models`, {
          headers: this.openWebUIApiKey ? { Authorization: `Bearer ${this.openWebUIApiKey}` } : {},
        });
        if (!response.ok) throw new Error(`Failed to fetch models: ${response.status}`);
        const data = await response.json();
        // OpenAI-compatible: { object: "list", data: [ { id: "model-id", ... } ] }
        return Array.isArray(data.data) ? data.data.map((m: any) => m.id) : [];
      } catch (error) {
        console.error('[fetchOpenWebUIModels] Failed:', error);
        throw error;
      }
    }
  private provider: AIProvider = 'ollama';
  private model: string = 'qwen2.5-coder:14b';
  private openAIApiKey: string = '';
  private gitHubToken: string = '';
  private groqApiKey: string = '';
  private openWebUIUrl: string = 'http://localhost:3000';
  private openWebUIApiKey: string = '';
  private copilotProxyToken: string = '';
  private copilotProxyUrl: string = 'http://localhost:3100/v1';
  
  private pendingImageDataUrl?: string; // Pending image for vision AI request

  // Chat history (for display)
  private chatHistory: ChatMessage[] = [];

  // Selected entities for AI context
  private selectedEntities: SelectedEntity[] = [];

  // Canvas state (current widgets on canvas)
  private canvasState: any = {
    widgets: [],
    widgetCount: 0,
    isEmpty: true,
    currentViewId: '',
    viewWidth: 1920,
    viewHeight: 1080
  };

  constructor(_hass?: any) {
    // _hass parameter for backward compatibility - not used in v19
    this.loadSettings();
    
    // Initialize Lovelace card discovery (async, non-blocking)
    this.initializeLovelaceCards();
  }

  /**
   * Initialize Lovelace card discovery
   */
  private async initializeLovelaceCards(): Promise<void> {
    const { lovelaceCardDiscovery } = await import('./LovelaceCardDiscovery');
    await lovelaceCardDiscovery.loadCardDatabase();
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings(): void {
    try {
      const savedModel = localStorage.getItem('canvasui_ai_model');
      const savedProvider = localStorage.getItem('canvasui_ai_provider');
      const savedApiKey = localStorage.getItem('canvasui_openai_apikey');
      const savedGitHubToken = localStorage.getItem('canvasui_github_token');
      const savedGroqApiKey = localStorage.getItem('canvasui_groq_apikey');
      const savedOpenWebUIUrl = localStorage.getItem('canvasui_openwebui_url');
      const savedOpenWebUIApiKey = localStorage.getItem('canvasui_openwebui_apikey');

      if (savedModel) {
        this.model = savedModel;
        console.log('[ConversationService] Loaded model:', this.model);
      }

      if (savedProvider === 'ollama' || savedProvider === 'openai' || savedProvider === 'github' || savedProvider === 'groq' || savedProvider === 'openwebui') {
        this.provider = savedProvider;
        console.log('[ConversationService] Loaded provider:', this.provider);
      }

      if (savedApiKey) {
        this.openAIApiKey = savedApiKey;
        getOpenAIClient(savedApiKey);
        console.log('[ConversationService] Loaded OpenAI API key');
      }

      if (savedGitHubToken) {
        this.gitHubToken = savedGitHubToken;
        getGitHubClient(savedGitHubToken);
        console.log('[ConversationService] Loaded GitHub token');
      }

      if (savedGroqApiKey) {
        this.groqApiKey = savedGroqApiKey;
        getGroqClient(savedGroqApiKey);
        console.log('[ConversationService] Loaded Groq API key');
      }

      if (savedOpenWebUIUrl) {
        this.openWebUIUrl = savedOpenWebUIUrl;
        console.log('[ConversationService] Loaded Open WebUI URL');
      }

      if (savedOpenWebUIApiKey) {
        this.openWebUIApiKey = savedOpenWebUIApiKey;
        getOpenWebUIClient(this.openWebUIUrl, savedOpenWebUIApiKey);
        console.log('[ConversationService] Loaded Open WebUI API key');
      }

      const savedCopilotProxyToken = localStorage.getItem('canvasui_copilotproxy_token');
      const savedCopilotProxyUrl = localStorage.getItem('canvasui_copilotproxy_url');

      if (savedCopilotProxyToken) {
        this.copilotProxyToken = savedCopilotProxyToken;
        getCopilotProxyClient(savedCopilotProxyToken, this.copilotProxyUrl);
        console.log('[ConversationService] Loaded Copilot Proxy token');
      }

      if (savedCopilotProxyUrl) {
        this.copilotProxyUrl = savedCopilotProxyUrl;
        console.log('[ConversationService] Loaded Copilot Proxy URL');
      }
    } catch (error) {
      console.error('[ConversationService] Failed to load settings:', error);
    }
  }

  // ==================== SETTINGS METHODS ====================

  setModel(model: string): void {
    this.model = model;
    localStorage.setItem('canvasui_ai_model', model);
  }

  getModel(): string {
    return this.model;
  }

  setProvider(provider: AIProvider): void {
    this.provider = provider;
    localStorage.setItem('canvasui_ai_provider', provider);
  }

  getProvider(): AIProvider {
    return this.provider;
  }

  setOpenAIApiKey(apiKey: string): void {
    this.openAIApiKey = apiKey;
    localStorage.setItem('canvasui_openai_apikey', apiKey);
    getOpenAIClient(apiKey);
  }

  getOpenAIApiKey(): string {
    return this.openAIApiKey;
  }

  setGitHubToken(token: string): void {
    this.gitHubToken = token;
    localStorage.setItem('canvasui_github_token', token);
    getGitHubClient(token);
  }

  getGitHubToken(): string {
    return this.gitHubToken;
  }

  setGroqApiKey(apiKey: string): void {
    this.groqApiKey = apiKey;
    localStorage.setItem('canvasui_groq_apikey', apiKey);
    getGroqClient(apiKey);
  }

  getGroqApiKey(): string {
    return this.groqApiKey;
  }

  setOpenWebUIUrl(url: string): void {
    this.openWebUIUrl = url;
    localStorage.setItem('canvasui_openwebui_url', url);
    getOpenWebUIClient(url, this.openWebUIApiKey);
  }

  getOpenWebUIUrl(): string {
    return this.openWebUIUrl;
  }

  setOpenWebUIApiKey(apiKey: string): void {
    this.openWebUIApiKey = apiKey;
    localStorage.setItem('canvasui_openwebui_apikey', apiKey);
    getOpenWebUIClient(this.openWebUIUrl, apiKey);
  }

  getOpenWebUIApiKey(): string {
    return this.openWebUIApiKey;
  }

  setCopilotProxyToken(token: string): void {
    this.copilotProxyToken = token;
    localStorage.setItem('canvasui_copilotproxy_token', token);
    getCopilotProxyClient(token, this.copilotProxyUrl);
  }

  getCopilotProxyToken(): string {
    return this.copilotProxyToken;
  }

  setCopilotProxyUrl(url: string): void {
    this.copilotProxyUrl = url;
    localStorage.setItem('canvasui_copilotproxy_url', url);
    getCopilotProxyClient(this.copilotProxyToken, url);
  }

  getCopilotProxyUrl(): string {
    return this.copilotProxyUrl;
  }

  // ==================== LEGACY COMPATIBILITY METHODS ====================
  // These maintain compatibility with existing UI code
  
  setMaxIterations(_maxIterations: number): void {
    // No-op - v19 doesn't use iterations
  }

  getMessages(): ChatMessage[] {
    return this.getChatHistory();
  }

  getSelectedEntities(): SelectedEntity[] {
    return this.selectedEntities;
  }

  hasHistory(): boolean {
    return this.chatHistory.length > 0;
  }

  getAvailableModels(): Promise<string[]> {
    // Fallback to Ollama models
    return this.fetchOllamaModels();
  }

  setCreationMode(_mode: string): void {
    // No-op - v19 doesn't use creation modes
  }

  clearHistoryOnly(): void {
    this.clearChatHistory();
  }

  updateCanvasState(canvasState: any): void {
    this.canvasState = canvasState;
    console.log('[ConversationService] Canvas state updated:', {
      widgetCount: canvasState.widgetCount,
      isEmpty: canvasState.isEmpty,
      viewId: canvasState.currentViewId
    });
  }

  continueAfterConfirmation(
    _stage1: any, 
    _requestType: string, 
    _mode: string = 'replace',
    _onProgress?: ProgressCallback,
    _onUserDecision?: UserDecisionCallback
  ): Promise<any> {
    // No-op - v19 doesn't use confirmation
    return Promise.resolve({ success: false, error: 'Not implemented in v19' });
  }

  cancelValidation(): void {
    // No-op - v19 doesn't have validation loop
  }

  clearHistory(): void {
    this.clearChatHistory();
  }

  setSelectedEntities(entities: SelectedEntity[]): void {
    this.selectedEntities = entities;
    console.log(`[ConversationService] Selected entities updated: ${entities.length} entities`);
  }

  // =================== END LEGACY COMPATIBILITY ====================

  // ==================== PROVIDER API METHODS ====================

  /**
   * Call Ollama API
   */
  private async callOllama(prompt: string, timeoutMs: number = 180000): Promise<string> {
    try {
      const imageDataUrl = this.pendingImageDataUrl;
      this.pendingImageDataUrl = undefined;
      const ollamaUserMsg: OllamaMessage = { role: 'user', content: prompt };
      if (imageDataUrl) {
        // Ollama vision: strip data URL prefix and pass as images array
        const base64 = imageDataUrl.replace(/^data:image\/[^;]+;base64,/, '');
        ollamaUserMsg.images = [base64];
      }
      console.group('🤖 [Ollama Request]');
      console.log('Model:', this.model);
      console.log('Timeout:', `${timeoutMs / 1000}s`);
      console.log('\n📤 PROMPT:\n', prompt);
      console.groupEnd();

      const response = await Promise.race([
        ollamaClient.chat({
          model: this.model,
          messages: [ollamaUserMsg],
          temperature: 0.7,
          stream: false,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout after ${timeoutMs / 1000}s`)), timeoutMs)
        ),
      ]);

      const content = response.message.content;

      console.group('🤖 [Ollama Response]');
      console.log('\n📥 RESPONSE:\n', content);
      console.groupEnd();

      return content;
    } catch (error) {
      console.error('[callOllama] Failed:', error);
      throw new Error((error as Error)?.message || 'Failed to communicate with Ollama');
    }
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(prompt: string, timeoutMs: number = 180000): Promise<string> {
    try {
      const client = getOpenAIClient(this.openAIApiKey);
      if (!client) {
        throw new Error('OpenAI API key not configured');
      }
      const imageDataUrl = this.pendingImageDataUrl;
      this.pendingImageDataUrl = undefined;
      const messages: OpenAIMessage[] = imageDataUrl
        ? [{ role: 'user', content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageDataUrl } },
          ] as VisionContent[] }]
        : [{ role: 'user', content: prompt }];

      console.group('🤖 [OpenAI Request]');
      console.log('Model:', this.model);
      console.log('Timeout:', `${timeoutMs / 1000}s`);
      console.log('\n📤 PROMPT:\n', prompt);
      console.groupEnd();

      const response = await Promise.race([
        client.chat({
          model: this.model,
          messages: messages,
          temperature: 0.7,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout after ${timeoutMs / 1000}s`)), timeoutMs)
        ),
      ]);

      const content = response.choices[0].message.content || '';

      console.group('🤖 [OpenAI Response]');
      console.log('\n📥 RESPONSE:\n', content);
      console.groupEnd();

      return content;
    } catch (error) {
      console.error('[callOpenAI] Failed:', error);
      throw new Error((error as Error)?.message || 'Failed to communicate with OpenAI');
    }
  }

  /**
   * Call GitHub Models API
   */
  private async callGitHub(prompt: string, timeoutMs: number = 180000): Promise<string> {
    try {
      const client = getGitHubClient(this.gitHubToken);
      if (!client) {
        throw new Error('GitHub token not configured');
      }
      const imageDataUrl = this.pendingImageDataUrl;
      this.pendingImageDataUrl = undefined;
      const messages: GitHubMessage[] = imageDataUrl
        ? [{ role: 'user', content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageDataUrl } },
          ] as VisionContent[] }]
        : [{ role: 'user', content: prompt }];

      console.group('🤖 [GitHub Request]');
      console.log('Model:', this.model);
      console.log('Timeout:', `${timeoutMs / 1000}s`);
      console.log('\n📤 PROMPT:\n', prompt);
      console.groupEnd();

      const response = await Promise.race([
        client.chat({
          model: this.model,
          messages: messages,
          temperature: 0.7,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout after ${timeoutMs / 1000}s`)), timeoutMs)
        ),
      ]);

      const content = response.choices[0].message.content || '';

      console.group('🤖 [GitHub Response]');
      console.log('\n📥 RESPONSE:\n', content);
      console.groupEnd();

      return content;
    } catch (error) {
      console.error('[callGitHub] Failed:', error);
      throw new Error((error as Error)?.message || 'Failed to communicate with GitHub');
    }
  }

  /**
   * Call Groq API
   */
  private async callGroq(prompt: string, timeoutMs: number = 180000): Promise<string> {
    try {
      const client = getGroqClient(this.groqApiKey);
      if (!client) {
        throw new Error('Groq API key not configured');
      }
      if (this.pendingImageDataUrl) {
        console.warn('[callGroq] Image attached but Groq does not support vision; sending text only');
        this.pendingImageDataUrl = undefined;
      }
      console.group('🤖 [Groq Request]');
      console.log('Model:', this.model);
      console.log('Timeout:', `${timeoutMs / 1000}s`);
      console.log('\n📤 PROMPT:\n', prompt);
      console.groupEnd();

      const response = await Promise.race([
        client.chat({
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout after ${timeoutMs / 1000}s`)), timeoutMs)
        ),
      ]);

      const content = response.choices[0].message.content || '';

      console.group('🤖 [Groq Response]');
      console.log('\n📥 RESPONSE:\n', content);
      console.groupEnd();

      return content;
    } catch (error) {
      console.error('[callGroq] Failed:', error);
      throw new Error((error as Error)?.message || 'Failed to communicate with Groq');
    }
  }

  /**
   * Ensure widget documentation file is uploaded to Open WebUI
   * Returns file ID for attachment to chat requests
   */
  private async ensureWidgetDocUploaded(): Promise<string> {
    const client = getOpenWebUIClient(this.openWebUIUrl, this.openWebUIApiKey);
    
    // Check if we already have a cached file ID
    let fileId = client.getWidgetDocFileId();
    
    if (!fileId) {
      console.log('[OpenWebUI] Uploading CANVAS_UI_WIDGETS.md...');
      
      // Load file from canvas-ui directory
      const response = await fetch('/canvas-ui-static/CANVAS_UI_WIDGETS.md');
      if (!response.ok) {
        throw new Error('Failed to load CANVAS_UI_WIDGETS.md from /canvas-ui-static/');
      }
      const content = await response.text();
      
      // Upload to Open WebUI
      fileId = await client.uploadWidgetDoc(content);
      console.log('[OpenWebUI] Widget doc uploaded, file ID:', fileId);
    }
    
    return fileId;
  }

  /**
   * Call Open WebUI API with file attachment support
   */
  private async callOpenWebUI(prompt: string, timeoutMs: number = 180000): Promise<string> {
    try {
      const client = getOpenWebUIClient(this.openWebUIUrl, this.openWebUIApiKey);
      if (!client) {
        throw new Error('Open WebUI not configured');
      }

      // Ensure widget documentation is uploaded
      const fileId = await this.ensureWidgetDocUploaded();

      const imageDataUrl = this.pendingImageDataUrl;
      this.pendingImageDataUrl = undefined;
      const messages: OpenWebUIMessage[] = imageDataUrl
        ? [{ role: 'user', content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageDataUrl } },
          ] as VisionContent[] }]
        : [{ role: 'user', content: prompt }];

      console.group('🤖 [Open WebUI Request]');
      console.log('URL:', this.openWebUIUrl);
      console.log('Model:', this.model);
      console.log('File attached:', fileId);
      console.log('Timeout:', `${timeoutMs / 1000}s`);
      console.log('\n📤 PROMPT:\n', prompt);
      console.groupEnd();

      const response = await Promise.race([
        client.chat({
          model: this.model,
          messages: messages,
          temperature: 0.7,
          fileIds: [fileId], // Attach widget documentation
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout after ${timeoutMs / 1000}s`)), timeoutMs)
        ),
      ]);

      const content = response.choices[0].message.content || '';

      console.group('🤖 [Open WebUI Response]');
      console.log('\n📥 RESPONSE:\n', content);
      console.groupEnd();

      return content;
    } catch (error) {
      console.error('[callOpenWebUI] Failed:', error);
      throw new Error((error as Error)?.message || 'Failed to communicate with Open WebUI');
    }
  }

  /**
   * Call GitHub Copilot Proxy API
   */
  private async callCopilotProxy(prompt: string, timeoutMs: number = 180000): Promise<string> {
    try {
      const client = getCopilotProxyClient(this.copilotProxyToken, this.copilotProxyUrl);
      if (!client) {
        throw new Error('Copilot Proxy token not configured');
      }
      const imageDataUrl = this.pendingImageDataUrl;
      this.pendingImageDataUrl = undefined;

      const messages: CopilotProxyMessage[] = imageDataUrl
        ? [{ role: 'user', content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageDataUrl } },
          ] as VisionContent[] }]
        : [{ role: 'user', content: prompt }];

      console.group('🤖 [Copilot Proxy Request]');
      console.log('Model:', this.model);
      console.log('Proxy URL:', this.copilotProxyUrl);
      console.log('Timeout:', `${timeoutMs / 1000}s`);
      console.log('\n📤 PROMPT:\n', prompt);
      console.groupEnd();

      const response = await Promise.race([
        client.chat({
          model: this.model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 16000,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout after ${timeoutMs / 1000}s`)), timeoutMs)
        ),
      ]);

      const content = response.choices[0].message.content || '';

      console.group('🤖 [Copilot Proxy Response]');
      console.log('\n📥 RESPONSE:\n', content);
      console.groupEnd();

      return content;
    } catch (error) {
      console.error('[callCopilotProxy] Failed:', error);
      throw new Error((error as Error)?.message || 'Failed to communicate with Copilot Proxy');
    }
  }

  /**
   * Call AI using selected provider
   */
  private async callAI(prompt: string, timeoutMs: number = 180000): Promise<string> {
    switch (this.provider) {
      case 'ollama':
        return this.callOllama(prompt, timeoutMs);
      case 'openai':
        return this.callOpenAI(prompt, timeoutMs);
      case 'github':
        return this.callGitHub(prompt, timeoutMs);
      case 'groq':
        return this.callGroq(prompt, timeoutMs);
      case 'openwebui':
        return this.callOpenWebUI(prompt, timeoutMs);
      case 'copilotproxy':
        return this.callCopilotProxy(prompt, timeoutMs);
      default:
        throw new Error(`Unknown provider: ${this.provider}`);
    }
  }

  // ==================== CORE GENERATION METHOD ====================

  /**
   * Generate dashboard view from user request
   * Single-pass generation - no stages, no confirmations
   */
  async generateView(
    userRequest: string,
    entities: SelectedEntity[],
    viewId: string,
    viewName: string
  ): Promise<GenerationResult> {
    try {
      console.group('🎨 [AI Dashboard Generator]');
      console.log('Request:', userRequest);
      console.log('Entities:', entities.length);
      console.log('Provider:', this.provider);
      console.log('Model:', this.model);

      // Add user message to chat history
      this.chatHistory.push({
        role: 'user',
        content: userRequest,
        timestamp: Date.now(),
      });

      // Build minimal prompt (skip widget catalog for Open WebUI - file provides it)
      // Pass current widgets for edit mode context
      const skipCatalog = this.provider === 'openwebui';
      const currentWidgets = this.canvasState?.widgets || [];
      const prompt = buildGenerationPrompt(
        userRequest, 
        entities, 
        viewId, 
        viewName, 
        skipCatalog,
        currentWidgets,
        this.canvasState?.viewWidth || 1920,
        this.canvasState?.viewHeight || 1080
      );

      console.log('[generateView] Mode:', currentWidgets.length > 0 ? 'EDIT' : 'CREATE');
      console.log('[generateView] Current widgets:', currentWidgets.length);

      // Single AI call
      const aiResponse = await this.callAI(prompt, 180000);

      // Add AI response to chat history
      this.chatHistory.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: Date.now(),
      });

      // Extract ExportedView JSON (handles markdown automatically)
      const exportedView = extractExportedView(aiResponse);

      if (!exportedView) {
        console.error('Failed to extract valid ExportedView from AI response');
        console.groupEnd();
        return {
          success: false,
          error: 'AI response did not contain valid dashboard JSON',
        };
      }

      console.log('✅ Successfully generated dashboard with', exportedView.view.widgets.length, 'widgets');
      console.groupEnd();

      return {
        success: true,
        exportedView,
      };
    } catch (error) {
      console.error('[generateView] Failed:', error);
      console.groupEnd();

      return {
        success: false,
        error: (error as Error)?.message || 'Unknown error',
      };
    }
  }

  /**
   * Compress an image data URL to a max dimension / JPEG quality to keep request sizes small.
   * Needed because raw screenshots / high-res uploads easily exceed proxy 413 limits.
   */
  private static async compressImageDataUrl(
    dataUrl: string,
    maxDimension: number = 512,
    quality: number = 0.6
  ): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(dataUrl); return; }
        ctx.drawImage(img, 0, 0, w, h);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        const origKB = Math.round(dataUrl.length * 0.75 / 1024);
        const newKB = Math.round(compressed.length * 0.75 / 1024);
        console.log(`[ConversationService] Image compressed: ${origKB}KB → ${newKB}KB (${w}x${h})`);
        resolve(compressed);
      };
      img.onerror = () => resolve(dataUrl); // fallback: send original
      img.src = dataUrl;
    });
  }

  /**
   * Legacy sendMessage method for UI compatibility
   * v19: Simplified to single-pass generation
   */
  async sendMessage(
    text: string,
    _mode: string = 'replace',
    _awaitUserConfirmation: boolean = false,
    imageDataUrl?: string
  ): Promise<any> {
    // Compress image before storing — prevents 413 errors from full-resolution uploads
    if (imageDataUrl) {
      this.pendingImageDataUrl = await ConversationService.compressImageDataUrl(imageDataUrl);
    }
    try {
      // Store current widget count for validation
      const currentWidgetCount = this.canvasState?.widgets?.length || 0;
      const isEditMode = currentWidgetCount > 0;

      // Generate view directly (no confirmation dialog in v19)
      // Use stored selectedEntities from setSelectedEntities()
      const result = await this.generateView(
        text,
        this.selectedEntities,
        'ai-generated',
        'AI Generated Dashboard'
      );

      if (result.success && result.exportedView) {
        // VALIDATION: In edit mode, AI should return at least as many widgets as we have
        const newWidgetCount = result.exportedView.view.widgets.length;
        if (isEditMode && newWidgetCount < currentWidgetCount) {
          console.error(`[sendMessage] ❌ VALIDATION FAILED: AI returned only ${newWidgetCount} widgets but we have ${currentWidgetCount} on canvas`);
          console.error('[sendMessage] This would delete widgets. Rejecting AI response.');
          return {
            success: false,
            error: `AI error: Returned only ${newWidgetCount} widget(s) instead of all ${currentWidgetCount}. The AI model may not be following instructions correctly. Try using deepseek-coder-v2:16b or rephrasing your request.`,
          };
        }

        // Get current view ID from store
        const { currentViewId } = useConfigStore.getState();
        if (!currentViewId) {
          console.error('[sendMessage] No view selected');
          return {
            success: false,
            error: 'No view selected. Please open a view before using AI Builder.',
          };
        }

        // Import the view automatically with correct parameters
        console.log('[sendMessage] Importing', result.exportedView.view.widgets.length, 'widgets to view:', currentViewId);
        const { importAIGeneratedView } = await import('./AIViewImporter');
        const importResult = await importAIGeneratedView(
          result.exportedView,
          currentViewId,
          'replace'
        );
        
        // Check import result
        if (!importResult.success) {
          console.error('[sendMessage] Import failed:', importResult.error);
          return {
            success: false,
            error: importResult.error || 'Failed to import widgets',
          };
        }

        console.log('[sendMessage] ✅ Successfully imported', importResult.widgetCount, 'widgets');
        
        return {
          success: true,
          exportedView: result.exportedView,
          widgetCount: importResult.widgetCount,
        };
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: (error as Error)?.message || 'Generation failed',
      };
    }
  }

  /**
   * Legacy createWidgetsPromptMode for UI compatibility
   * v19: Simplified to call generateView
   */
  async createWidgetsPromptMode(
    userRequest: string,
    _entities: SelectedEntity[],
    _mode: string = 'replace',
    _onProgress?: any,
    _onUserApproval?: any
  ): Promise<any> {
    // Just call sendMessage
    return this.sendMessage(userRequest, _mode, false);
  }

  // ==================== CHAT HISTORY ====================

  getChatHistory(): ChatMessage[] {
    return this.chatHistory;
  }

  clearChatHistory(): void {
    this.chatHistory = [];
  }

  // ==================== MODEL LISTING ====================

  /**
   * Fetch available OpenAI models
   */
  async fetchOpenAIModels(): Promise<string[]> {
    try {
      const client = getOpenAIClient(this.openAIApiKey);
      if (!client) {
        throw new Error('OpenAI API key not configured');
      }

      console.log('[ConversationService] Fetching OpenAI models...');
      const models = await client.listModels();
      const chatModels = models
        .filter((m: any) => {
          const id = m.id.toLowerCase();
          if (!id.includes('gpt')) return false;
          if (id.includes('realtime') || id.includes('audio') || id.includes('tts') || id.includes('whisper') || id.includes('dall-e')) return false;
          return true;
        })
        .map((m: any) => m.id)
        .sort();

      console.log('[ConversationService] Available models:', chatModels);
      return chatModels;
    } catch (error) {
      console.error('[fetchOpenAIModels] Failed:', error);
      throw error;
    }
  }

  /**
   * Fetch available Ollama models
   */
  async fetchOllamaModels(): Promise<string[]> {
    try {
      console.log('[ConversationService] Fetching Ollama models...');
      const models = await ollamaClient.listModels(); // Already returns string[]
      console.log('[ConversationService] Available models:', models);
      return models.sort();
    } catch (error) {
      console.error('[fetchOllamaModels] Failed:', error);
      throw error;
    }
  }

  /**
   * Fetch available GitHub models
   */
  async fetchGitHubModels(): Promise<string[]> {
    try {
      const client = getGitHubClient(this.gitHubToken);
      if (!client) {
        throw new Error('GitHub token not configured');
      }

      console.log('[ConversationService] Fetching GitHub models...');
      const models = await client.listModels();
      // GitHubClient.listModels() returns string[], not objects with .id
      const modelList = models.sort();
      console.log('[ConversationService] Available models:', modelList);
      return modelList;
    } catch (error) {
      console.error('[fetchGitHubModels] Failed:', error);
      throw error;
    }
  }

  /**
   * Fetch available Groq models
   */
  async fetchGroqModels(): Promise<string[]> {
    try {
      const client = getGroqClient(this.groqApiKey);
      if (!client) {
        throw new Error('Groq API key not configured');
      }

      console.log('[ConversationService] Fetching Groq models...');
      const modelList = await client.listModels();
      console.log('[ConversationService] Available models:', modelList);
      return modelList.sort();
    } catch (error) {
      console.error('[fetchGroqModels] Failed:', error);
      throw error;
    }
  }

  /**
   * Fetch available Copilot Proxy models
   */
  async fetchCopilotProxyModels(): Promise<string[]> {
    try {
      const client = getCopilotProxyClient(this.copilotProxyToken, this.copilotProxyUrl);
      if (!client) {
        throw new Error('Copilot Proxy token not configured');
      }

      console.log('[ConversationService] Fetching Copilot Proxy models...');
      const models = await client.listModels();
      const modelList = models.map((m: { id: string }) => m.id).sort();
      console.log('[ConversationService] Available models:', modelList);
      return modelList;
    } catch (error) {
      console.error('[fetchCopilotProxyModels] Failed:', error);
      throw error;
    }
  }

}

// Export singleton instance
export const conversationService = new ConversationService();
