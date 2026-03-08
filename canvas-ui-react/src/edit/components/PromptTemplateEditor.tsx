/**
 * PromptTemplateEditor - UI for customizing AI prompt templates
 * 
 * Allows users to edit 6 prompt template sections:
 * - System Override
 * - Stage 1: Understanding
 * - Stage 2: Edit Modes (UPDATE/ADD/REPLACE)
 * - Stage 2: Best Practices
 * - Stage 2: Output Format
 * - Stage 4: Validation
 */

import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Tab,
    Tabs,
    TextField,
    Typography
} from '@mui/material';
import React, { useState } from 'react';
import { promptTemplateStore, type PromptTemplates } from '../../services/ai/PromptTemplateStore';

interface Props {
  open: boolean;
  onClose: () => void;
}

interface TemplateSection {
  key: keyof PromptTemplates;
  label: string;
  description: string;
}

// v19 Simplified Templates - Only 3 templates
const templateSections: TemplateSection[] = [
  {
    key: 'systemPrompt',
    label: 'System Prompt',
    description: 'Core AI instruction for dashboard generation'
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
];

export const PromptTemplateEditor: React.FC<Props> = ({ open, onClose }) => {
  const [currentTab, setCurrentTab] = useState(0);
  const [templates, setTemplates] = useState<PromptTemplates>(promptTemplateStore.getTemplates());
  const [hasChanges, setHasChanges] = useState(false);

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setTemplates(promptTemplateStore.getTemplates());
      setHasChanges(false);
      setCurrentTab(0);
    }
  }, [open]);

  const handleSave = () => {
    promptTemplateStore.saveTemplates(templates);
    setHasChanges(false);
    onClose();
  };

  const handleReset = () => {
    if (confirm('Reset all templates to defaults? This cannot be undone.')) {
      promptTemplateStore.resetToDefaults();
      setTemplates(promptTemplateStore.getTemplates());
      setHasChanges(false);
    }
  };

  const handleTemplateChange = (key: keyof PromptTemplates, value: string) => {
    setTemplates({ ...templates, [key]: value });
    setHasChanges(true);
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (confirm('Discard unsaved changes?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const currentSection = templateSections[currentTab];

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
          Customize AI Prompts
        </Typography>
        {promptTemplateStore.isCustomized() && (
          <Chip 
            label="Custom" 
            color="warning" 
            size="small" 
          />
        )}
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Tabs Navigation */}
          <Tabs
            value={currentTab}
            onChange={(_, v) => setCurrentTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
              px: 2
            }}
          >
            {templateSections.map((section) => (
              <Tab 
                key={section.key} 
                label={section.label} 
                sx={{ fontSize: '0.875rem' }}
              />
            ))}
          </Tabs>

          {/* Template Editor */}
          <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ mb: 2 }}
            >
              {currentSection.description}
            </Typography>

            <TextField
              multiline
              fullWidth
              minRows={20}
              maxRows={30}
              value={templates[currentSection.key]}
              onChange={(e) => handleTemplateChange(currentSection.key, e.target.value)}
              sx={{
                '& .MuiInputBase-root': {
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  lineHeight: '1.6'
                }
              }}
              placeholder={`Enter ${currentSection.label.toLowerCase()} template...`}
            />

            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ mt: 1, display: 'block' }}
            >
              {templates[currentSection.key].length} characters
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button 
          onClick={handleReset} 
          color="warning"
          disabled={!promptTemplateStore.isCustomized()}
        >
          Reset to Defaults
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={handleCancel}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={!hasChanges}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};
