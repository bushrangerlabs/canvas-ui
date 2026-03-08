/**
 * OllamaClient - Direct Ollama API integration via Home Assistant Proxy
 * 
 * Uses HA proxy endpoint to avoid CORS issues while maintaining security.
 * Architecture: Browser → HA Proxy (/api/canvas_ui/ollama/) → Ollama (192.168.1.204:11434)
 * 
 * Benefits:
 * - Same origin (no CORS restrictions)
 * - HA authentication required
 * - Ollama stays private (no network exposure)
 * - Full HA logging and monitoring
 * 
 * Phase 1 implementation - supports both chat and embeddings
 */

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  images?: string[]; // Optional base64-encoded images for vision models
}

export interface OllamaChatOptions {
  model: string;
  messages: OllamaMessage[];
  temperature?: number;
  top_p?: number;
  stream?: boolean;
}

export interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

export interface OllamaEmbeddingOptions {
  model: string;
  prompt: string;
}

export interface OllamaEmbeddingResponse {
  embedding: number[];
}

/**
 * OllamaClient - Ollama API communication via HA proxy
 */
export class OllamaClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/canvas_ui/ollama') {
    this.baseUrl = baseUrl;
  }

  /**
   * Get HA access token from localStorage
   * @returns Access token or null
   */
  private getAccessToken(): string | null {
    try {
      const hassTokens = localStorage.getItem('hassTokens');
      if (hassTokens) {
        const tokens = JSON.parse(hassTokens);
        return tokens.access_token;
      }
    } catch (e) {
      console.error('Failed to get HA access token:', e);
    }
    return null;
  }

  /**
   * Get auth headers for HA API requests
   * @returns Headers object with Authorization if token available
   */
  private getAuthHeaders(): HeadersInit {
    const token = this.getAccessToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  /**
   * Generate chat response from Ollama
   * @param options - Chat options including model and messages
   * @returns Chat response with generated text
   */
  async chat(options: OllamaChatOptions): Promise<OllamaChatResponse> {
    const url = `${this.baseUrl}/chat`;
    
    const requestBody = {
      model: options.model,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      top_p: options.top_p ?? 0.9,
      stream: options.stream ?? false,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data as OllamaChatResponse;
    } catch (error) {
      console.error('Ollama chat error:', error);
      throw new Error(`Failed to communicate with Ollama: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate embeddings using Ollama embedding model
   * @param options - Embedding options including model and text
   * @returns Array of embedding values
   */
  async embed(options: OllamaEmbeddingOptions): Promise<number[]> {
    const url = `${this.baseUrl}/embeddings`;
    
    const requestBody = {
      model: options.model,
      prompt: options.prompt,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as OllamaEmbeddingResponse;
      return data.embedding;
    } catch (error) {
      console.error('Ollama embedding error:', error);
      throw new Error(`Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if Ollama is available
   * @returns True if Ollama is reachable
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/tags`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get list of available models
   * @returns Array of model names
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/tags`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      return data.models?.map((m: any) => m.name) || [];
    } catch (error) {
      console.error('Ollama list models error:', error);
      return [];
    }
  }
}

/**
 * Singleton instance for application-wide use
 */
export const ollamaClient = new OllamaClient();
