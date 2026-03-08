/**
 * CopilotProxyClient - GitHub Copilot Proxy integration
 * 
 * Connects to local Copilot Proxy server which provides access to:
 * - Claude 3.5 Sonnet (via GitHub Copilot Pro subscription)
 * - GPT-4, GPT-5, Gemini
 * - All other GitHub Copilot models
 * 
 * Proxy server: /home/spetchal/Code/HADD/copilot-proxy/
 * Start with: cd copilot-proxy && npm start
 */

export type VisionContent =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

export interface CopilotProxyMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | VisionContent[];
}

export interface CopilotProxyChatOptions {
  model: string;
  messages: CopilotProxyMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface CopilotProxyChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface CopilotProxyModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
  _copilot?: {
    name: string;
    capabilities?: any;
    policy?: any;
    billing?: any;
  };
}

/**
 * CopilotProxyClient - Communication with local Copilot Proxy server
 */
export class CopilotProxyClient {
  private token: string;
  private baseUrl: string;

  constructor(
    token: string, 
    baseUrl: string = 'http://localhost:3100/v1'
  ) {
    this.token = token;
    this.baseUrl = baseUrl;
  }

  /**
   * Generate chat response from Copilot Proxy
   * @param options - Chat options including model and messages
   * @returns Chat response with generated text
   */
  async chat(options: CopilotProxyChatOptions): Promise<CopilotProxyChatResponse> {
    const url = `${this.baseUrl}/chat/completions`;
    
    const requestBody = {
      model: options.model,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens,
      stream: options.stream ?? false,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Provide helpful error messages
        if (response.status === 0 || response.status === 504) {
          throw new Error(
            `Copilot Proxy server not reachable at ${this.baseUrl}. ` +
            `Is the server running? Start with: cd copilot-proxy && npm start`
          );
        }
        
        throw new Error(
          `Copilot Proxy API error: ${response.status} ${response.statusText}. ${
            errorData.error?.message || ''
          }`
        );
      }

      const data: CopilotProxyChatResponse = await response.json();
      return data;
    } catch (error: unknown) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(
          `Cannot connect to Copilot Proxy at ${this.baseUrl}. ` +
          `Make sure the proxy server is running (npm start in copilot-proxy folder).`
        );
      }
      console.error('[CopilotProxyClient] Chat request failed:', error);
      throw error;
    }
  }

  /**
   * Get list of available models from Copilot Proxy
   * @returns List of model objects
   */
  async listModels(): Promise<CopilotProxyModel[]> {
    const url = `${this.baseUrl}/models`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 0 || response.status === 504) {
          throw new Error(
            `Copilot Proxy server not running. Start with: cd copilot-proxy && npm start`
          );
        }
        throw new Error(`Failed to fetch models: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error: unknown) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        // Return empty array if server not running (better UX than error)
        console.warn('[CopilotProxyClient] Proxy server not reachable');
        return [];
      }
      console.error('[CopilotProxyClient] List models failed:', error);
      throw error;
    }
  }

  /**
   * Set GitHub token
   * @param token - GitHub Personal Access Token
   */
  setToken(token: string): void {
    this.token = token;
  }

  /**
   * Set base URL for proxy server
   * @param baseUrl - Base URL (default: http://localhost:3100/v1)
   */
  setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl;
  }
}

// Singleton instance (will be initialized when token is provided)
let copilotProxyClientInstance: CopilotProxyClient | null = null;

export const getCopilotProxyClient = (
  token?: string, 
  baseUrl?: string
): CopilotProxyClient | null => {
  if (token) {
    if (!copilotProxyClientInstance || 
        copilotProxyClientInstance['token'] !== token ||
        (baseUrl && copilotProxyClientInstance['baseUrl'] !== baseUrl)) {
      copilotProxyClientInstance = new CopilotProxyClient(
        token, 
        baseUrl || 'http://localhost:3100/v1'
      );
    }
  }
  return copilotProxyClientInstance;
};

export const copilotProxyClient = {
  chat: async (options: CopilotProxyChatOptions): Promise<CopilotProxyChatResponse> => {
    const client = getCopilotProxyClient();
    if (!client) {
      throw new Error('CopilotProxy client not initialized. Configure in AI Settings.');
    }
    return client.chat(options);
  },
  
  listModels: async (): Promise<CopilotProxyModel[]> => {
    const client = getCopilotProxyClient();
    if (!client) {
      throw new Error('CopilotProxy client not initialized. Configure in AI Settings.');
    }
    return client.listModels();
  },
};
