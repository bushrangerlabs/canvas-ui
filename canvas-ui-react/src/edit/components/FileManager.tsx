/**
 * File Manager Component
 * Full-featured file management interface for Canvas UI
 *
 * Features:
 * - List/Grid view modes
 * - Upload with drag & drop
 * - Multi-select operations
 * - File operations: upload, download, rename, delete, create folder
 * - Progress tracking
 * - Sorting and filtering
 */

import * as MuiIcons from '@mui/icons-material';
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    LinearProgress,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Toolbar,
    Tooltip,
    Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../../shared/providers/WebSocketProvider';

interface FileInfo {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: string;
  extension?: string;
}

interface FileManagerProps {
  open: boolean;
  onClose: () => void;
  mode?: 'manage' | 'select';
  onFileSelect?: (filePath: string) => void;
  initialPath?: string;
}

export const FileManager: React.FC<FileManagerProps> = ({ 
  open, 
  onClose, 
  mode = 'manage',
  onFileSelect,
  initialPath = '/config/www',
}) => {
  const { hass } = useWebSocket();
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortBy] = useState<'name' | 'date' | 'size' | 'type'>('name');  // TODO: Add sort UI
  const [uploadProgress, setUploadProgress] = useState<Map<string, number>>(new Map());
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: FileInfo | null } | null>(null);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [renameFile, setRenameFile] = useState<FileInfo | null>(null);

  useEffect(() => {
    if (open && hass) {
      loadFiles(currentPath);
    }
  }, [open, currentPath, hass]);

  const loadFiles = async (path: string) => {
    if (!hass) return;

    setLoading(true);
    try {
      const result = await hass.callService('canvas_ui', 'list_files_op', {
        path,
        recursive: false,
        return_response: true,
      });

      console.log('[FileManager] Raw result:', result);
      
      // HA service returns: {success: true, result: {response: {files: [...], path: "..."}}}
      const serviceResult = result?.result?.response || result?.response || result;
      console.log('[FileManager] Service result:', serviceResult);
      
      const fileList = serviceResult.files || [];
      console.log('[FileManager] File list:', fileList);
      setFiles(fileList);
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateUp = () => {
    const parts = currentPath.split('/').filter(p => p);
    if (parts.length > 2) { // Don't go above /config/www
      parts.pop();
      setCurrentPath('/' + parts.join('/'));
    }
  };

  const navigateToFolder = (folder: FileInfo) => {
    if (folder.type === 'directory') {
      setCurrentPath(folder.path);
      setSelectedFiles(new Set());
    }
  };

  const createFolder = async () => {
    if (!hass || !newFolderName) return;

    try {
      const folderPath = `${currentPath}/${newFolderName}`;
      await hass.callService('canvas_ui', 'create_folder', {
        path: folderPath,
        return_response: true,
      });

      setNewFolderOpen(false);
      setNewFolderName('');
      loadFiles(currentPath);
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  const uploadFiles = async (files: FileList) => {
    if (!hass) return;

    const newProgress = new Map(uploadProgress);

    for (const file of Array.from(files)) {
      try {
        // Read file as base64
        const base64Data = await fileToBase64(file);

        newProgress.set(file.name, 0);
        setUploadProgress(new Map(newProgress));

        const filePath = `${currentPath}/${file.name}`;
        await hass.callService('canvas_ui', 'upload_file', {
          path: filePath,
          data: base64Data,
          overwrite: false,
          return_response: true,
        });

        newProgress.set(file.name, 100);
        setUploadProgress(new Map(newProgress));

        // Remove from progress after 1 second
        setTimeout(() => {
          const updated = new Map(uploadProgress);
          updated.delete(file.name);
          setUploadProgress(updated);
        }, 1000);
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        newProgress.delete(file.name);
        setUploadProgress(new Map(newProgress));
      }
    }

    loadFiles(currentPath);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (data:...;base64,)
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const deleteSelected = async () => {
    if (!hass || selectedFiles.size === 0) return;

    const confirmed = window.confirm(
      `Delete ${selectedFiles.size} item(s)? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      for (const path of selectedFiles) {
        await hass.callService('canvas_ui', 'delete_file', {
          path,
          return_response: true,
        });
      }
      setSelectedFiles(new Set());
      loadFiles(currentPath);
    } catch (error) {
      console.error('Failed to delete files:', error);
    }
  };

  const renameFileAction = async () => {
    if (!hass || !renameFile || !renameValue) return;

    try {
      const newPath = currentPath + '/' + renameValue;
      await hass.callService('canvas_ui', 'rename_file', {
        old_path: renameFile.path,
        new_path: newPath,
        return_response: true,
      });

      setRenameOpen(false);
      setRenameValue('');
      setRenameFile(null);
      loadFiles(currentPath);
    } catch (error) {
      console.error('Failed to rename file:', error);
    }
  };

  const downloadFile = async (file: FileInfo) => {
    if (!hass) return;

    try {
      const result = await hass.callService('canvas_ui', 'read_file', {
        path: file.path,
        return_response: true,
      });

      // HA service returns: {success: true, result: {response: {data: "...", exists: true}}}
      const serviceResult = result?.result?.response || result?.response || result;
      const data = serviceResult.data;

      // Convert base64 to blob and download
      const byteCharacters = atob(data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray]);

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download file:', error);
    }
  };

  const toggleSelection = (file: FileInfo, ctrlKey: boolean) => {
    const newSelection = new Set(selectedFiles);
    if (ctrlKey) {
      if (newSelection.has(file.path)) {
        newSelection.delete(file.path);
      } else {
        newSelection.add(file.path);
      }
    } else {
      newSelection.clear();
      newSelection.add(file.path);
    }
    setSelectedFiles(newSelection);
  };

  const selectAll = () => {
    setSelectedFiles(new Set(files.map(f => f.path)));
  };

  const getFileIcon = (file: FileInfo) => {
    if (file.type === 'directory') {
      return <MuiIcons.Folder color="primary" />;
    }

    const ext = file.extension?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'ico'].includes(ext)) {
      return <MuiIcons.Image color="secondary" />;
    }
    if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) {
      return <MuiIcons.Videocam />;
    }
    if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) {
      return <MuiIcons.AudioFile />;
    }
    if (['js', 'ts', 'tsx', 'py', 'json', 'yaml', 'yml'].includes(ext)) {
      return <MuiIcons.Code />;
    }
    if (['txt', 'md', 'log'].includes(ext)) {
      return <MuiIcons.Description />;
    }
    if (['zip', 'tar', 'gz', '7z', 'rar'].includes(ext)) {
      return <MuiIcons.Archive />;
    }
    return <MuiIcons.InsertDriveFile />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const sortedFiles = [...files].sort((a, b) => {
    // Directories first
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1;
    }

    let comparison = 0;
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'date':
        comparison = (a.modified || '').localeCompare(b.modified || '');
        break;
      case 'size':
        comparison = (a.size || 0) - (b.size || 0);
        break;
      case 'type':
        comparison = (a.extension || '').localeCompare(b.extension || '');
        break;
    }
    return comparison;
  });

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: '80vh',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">{mode === 'select' ? 'Select File' : 'File Manager'}</Typography>
            <IconButton onClick={onClose} size="small">
              <MuiIcons.Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <Divider />

        {/* Toolbar */}
        <Toolbar variant="dense" sx={{ gap: 1, flexWrap: 'wrap' }}>
          <Tooltip title="Up">
            <IconButton onClick={navigateUp} size="small">
              <MuiIcons.ArrowUpward />
            </IconButton>
          </Tooltip>
          <Tooltip title="Home">
            <IconButton onClick={() => setCurrentPath('/config/www')} size="small">
              <MuiIcons.Home />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh">
            <IconButton onClick={() => loadFiles(currentPath)} size="small">
              <MuiIcons.Refresh />
            </IconButton>
          </Tooltip>
          <Divider orientation="vertical" flexItem />
          <Tooltip title="New Folder">
            <IconButton onClick={() => setNewFolderOpen(true)} size="small">
              <MuiIcons.CreateNewFolder />
            </IconButton>
          </Tooltip>
          <Tooltip title="Upload">
            <IconButton component="label" size="small">
              <MuiIcons.Upload />
              <input
                type="file"
                hidden
                multiple
                onChange={(e) => e.target.files && uploadFiles(e.target.files)}
              />
            </IconButton>
          </Tooltip>
          {selectedFiles.size > 0 && (
            <Tooltip title="Delete Selected">
              <IconButton onClick={deleteSelected} size="small" color="error">
                <MuiIcons.Delete />
              </IconButton>
            </Tooltip>
          )}
          <Divider orientation="vertical" flexItem />
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, v) => v && setViewMode(v)}
            size="small"
          >
            <ToggleButton value="list">
              <MuiIcons.ViewList fontSize="small" />
            </ToggleButton>
            <ToggleButton value="grid">
              <MuiIcons.ViewModule fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
          <Box sx={{ flex: 1 }} />
          {selectedFiles.size > 0 && (
            <Chip
              label={`${selectedFiles.size} selected`}
              size="small"
              onDelete={() => setSelectedFiles(new Set())}
            />
          )}
        </Toolbar>

        <Divider />

        {/* Breadcrumb */}
        <Box sx={{ px: 2, py: 1, bgcolor: 'background.default' }}>
          <Typography variant="body2" fontFamily="monospace" color="text.secondary">
            {currentPath}
          </Typography>
        </Box>

        <Divider />

        {/* Upload Progress */}
        {uploadProgress.size > 0 && (
          <Box sx={{ px: 2, py: 1 }}>
            {Array.from(uploadProgress.entries()).map(([name, progress]) => (
              <Box key={name} sx={{ mb: 1 }}>
                <Typography variant="caption">{name}</Typography>
                <LinearProgress variant="determinate" value={progress} />
              </Box>
            ))}
          </Box>
        )}

        {/* File List */}
        <DialogContent sx={{ flex: 1, overflow: 'auto', p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          ) : viewMode === 'list' ? (
            <List dense>
              {sortedFiles.map((file) => (
                <ListItem
                  key={file.path}
                  disablePadding
                  sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                  }}
                >
                  <ListItemButton
                    selected={selectedFiles.has(file.path)}
                    onClick={(e) => {
                      if (mode === 'select' && file.type === 'file') {
                        // In select mode, clicking a file selects it
                        onFileSelect?.(file.path);
                      } else if (file.type === 'directory' && !e.ctrlKey && !e.metaKey) {
                        navigateToFolder(file);
                      } else {
                        toggleSelection(file, e.ctrlKey || e.metaKey);
                      }
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenu({ x: e.clientX, y: e.clientY, file });
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {getFileIcon(file)}
                    </ListItemIcon>
                    <ListItemText
                      primary={file.name}
                      secondary={file.type === 'file' ? formatFileSize(file.size) : 'Folder'}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: 2,
                p: 2,
              }}
            >
              {sortedFiles.map((file) => (
                <Box
                  key={file.path}
                  onClick={(e) => {
                    if (file.type === 'directory' && !e.ctrlKey && !e.metaKey) {
                      navigateToFolder(file);
                    } else {
                      toggleSelection(file, e.ctrlKey || e.metaKey);
                    }
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({ x: e.clientX, y: e.clientY, file });
                  }}
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    cursor: 'pointer',
                    borderRadius: 1,
                    border: 1,
                    borderColor: selectedFiles.has(file.path) ? 'primary.main' : 'divider',
                    bgcolor: selectedFiles.has(file.path) ? 'action.selected' : 'transparent',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <Box sx={{ fontSize: 48, mb: 1 }}>
                    {getFileIcon(file)}
                  </Box>
                  <Typography variant="caption" sx={{ wordBreak: 'break-word' }}>
                    {file.name}
                  </Typography>
                  {file.type === 'file' && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {formatFileSize(file.size)}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>

        <Divider />

        <DialogActions>
          <Typography variant="caption" color="text.secondary" sx={{ flex: 1, pl: 1 }}>
            {files.length} items
          </Typography>
          <Button onClick={selectAll} size="small">Select All</Button>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Context Menu */}
      <Menu
        open={contextMenu !== null}
        onClose={() => setContextMenu(null)}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu ? { top: contextMenu.y, left: contextMenu.x } : undefined
        }
      >
        {contextMenu?.file?.type === 'file' && (
          <MenuItem onClick={() => {
            if (contextMenu.file) downloadFile(contextMenu.file);
            setContextMenu(null);
          }}>
            <ListItemIcon><MuiIcons.Download fontSize="small" /></ListItemIcon>
            <ListItemText>Download</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={() => {
          if (contextMenu?.file) {
            setRenameFile(contextMenu.file);
            setRenameValue(contextMenu.file.name);
            setRenameOpen(true);
          }
          setContextMenu(null);
        }}>
          <ListItemIcon><MuiIcons.Edit fontSize="small" /></ListItemIcon>
          <ListItemText>Rename</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          if (contextMenu?.file) {
            setSelectedFiles(new Set([contextMenu.file.path]));
            deleteSelected();
          }
          setContextMenu(null);
        }}>
          <ListItemIcon><MuiIcons.Delete fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* New Folder Dialog */}
      <Dialog open={newFolderOpen} onClose={() => setNewFolderOpen(false)}>
        <DialogTitle>Create New Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Folder Name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && createFolder()}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewFolderOpen(false)}>Cancel</Button>
          <Button onClick={createFolder} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameOpen} onClose={() => setRenameOpen(false)}>
        <DialogTitle>Rename {renameFile?.type === 'directory' ? 'Folder' : 'File'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="New Name"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && renameFileAction()}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameOpen(false)}>Cancel</Button>
          <Button onClick={renameFileAction} variant="contained">Rename</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
