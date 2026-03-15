/**
 * AITabPanel - AI-powered widget creation chat interface
 * Single Qwen 2.5 Coder 14B Model - 4-Stage Self-Validating Pipeline
 */

import { AttachFile as AttachFileIcon, Cancel as CancelIcon, CheckCircle as CheckCircleIcon, ClearAll as ClearAllIcon, Close as CloseIcon, FormatListBulleted as EntitiesIcon, FormatListBulleted, Send as SendIcon } from '@mui/icons-material';
import {
    Badge,
    Box,
    Button,
    CircularProgress,
    FormControl,
    IconButton,
    InputLabel,
    LinearProgress,
    MenuItem,
    Paper,
    Select,
    TextField,
    Tooltip,
    Typography
} from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import type {
    AIProvider,
    ChatMessage,
    ConversationAgent,
    ProgressCallback,
    UserDecisionCallback
} from '../../services/ai/ConversationService';
import { ConversationService } from '../../services/ai/ConversationService';
import type { SelectedEntity, Stage1Output } from '../../services/ai/PromptBuilder';
import { useWebSocket } from '../../shared/providers/WebSocketProvider';
import { useConfigStore } from '../../shared/stores/useConfigStore';
import type { ViewConfig } from '../../shared/types';
import { EntitySelectorDialog } from './EntitySelectorDialog';

interface AITabPanelProps {
  currentView: ViewConfig | null;
  selectedWidgetIds?: string[];
  onClearSelection?: () => void;
}

// Module-level service instance (persists across component mount/unmount)
let conversationServiceInstance: ConversationService | null = null;

export const AITabPanel: React.FC<AITabPanelProps> = ({ currentView, selectedWidgetIds = [], onClearSelection }) => {
  const { hass } = useWebSocket();
  const { config, currentViewId } = useConfigStore();
  const [agents, setAgents] = useState<ConversationAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Thinking...');
  const [error, setError] = useState<string>('');
  const [hasServiceHistory, setHasServiceHistory] = useState(false);
  const [entityDialogOpen, setEntityDialogOpen] = useState(false);
  const [selectedEntities, setSelectedEntities] = useState<SelectedEntity[]>([]);
  
  // NEW: User confirmation state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingStage1, setPendingStage1] = useState<Stage1Output | null>(null);
  
  // NEW: Validation progress state
  const [validationAttempt, setValidationAttempt] = useState(0);
  const [maxIterations, setMaxIterations] = useState(() => {
    const saved = localStorage.getItem('ai-max-iterations');
    return saved ? parseInt(saved, 10) : 10;
  });
  const [lastScore, setLastScore] = useState<number | null>(null);
  // Store validation issues for future UI display (unused for now)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_validationIssues, setValidationIssues] = useState<Array<{ severity: string; message: string; fix?: string }>>([]);
  const [progressMessage, setProgressMessage] = useState<string>('');
  
  // NEW: User decision dialog state (after each validation attempt)
  const [showDecisionDialog, setShowDecisionDialog] = useState(false);
  const [decisionData, setDecisionData] = useState<{
    attempt: number;
    score: number;
    satisfied: boolean;
    issues: Array<{ severity: string; message: string; fix?: string }>;
    widgetCount: number;
  } | null>(null);
  const [decisionResolver, setDecisionResolver] = useState<((choice: 'accept' | 'retry') => void) | null>(null);
  
  // NEW: AI Provider state (OpenAI / Ollama selection)
  const [provider, setProvider] = useState<AIProvider>(() => {
    const saved = localStorage.getItem('canvasui_ai_provider');
    return (saved as AIProvider) || 'ollama';
  });
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('canvasui_openai_apikey') || '';
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image attachment state
  const [attachedImage, setAttachedImage] = useState<string | null>(null);

  // Listen for AI settings changes from the settings dialog
  useEffect(() => {
    const handleSettingsChange = () => {
      const newProvider = (localStorage.getItem('canvasui_ai_provider') as AIProvider) || 'ollama';
      const newApiKey = localStorage.getItem('canvasui_openai_apikey') || '';
      const newGitHubToken = localStorage.getItem('canvasui_github_token') || '';
      setProvider(newProvider);
      setApiKey(newApiKey);
      
      // Update service
      if (conversationServiceInstance) {
        conversationServiceInstance.setProvider(newProvider);
        if (newProvider === 'openai' && newApiKey) {
          conversationServiceInstance.setOpenAIApiKey(newApiKey);
        } else if (newProvider === 'github' && newGitHubToken) {
          conversationServiceInstance.setGitHubToken(newGitHubToken);
        }
      }
      
      // Reload models for new provider
      setAgents([]);
      setSelectedAgent('');
    };
    
    window.addEventListener('ai-settings-changed', handleSettingsChange);
    return () => window.removeEventListener('ai-settings-changed', handleSettingsChange);
  }, []);

  // Initialize service and load agents (persist service across tab switches using module-level variable)
  useEffect(() => {
    if (!hass) return;

    // Create service only if it doesn't exist (first time ever)
    if (!conversationServiceInstance) {
      console.log('[AITabPanel] Creating new ConversationService instance (module-level singleton)');
      conversationServiceInstance = new ConversationService(hass);
    } else {
      console.log('[AITabPanel] Reusing existing ConversationService instance');
    }

    const service = conversationServiceInstance;
    
    // Set max iterations from state
    service.setMaxIterations(maxIterations);
    
    // Set provider and credentials from state
    service.setProvider(provider);
    if (provider === 'openai' && apiKey) {
      service.setOpenAIApiKey(apiKey);
    } else if (provider === 'github') {
      const githubToken = localStorage.getItem('canvasui_github_token') || '';
      if (githubToken) {
        service.setGitHubToken(githubToken);
      }
    }
    
    // Sync messages state with service history (restore conversation on remount)
    const serviceMessages = service.getMessages();
    if (serviceMessages.length > 0 && messages.length === 0) {
      console.log(`[AITabPanel] Restoring ${serviceMessages.length} messages from service history`);
      setMessages(serviceMessages);
    }
    
    // Restore selected entities from service
    const serviceEntities = service.getSelectedEntities();
    if (serviceEntities.length > 0 && selectedEntities.length === 0) {
      console.log(`[AITabPanel] Restoring ${serviceEntities.length} entities from service`);
      setSelectedEntities(serviceEntities);
    }
    
    // Check if service already has conversation history
    setHasServiceHistory(service.hasHistory());

    // Load available AI models based on provider
    if (agents.length === 0) {
      const loadModels = async () => {
        try {
          let modelList: string[];
          
          if (provider === 'openai') {
            if (!apiKey) {
              setError('OpenAI API key required. Configure in AI Settings.');
              return;
            }
            console.log('[AITabPanel] Loading OpenAI models...');
            modelList = await service.fetchOpenAIModels();
            console.log('[AITabPanel] Loaded OpenAI models:', modelList);
          } else if (provider === 'github') {
            const githubToken = localStorage.getItem('canvasui_github_token') || '';
            if (!githubToken) {
              setError('GitHub token required. Configure in AI Settings.');
              return;
            }
            console.log('[AITabPanel] Loading GitHub models...');
            modelList = await service.fetchGitHubModels();
            console.log('[AITabPanel] Loaded GitHub models:', modelList);
          } else if (provider === 'groq') {
            const groqApiKey = localStorage.getItem('canvasui_groq_apikey') || '';
            if (!groqApiKey) {
              setError('Groq API key required. Configure in AI Settings.');
              return;
            }
            console.log('[AITabPanel] Loading Groq models...');
            modelList = await service.fetchGroqModels();
            console.log('[AITabPanel] Loaded Groq models:', modelList);
          } else if (provider === 'copilotproxy') {
            const copilotProxyToken = localStorage.getItem('canvasui_copilotproxy_token') || '';
            if (!copilotProxyToken) {
              setError('GitHub token required. Configure in AI Settings.');
              return;
            }
            console.log('[AITabPanel] Loading Copilot Proxy models...');
            modelList = await service.fetchCopilotProxyModels();
            console.log('[AITabPanel] Loaded Copilot Proxy models:', modelList);
          } else {
            console.log('[AITabPanel] Loading Ollama models...');
            modelList = await service.getAvailableModels();
            console.log('[AITabPanel] Loaded Ollama models:', modelList);
          }
          
          // Convert model strings to agent-like objects for UI compatibility
          const modelAgents = modelList.map((model) => ({
            id: model,
            name: model,
          }));
          setAgents(modelAgents);
          
          // Auto-select saved model or first available
          if (modelList.length > 0) {
            const savedModel = localStorage.getItem('canvasui_ai_model');
            const modelToSelect = savedModel && modelList.includes(savedModel)
              ? savedModel
              : modelList[0];
            setSelectedAgent(modelToSelect);
            setError(''); // Clear any previous errors
          } else {
            if (provider === 'openai') {
              setError('No OpenAI models available. Check your API key in AI Settings.');
            } else if (provider === 'github') {
              setError('No GitHub models available. Check your token in AI Settings.');
            } else if (provider === 'groq') {
              setError('No Groq models available. Check your API key in AI Settings.');
            } else if (provider === 'copilotproxy') {
              setError('No Coxy proxy models available. Is the server running? Start with: pnpx coxy');
            } else {
              setError('No Ollama models available. Please install models (e.g., ollama pull qwen2.5-coder:14b)');
            }
          }
        } catch (err: Error | unknown) {
          console.error(`[AITabPanel] Failed to load ${provider} models:`, err);
          if (provider === 'openai') {
            setError('Failed to connect to OpenAI. Check your API key.');
          } else if (provider === 'groq') {
            setError('Failed to connect to Groq. Check your API key in AI Settings.');
          } else if (provider === 'copilotproxy') {
            setError('Failed to connect to Coxy proxy. Is it running at http://localhost:3000?');
          } else {
            setError('Failed to connect to Ollama. Check that Ollama is running at http://192.168.1.204:11434');
          }
        }
      };
      
      loadModels();
    }
  }, [hass, agents.length, messages.length, selectedEntities.length, maxIterations, provider, apiKey]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save selected model to localStorage and update service
  useEffect(() => {
    if (selectedAgent) {
      localStorage.setItem('canvasui_ai_model', selectedAgent);
      const service = conversationServiceInstance;
      if (service) {
        service.setModel(selectedAgent);
      }
    }
  }, [selectedAgent]);

  // Reload models when provider changes
  useEffect(() => {
    const service = conversationServiceInstance;
    if (!service) return;
    
    const loadModels = async () => {
      try {
        setAgents([]); // Clear existing models
        setError(''); // Clear errors
        
        let modelList: string[];
        
        if (provider === 'openai') {
          if (!apiKey) {
            setError('OpenAI API key required. Configure in AI Settings.');
            return;
          }
          console.log('[AITabPanel] Loading OpenAI models...');
          modelList = await service.fetchOpenAIModels();
          console.log('[AITabPanel] Loaded OpenAI models:', modelList);
        } else if (provider === 'github') {
          const githubToken = localStorage.getItem('canvasui_github_token') || '';
          if (!githubToken) {
            setError('GitHub token required. Configure in AI Settings.');
            return;
          }
          console.log('[AITabPanel] Loading GitHub models...');
          modelList = await service.fetchGitHubModels();
          console.log('[AITabPanel] Loaded GitHub models:', modelList);
        } else if (provider === 'groq') {
          const groqApiKey = localStorage.getItem('canvasui_groq_apikey') || '';
          if (!groqApiKey) {
            setError('Groq API key required. Configure in AI Settings.');
            return;
          }
          console.log('[AITabPanel] Loading Groq models...');
          modelList = await service.fetchGroqModels();
          console.log('[AITabPanel] Loaded Groq models:', modelList);
        } else if (provider === 'openwebui') {
          const openWebUIUrl = localStorage.getItem('canvasui_openwebui_url') || '';
          if (!openWebUIUrl) {
            setError('Open WebUI URL required. Configure in AI Settings.');
            return;
          }
          console.log('[AITabPanel] Loading Open WebUI models...');
          modelList = await service.fetchOpenWebUIModels();
          console.log('[AITabPanel] Loaded Open WebUI models:', modelList);
        } else if (provider === 'copilotproxy') {
          const copilotProxyToken = localStorage.getItem('canvasui_copilotproxy_token') || '';
          if (!copilotProxyToken) {
            setError('GitHub token required. Configure in AI Settings.');
            return;
          }
          console.log('[AITabPanel] Loading Copilot Proxy models...');
          modelList = await service.fetchCopilotProxyModels();
          console.log('[AITabPanel] Loaded Copilot Proxy models:', modelList);
        } else {
          console.log('[AITabPanel] Loading Ollama models...');
          modelList = await service.getAvailableModels();
          console.log('[AITabPanel] Loaded Ollama models:', modelList);
        }
        
        // Convert model strings to agent-like objects for UI compatibility
        const modelAgents = modelList.map((model) => ({
          id: model,
          name: model,
        }));
        setAgents(modelAgents);
        
        // Auto-select first model or saved model
        if (modelList.length > 0) {
          const savedModel = localStorage.getItem('canvasui_ai_model');
          const modelToSelect = savedModel && modelList.includes(savedModel)
            ? savedModel
            : modelList[0];
          setSelectedAgent(modelToSelect);
        } else {
          if (provider === 'openai') {
            setError('No OpenAI models available. Check your API key in AI Settings.');
          } else if (provider === 'github') {
            setError('No GitHub models available. Check your token in AI Settings.');
          } else if (provider === 'groq') {
            setError('No Groq models available. Check your API key in AI Settings.');
          } else {
            setError('No Ollama models available. Install models (e.g., ollama pull qwen2.5-coder:14b)');
          }
        }
      } catch (err: Error | unknown) {
        console.error(`[AITabPanel] Failed to load ${provider} models:`, err);
        if (provider === 'openai') {
          setError('Failed to connect to OpenAI. Check your API key.');
        } else if (provider === 'groq') {
          setError('Failed to connect to Groq. Check your API key in AI Settings.');
        } else {
          setError('Failed to connect to Ollama. Check that Ollama is running.');
        }
      }
    };
    
    loadModels();
  }, [provider, apiKey]); // Reload when provider or API key changes

  const handleSendMessage = async () => {
    const service = conversationServiceInstance;
    if ((!inputText.trim() && !attachedImage) || !service || !selectedAgent || !config || !currentViewId) return;

    // Check if this is the first message and canvas is blank
    const isFirstMessage = messages.length === 0;
    const currentView = config.views.find(v => v.id === currentViewId);
    const widgetCount = currentView?.widgets?.length || 0;
    const canvasIsBlank = widgetCount === 0;
    
    // Clear conversation history if starting fresh on blank canvas
    // Use clearHistoryOnly() to preserve user's entity selection
    if (isFirstMessage && canvasIsBlank) {
      service.clearHistoryOnly();
      console.log('[AITabPanel] First message on blank canvas - cleared conversation history (entities preserved)');
    }

    // Capture current canvas state for AI context (MUST do this before sendMessage)
    const canvasState = {
      widgets: currentView?.widgets || [],
      widgetCount: widgetCount,
      isEmpty: widgetCount === 0,
      currentViewId: currentViewId, // CRITICAL: Required for import
      viewWidth: currentView?.sizex || 1920,
      viewHeight: currentView?.sizey || 1080
    };
    service.updateCanvasState(canvasState);

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputText + (attachedImage ? '\n\n[Image attached]' : ''),
      timestamp: Date.now(),
    };

    const imageToSend = attachedImage;
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setAttachedImage(null);
    setLoading(true);
    setError('');
    setLoadingMessage('Understanding your request...');

    try {
      await handleAutomaticMode(service, inputText, imageToSend || undefined);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to get response from AI');
      console.error('AI chat error:', err);
    } finally {
      if (!showConfirmation) {
        setLoading(false);
      }
    }
  };

  // Handle Automatic Mode (existing flow)
  const handleAutomaticMode = async (service: any, userPrompt: string, imageDataUrl?: string) => {
    // NEW: Run Stage 1 (understanding) with user confirmation
    const result = await service.sendMessage(
      userPrompt,
      'replace', // Default mode
      true, // awaitUserConfirmation
      imageDataUrl // Vision image (optional)
    );

    // Check if waiting for user confirmation
    if (result.error === 'AWAITING_USER_CONFIRMATION' && result.stage1Understanding) {
      // Show understanding to user with Yes/No buttons
      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: `I understand you want:\n\n${result.stage1Understanding.userIntent}\n\nIs this correct?`,
        timestamp: Date.now(),
        metadata: {
          stage: '1_understanding',
        },
      };
      setMessages((prev) => [...prev, aiMessage]);
      
      // Show confirmation UI
      setShowConfirmation(true);
      setPendingStage1(result.stage1Understanding);
      setLoading(false);
      updateServiceHistoryState();
      return;
    }

    // If error (not confirmation), show error
    if (!result.success) {
      throw new Error(result.error || 'Failed to process request');
    }

    // Success - widgets imported, now save to Home Assistant
    if (result.success && hass) {
      console.log('[handleAutomaticMode] Saving config after AI import...');
      await useConfigStore.getState().saveConfig(hass);
      console.log('[handleAutomaticMode] ✅ Config saved successfully');
      
      // Clear selection after successful AI update
      if (onClearSelection) {
        onClearSelection();
      }
    }
  };

  // NEW: Handle user clicking "Yes, continue"
  const handleConfirmYes = async () => {
    const service = conversationServiceInstance;
    if (!service || !pendingStage1 || !config || !currentViewId) return;

    setShowConfirmation(false);
    setLoading(true);
    setLoadingMessage('Planning layout...');
    setValidationAttempt(0);
    setLastScore(null);
    setValidationIssues([]);
    setProgressMessage('');

    try {
      const currentView = config.views.find(v => v.id === currentViewId);
      const widgetCount = currentView?.widgets?.length || 0;
      const requestType = widgetCount === 0 ? 'new' : 'edit';

      // Progress callback for real-time updates
      const onProgress: ProgressCallback = (update) => {
        console.log('[AITabPanel] Progress:', update);
        
        setProgressMessage(update.message || '');
        
        if (update.stage === 'planning') {
          setLoadingMessage('Planning layout...');
        } else if (update.stage === 'generating') {
          setLoadingMessage(`Generating widgets (${update.attempt}/${update.maxAttempts})...`);
          setValidationAttempt(update.attempt || 0);
        } else if (update.stage === 'validating') {
          setLoadingMessage(`Validating (${update.attempt}/${update.maxAttempts})...`);
          setValidationAttempt(update.attempt || 0);
          setLastScore(update.score || null);
          
          // Store validation issues for display
          if (update.issues && update.issues.length > 0) {
            setValidationIssues(update.issues);
            
            // Add validation feedback message to chat
            const feedbackMessage: ChatMessage = {
              role: 'assistant',
              content: `Validation attempt ${update.attempt}/${update.maxAttempts}: Score ${update.score}/100\n\nIssues found:\n${update.issues.map(issue => `• ${issue.severity.toUpperCase()}: ${issue.message}`).join('\n')}`,
              timestamp: Date.now(),
              metadata: {
                stage: '4_validation',
                attemptNumber: update.attempt,
                validationScore: update.score,
              },
            };
            setMessages((prev) => [...prev, feedbackMessage]);
          } else if (update.satisfied) {
            // Validation passed
            const passMessage: ChatMessage = {
              role: 'assistant',
              content: `✅ Validation passed! Score: ${update.score}/100`,
              timestamp: Date.now(),
              metadata: {
                stage: '4_validation',
                attemptNumber: update.attempt,
                validationScore: update.score,
              },
            };
            setMessages((prev) => [...prev, passMessage]);
          }
        } else if (update.stage === 'importing') {
          setLoadingMessage('Importing to canvas...');
        } else if (update.stage === 'complete') {
          setLoadingMessage('Complete!');
        }
      };

      // NEW: User decision callback (called after each validation attempt)
      const onUserDecision: UserDecisionCallback = async (update) => {
        console.log('[AITabPanel] User decision requested:', update);
        
        // Show decision dialog with validation results
        return new Promise<'accept' | 'retry'>((resolve) => {
          setDecisionData(update);
          setShowDecisionDialog(true);
          setDecisionResolver(() => resolve); // Store resolver for button handlers
        });
      };

      // Run Stages 2-4 (planning, generation, validation loop) with progress callback
      const result = await service.continueAfterConfirmation(
        pendingStage1,
        requestType,
        'replace',
        onProgress,
        onUserDecision
      );

      if (result.cancelled) {
        const cancelMessage: ChatMessage = {
          role: 'assistant',
          content: '🚫 Cancelled by user',
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, cancelMessage]);
      } else if (result.success && result.finalJSON) {
        // Show success message
        const successMessage: ChatMessage = {
          role: 'assistant',
          content: `✅ Created ${result.widgetCount} widgets in ${result.totalAttempts} attempt${result.totalAttempts !== 1 ? 's' : ''}!`,
          timestamp: Date.now(),
          metadata: {
            stage: '4_validation',
            attemptNumber: result.totalAttempts,
            validationScore: result.stage4Validation?.score,
          },
        };
        setMessages((prev) => [...prev, successMessage]);

        // Trigger save
        if (hass && config) {
          await useConfigStore.getState().saveConfig(hass, config);
        }
      } else {
        throw new Error(result.error || 'Failed to generate widgets');
      }

    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to generate widgets');
      console.error('AI generation error:', err);
    } finally {
      setPendingStage1(null);
      setLoading(false);
      setValidationAttempt(0);
      setLastScore(null);
      setValidationIssues([]);
      setProgressMessage('');
      updateServiceHistoryState();
    }
  };

  // NEW: Handle cancel during validation
  const handleCancelValidation = () => {
    const service = conversationServiceInstance;
    if (service) {
      service.cancelValidation();
      setLoading(false);
      setValidationAttempt(0);
      setLastScore(null);
      setValidationIssues([]);
      setProgressMessage('');
    }
  };

  // NEW: Handle user clicking "No, let me clarify"
  const handleMaxIterationsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    if (value >= 1 && value <= 100) {
      setMaxIterations(value);
      localStorage.setItem('ai-max-iterations', value.toString());
      const service = conversationServiceInstance;
      if (service) {
        service.setMaxIterations(value);
      }
    }
  };

  const handleConfirmNo = () => {
    setShowConfirmation(false);
    
    // Add clarification prompt
    const clarificationMessage: ChatMessage = {
      role: 'assistant',
      content: 'What should I change about my understanding?',
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, clarificationMessage]);
    
    // User can now type clarification, which will trigger handleSendMessage again
    // ConversationService will use the previous understanding + clarification
    setPendingStage1(null);
  };

  // NEW: Handle user accepting current validation result
  const handleDecisionAccept = () => {
    console.log('[AITabPanel] User accepted result');
    if (decisionResolver) {
      decisionResolver('accept');
      setDecisionResolver(null);
    }
    setShowDecisionDialog(false);
    setDecisionData(null);
  };

  // NEW: Handle user requesting another attempt
  const handleDecisionRetry = () => {
    console.log('[AITabPanel] User requested retry');
    if (decisionResolver) {
      decisionResolver('retry');
      setDecisionResolver(null);
    }
    setShowDecisionDialog(false);
    setDecisionData(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // NEW: Extract selected widget names and append to input
  const handleAddSelectedWidgets = () => {
    if (!currentView || selectedWidgetIds.length === 0) return;
    
    const selectedWidgets = currentView.widgets.filter(w => selectedWidgetIds.includes(w.id));
    const widgetNames = selectedWidgets.map(w => {
      // Use widget name if available, otherwise use type + short ID
      if (w.name) return `"${w.name}"`;
      const shortId = w.id.split('-').pop() || w.id;
      return `"${w.type} ${shortId}"`;
    });
    
    if (widgetNames.length === 0) return;
    
    // Append to existing input with proper spacing
    const separator = inputText.trim() ? ' ' : '';
    const newText = inputText + separator + widgetNames.join(' ');
    setInputText(newText);
    
    // Focus the input field after appending widget names
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleClearChat = () => {
    const service = conversationServiceInstance;
    if (!service) return;
    
    // Clear conversation history in service
    service.clearHistory();
    
    // Clear UI messages and states
    setMessages([]);
    setError('');
    setHasServiceHistory(false);
    setShowConfirmation(false);
    setPendingStage1(null);
    setValidationAttempt(0);
    setLastScore(null);
    
    console.log('[AITabPanel] Chat history cleared (service + UI)');
  };

  // Handle entity selection dialog
  const handleOpenEntityDialog = () => {
    setEntityDialogOpen(true);
  };

  const handleCloseEntityDialog = () => {
    setEntityDialogOpen(false);
  };

  const handleEntitySelectionChange = async (entityIds: string[]) => {
    const service = conversationServiceInstance;
    if (!service || !hass) return;

    // Convert entity IDs to SelectedEntity[] with full entity data
    const entities = await hass.getStates();
    const selectedEntityObjects = entityIds.map(id => {
      const entity = entities.find((e: { entity_id: string }) => e.entity_id === id);
      return {
        entity_id: id,
        friendly_name: entity?.attributes?.friendly_name || id,
        domain: id.split('.')[0],
        state: entity?.state,
        attributes: entity?.attributes,
      };
    });

    setSelectedEntities(selectedEntityObjects);
    service.setSelectedEntities(selectedEntityObjects);
    console.log(`[AITabPanel] Entity selection updated: ${selectedEntityObjects.length} entities`);
  };

  // Update service history state after sending messages
  const updateServiceHistoryState = () => {
    const service = conversationServiceInstance;
    if (service) {
      setHasServiceHistory(service.hasHistory());
    }
  };

  const getAgentIcon = (agentId: string) => {
    if (!agentId) return '🤖';
    if (agentId.includes('ollama')) return '🦙';
    if (agentId.includes('openai')) return '🤖';
    if (agentId.includes('google')) return '✨';
    if (agentId.includes('claude')) return '🧠';
    if (agentId.includes('groq')) return '⚡';
    return '🤖';
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        p: 2,
      }}
    >
      {/* Agent Selector with Entity and Clear Buttons */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <FormControl fullWidth size="small">
          <InputLabel>AI Agent</InputLabel>
          <Select
            value={selectedAgent}
            label="AI Agent"
            onChange={(e) => setSelectedAgent(e.target.value)}
            disabled={agents.length === 0}
          >
            {agents.map((agent) => (
              <MenuItem key={agent.id} value={agent.id}>
                {getAgentIcon(agent.id)} {agent.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Tooltip title={`Select entities for AI context (${selectedEntities.length} selected)`}>
          <IconButton
            onClick={handleOpenEntityDialog}
            disabled={loading}
            size="small"
            sx={{
              bgcolor: selectedEntities.length > 0 ? 'primary.main' : 'action.selected',
              color: selectedEntities.length > 0 ? 'primary.contrastText' : 'text.secondary',
              border: 1,
              borderColor: selectedEntities.length > 0 ? 'primary.dark' : 'divider',
              '&:hover': {
                bgcolor: selectedEntities.length > 0 ? 'primary.dark' : 'action.hover',
              },
              '&.Mui-disabled': {
                bgcolor: 'action.disabledBackground',
                color: 'text.disabled',
                borderColor: 'divider',
              },
            }}
          >
            <Badge 
              badgeContent={selectedEntities.length || null} 
              color="secondary"
              max={99}
            >
              <EntitiesIcon fontSize="small" />
            </Badge>
          </IconButton>
        </Tooltip>
        <Tooltip title="Max validation iterations (1-100)">
          <TextField
            type="number"
            value={maxIterations}
            onChange={handleMaxIterationsChange}
            disabled={loading}
            size="small"
            inputProps={{ min: 1, max: 100, step: 1 }}
            sx={{ 
              width: 110,
              '& input': {
                textAlign: 'center',
                fontWeight: 'bold',
              },
            }}
          />
        </Tooltip>
        <Tooltip title="Clear chat history">
          <span>
            <IconButton
              onClick={handleClearChat}
              disabled={!hasServiceHistory || loading}
              size="small"
              sx={{
                bgcolor: hasServiceHistory ? 'error.main' : 'action.disabledBackground',
                color: hasServiceHistory ? 'error.contrastText' : 'text.disabled',
                border: 1,
                borderColor: hasServiceHistory ? 'error.dark' : 'divider',
                '&:hover': {
                  bgcolor: hasServiceHistory ? 'error.dark' : 'action.disabledBackground',
                },
                '&.Mui-disabled': {
                  bgcolor: 'action.disabledBackground',
                  color: 'text.disabled',
                  borderColor: 'divider',
                },
              }}
            >
              <ClearAllIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* Error Message */}
      {error && (
        <Paper
          sx={{
            p: 1.5,
            mb: 2,
            bgcolor: 'error.light',
            color: 'error.contrastText',
          }}
        >
          <Typography variant="body2">{error}</Typography>
        </Paper>
      )}

      {/* Chat Messages */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          mb: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {messages.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Start creating widgets with AI
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Try: "Create 3 bedroom light switches" or "Add a temperature gauge"
            </Typography>
          </Box>
        )}

        {messages.map((msg, idx) => (
          <Paper
            key={idx}
            sx={{
              p: 1.5,
              bgcolor: msg.role === 'user' ? 'primary.light' : 'grey.100',
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              border: msg.role === 'assistant' ? 1 : 0,
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                {msg.role === 'user' ? '💬 You' : `${getAgentIcon(selectedAgent)} AI`}
              </Typography>
              {msg.metadata?.stage && (
                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  {msg.metadata.stage === '1_understanding' && 'Understanding'}
                  {msg.metadata.stage === '2_planning' && 'Planning'}
                  {msg.metadata.stage === '3_generation' && 'Generating'}
                  {msg.metadata.stage === '4_validation' && `Validated (${msg.metadata.validationScore}/100)`}
                </Typography>
              )}
            </Box>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: msg.role === 'user' ? 'primary.contrastText' : 'grey.900' }}>
              {msg.content}
            </Typography>
          </Paper>
        ))}

        {/* NEW: User Confirmation UI (Yes/No buttons) */}
        {showConfirmation && pendingStage1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, my: 2 }}>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircleIcon />}
              onClick={handleConfirmYes}
              disabled={loading}
              sx={{ minWidth: 140 }}
            >
              Yes, continue
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<CancelIcon />}
              onClick={handleConfirmNo}
              disabled={loading}
              sx={{ minWidth: 140 }}
            >
              No, let me clarify
            </Button>
          </Box>
        )}

        {/* NEW: Validation Decision Dialog (Accept/Retry buttons) */}
        {showDecisionDialog && decisionData && (
          <Paper
            elevation={3}
            sx={{
              p: 2,
              my: 2,
              bgcolor: 'background.paper',
              border: '2px solid',
              borderColor: decisionData.satisfied ? 'success.main' : 'warning.main',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Attempt {decisionData.attempt} Complete
            </Typography>
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {decisionData.widgetCount} widgets created
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>
                Validation Score: {decisionData.score}/100 {decisionData.satisfied ? '✓' : ''}
              </Typography>
              
              {decisionData.issues.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Issues found:
                  </Typography>
                  {decisionData.issues.slice(0, 3).map((issue, idx) => (
                    <Typography
                      key={idx}
                      variant="caption"
                      display="block"
                      color={
                        issue.severity === 'critical' ? 'error.main' :
                        issue.severity === 'warning' ? 'warning.main' : 'info.main'
                      }
                      sx={{ ml: 1 }}
                    >
                      • {issue.message}
                    </Typography>
                  ))}
                  {decisionData.issues.length > 3 && (
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      ... and {decisionData.issues.length - 3} more
                    </Typography>
                  )}
                </Box>
              )}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={handleDecisionAccept}
                sx={{ minWidth: 160 }}
              >
                Accept This
              </Button>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleDecisionRetry}
                sx={{ minWidth: 160 }}
              >
                Try Another Attempt
              </Button>
            </Box>
          </Paper>
        )}

        {/* NEW: Validation Progress Display - Enhanced Visibility */}
        {loading && validationAttempt > 0 && (
          <Paper 
            elevation={3}
            sx={{ 
              width: '100%', 
              p: 2, 
              my: 1,
              bgcolor: lastScore !== null && lastScore >= 90 ? 'success.dark' : lastScore !== null && lastScore >= 70 ? 'warning.dark' : 'info.dark',
              color: 'white',
              border: 2,
              borderColor: lastScore !== null && lastScore >= 90 ? 'success.light' : lastScore !== null && lastScore >= 70 ? 'warning.light' : 'info.light',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Box flex={1}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5 }}>
                  🔄 Attempt {validationAttempt}/{maxIterations}
                </Typography>
                <Typography variant="body2">
                  {progressMessage || 'AI is validating the generated widgets...'}
                </Typography>
                {lastScore !== null && (
                  <Typography variant="body1" fontWeight="bold" sx={{ mt: 1 }}>
                    Score: {lastScore}/100 {lastScore >= 90 ? '✅' : lastScore >= 70 ? '⚠️' : '❌'}
                  </Typography>
                )}
              </Box>
              <Button
                variant="contained"
                size="medium"
                color="error"
                onClick={handleCancelValidation}
                startIcon={<CancelIcon />}
                sx={{ 
                  ml: 2,
                  fontWeight: 'bold',
                  bgcolor: 'error.main',
                  '&:hover': {
                    bgcolor: 'error.dark',
                  },
                }}
              >
                Stop Generation
              </Button>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={(validationAttempt / maxIterations) * 100}
              sx={{
                height: 8,
                borderRadius: 1,
                bgcolor: 'rgba(255, 255, 255, 0.3)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: 'white',
                },
              }}
            />
          </Paper>
        )}

        {loading && validationAttempt === 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
            <CircularProgress size={16} />
            <Typography variant="body2" color="text.secondary">
              {loadingMessage}
            </Typography>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Input Field */}
      {/* Hidden file input for image attachment */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (evt) => {
            setAttachedImage(evt.target?.result as string);
          };
          reader.readAsDataURL(file);
          // Reset input so the same file can be re-selected
          e.target.value = '';
        }}
      />
      {/* Attached image thumbnail strip */}
      {attachedImage && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, p: 0.5, bgcolor: 'action.hover', borderRadius: 1 }}>
          <img
            src={attachedImage}
            alt="attached"
            style={{ height: 48, maxWidth: 80, objectFit: 'cover', borderRadius: 4, border: '1px solid rgba(255,255,255,0.15)' }}
          />
          <Typography variant="caption" sx={{ flex: 1, color: 'text.secondary' }}>Image attached</Typography>
          <IconButton size="small" onClick={() => setAttachedImage(null)} sx={{ color: 'error.main' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Tooltip title={selectedWidgetIds.length === 0 ? 'Select widgets on canvas first' : `Add ${selectedWidgetIds.length} selected widget${selectedWidgetIds.length === 1 ? '' : 's'} to message`}>
          <span>
            <IconButton
              size="small"
              color="secondary"
              onClick={handleAddSelectedWidgets}
              disabled={loading || selectedWidgetIds.length === 0}
              sx={{
                bgcolor: selectedWidgetIds.length > 0 ? 'secondary.main' : 'action.disabledBackground',
                color: selectedWidgetIds.length > 0 ? 'secondary.contrastText' : 'action.disabled',
                '&:hover': {
                  bgcolor: selectedWidgetIds.length > 0 ? 'secondary.dark' : 'action.disabledBackground',
                },
                minWidth: 40,
                height: 40,
              }}
            >
              <Badge badgeContent={selectedWidgetIds.length} color="error">
                <FormatListBulleted fontSize="small" />
              </Badge>
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Attach image — AI will describe/replicate what it sees">
          <span>
            <IconButton
              size="small"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || !selectedAgent || agents.length === 0}
              sx={{
                bgcolor: attachedImage ? 'success.dark' : 'action.disabledBackground',
                color: attachedImage ? 'success.contrastText' : 'action.active',
                '&:hover': { bgcolor: attachedImage ? 'success.main' : 'action.hover' },
                minWidth: 40,
                height: 40,
              }}
            >
              <AttachFileIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <TextField
          fullWidth
          size="small"
          placeholder="Type your message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading || !selectedAgent || agents.length === 0}
          multiline
          maxRows={3}
          inputRef={inputRef}
        />
        <IconButton
          color="primary"
          onClick={handleSendMessage}
          disabled={loading || (!inputText.trim() && !attachedImage) || !selectedAgent}
          sx={{
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
            '&.Mui-disabled': {
              bgcolor: 'action.disabledBackground',
            },
          }}
        >
          <SendIcon />
        </IconButton>
      </Box>

      {/* Entity Selector Dialog */}
      <EntitySelectorDialog
        open={entityDialogOpen}
        onClose={handleCloseEntityDialog}
        selectedEntities={selectedEntities.map(e => e.entity_id)}
        onSelectionChange={handleEntitySelectionChange}
        hass={hass}
      />

    </Box>
  );
};
