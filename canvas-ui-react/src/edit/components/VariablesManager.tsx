/**
 * Variables Manager Component
 * CRUD interface for Canvas Variables (Phase 2 - Flow System)
 */

import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography
} from '@mui/material';
import React, { useState } from 'react';
import { useConfigStore } from '../../shared/stores/useConfigStore';
import type { CanvasVariable } from '../../shared/types';

interface VariablesManagerProps {
  open: boolean;
  onClose: () => void;
}

export const VariablesManager: React.FC<VariablesManagerProps> = ({ open, onClose }) => {
  const { listVariables, setVariable, deleteVariable } = useConfigStore();
  const variables = listVariables();
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingVariable, setEditingVariable] = useState<CanvasVariable | null>(null);
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<CanvasVariable['type']>('string');
  const [formValue, setFormValue] = useState('');

  const handleCreate = () => {
    setEditingVariable(null);
    setFormName('');
    setFormType('string');
    setFormValue('');
    setEditDialogOpen(true);
  };

  const handleEdit = (variable: CanvasVariable) => {
    setEditingVariable(variable);
    setFormName(variable.name);
    setFormType(variable.type);
    setFormValue(String(variable.value));
    setEditDialogOpen(true);
  };

  const handleSave = () => {
    if (!formName.trim()) return;

    // Parse value based on type
    let parsedValue: any = formValue;
    if (formType === 'number') {
      parsedValue = parseFloat(formValue) || 0;
    } else if (formType === 'boolean') {
      parsedValue = formValue === 'true' || formValue === '1';
    }

    setVariable(formName, parsedValue, formType);
    setEditDialogOpen(false);
  };

  const handleDelete = (name: string) => {
    if (confirm(`Delete variable "${name}"?`)) {
      deleteVariable(name);
    }
  };

  const variablesList = Object.values(variables);

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Canvas Variables</Typography>
            <Button variant="contained" onClick={handleCreate}>
              + Create Variable
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          {variablesList.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No variables created yet.
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Variables are global values that can be used in flows and bindings.
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Value</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {variablesList.map((variable) => (
                    <TableRow key={variable.name} hover>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ fontFamily: 'monospace', fontWeight: 600 }}
                        >
                          {variable.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {variable.type}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ 
                            fontFamily: 'monospace',
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {typeof variable.value === 'object' 
                            ? JSON.stringify(variable.value)
                            : String(variable.value)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(variable)}
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(variable.name)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit/Create Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingVariable ? 'Edit Variable' : 'Create Variable'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Variable Name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              disabled={!!editingVariable} // Can't rename
              placeholder="e.g., brightness, current_room"
              helperText="Alphanumeric + underscores only"
              sx={{
                '& .MuiInputBase-input': {
                  fontFamily: 'monospace'
                }
              }}
            />
            
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={formType}
                label="Type"
                onChange={(e) => setFormType(e.target.value as CanvasVariable['type'])}
              >
                <MenuItem value="string">String</MenuItem>
                <MenuItem value="number">Number</MenuItem>
                <MenuItem value="boolean">Boolean</MenuItem>
                <MenuItem value="color">Color</MenuItem>
                <MenuItem value="datetime">DateTime</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Value"
              value={formValue}
              onChange={(e) => setFormValue(e.target.value)}
              placeholder={
                formType === 'number' ? '42' :
                formType === 'boolean' ? 'true' :
                formType === 'color' ? '#ff0000' :
                formType === 'datetime' ? '2026-02-16' :
                'Hello World'
              }
              helperText={
                formType === 'boolean' ? 'Enter: true or false' :
                formType === 'number' ? 'Enter a number' :
                'Enter a value'
              }
              sx={{
                '& .MuiInputBase-input': {
                  fontFamily: 'monospace'
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={!formName.trim()}>
            {editingVariable ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
