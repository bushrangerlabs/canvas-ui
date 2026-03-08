/**
 * LocalRAG - Local Retrieval-Augmented Generation
 * 
 * Semantic search over local example views using Ollama embeddings.
 * Retrieves top-N most relevant examples to inject into Stage 2 prompts.
 * 
 * Uses mxbai-embed-large (334M params) for high-quality embeddings.
 */

import { ollamaClient } from './OllamaClient';

/**
 * Example view with metadata for RAG
 */
export interface ExampleView {
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  widgets_count: number;
  pattern: string;
  learning_points: string[];
  view: any; // ExportedView format
}

/**
 * Embedded example with vector
 */
interface EmbeddedExample {
  example: ExampleView;
  embedding: number[];
  text: string; // Combined text that was embedded
}

/**
 * Search result with relevance score
 */
export interface SearchResult {
  example: ExampleView;
  score: number; // Cosine similarity (0-1, higher is better)
}

/**
 * LocalRAG service for semantic search over example views
 */
export class LocalRAG {
  private examples: EmbeddedExample[] = [];
  private loaded: boolean = false;
  private embeddingModel: string = 'mxbai-embed-large';

  /**
   * Load and embed all example views from folder
   */
  async loadExamples(folderPath: string = '/local/canvas-library/example-views/'): Promise<void> {
    console.log(`[LocalRAG] Loading examples from ${folderPath}...`);

    try {
      // Fetch index.json manifest (contains list of example files)
      const indexUrl = `${folderPath}index.json`;
      console.log(`[LocalRAG] Fetching index: ${indexUrl}`);
      
      const indexResponse = await fetch(indexUrl);
      if (!indexResponse.ok) {
        console.warn(`[LocalRAG] Index not accessible: ${indexUrl}. RAG disabled.`);
        console.warn(`[LocalRAG] Make sure index.json exists in ${folderPath}`);
        return;
      }

      const index = await indexResponse.json();
      const jsonFiles = index.examples || [];
      console.log(`[LocalRAG] Found ${jsonFiles.length} example files:`, jsonFiles);

      // Load and embed each example
      for (const filename of jsonFiles) {
        try {
          const fileUrl = `${folderPath}${filename}`;
          const fileResponse = await fetch(fileUrl);
          
          if (!fileResponse.ok) {
            console.warn(`[LocalRAG] Failed to load ${filename}`);
            continue;
          }

          const example: ExampleView = await fileResponse.json();
          
          // Combine text fields for embedding
          const text = this.buildEmbeddingText(example);
          
          // Generate embedding
          console.log(`[LocalRAG] Embedding: ${example.name}...`);
          const embedding = await this.embed(text);
          
          this.examples.push({
            example,
            embedding,
            text,
          });

          console.log(`[LocalRAG] ✓ Embedded: ${example.name} (${example.widgets_count} widgets)`);
        } catch (err) {
          console.error(`[LocalRAG] Error loading ${filename}:`, err);
        }
      }

      this.loaded = true;
      console.log(`[LocalRAG] Successfully loaded ${this.examples.length} examples`);
    } catch (error) {
      console.error('[LocalRAG] Error loading examples:', error);
    }
  }

  /**
   * Build combined text for embedding (description + tags + learning points)
   */
  private buildEmbeddingText(example: ExampleView): string {
    const parts = [
      example.name,
      example.description,
      example.pattern,
      ...example.tags,
      ...example.learning_points,
    ];

    return parts.join(' ');
  }

  /**
   * Generate embedding for text using mxbai-embed-large
   */
  private async embed(text: string): Promise<number[]> {
    try {
      const embedding = await ollamaClient.embed({
        model: this.embeddingModel,
        prompt: text
      });
      return embedding;
    } catch (error) {
      console.error('[LocalRAG] Embedding error:', error);
      throw error;
    }
  }

  /**
   * Find top-N most relevant examples for user prompt using semantic search
   */
  async findRelevant(userPrompt: string, limit: number = 3): Promise<SearchResult[]> {
    if (!this.loaded || this.examples.length === 0) {
      console.warn('[LocalRAG] No examples loaded. Call loadExamples() first.');
      return [];
    }

    try {
      // Embed user prompt
      console.log(`[LocalRAG] Searching for: "${userPrompt}"`);
      const queryEmbedding = await this.embed(userPrompt);

      // Calculate cosine similarity for each example
      const results: SearchResult[] = this.examples.map(({ example, embedding }) => ({
        example,
        score: this.cosineSimilarity(queryEmbedding, embedding),
      }));

      // Sort by score (descending) and take top N
      results.sort((a, b) => b.score - a.score);
      const topResults = results.slice(0, limit);

      console.log('[LocalRAG] Top results:');
      topResults.forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.example.name} (score: ${r.score.toFixed(3)})`);
      });

      return topResults;
    } catch (error) {
      console.error('[LocalRAG] Search error:', error);
      return [];
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   * Returns value between -1 and 1 (higher is more similar)
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have same length');
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magnitudeA += a[i] * a[i];
      magnitudeB += b[i] * b[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Check if examples are loaded
   */
  isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * Get count of loaded examples
   */
  getExampleCount(): number {
    return this.examples.length;
  }
}

// Singleton instance
export const localRAG = new LocalRAG();
