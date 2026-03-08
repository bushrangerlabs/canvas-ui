/**
 * ModelRecommendationEngine - AI Model Recommendations
 * Phase 4.5: Multi-model optimization recommendations
 * 
 * Provides tiered recommendations based on available VRAM
 */

import type { ConversationAgent } from './ConversationService';

/**
 * Hardware tier classification
 */
export type VRAMTier = 'cpu' | '4gb' | '8gb' | '12gb' | '16gb' | '24gb+';

/**
 * Strategy type based on model count
 */
export type Strategy = 'single' | 'dual' | 'triple' | 'custom';

/**
 * Recommendation result
 */
export interface ModelRecommendation {
  tier: string;
  strategy: Strategy;
  recommended: {
    planning?: string;
    code?: string;
    refinement?: string;
    fallback: string;
  };
  benefits: string[];
  estimatedVRAM: string;
}

/**
 * Model size estimates (in GB)
 */
const MODEL_SIZES: Record<string, number> = {
  'phi-3-mini': 2.0,
  'gemma:2b': 2.0,
  'tinyllama': 1.0,
  'llama3:8b': 4.7,
  'llama3': 4.7,
  'mistral': 4.1,
  'codellama:13b': 7.4,
  'codellama:7b': 4.0,
  'deepseek-coder': 7.0,
  'starcoder': 7.0,
  'codellama:34b': 19.0,
  'mixtral:8x7b': 26.0,
};

/**
 * Tier definitions with recommendations
 */
const TIER_RECOMMENDATIONS: Record<VRAMTier, ModelRecommendation> = {
  'cpu': {
    tier: 'Minimal (CPU Only)',
    strategy: 'single',
    recommended: {
      fallback: 'phi-3-mini',
    },
    benefits: [
      'Works on any hardware',
      'Functional for basic tasks',
    ],
    estimatedVRAM: '~2GB RAM',
  },
  '4gb': {
    tier: 'Entry (4GB)',
    strategy: 'single',
    recommended: {
      fallback: 'phi-3-mini',
    },
    benefits: [
      'Fast responses',
      'Good for simple dashboards',
    ],
    estimatedVRAM: '~2GB',
  },
  '8gb': {
    tier: 'Mid-Range (8GB)',
    strategy: 'single',
    recommended: {
      fallback: 'llama3:8b',
    },
    benefits: [
      'High-quality responses',
      'Good general performance',
    ],
    estimatedVRAM: '~4.7GB',
  },
  '12gb': {
    tier: 'High-End (12GB)',
    strategy: 'dual',
    recommended: {
      planning: 'llama3:8b',
      refinement: 'phi-3-mini',
      fallback: 'llama3:8b',
    },
    benefits: [
      'Fast refinement (1-3s)',
      'Quality initial generation',
      '10x faster chat vs single model',
    ],
    estimatedVRAM: '~6.7GB',
  },
  '16gb': {
    tier: 'Enthusiast (16GB)',
    strategy: 'triple',
    recommended: {
      planning: 'llama3:8b',
      code: 'codellama:13b',
      refinement: 'phi-3-mini',
      fallback: 'llama3:8b',
    },
    benefits: [
      'Professional code quality',
      'Instant refinement (<1s)',
      '30x faster chat vs single model',
      'Optimal planning + code generation',
    ],
    estimatedVRAM: '~14GB',
  },
  '24gb+': {
    tier: 'Professional (24GB+)',
    strategy: 'triple',
    recommended: {
      planning: 'llama3:8b',
      code: 'codellama:34b',
      refinement: 'phi-3-mini',
      fallback: 'codellama:34b',
    },
    benefits: [
      'Cutting-edge code quality',
      'Complex dashboard generation',
      'Instant refinement (<1s)',
      'Supports very large models',
    ],
    estimatedVRAM: '~24GB',
  },
};

/**
 * Get model size estimate
 */
function estimateModelSize(modelName: string): number {
  // Check if model name contains any known model
  for (const [key, size] of Object.entries(MODEL_SIZES)) {
    if (modelName.toLowerCase().includes(key.toLowerCase())) {
      return size;
    }
  }
  
  // Default estimates based on model name patterns
  if (modelName.includes('34b')) return 19.0;
  if (modelName.includes('13b')) return 7.4;
  if (modelName.includes('8b') || modelName.includes('7b')) return 4.5;
  if (modelName.includes('3b') || modelName.includes('2b')) return 2.0;
  
  // Unknown - assume medium size
  return 5.0;
}

/**
 * Calculate total VRAM usage for a set of models
 */
function calculateTotalVRAM(models: string[]): number {
  return models.reduce((total, model) => {
    return total + estimateModelSize(model);
  }, 0);
}

/**
 * Check if recommended models are available in agent list
 */
function findAvailableModels(
  recommended: ModelRecommendation['recommended'],
  availableAgents: ConversationAgent[]
): ModelRecommendation['recommended'] {
  const result: ModelRecommendation['recommended'] = {
    fallback: recommended.fallback,
  };

  const findAgent = (modelName?: string) => {
    if (!modelName) return undefined;
    return availableAgents.find(
      a => a.id.includes(modelName) || 
           a.name.toLowerCase().includes(modelName.toLowerCase())
    );
  };

  const planningAgent = findAgent(recommended.planning);
  if (planningAgent) result.planning = planningAgent.id;

  const codeAgent = findAgent(recommended.code);
  if (codeAgent) result.code = codeAgent.id;

  const refinementAgent = findAgent(recommended.refinement);
  if (refinementAgent) result.refinement = refinementAgent.id;

  const fallbackAgent = findAgent(recommended.fallback);
  if (fallbackAgent) result.fallback = fallbackAgent.id;

  return result;
}

/**
 * Get recommendations for a given VRAM tier
 */
export function getRecommendations(
  vram: VRAMTier,
  availableAgents: ConversationAgent[]
): ModelRecommendation | null {
  const tierRec = TIER_RECOMMENDATIONS[vram];
  
  if (!tierRec) {
    console.warn('[ModelRecommendation] Unknown VRAM tier:', vram);
    return null;
  }

  // Find available models that match recommendations
  const availableModels = findAvailableModels(tierRec.recommended, availableAgents);

  // Calculate actual VRAM usage if models are found
  const modelList = [
    availableModels.planning,
    availableModels.code,
    availableModels.refinement,
  ].filter(Boolean) as string[];

  let estimatedVRAM = tierRec.estimatedVRAM;
  if (modelList.length > 0) {
    const totalGB = calculateTotalVRAM(modelList);
    estimatedVRAM = `~${totalGB.toFixed(1)}GB`;
  }

  return {
    ...tierRec,
    recommended: availableModels,
    estimatedVRAM,
  };
}

/**
 * Validate if a configuration fits within VRAM limits
 */
export function validateConfiguration(
  vram: VRAMTier,
  models: string[]
): { valid: boolean; totalVRAM: number; limit: number } {
  const limits: Record<VRAMTier, number> = {
    'cpu': 4,
    '4gb': 4,
    '8gb': 8,
    '12gb': 12,
    '16gb': 16,
    '24gb+': 24,
  };

  const totalVRAM = calculateTotalVRAM(models);
  const limit = limits[vram];

  return {
    valid: totalVRAM <= limit,
    totalVRAM,
    limit,
  };
}

/**
 * Suggest models to install for a given tier
 */
export function suggestInstalls(
  vram: VRAMTier,
  installedModels: string[]
): string[] {
  const tierRec = TIER_RECOMMENDATIONS[vram];
  if (!tierRec) return [];

  const recommended = Object.values(tierRec.recommended).filter(Boolean) as string[];
  
  // Find models that are recommended but not installed
  return recommended.filter(model => {
    return !installedModels.some(installed => 
      installed.includes(model) || model.includes(installed)
    );
  });
}

export default {
  getRecommendations,
  validateConfiguration,
  suggestInstalls,
};
