/**
 * OllamaConfigDialog - Multi-Model Configuration
 * Phase 4.5: User-guided AI model configuration
 * 
 * Allows users to configure specialized AI models for different tasks:
 * - Planning: Natural language understanding (llama3, mistral)
 * - Code: JavaScript generation (codellama, deepseek-coder)
 * - Refinement: Fast chat responses (phi-3-mini, gemma)
 */

import {
    Close as CloseIcon,
    FlashOn as FlashOnIcon,
    Info as InfoIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    FormControlLabel,
    IconButton,
    InputLabel,
    LinearProgress,
    MenuItem,
    Select,
    Switch,
    Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import type { ConversationAgent } from '../../services/ai/ConversationService';
import { getRecommendations } from '../../services/ai/ModelRecommendationEngine';
import type { HassConnection } from '../../shared/types';

/**
 * Multi-model configuration
 */
export interface OllamaConfig {
  vram: '4gb' | '8gb' | '12gb' | '16gb' | '24gb+' | 'cpu';
  strategy: 'single' | 'dual' | 'triple' | 'custom';
  models: {
    planning?: string;      // For blank canvas Pass 1
    code?: string;          // For blank canvas Pass 2
    refinement?: string;    // For chat refinement
    fallback: string;       // Single model fallback
  };
  useMultiModel: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  hass: HassConnection;
  currentConfig?: OllamaConfig;
  onSave: (config: OllamaConfig) => void;
}

/**
 * Configuration Dialog Component
 */
export const OllamaConfigDialog: React.FC<Props> = ({
  open,
  onClose,
  hass,
  currentConfig,
  onSave,
}) => {
  // State
  const [vram, setVram] = useState<OllamaConfig['vram']>(currentConfig?.vram || '16gb');
  const [availableAgents, setAvailableAgents] = useState<ConversationAgent[]>([]);
  const [loading, setLoading] = useState(false);
  const [useMultiModel, setUseMultiModel] = useState(currentConfig?.useMultiModel ?? true);
  
  // Model selections
  const [planningModel, setPlanningModel] = useState(currentConfig?.models.planning || '');
  const [codeModel, setCodeModel] = useState(currentConfig?.models.code || '');
  const [refinementModel, setRefinementModel] = useState(currentConfig?.models.refinement || '');
  const [fallbackModel, setFallbackModel] = useState(currentConfig?.models.fallback || '');

  /**
   * Load available AI agents from Home Assistant
   */
  const loadAvailableAgents = React.useCallback(async () => {
    setLoading(true);
    try {
      // Use sendMessage instead of callWS
      if (!hass.sendMessage) {
        throw new Error('WebSocket sendMessage not available');
      }
      
      const result = await hass.sendMessage({
        type: 'conversation/agent/list',
      }) as { agents?: ConversationAgent[], result?: { agents: ConversationAgent[] } };
      
      const agents = result.agents || result.result?.agents || [];
      setAvailableAgents(agents);
      
      // Set fallback to first agent if not set
      if (!fallbackModel && agents.length > 0) {
        setFallbackModel(agents[0].id);
      }
    } catch (error) {
      console.error('[OllamaConfig] Failed to load agents:', error);
    } finally {
      setLoading(false);
    }
  }, [hass, fallbackModel]);

  // Load available agents on mount
  useEffect(() => {
    if (open) {
      loadAvailableAgents();
    }
  }, [open, loadAvailableAgents]);

  // Restore saved config when dialog opens (fixes persistence issue)
  useEffect(() => {
    if (open && currentConfig) {
      console.log('[OllamaConfigDialog] Restoring saved config:', currentConfig);
      setVram(currentConfig.vram);
      setUseMultiModel(currentConfig.useMultiModel);
      setPlanningModel(currentConfig.models.planning || '');
      setCodeModel(currentConfig.models.code || '');
      setRefinementModel(currentConfig.models.refinement || '');
      setFallbackModel(currentConfig.models.fallback || '');
    }
  }, [open, currentConfig]);

  /**
   * Apply recommended models based on VRAM tier
   */
  const applyRecommendations = React.useCallback(() => {
    const recommendations = getRecommendations(vram, availableAgents);
    
    if (!recommendations) return;

    // Apply recommended models if they exist in available agents
    const findAgent = (name: string) => 
      availableAgents.find(a => a.id.includes(name) || a.name.includes(name));

    if (recommendations.recommended.planning) {
      const agent = findAgent(recommendations.recommended.planning);
      if (agent) setPlanningModel(agent.id);
    }

    if (recommendations.recommended.code) {
      const agent = findAgent(recommendations.recommended.code);
      if (agent) setCodeModel(agent.id);
    }

    if (recommendations.recommended.refinement) {
      const agent = findAgent(recommendations.recommended.refinement);
      if (agent) setRefinementModel(agent.id);
    }

    // Set fallback if not already set
    if (!fallbackModel && availableAgents.length > 0) {
      const llama3 = findAgent('llama3');
      setFallbackModel(llama3?.id || availableAgents[0].id);
    }
  }, [vram, availableAgents, fallbackModel]);

  // Auto-apply recommendations when VRAM changes
  useEffect(() => {
    if (availableAgents.length > 0 && !currentConfig) {
      applyRecommendations();
    }
  }, [vram, availableAgents, currentConfig, applyRecommendations]);

  /**
   * Save configuration
   */
  const handleSave = () => {
    // Determine strategy based on selections
    let strategy: OllamaConfig['strategy'] = 'single';
    
    if (useMultiModel) {
      const hasAllThree = planningModel && codeModel && refinementModel;
      const hasTwoModels = [planningModel, codeModel, refinementModel].filter(Boolean).length === 2;
      
      if (hasAllThree) {
        strategy = 'triple';
      } else if (hasTwoModels) {
        strategy = 'dual';
      } else {
        strategy = 'custom';
      }
    }

    const config: OllamaConfig = {
      vram,
      strategy,
      models: {
        planning: planningModel,
        code: codeModel,
        refinement: refinementModel,
        fallback: fallbackModel || availableAgents[0]?.id || '',
      },
      useMultiModel,
    };

    onSave(config);
    onClose();
  };

  /**
   * Get recommendations for current VRAM tier
   */
  const recommendations = getRecommendations(vram, availableAgents);

  /**
   * Check if a model is configured (exists in agent list)
   */
  const isModelConfigured = (modelId: string) => {
    return availableAgents.some(a => a.id === modelId);
  };

  /**
   * Render model selector
   */
  const renderModelSelector = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    description: string,
    disabled: boolean = false
  ) => (
    <Box sx={{ mb: 2 }}>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {description}
      </Typography>
      <FormControl fullWidth size="small" disabled={disabled}>
        <InputLabel>{label}</InputLabel>
        <Select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          label={label}
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {availableAgents.map((agent) => (
            <MenuItem key={agent.id} value={agent.id}>
              {agent.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {value && isModelConfigured(value) && (
        <Chip
          size="small"
          icon={<FlashOnIcon />}
          label="Configured"
          color="success"
          sx={{ mt: 0.5 }}
        />
      )}
    </Box>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">🤖 AI Model Configuration</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Step 1: Hardware Selection */}
        <Typography variant="subtitle1" gutterBottom fontWeight="bold">
          Step 1: Your Hardware
        </Typography>
        <FormControl fullWidth size="small" sx={{ mb: 3 }}>
          <InputLabel>GPU VRAM</InputLabel>
          <Select
            value={vram}
            onChange={(e) => setVram(e.target.value as OllamaConfig['vram'])}
            label="GPU VRAM"
          >
            <MenuItem value="cpu">CPU Only (2-4GB RAM)</MenuItem>
            <MenuItem value="4gb">4GB VRAM (Entry GPU)</MenuItem>
            <MenuItem value="8gb">8GB VRAM (Mid-range)</MenuItem>
            <MenuItem value="12gb">12GB VRAM (High-end)</MenuItem>
            <MenuItem value="16gb">16GB VRAM (Enthusiast)</MenuItem>
            <MenuItem value="24gb+">24GB+ VRAM (Professional)</MenuItem>
          </Select>
        </FormControl>

        <Divider sx={{ my: 2 }} />

        {/* Step 2: Available Models */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <Typography variant="subtitle1" fontWeight="bold">
            Step 2: Available AI Agents
          </Typography>
          <IconButton onClick={loadAvailableAgents} size="small" disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Box>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {!loading && availableAgents.length === 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            No AI conversation agents found. Please configure AI agents in Home Assistant first.
          </Alert>
        )}

        {!loading && availableAgents.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Detected {availableAgents.length} conversation agent(s)
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
              {availableAgents.map((agent) => (
                <Chip
                  key={agent.id}
                  label={agent.name}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Step 3: Multi-Model Toggle */}
        <Typography variant="subtitle1" gutterBottom fontWeight="bold">
          Step 3: Strategy
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={useMultiModel}
              onChange={(e) => setUseMultiModel(e.target.checked)}
            />
          }
          label="Enable Multi-Model Optimization"
        />
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Use specialized models for different tasks (planning, code, refinement) for better performance.
        </Typography>

        {/* Recommendations */}
        {recommendations && useMultiModel && (
          <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              Recommended: {recommendations.tier} Strategy
            </Typography>
            <Typography variant="body2" component="div">
              {recommendations.benefits.map((benefit: string, i: number) => (
                <div key={i}>• {benefit}</div>
              ))}
            </Typography>
          </Alert>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Step 4: Model Assignment */}
        <Typography variant="subtitle1" gutterBottom fontWeight="bold">
          Step 4: Model Assignment
        </Typography>

        {useMultiModel ? (
          <>
            {renderModelSelector(
              'Planning Model',
              planningModel,
              setPlanningModel,
              'Used for understanding requirements (blank canvas only, 60s timeout)',
              availableAgents.length === 0
            )}

            {renderModelSelector(
              'Code Generation Model',
              codeModel,
              setCodeModel,
              'Used for JavaScript code generation (blank canvas only, 120s timeout)',
              availableAgents.length === 0
            )}

            {renderModelSelector(
              'Refinement Model',
              refinementModel,
              setRefinementModel,
              'Used for fast chat refinements (30s timeout, aim for <1s response)',
              availableAgents.length === 0
            )}
          </>
        ) : (
          renderModelSelector(
            'AI Model',
            fallbackModel,
            setFallbackModel,
            'Single model for all tasks',
            availableAgents.length === 0
          )
        )}

        {/* Missing Models Warning */}
        {recommendations && useMultiModel && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              Need to install models?
            </Typography>
            <Typography variant="body2">
              Configure AI conversation agents in Home Assistant:
            </Typography>
            <Typography variant="body2" component="div" sx={{ mt: 1, fontFamily: 'monospace', fontSize: '0.85rem' }}>
              Settings → Voice Assistants → Add Assistant
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Recommended models for {recommendations.tier}:
            </Typography>
            <Typography variant="body2" component="div" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
              {recommendations.recommended.planning && `• ${recommendations.recommended.planning}\n`}
              {recommendations.recommended.code && `• ${recommendations.recommended.code}\n`}
              {recommendations.recommended.refinement && `• ${recommendations.recommended.refinement}`}
            </Typography>
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!fallbackModel && availableAgents.length === 0}
        >
          Save Configuration
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// No default export - use named export only
