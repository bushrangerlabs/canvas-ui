/**
 * View Manager - Create, edit, delete, and switch views
 */

import {
    Add as AddIcon,
    Close as CloseIcon,
    Delete as DeleteIcon,
    ContentCopy as DuplicateIcon,
    Edit as EditIcon,
    Visibility as ViewIcon,
} from '@mui/icons-material';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemSecondaryAction,
    ListItemText,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { RESOLUTION_PRESETS, parseResolution } from '../../shared/constants/resolutions';
import type { ViewConfig } from '../../shared/types';

interface ViewManagerProps {
  open: boolean;
  onClose: () => void;
  views: ViewConfig[];
  currentViewId: string | null;
  onViewSwitch: (viewId: string) => void;
  onAddView: (view: ViewConfig) => void;
  onDeleteView: (viewId: string) => void;
  onDuplicateView: (viewId: string) => void;
  onUpdateView: (viewId: string, updates: Partial<ViewConfig>) => void;
}

export const ViewManager: React.FC<ViewManagerProps> = ({
  open,
  onClose,
  views,
  currentViewId,
  onViewSwitch,
  onAddView,
  onDeleteView,
  onDuplicateView,
  onUpdateView,
}) => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedViewId, setSelectedViewId] = useState<string | null>(null);
  const [newViewName, setNewViewName] = useState('');
  const [editViewName, setEditViewName] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#1a1a1a');
  const [resolution, setResolution] = useState<string>('none');
  const [sizex, setSizex] = useState<number>(1920);
  const [sizey, setSizey] = useState<number>(1080);

  const handleCreateView = () => {
    const viewId = `view-${Date.now()}`;
    
    // Auto-create resolution widget to help user set dimensions
    const resolutionWidget = {
      id: `widget-${Date.now()}`,
      type: 'resolution',
      position: {
        x: 20,
        y: 20,
        width: 300,
        height: 180,
      },
      config: {
        style: {},
      },
    };

    const newView: ViewConfig = {
      id: viewId,
      name: newViewName || 'New View',
      style: {
        backgroundColor: backgroundColor,
        backgroundOpacity: 1,
      },
      widgets: [resolutionWidget], // Auto-add resolution widget
      // Add resolution fields if not 'none'
      ...(resolution !== 'none' && {
        resolution,
        sizex,
        sizey,
      }),
    };
    onAddView(newView);
    setCreateDialogOpen(false);
    setNewViewName('');
    setBackgroundColor('#1a1a1a');
    setResolution('none');
    setSizex(1920);
    setSizey(1080);
  };

  const handleEditView = () => {
    if (!selectedViewId) return;
    onUpdateView(selectedViewId, {
      name: editViewName,
      style: {
        backgroundColor: backgroundColor,
        backgroundOpacity: 1,
      },
      // Update resolution fields
      resolution: resolution === 'none' ? undefined : resolution,
      sizex: resolution === 'none' ? undefined : sizex,
      sizey: resolution === 'none' ? undefined : sizey,
    });
    setEditDialogOpen(false);
    setSelectedViewId(null);
  };

  const handleDeleteView = () => {
    if (!selectedViewId) return;
    onDeleteView(selectedViewId);
    setDeleteDialogOpen(false);
    setSelectedViewId(null);
  };

  const openEditDialog = (view: ViewConfig) => {
    setSelectedViewId(view.id);
    setEditViewName(view.name);
    setBackgroundColor(view.style.backgroundColor || '#1a1a1a');
    setResolution(view.resolution || 'none');
    setSizex(view.sizex || 1920);
    setSizey(view.sizey || 1080);
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (viewId: string) => {
    setSelectedViewId(viewId);
    setDeleteDialogOpen(true);
  };

  const selectedView = views.find(v => v.id === selectedViewId);

  return (
    <>
      <Drawer
        anchor="left"
        open={open}
        onClose={onClose}
        sx={{
          '& .MuiDrawer-paper': {
            width: 360,
            mt: 8, // Below AppBar
            height: 'calc(100vh - 64px)', // Full height minus AppBar
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexShrink: 0 }}>
            <ViewIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              View Manager
            </Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Create View Button */}
          <Button
            fullWidth
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{ mb: 2, flexShrink: 0 }}
          >
            Create New View
          </Button>

          {/* Views List */}
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, flexShrink: 0 }}>
            {views.length} View{views.length !== 1 ? 's' : ''}
          </Typography>

          <List dense sx={{ p: 0, flex: 1, overflow: 'auto' }}>
            {views.map((view) => {
              const isActive = currentViewId === view.id;
              const widgetCount = view.widgets.length;
              
              return (
                <ListItem
                  key={view.id}
                  disablePadding
                  sx={{ 
                    mb: 1,
                    border: 1,
                    borderColor: isActive ? 'primary.main' : 'divider',
                    borderRadius: 1,
                  }}
                >
                  <ListItemButton
                    selected={isActive}
                    onClick={() => {
                      onViewSwitch(view.id);
                      onClose();
                    }}
                    sx={{
                      '&.Mui-selected': {
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        '&:hover': { bgcolor: 'primary.dark' },
                      },
                    }}
                  >
                    <ListItemText
                      primary={view.name}
                      secondary={`${widgetCount} widget${widgetCount !== 1 ? 's' : ''}`}
                      primaryTypographyProps={{
                        fontWeight: isActive ? 600 : 400,
                      }}
                      secondaryTypographyProps={{
                        sx: { color: isActive ? 'inherit' : 'text.secondary' },
                      }}
                    />
                  </ListItemButton>
                  <ListItemSecondaryAction>
                    <Stack direction="row" spacing={0.5}>
                      <IconButton
                        size="small"
                        onClick={() => openEditDialog(view)}
                        title="Edit View"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => onDuplicateView(view.id)}
                        title="Duplicate View"
                      >
                        <DuplicateIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => openDeleteDialog(view.id)}
                        disabled={views.length <= 1}
                        title={views.length <= 1 ? "Can't delete last view" : "Delete View"}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </ListItemSecondaryAction>
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Drawer>

      {/* Create View Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New View</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              autoFocus
              label="View Name"
              fullWidth
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              placeholder="My View"
            />
            <TextField
              label="Background Color"
              fullWidth
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              placeholder="#1a1a1a"
              helperText="Hex color code"
            />
            <Select
              fullWidth
              value={resolution}
              onChange={(e) => {
                const value = e.target.value;
                setResolution(value);
                if (value !== 'none' && value !== 'user') {
                  // Parse preset and auto-fill dimensions
                  const parsed = parseResolution(value);
                  if (parsed) {
                    setSizex(parsed.width);
                    setSizey(parsed.height);
                  }
                }
              }}
              displayEmpty
            >
              {RESOLUTION_PRESETS.map((preset) => (
                <MenuItem key={preset.value} value={preset.value}>
                  {preset.label}
                </MenuItem>
              ))}
            </Select>
            {resolution !== 'none' && (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  type="number"
                  label="Width (px)"
                  value={sizex}
                  disabled={resolution !== 'user'}
                  onChange={(e) => setSizex(Number(e.target.value))}
                  sx={{ flex: 1 }}
                />
                <Typography>×</Typography>
                <TextField
                  type="number"
                  label="Height (px)"
                  value={sizey}
                  disabled={resolution !== 'user'}
                  onChange={(e) => setSizey(Number(e.target.value))}
                  sx={{ flex: 1 }}
                />
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateView} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit View Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit View</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              autoFocus
              label="View Name"
              fullWidth
              value={editViewName}
              onChange={(e) => setEditViewName(e.target.value)}
            />
            <TextField
              label="Background Color"
              fullWidth
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              placeholder="#1a1a1a"
              helperText="Hex color code"
            />
            <Select
              fullWidth
              value={resolution}
              onChange={(e) => {
                const value = e.target.value;
                setResolution(value);
                if (value !== 'none' && value !== 'user') {
                  // Parse preset and auto-fill dimensions
                  const parsed = parseResolution(value);
                  if (parsed) {
                    setSizex(parsed.width);
                    setSizey(parsed.height);
                  }
                }
              }}
              displayEmpty
            >
              {RESOLUTION_PRESETS.map((preset) => (
                <MenuItem key={preset.value} value={preset.value}>
                  {preset.label}
                </MenuItem>
              ))}
            </Select>
            {resolution !== 'none' && (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  type="number"
                  label="Width (px)"
                  value={sizex}
                  disabled={resolution !== 'user'}
                  onChange={(e) => setSizex(Number(e.target.value))}
                  sx={{ flex: 1 }}
                />
                <Typography>×</Typography>
                <TextField
                  type="number"
                  label="Height (px)"
                  value={sizey}
                  disabled={resolution !== 'user'}
                  onChange={(e) => setSizey(Number(e.target.value))}
                  sx={{ flex: 1 }}
                />
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditView} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete View Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm">
        <DialogTitle>Delete View</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedView?.name}"? This action cannot be undone.
          </Typography>
          {selectedView && selectedView.widgets.length > 0 && (
            <Typography color="warning.main" sx={{ mt: 2 }}>
              This view contains {selectedView.widgets.length} widget{selectedView.widgets.length !== 1 ? 's' : ''} that will be deleted.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteView} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
