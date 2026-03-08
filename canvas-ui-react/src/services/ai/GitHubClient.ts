/**
 * GitHubClient - GitHub Models API integration
 * 
 * Integration with GitHub Copilot's AI Models API.
 * Supports OpenAI (GPT-4o, o1), Anthropic (Claude 3.5), Google (Gemini), 
 * Meta (Llama 3.1), Mistral, Cohere, Microsoft (Phi), and AI21 (Jamba).
 * 
 * API: OpenAI-compatible endpoint at models.inference.ai.azure.com
 * Authentication: GitHub Personal Access Token (PAT)
 * Availability: Free tier (rate-limited) + Copilot Pro (higher limits)
 * Docs: https://docs.github.com/en/copilot/reference/ai-models/supported-models
 */

export type VisionContent =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

export interface GitHubMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | VisionContent[];
}

export interface GitHubChatOptions {
  model: string;
  messages: GitHubMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
}

export interface GitHubChatResponse {
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
 * GitHubClient - GitHub Models API communication
 */
export class GitHubClient {
  private token: string;
  private baseUrl: string;

  constructor(token: string, baseUrl: string = 'https://models.inference.ai.azure.com') {
    this.token = token;
    this.baseUrl = baseUrl;
  }

  /**
   * Generate chat response from GitHub Models
   * @param options - Chat options including model and messages
   * @returns Chat response with generated text
   */
  async chat(options: GitHubChatOptions): Promise<GitHubChatResponse> {
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
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `GitHub Models API error: ${response.status} ${response.statusText}. ${
            errorData.error?.message || ''
          }`
        );
      }

      const data: GitHubChatResponse = await response.json();
      return data;
    } catch (error: unknown) {
      console.error('[GitHubClient] Chat request failed:', error);
      throw error;
    }
  }

  /**
   * Get list of available GitHub models
   * Note: GitHub Models API doesn't have a models endpoint, so we return a curated list
   * Model names are Azure AI model identifiers used by GitHub Models
   * Source: https://docs.github.com/en/copilot/reference/ai-models/supported-models
   * @returns List of GitHub Copilot supported models
   */
  async listModels(): Promise<string[]> {
    // GitHub Models doesn't have a models list endpoint
    // Full list based on official documentation (Copilot Pro has access to all)
    return [
      // OpenAI models
      'gpt-4o',
      'gpt-4o-mini',
      'o1-preview',
      'o1-mini',
      
      // Anthropic Claude models ⭐ NEW
      'claude-3-5-sonnet',
      'claude-3-5-haiku',
      'claude-3-opus',
      'claude-3-sonnet',
      'claude-3-haiku',
      
      // Google Gemini models ⭐ NEW
      'gemini-2.0-flash-exp',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      
      // Meta Llama models
      'Meta-Llama-3.1-405B-Instruct',
      'Meta-Llama-3.1-70B-Instruct',
      'Meta-Llama-3.1-8B-Instruct',
      'Meta-Llama-3-70B-Instruct',
      'Meta-Llama-3-8B-Instruct',
      
      // Mistral models ⭐ NEW
      'Mistral-large',
      'Mistral-large-2407',
      'Mistral-Nemo',
      'Mistral-small',
      
      // Cohere models ⭐ NEW
      'Cohere-command-r-plus',
      'Cohere-command-r',
      
      // Microsoft Phi models ⭐ NEW
      'Phi-3.5-mini-instruct',
      'Phi-3.5-MoE-instruct',
      'Phi-3-medium-instruct',
      'Phi-3-mini-instruct',
      'Phi-3-small-instruct',
      
      // AI21 models ⭐ NEW
      'AI21-Jamba-1.5-Large',
      'AI21-Jamba-1.5-Mini',
    ];
  }

  /**
   * Set GitHub token
   * @param token - GitHub Personal Access Token
   */
  setToken(token: string): void {
    this.token = token;
  }
}

// Singleton instance (will be initialized when token is provided)
let gitHubClientInstance: GitHubClient | null = null;

export const getGitHubClient = (token?: string): GitHubClient | null => {
  if (token) {
    if (!gitHubClientInstance || gitHubClientInstance['token'] !== token) {
      gitHubClientInstance = new GitHubClient(token);
    }
  }
  return gitHubClientInstance;
};

export const gitHubClient = {
  chat: async (options: GitHubChatOptions): Promise<GitHubChatResponse> => {
    const client = getGitHubClient();
    if (!client) {
      throw new Error('GitHub client not initialized. Please provide a Personal Access Token.');
    }
    return client.chat(options);
  },
  
  listModels: async (): Promise<string[]> => {
    const client = getGitHubClient();
    if (!client) {
      throw new Error('GitHub client not initialized. Please provide a Personal Access Token.');
    }
    return client.listModels();
  },
  
  setToken: (token: string): void => {
    const client = getGitHubClient(token);
    if (client) {
      client.setToken(token);
    }
  }
};
