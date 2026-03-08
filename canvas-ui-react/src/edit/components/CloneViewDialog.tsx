/**
 * Clone View Dialog
 * Dialog for cloning the current view with a custom name
 */

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import React, { useEffect, useState } from 'react';

interface CloneViewDialogProps {
  open: boolean;
  currentViewName: string;
  onClose: () => void;
  onClone: (newName: string) => void;
}

export const CloneViewDialog: React.FC<CloneViewDialogProps> = ({
  open,
  currentViewName,
  onClose,
  onClone,
}) => {
  const [newName, setNewName] = useState('');

  // Reset name when dialog opens
  useEffect(() => {
    if (open) {
      setNewName(`${currentViewName} (Clone)`);
    }
  }, [open, currentViewName]);

  const handleClone = () => {
    if (newName.trim()) {
      onClone(newName.trim());
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newName.trim()) {
      handleClone();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Clone View</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="New View Name"
          type="text"
          fullWidth
          variant="outlined"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyPress={handleKeyPress}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleClone} variant="contained" disabled={!newName.trim()}>
          Clone
        </Button>
      </DialogActions>
    </Dialog>
  );
};
