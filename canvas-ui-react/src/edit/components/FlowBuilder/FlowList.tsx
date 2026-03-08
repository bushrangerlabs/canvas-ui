/**
 * FlowList Component - List and manage flows
 * Shows table of flows with create/edit/delete actions
 */

import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    FileDownload as ExportIcon,
    FileUpload as ImportIcon,
    PowerSettingsNew as ToggleIcon,
    Schedule as TriggersIcon,
} from '@mui/icons-material';
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { useConfigStore } from '../../../shared/stores/useConfigStore';
import type { FlowDefinition } from '../../../shared/types/flow';

interface FlowListProps {
  onEditFlow: (flowId: string) => void;
  onConfigureTriggers: (flowId: string) => void;
  onSave?: () => void;
}

export const FlowList: React.FC<FlowListProps> = ({ onEditFlow, onConfigureTriggers, onSave }) => {
  const { listFlows, setFlow, deleteFlow, exportFlow, exportAllFlows, importFlow } = useConfigStore();
  const flows = listFlows();
  const flowArray = Object.values(flows);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newFlowName, setNewFlowName] = useState('');
  const [newFlowDescription, setNewFlowDescription] = useState('');

  const handleCreateFlow = () => {
    if (!newFlowName.trim()) return;

    const newFlow: FlowDefinition = {
      id: `flow_${Date.now()}`,
      name: newFlowName,
      description: newFlowDescription,
      enabled: true,
      nodes: [],
      edges: [],
      triggers: [],
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    };

    setFlow(newFlow);
    setCreateDialogOpen(false);
    setNewFlowName('');
    setNewFlowDescription('');
    onSave?.(); // Save to HA
  };

  const handleToggleEnabled = (flow: FlowDefinition) => {
    setFlow({
      ...flow,
      enabled: !flow.enabled,
    });
    onSave?.(); // Save to HA
  };

  const handleDeleteFlow = (flowId: string) => {
    if (confirm('Are you sure you want to delete this flow?')) {
      deleteFlow(flowId);
      onSave?.(); // Save to HA
    }
  };

  const handleExportAllFlows = () => {
    exportAllFlows();
  };

  const handleImportFlow = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          await importFlow(file);
          onSave?.(); // Save to HA after import
        } catch (error) {
          alert(`Failed to import flow: ${(error as Error).message}`);
        }
      }
    };
    input.click();
  };

  const formatDate = (timestamp: number | undefined) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Flows</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Export All Flows">
            <Button
              variant="outlined"
              size="small"
              startIcon={<ExportIcon />}
              onClick={handleExportAllFlows}
              disabled={flowArray.length === 0}
            >
              Export All
            </Button>
          </Tooltip>
          <Tooltip title="Import Flow(s)">
            <Button
              variant="outlined"
              size="small"
              startIcon={<ImportIcon />}
              onClick={handleImportFlow}
            >
              Import
            </Button>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Flow
          </Button>
        </Box>
      </Box>

      {/* Flows Table */}
      {flowArray.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No flows yet. Create your first flow to get started!
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Nodes</TableCell>
                <TableCell>Triggers</TableCell>
                <TableCell>Last Updated</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {flowArray.map((flow) => (
                <TableRow key={flow.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {flow.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {flow.description || 'No description'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        color: flow.enabled ? 'success.main' : 'text.disabled',
                        fontWeight: 'bold',
                      }}
                    >
                      {flow.enabled ? 'Enabled' : 'Disabled'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{flow.nodes.length}</Typography>
                  </TableCell>
                  <TableCell>
                    {flow.triggers && flow.triggers.length > 0 ? (
                      <Chip
                        label={`${flow.triggers.length} trigger${flow.triggers.length > 1 ? 's' : ''}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ) : (
                      <Chip
                        label="Manual only"
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(flow.metadata?.updatedAt)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title={flow.enabled ? 'Disable' : 'Enable'}>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleEnabled(flow)}
                        color={flow.enabled ? 'success' : 'default'}
                      >
                        <ToggleIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Configure Triggers">
                      <IconButton
                        size="small"
                        onClick={() => onConfigureTriggers(flow.id)}
                        color="info"
                      >
                        <TriggersIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Flow">
                      <IconButton
                        size="small"
                        onClick={() => onEditFlow(flow.id)}
                        color="primary"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Export Flow">
                      <IconButton
                        size="small"
                        onClick={() => exportFlow(flow.id)}
                        color="default"
                      >
                        <ExportIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Flow">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteFlow(flow.id)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create Flow Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Flow</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Flow Name"
            fullWidth
            value={newFlowName}
            onChange={(e) => setNewFlowName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description (optional)"
            fullWidth
            multiline
            rows={3}
            value={newFlowDescription}
            onChange={(e) => setNewFlowDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateFlow}
            variant="contained"
            disabled={!newFlowName.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
