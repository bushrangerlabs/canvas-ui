/**
 * Delete View Dialog
 * Confirmation dialog for deleting a view
 */

import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import React from 'react';

interface DeleteViewDialogProps {
  open: boolean;
  viewName: string;
  viewCount: number;
  onClose: () => void;
  onDelete: () => void;
}

export const DeleteViewDialog: React.FC<DeleteViewDialogProps> = ({
  open,
  viewName,
  viewCount,
  onClose,
  onDelete,
}) => {
  const canDelete = viewCount > 1;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Delete View</DialogTitle>
      <DialogContent>
        {canDelete ? (
          <DialogContentText>
            Are you sure you want to delete the view "{viewName}"? This action cannot be undone.
          </DialogContentText>
        ) : (
          <DialogContentText>
            Cannot delete the last view. You must have at least one view in your configuration.
          </DialogContentText>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {canDelete && (
          <Button onClick={onDelete} variant="contained" color="error">
            Delete
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
