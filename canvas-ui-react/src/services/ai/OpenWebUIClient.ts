/**
 * OpenWebUIClient - Open WebUI API integration for AI dashboard generation
 * 
 * Uses Open WebUI's API to leverage file attachments and better prompt handling.
 * Benefits:
 * - File upload support (CANVAS_UI_WIDGETS.md)
 * - Better prompt engineering than direct Ollama
 * - Same local models (no cloud costs)
 * - Proven success with widget generation
 */

export type VisionContent =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

export interface OpenWebUIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | VisionContent[];
}

export interface OpenWebUIChatOptions {
  model: string;
  messages: OpenWebUIMessage[];
  temperature?: number;
  fileIds?: string[]; // File attachment IDs
  stream?: boolean;
}

export interface OpenWebUIChatResponse {
  id: string;
  model: string;
  created: number;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
}

export interface OpenWebUIFileUploadResponse {
  id: string;
  filename: string;
  meta: {
    name: string;
    content_type: string;
    size: number;
  };
}

/**
 * OpenWebUIClient - Open WebUI API communication
 */
export class OpenWebUIClient {
  private baseUrl: string;
  private apiKey: string;
  private widgetDocFileId: string | null = null;

  constructor(baseUrl: string = 'http://localhost:3000', apiKey: string = '') {
    this.baseUrl = baseUrl.replace(/\/$/, '').replace(/\/api$/, ''); // Remove trailing slash or /api suffix
    this.apiKey = apiKey;
  }

  /**
   * Upload CANVAS_UI_WIDGETS.md file to Open WebUI
   * @returns File ID for use in chat
   */
  async uploadWidgetDoc(fileContent: string): Promise<string> {
    try {
      // Create a blob from the markdown content
      const blob = new Blob([fileContent], { type: 'text/markdown' });
      const formData = new FormData();
      formData.append('file', blob, 'CANVAS_UI_WIDGETS.md');

      const fetchOptions: RequestInit = {
        method: 'POST',
        body: formData,
      };

      if (this.apiKey) {
        const headers = new Headers();
        headers.append('Authorization', `Bearer ${this.apiKey}`);
        fetchOptions.headers = headers;
      }

      const response = await fetch(`${this.baseUrl}/api/v1/files/`, fetchOptions);

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data: OpenWebUIFileUploadResponse = await response.json();
      this.widgetDocFileId = data.id;
      console.log('[OpenWebUI] Uploaded widget doc, file ID:', data.id);
      return data.id;
    } catch (error) {
      console.error('[OpenWebUI] File upload failed:', error);
      throw error;
    }
  }

  /**
   * Get cached widget doc file ID
   */
  getWidgetDocFileId(): string | null {
    return this.widgetDocFileId;
  }

  /**
   * Generate chat response from Open WebUI
   * @param options - Chat options including model, messages, and file IDs
   * @returns Chat response with generated text
   */
  async chat(options: OpenWebUIChatOptions): Promise<OpenWebUIChatResponse> {
    const requestBody: any = {
      model: options.model,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      stream: options.stream ?? false,
    };

    // Add file IDs if provided
    if (options.fileIds && options.fileIds.length > 0) {
      requestBody.files = options.fileIds.map((id) => ({ id, type: 'file' }));
    }

    console.log('[OpenWebUI] Chat request:', {
      model: options.model,
      messageCount: options.messages.length,
      fileIds: options.fileIds,
    });

    const fetchOptions: RequestInit = {
      method: 'POST',
      body: JSON.stringify(requestBody),
    };

    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    if (this.apiKey) {
      // Sanitize API key to ensure only ASCII characters (ISO-8859-1 compatible)
      const sanitizedKey = this.apiKey.trim().replace(/[^\x00-\x7F]/g, '');
      headers.append('Authorization', `Bearer ${sanitizedKey}`);
    }
    fetchOptions.headers = headers;

    const response = await fetch(`${this.baseUrl}/api/chat/completions`, fetchOptions);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[OpenWebUI] Chat failed:', response.status, errorText);
      throw new Error(`OpenWebUI chat failed: ${response.statusText}`);
    }

    const data: OpenWebUIChatResponse = await response.json();
    console.log('[OpenWebUI] Response received:', {
      model: data.model,
      contentLength: data.choices[0]?.message?.content?.length || 0,
    });

    return data;
  }

  /**
   * Get available models from Open WebUI
   * @returns List of model names
   */
  async getModels(): Promise<string[]> {
    try {
      const fetchOptions: RequestInit = {};
      
      if (this.apiKey) {
        const headers = new Headers();
        // Sanitize API key to ensure only ASCII characters (ISO-8859-1 compatible)
        const sanitizedKey = this.apiKey.trim().replace(/[^\x00-\x7F]/g, '');
        headers.append('Authorization', `Bearer ${sanitizedKey}`);
        fetchOptions.headers = headers;
      }

      const response = await fetch(`${this.baseUrl}/api/models`, fetchOptions);

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Open WebUI returns models in the format: { data: [{ id: 'model-name' }] }
      if (data.data && Array.isArray(data.data)) {
        return data.data.map((m: any) => m.id);
      }

      return [];
    } catch (error) {
      console.error('[OpenWebUI] Failed to fetch models:', error);
      return [];
    }
  }
}

// Singleton instance
let openWebUIClient: OpenWebUIClient | null = null;

/**
 * Get or create OpenWebUIClient instance
 * @param baseUrl - Open WebUI base URL (e.g., http://localhost:3000)
 * @param apiKey - API key for authentication
 * @returns Client instance
 */
export function getOpenWebUIClient(baseUrl?: string, apiKey?: string): OpenWebUIClient {
  if (!openWebUIClient || (baseUrl && openWebUIClient['baseUrl'] !== baseUrl) || (apiKey && openWebUIClient['apiKey'] !== apiKey)) {
    openWebUIClient = new OpenWebUIClient(baseUrl || 'http://localhost:3000', apiKey || '');
  }
  return openWebUIClient;
}
