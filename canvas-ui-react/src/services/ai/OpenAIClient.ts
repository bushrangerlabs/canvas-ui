/**
 * OpenAIClient - OpenAI API integration
 * 
 * Direct integration with OpenAI's Chat Completion API.
 * Supports GPT-4, GPT-3.5-turbo, and other OpenAI models.
 * 
 * API Key stored in localStorage (user-provided)
 */

export type VisionContent =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | VisionContent[];
}

export interface OpenAIChatOptions {
  model: string;
  messages: OpenAIMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
}

export interface OpenAIChatResponse {
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

/**
 * OpenAIClient - OpenAI API communication
 */
export class OpenAIClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = 'https://api.openai.com/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * Generate chat response from OpenAI
   * @param options - Chat options including model and messages
   * @returns Chat response with generated text
   */
  async chat(options: OpenAIChatOptions): Promise<OpenAIChatResponse> {
    const url = `${this.baseUrl}/chat/completions`;
    
    const requestBody = {
      model: options.model,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      top_p: options.top_p ?? 1.0,
      max_tokens: options.max_tokens,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `OpenAI API error: ${response.status} ${response.statusText}. ${
            errorData.error?.message || ''
          }`
        );
      }

      const data: OpenAIChatResponse = await response.json();
      return data;
    } catch (error: unknown) {
      console.error('[OpenAIClient] Chat request failed:', error);
      throw error;
    }
  }

  /**
   * List available OpenAI models
   * @returns List of available models
   */
  async listModels(): Promise<{ id: string; object: string; created: number }[]> {
    const url = `${this.baseUrl}/models`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to list models: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error: unknown) {
      console.error('[OpenAIClient] List models failed:', error);
      throw error;
    }
  }

  /**
   * Set API key
   * @param apiKey - OpenAI API key
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }
}

// Singleton instance (will be initialized when API key is provided)
let openAIClientInstance: OpenAIClient | null = null;

export const getOpenAIClient = (apiKey?: string): OpenAIClient | null => {
  if (apiKey) {
    if (!openAIClientInstance || openAIClientInstance['apiKey'] !== apiKey) {
      openAIClientInstance = new OpenAIClient(apiKey);
    }
  }
  return openAIClientInstance;
};

export const openAIClient = {
  chat: async (options: OpenAIChatOptions): Promise<OpenAIChatResponse> => {
    const client = getOpenAIClient();
    if (!client) {
      throw new Error('OpenAI client not initialized. Please provide an API key.');
    }
    return client.chat(options);
  },
  
  listModels: async (): Promise<{ id: string; object: string; created: number }[]> => {
    const client = getOpenAIClient();
    if (!client) {
      throw new Error('OpenAI client not initialized. Please provide an API key.');
    }
    return client.listModels();
  },
  
  initialize: (apiKey: string) => {
    getOpenAIClient(apiKey);
  },
};
