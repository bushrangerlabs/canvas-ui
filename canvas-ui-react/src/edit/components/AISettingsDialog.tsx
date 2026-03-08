/**
 * Dialog - Comprehensive AI configuration
 * 
 * Contains two main sections:
 * 1. Settings - Provider selection, API keys, model configuration
 * 2. Prompts - Customizable AI prompt templates
 */

import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    FormLabel,
    IconButton,
    Radio,
    RadioGroup,
    Tab,
    Tabs,
    TextField,
    Tooltip,
    Typography
} from '@mui/material';
import React, { useState } from 'react';
import type { AIProvider } from '../../services/ai/ConversationService';
import { promptTemplateStore, type PromptTemplates } from '../../services/ai/PromptTemplateStore';

interface Props {
  open: boolean;
  onClose: () => void;
  // Current provider settings
  provider: AIProvider;
  apiKey: string;
  githubToken?: string;
  groqApiKey?: string;
  openWebUIUrl?: string;
  openWebUIApiKey?: string;
  copilotProxyToken?: string;
  copilotProxyUrl?: string;
  onProviderChange: (provider: AIProvider) => void;
  onApiKeyChange: (apiKey: string) => void;
  onGitHubTokenChange?: (token: string) => void;
  onGroqApiKeyChange?: (key: string) => void;
  onOpenWebUIUrlChange?: (url: string) => void;
  onOpenWebUIApiKeyChange?: (key: string) => void;
  onCopilotProxyTokenChange?: (token: string) => void;
  onCopilotProxyUrlChange?: (url: string) => void;
}

interface TemplateSection {
  key: keyof PromptTemplates;
  label: string;
  description: string;
}

interface StageCategory {
  categoryLabel: string;
  templates: TemplateSection[];
}

// v19 Simplified Templates - Create/Edit modes + catalog + output
const stageCategories: StageCategory[] = [
  {
    categoryLabel: 'AI Builder v19',
    templates: [
      {
        key: 'systemPromptCreate',
        label: 'System Prompt - Create Mode',
        description: 'Used when creating a NEW dashboard (empty canvas)'
      },
      {
        key: 'systemPromptEdit',
        label: 'System Prompt - Edit Mode',
        description: 'Used when EDITING an existing dashboard (has widgets). Instructs AI to preserve existing widgets.'
      },
      {
        key: 'widgetCatalog',
        label: 'Widget Catalog',
        description: 'Compact list of available widget types'
      },
      {
        key: 'outputFormat',
        label: 'Output Format',
        description: 'ExportedView JSON structure example'
      }
    ]
  }
];

export const AISettingsDialog: React.FC<Props> = ({ 
  open, 
  onClose,
  provider: externalProvider,
  apiKey: externalApiKey,
  githubToken: externalGitHubToken = '',
  groqApiKey: externalGroqApiKey = '',
  openWebUIUrl: externalOpenWebUIUrl = 'http://localhost:3000',
  openWebUIApiKey: externalOpenWebUIApiKey = '',
  copilotProxyToken: externalCopilotProxyToken = '',
  copilotProxyUrl: externalCopilotProxyUrl = 'http://localhost:3100/v1',
  onProviderChange,
  onApiKeyChange,
  onGitHubTokenChange,
  onGroqApiKeyChange,
  onOpenWebUIUrlChange,
  onOpenWebUIApiKeyChange,
  onCopilotProxyTokenChange,
  onCopilotProxyUrlChange
}) => {
  const [mainTab, setMainTab] = useState(0); // 0 = Settings, 1 = Prompts
  const [categoryTab, setCategoryTab] = useState(0); // Stage category (System, Stage 1, etc.)
  const [promptTab, setPromptTab] = useState(0); // Individual template within category
  const [templates, setTemplates] = useState<PromptTemplates>(promptTemplateStore.getTemplates());
  const [hasPromptChanges, setHasPromptChanges] = useState(false);
  
  // Track locked state for each template (all start locked)
  const [lockedTemplates, setLockedTemplates] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    stageCategories.forEach(category => {
      category.templates.forEach(template => {
        initial[template.key] = true; // All templates start locked
      });
    });
    return initial;
  });

  // Local state for settings (synced with external)
  const [localProvider, setLocalProvider] = useState(externalProvider);
  const [localApiKey, setLocalApiKey] = useState(externalApiKey);
  const [localGitHubToken, setLocalGitHubToken] = useState(externalGitHubToken);
  const [localGroqApiKey, setLocalGroqApiKey] = useState(externalGroqApiKey);
  const [localOpenWebUIUrl, setLocalOpenWebUIUrl] = useState(externalOpenWebUIUrl);
  const [localOpenWebUIApiKey, setLocalOpenWebUIApiKey] = useState(externalOpenWebUIApiKey);
  const [localCopilotProxyToken, setLocalCopilotProxyToken] = useState(externalCopilotProxyToken);
  const [localCopilotProxyUrl, setLocalCopilotProxyUrl] = useState(externalCopilotProxyUrl);

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setTemplates(promptTemplateStore.getTemplates());
      setHasPromptChanges(false);
      setMainTab(0);
      setCategoryTab(0);
      setPromptTab(0);
      setLocalProvider(externalProvider);
      setLocalApiKey(externalApiKey);
      setLocalGitHubToken(externalGitHubToken);
      setLocalGroqApiKey(externalGroqApiKey);
      setLocalOpenWebUIUrl(externalOpenWebUIUrl);
      setLocalOpenWebUIApiKey(externalOpenWebUIApiKey);
      setLocalCopilotProxyToken(externalCopilotProxyToken);
      setLocalCopilotProxyUrl(externalCopilotProxyUrl);
      
      // Reset all templates to locked state
      const resetLocked: Record<string, boolean> = {};
      stageCategories.forEach(category => {
        category.templates.forEach(template => {
          resetLocked[template.key] = true;
        });
      });
      setLockedTemplates(resetLocked);
    }
  }, [open, externalProvider, externalApiKey, externalGitHubToken, externalGroqApiKey, externalOpenWebUIUrl, externalOpenWebUIApiKey, externalCopilotProxyToken, externalCopilotProxyUrl]);

  const handleSavePrompts = () => {
    promptTemplateStore.saveTemplates(templates);
    setHasPromptChanges(false);
  };

  const handleResetPrompts = () => {
    if (confirm('Reset all templates to defaults? This cannot be undone.')) {
      promptTemplateStore.resetToDefaults();
      setTemplates(promptTemplateStore.getTemplates());
      setHasPromptChanges(false);
    }
  };

  const handleTemplateChange = (key: keyof PromptTemplates, value: string) => {
    setTemplates({ ...templates, [key]: value });
    setHasPromptChanges(true);
  };

  const handleToggleLock = (key: keyof PromptTemplates) => {
    setLockedTemplates({ ...lockedTemplates, [key]: !lockedTemplates[key] });
  };

  const handleCategoryChange = (_: React.SyntheticEvent, newValue: number) => {
    setCategoryTab(newValue);
    setPromptTab(0); // Reset to first template in new category
  };

  const handleProviderChangeLocal = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newProvider = event.target.value as AIProvider;
    setLocalProvider(newProvider);
  };

  const handleApiKeyChangeLocal = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLocalApiKey(event.target.value);
  };

  const handleGitHubTokenChangeLocal = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLocalGitHubToken(event.target.value);
  };

  const handleGroqApiKeyChangeLocal = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLocalGroqApiKey(event.target.value);
  };

  const handleOpenWebUIUrlChangeLocal = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLocalOpenWebUIUrl(event.target.value);
  };

  const handleOpenWebUIApiKeyChangeLocal = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLocalOpenWebUIApiKey(event.target.value);
  };

  const handleCopilotProxyTokenChangeLocal = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLocalCopilotProxyToken(event.target.value);
  };

  const handleCopilotProxyUrlChangeLocal = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLocalCopilotProxyUrl(event.target.value);
  };

  const handleSaveSettings = () => {
    onProviderChange(localProvider);
    onApiKeyChange(localApiKey);
    if (onGitHubTokenChange) {
      onGitHubTokenChange(localGitHubToken);
    }
    if (onGroqApiKeyChange) {
      onGroqApiKeyChange(localGroqApiKey);
    }
    if (onOpenWebUIUrlChange) {
      onOpenWebUIUrlChange(localOpenWebUIUrl);
    }
    if (onOpenWebUIApiKeyChange) {
      onOpenWebUIApiKeyChange(localOpenWebUIApiKey);
    }
    if (onCopilotProxyTokenChange) {
      onCopilotProxyTokenChange(localCopilotProxyToken);
    }
    if (onCopilotProxyUrlChange) {
      onCopilotProxyUrlChange(localCopilotProxyUrl);
    }
    onClose();
  };

  const handleCancel = () => {
    if (hasPromptChanges) {
      if (confirm('Discard unsaved prompt changes?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  // Get current stage category and template
  const currentCategory = stageCategories[categoryTab];
  const currentPromptSection = currentCategory?.templates[promptTab];
  const isTemplateLocked = currentPromptSection ? lockedTemplates[currentPromptSection.key] : true;
  const hasSettingsChanges = 
    localProvider !== externalProvider || 
    localApiKey !== externalApiKey ||
    localGitHubToken !== externalGitHubToken ||
    localGroqApiKey !== externalGroqApiKey ||
    localOpenWebUIUrl !== externalOpenWebUIUrl ||
    localOpenWebUIApiKey !== externalOpenWebUIApiKey ||
    localCopilotProxyToken !== externalCopilotProxyToken ||
    localCopilotProxyUrl !== externalCopilotProxyUrl;

  return (
    <Dialog 
      open={open} 
      onClose={handleCancel} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: {
          height: '90vh',
          maxHeight: '800px'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="h6" component="span">
          AI Settings
        </Typography>
        {promptTemplateStore.isCustomized() && mainTab === 1 && (
          <Chip 
            label="Custom Prompts" 
            color="warning" 
            size="small" 
          />
        )}
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Main Tabs (Settings / Prompts) */}
          <Tabs
            value={mainTab}
            onChange={(_, v) => setMainTab(v)}
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
              px: 2
            }}
          >
            <Tab label="Settings" />
            <Tab label="Prompts" />
          </Tabs>

          {/* Settings Tab */}
          {mainTab === 0 && (
            <Box sx={{ p: 3, overflow: 'auto' }}>
              <Typography variant="h6" gutterBottom>
                AI Provider Configuration
              </Typography>
              
              <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
                <FormLabel component="legend" sx={{ mb: 1 }}>
                  Provider
                </FormLabel>
                <RadioGroup
                  value={localProvider}
                  onChange={handleProviderChangeLocal}
                >
                  <FormControlLabel 
                    value="ollama" 
                    control={<Radio />} 
                    label={
                      <Box>
                        <Typography variant="body1">🏠 Ollama (Local)</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Run AI models locally on your machine
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel 
                    value="openai" 
                    control={<Radio />} 
                    label={
                      <Box>
                        <Typography variant="body1">☁️ OpenAI (Cloud)</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Use OpenAI's GPT models (requires API key)
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel 
                    value="github" 
                    control={<Radio />} 
                    label={
                      <Box>
                        <Typography variant="body1">🐙 GitHub Models (Free)</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Access GPT-4o and Meta Llama models via GitHub's free AI Models
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel 
                    value="groq" 
                    control={<Radio />} 
                    label={
                      <Box>
                        <Typography variant="body1">⚡ Groq (Ultra-Fast)</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Ultra-fast LPU inference with Llama 3.3, Mixtral, Gemma 2 (Free: 14.4K/day)
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel 
                    value="openwebui" 
                    control={<Radio />} 
                    label={
                      <Box>
                        <Typography variant="body1">🌐 Open WebUI (Local + Files)</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Local models with file attachment support (uploads CANVAS_UI_WIDGETS.md)
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel 
                    value="copilotproxy" 
                    control={<Radio />} 
                    label={
                      <Box>
                        <Typography variant="body1">🚀 GitHub Copilot Proxy (All Models)</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Access Claude, GPT-4, Gemini via local Copilot Proxy server (requires Copilot Pro)
                        </Typography>
                      </Box>
                    }
                  />
                </RadioGroup>
              </FormControl>

              {/* OpenAI API Key */}
              {localProvider === 'openai' && (
                <Box sx={{ mb: 3 }}>
                  <TextField
                    fullWidth
                    type="password"
                    label="OpenAI API Key"
                    value={localApiKey}
                    onChange={handleApiKeyChangeLocal}
                    placeholder="sk-..."
                    helperText="Your API key is stored locally and never sent to the server"
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 1, display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                          🔒
                        </Box>
                      ),
                    }}
                  />
                </Box>
              )}

              {/* GitHub Token */}
              {localProvider === 'github' && (
                <Box sx={{ mb: 3 }}>
                  <TextField
                    fullWidth
                    type="password"
                    label="GitHub Personal Access Token"
                    value={localGitHubToken}
                    onChange={handleGitHubTokenChangeLocal}
                    placeholder="github_pat_..."
                    helperText={
                      <Box component="span">
                        Your token is stored locally. No scopes required. {' '}
                        <a 
                          href="https://github.com/settings/tokens/new?description=Canvas%20UI%20AI&scopes=" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: 'inherit', textDecoration: 'underline' }}
                        >
                          Create token
                        </a>
                      </Box>
                    }
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 1, display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                          🔒
                        </Box>
                      ),
                    }}
                  />
                </Box>
              )}

              {/* Groq API Key */}
              {localProvider === 'groq' && (
                <Box sx={{ mb: 3 }}>
                  <TextField
                    fullWidth
                    type="password"
                    label="Groq API Key"
                    value={localGroqApiKey}
                    onChange={handleGroqApiKeyChangeLocal}
                    placeholder="gsk_..."
                    helperText={
                      <Box component="span">
                        Your API key is stored locally. Free tier: 14,400 requests/day. {' '}
                        <a 
                          href="https://console.groq.com/keys" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: 'inherit', textDecoration: 'underline' }}
                        >
                          Get API key
                        </a>
                      </Box>
                    }
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 1, display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                          ⚡
                        </Box>
                      ),
                    }}
                  />
                </Box>
              )}

              {/* Open WebUI Settings */}
              {localProvider === 'openwebui' && (
                <>
                  <Box sx={{ mb: 2 }}>
                    <TextField
                      fullWidth
                      type="text"
                      label="Open WebUI URL"
                      value={localOpenWebUIUrl}
                      onChange={handleOpenWebUIUrlChangeLocal}
                      placeholder="http://localhost:3000"
                      helperText="URL of your Open WebUI instance (e.g., http://192.168.1.100:3000)"
                      InputProps={{
                        startAdornment: (
                          <Box sx={{ mr: 1, display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                            🌐
                          </Box>
                        ),
                      }}
                    />
                  </Box>
                  <Box sx={{ mb: 3 }}>
                    <TextField
                      fullWidth
                      type="password"
                      label="Open WebUI API Key"
                      value={localOpenWebUIApiKey}
                      onChange={handleOpenWebUIApiKeyChangeLocal}
                      placeholder="sk-..."
                      helperText="Your API key from Open WebUI Settings → Account → API Keys"
                      InputProps={{
                        startAdornment: (
                          <Box sx={{ mr: 1, display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                            🔑
                          </Box>
                        ),
                      }}
                    />
                  </Box>
                </>
              )}

              {/* Copilot Proxy Settings */}
              {localProvider === 'copilotproxy' && (
                <>
                  <Box sx={{ mb: 2 }}>
                    <TextField
                      fullWidth
                      type="password"
                      label="GitHub Token"
                      value={localCopilotProxyToken}
                      onChange={handleCopilotProxyTokenChangeLocal}
                      placeholder="ghp_... or run: gh auth token"
                      helperText={
                        <Box component="span">
                          Your GitHub token for Copilot Pro access. Run{' '}
                          <code style={{ backgroundColor: 'rgba(0,0,0,0.1)', padding: '2px 4px', borderRadius: '3px' }}>gh auth token</code>
                          {' '}to get your token
                        </Box>
                      }
                      InputProps={{
                        startAdornment: (
                          <Box sx={{ mr: 1, display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                            🔑
                          </Box>
                        ),
                      }}
                    />
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <TextField
                      fullWidth
                      type="text"
                      label="Proxy Server URL"
                      value={localCopilotProxyUrl}
                      onChange={handleCopilotProxyUrlChangeLocal}
                      placeholder="http://localhost:3100/v1"
                      helperText="URL of your local Copilot Proxy server (default: http://localhost:3100/v1)"
                      InputProps={{
                        startAdornment: (
                          <Box sx={{ mr: 1, display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                            🚀
                          </Box>
                        ),
                      }}
                    />
                  </Box>
                  <Box sx={{ p: 2, bgcolor: 'warning.main', color: 'warning.contrastText', borderRadius: 1, mb: 3 }}>
                    <Typography variant="body2" gutterBottom>
                      <strong>Setup Required:</strong>
                    </Typography>
                    <Typography variant="caption" component="div" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                      {'# 1. Authenticate with GitHub Copilot Pro\ngh auth login\n\n# 2. Install Copilot extension\ngh extension install github/gh-copilot\n\n# 3. Start proxy server\ncd /home/spetchal/Code/HADD/copilot-proxy\nnpm start'}
                    </Typography>
                  </Box>
                </>
              )}

              <Box sx={{ p: 2, bgcolor: 'info.main', color: 'info.contrastText', borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>Note:</strong> Model selection is available in the AI tab after choosing a provider.
                </Typography>
              </Box>
            </Box>
          )}

          {/* Prompts Tab */}
          {mainTab === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              {/* Stage Category Tabs */}
              <Tabs
                value={categoryTab}
                onChange={handleCategoryChange}
                sx={{
                  borderBottom: 1,
                  borderColor: '#505050',
                  bgcolor: '#1e1e1e',
                  px: 2,
                  minHeight: '48px',
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#007acc',
                    height: '3px'
                  }
                }}
              >
                {stageCategories.map((category, idx) => (
                  <Tab 
                    key={idx}
                    label={category.categoryLabel} 
                    sx={{ 
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                      color: '#b0b0b0',
                      minHeight: '48px',
                      '&.Mui-selected': {
                        color: '#ffffff'
                      },
                      '&:hover': {
                        bgcolor: '#2d2d2d'
                      }
                    }}
                  />
                ))}
              </Tabs>

              {/* Template Tabs within Category */}
              <Tabs
                value={promptTab}
                onChange={(_, v) => setPromptTab(v)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  borderBottom: 1,
                  borderColor: '#3e3e3e',
                  bgcolor: '#2d2d2d',
                  px: 2,
                  minHeight: '40px',
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#007acc'
                  }
                }}
              >
                {currentCategory?.templates.map((section) => (
                  <Tab 
                    key={section.key} 
                    label={section.label} 
                    sx={{ 
                      fontSize: '0.875rem',
                      color: '#d4d4d4',
                      minHeight: '40px',
                      '&.Mui-selected': {
                        color: '#ffffff'
                      },
                      '&:hover': {
                        bgcolor: '#3e3e3e'
                      }
                    }}
                  />
                ))}
              </Tabs>

              {/* Template Editor */}
              {currentPromptSection && (
                <Box sx={{ flex: 1, p: 3, overflow: 'auto', bgcolor: '#252525' }}>
                  {/* Description and Lock Button */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ flex: 1, color: '#b0b0b0' }}
                    >
                      {currentPromptSection.description}
                    </Typography>
                    
                    <Tooltip title={isTemplateLocked ? 'Unlock to edit' : 'Lock to prevent accidental changes'}>
                      <IconButton 
                        onClick={() => handleToggleLock(currentPromptSection.key)}
                        size="small"
                        sx={{ 
                          color: isTemplateLocked ? '#ffa726' : '#66bb6a',
                          '&:hover': {
                            bgcolor: isTemplateLocked ? 'rgba(255, 167, 38, 0.1)' : 'rgba(102, 187, 106, 0.1)'
                          }
                        }}
                      >
                        {isTemplateLocked ? <LockIcon /> : <LockOpenIcon />}
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <TextField
                    multiline
                    fullWidth
                    minRows={20}
                    maxRows={30}
                    value={templates[currentPromptSection.key]}
                    onChange={(e) => handleTemplateChange(currentPromptSection.key, e.target.value)}
                    disabled={isTemplateLocked}
                    sx={{
                      '& .MuiInputBase-root': {
                        fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
                        fontSize: '0.875rem',
                        lineHeight: '1.6',
                        bgcolor: isTemplateLocked ? '#1a1a1a' : '#1e1e1e',
                        color: isTemplateLocked ? '#808080' : '#d4d4d4',
                        p: 2,
                        borderRadius: 1,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: isTemplateLocked ? '#1a1a1a' : '#252525'
                        },
                        '&.Mui-focused': {
                          bgcolor: '#1e1e1e'
                        },
                        '&.Mui-disabled': {
                          color: '#808080',
                          WebkitTextFillColor: '#808080'
                        }
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: isTemplateLocked ? '#2d2d2d' : '#3e3e3e',
                        borderWidth: '1px'
                      },
                      '& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: isTemplateLocked ? '#2d2d2d' : '#505050'
                      },
                      '& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#007acc',
                        borderWidth: '2px'
                      }
                    }}
                    placeholder={isTemplateLocked ? 'Click the lock icon to edit...' : `Enter ${currentPromptSection.label.toLowerCase()} template...`}
                  />

                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 2 }}>
                    <Typography 
                      variant="caption" 
                      sx={{ color: '#808080' }}
                    >
                      {templates[currentPromptSection.key].length} characters
                    </Typography>
                    {isTemplateLocked && (
                      <Chip 
                        label="🔒 Locked" 
                        size="small" 
                        sx={{ 
                          bgcolor: 'rgba(255, 167, 38, 0.2)',
                          color: '#ffa726',
                          fontSize: '0.75rem',
                          height: '20px'
                        }}
                      />
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        {mainTab === 1 && (
          <Button 
            onClick={handleResetPrompts} 
            color="warning"
            disabled={!promptTemplateStore.isCustomized()}
          >
            Reset Prompts
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Button onClick={handleCancel}>
          Cancel
        </Button>
        {mainTab === 0 ? (
          <Button 
            onClick={handleSaveSettings} 
            variant="contained"
            disabled={!hasSettingsChanges}
          >
            Apply Settings
          </Button>
        ) : (
          <Button 
            onClick={handleSavePrompts} 
            variant="contained" 
            disabled={!hasPromptChanges}
          >
            Save Prompts
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
