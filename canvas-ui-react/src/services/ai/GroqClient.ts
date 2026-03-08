/**
 * GroqClient - Groq API integration
 * 
 * Direct integration with Groq's ultra-fast LPU inference API.
 * Supports Llama 3.1, Mixtral, Gemma 2, and other open models.
 * 
 * API: OpenAI-compatible endpoint at api.groq.com
 * Authentication: Groq API Key
 * Cost: FREE (rate-limited: 14,400 requests/day, 6,000 tokens/min)
 * Speed: 10x faster than traditional GPUs (Lightning Processing Units)
 */

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqChatOptions {
  model: string;
  messages: GroqMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
}

export interface GroqChatResponse {
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
    prompt_tokens_details?: any;
    completion_tokens_details?: any;
  };
}

/**
 * GroqClient - Groq API communication
 */
export class GroqClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = 'https://api.groq.com/openai/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * Generate chat response from Groq
   * @param options - Chat options including model and messages
   * @returns Chat response with generated text
   */
  async chat(options: GroqChatOptions): Promise<GroqChatResponse> {
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
          `Groq API error: ${response.status} ${response.statusText}. ${
            errorData.error?.message || ''
          }`
        );
      }

      const data: GroqChatResponse = await response.json();
      return data;
    } catch (error: unknown) {
      console.error('[GroqClient] Chat request failed:', error);
      throw error;
    }
  }

  /**
   * Get list of available Groq models
   * @returns List of Groq models (optimized for LPU inference)
   */
  async listModels(): Promise<string[]> {
    // Groq's confirmed working models (as of March 2026)
    // All optimized for ultra-fast inference on LPUs
    // See: https://console.groq.com/docs/models
    return [
      // Meta Llama models (FASTEST - recommended)
      'llama-3.3-70b-versatile',       // Latest Llama 3.3 70B (best quality + speed)
      'llama-3.3-70b-specdec',         // Llama 3.3 70B with speculative decoding (even faster)
      'llama-3.1-8b-instant',          // Llama 3.1 8B (ultra-fast, still supported)
      
      // Mixtral models (Mixture of Experts - long context)
      'mixtral-8x7b-32768',            // Mixtral 8x7B (32K context window)
      
      // Google Gemma models
      'gemma2-9b-it',                  // Gemma 2 9B (Google's instruction-tuned model)
      'gemma-7b-it',                   // Gemma 7B (smaller Google model)
      
      // Llama Guard (content moderation)
      'llama-guard-3-8b',              // Safety/moderation model
    ];
  }

  /**
   * Set Groq API key
   * @param apiKey - Groq API Key
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }
}

// Singleton instance (will be initialized when API key is provided)
let groqClientInstance: GroqClient | null = null;

export const getGroqClient = (apiKey?: string): GroqClient | null => {
  if (apiKey) {
    if (!groqClientInstance || groqClientInstance['apiKey'] !== apiKey) {
      groqClientInstance = new GroqClient(apiKey);
    }
  }
  return groqClientInstance;
};

export const groqClient = {
  chat: async (options: GroqChatOptions): Promise<GroqChatResponse> => {
    const client = getGroqClient();
    if (!client) {
      throw new Error('Groq client not initialized. Please provide an API key.');
    }
    return client.chat(options);
  },
  
  listModels: async (): Promise<string[]> => {
    const client = getGroqClient();
    if (!client) {
      throw new Error('Groq client not initialized. Please provide an API key.');
    }
    return client.listModels();
  },
  
  setApiKey: (apiKey: string): void => {
    const client = getGroqClient(apiKey);
    if (client) {
      client.setApiKey(apiKey);
    }
  }
};
