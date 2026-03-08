/**
 * Widget Name Dialog
 * Dialog for naming a widget before adding it to the canvas
 * Enforces unique widget names across all views
 */

import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import React, { useEffect, useState } from 'react';

interface WidgetNameDialogProps {
  open: boolean;
  widgetType: string;
  onClose: () => void;
  onConfirm: (name: string) => void;
  validateName: (name: string) => string | null; // Returns error message or null if valid
}

export const WidgetNameDialog: React.FC<WidgetNameDialogProps> = ({
  open,
  widgetType,
  onClose,
  onConfirm,
  validateName,
}) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Reset name when dialog opens
  useEffect(() => {
    if (open) {
      setName('');
      setError(null);
    }
  }, [open]);

  const handleNameChange = (value: string) => {
    setName(value);
    // Validate on change
    if (value.trim()) {
      const validationError = validateName(value.trim());
      setError(validationError);
    } else {
      setError('Widget name is required');
    }
  };

  const handleConfirm = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Widget name is required');
      return;
    }

    const validationError = validateName(trimmed);
    if (validationError) {
      setError(validationError);
      return;
    }

    onConfirm(trimmed);
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && name.trim() && !error) {
      handleConfirm();
    }
  };

  // Get widget type display name (capitalize first letter)
  const displayType = widgetType.charAt(0).toUpperCase() + widgetType.slice(1);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Name Your {displayType} Widget</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Widget Name"
          type="text"
          fullWidth
          variant="outlined"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          onKeyPress={handleKeyPress}
          error={!!error}
          helperText={error || 'Enter a unique name for this widget (letters, numbers, underscores)'}
          sx={{ mt: 1 }}
        />
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleConfirm} 
          variant="contained" 
          disabled={!name.trim() || !!error}
        >
          Add Widget
        </Button>
      </DialogActions>
    </Dialog>
  );
};
