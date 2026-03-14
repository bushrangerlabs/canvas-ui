/**
 * CanvasToolbar - MUI-based Multiline Ribbon Toolbar
 * Inspired by ioBroker vis toolbar architecture
 */

import {
    AddComment as AddCommentIcon,
    Add as AddIcon,
    AlignHorizontalCenter,
    AlignHorizontalLeft,
    AlignHorizontalRight,
    AlignVerticalBottom,
    AlignVerticalCenter,
    AlignVerticalTop,
    UnfoldLess as CenterOnViewIcon,
    ContentCopy as CloneIcon,
    DataObject as DataObjectIcon,
    DeleteSweep as DeleteAllIcon,
    Delete as DeleteIcon,
    DeleteOutline as DeleteViewIcon,
    SwapHoriz as DistributeHIcon,
    SwapVert as DistributeVIcon,
    FileDownload as ExportIcon,
    AccountTree as FlowsIcon,
    FolderOpen as FolderOpenIcon,
    GridOff as GridOffIcon,
    GridOn as GridSnapIcon,
    FileUpload as ImportIcon,
    Menu as InspectorIcon,
    OpenInNew as OpenInNewIcon,
    Redo as RedoIcon,
    Save as SaveIcon,
    Undo as UndoIcon,
    Visibility as ViewsIcon,
    ZoomIn as ZoomInIcon,
    ZoomOut as ZoomOutIcon,
    RestartAlt as ZoomResetIcon,
    Settings as SettingsIcon,
    Height as HeightIcon
} from '@mui/icons-material';
import { AppBar, Box, Button, ButtonGroup, Divider, IconButton, MenuItem, Select, Tooltip, Typography } from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import type { ViewMode } from '../../shared/stores/useConfigStore';
import './CanvasToolbar.css';
import { ToolbarGroupComponent } from './Toolbar/ToolbarGroup';
import type { ToolbarGroup } from './Toolbar/types';

export interface CanvasToolbarProps {
  // View management
  currentViewName: string;
  onViewsClick: () => void;
  onCloneView: () => void;
  onDeleteView: () => void;
  onExportView?: () => void;
  onImportView?: (file: File) => void;
  onFileManagerClick: () => void;
  onVariablesClick?: () => void; // Phase 2 - Canvas Variables
  onFlowsClick?: () => void; // Phase 3 - Flow Builder
  onPromptTemplatesClick?: () => void; // AI Settings (Provider + Prompts)
  onSettingsClick?: () => void; // Canvas UI Settings (API keys etc.)
  
  // Mode switching
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  
  // Widget actions
  onAddWidget: () => void;
  
  // Edit actions
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  
  // Delete
  selectedCount: number;
  onDelete: () => void;
  onDeleteAllWidgets: () => void;
  widgetCount: number;
  
  // Save indicator
  isSaving: boolean;
  onSave: () => void;
  
  // Grid & Zoom
  gridSnap: boolean;
  showGrid: boolean;
  gridSize: number;
  gridColor: string;
  gridLineWidth: number;
  gridBrightness: number;
  zoom: number;
  onToggleGridSnap: () => void;
  onToggleShowGrid: () => void;
  onGridSizeChange: (size: number) => void;
  onGridColorChange: (color: string) => void;
  onGridLineWidthChange: (width: number) => void;
  onGridBrightnessChange: (brightness: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  
  // Inspector drawer
  drawerOpen: boolean;
  onToggleDrawer: () => void;
  
  // Alignment
  onAlignLeft: () => void;
  onAlignRight: () => void;
  onAlignTop: () => void;
  onAlignBottom: () => void;
  onAlignCenterH: () => void;
  onAlignCenterV: () => void;  onAlignToViewCenterH?: () => void;
  onAlignToViewCenterV?: () => void;  
  // Distribution
  onDistributeH: () => void;
  onDistributeV: () => void;
  // Same size
  onMakeSameWidth: () => void;
  onMakeSameHeight: () => void;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  currentViewName,
  onViewsClick,
  onCloneView,
  onDeleteView,
  onExportView,
  onImportView,
  onFileManagerClick,
  onVariablesClick,
  onFlowsClick,
  onPromptTemplatesClick,
  onSettingsClick,
  mode,
  onModeChange,
  onAddWidget,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  selectedCount,
  onDelete,
  onDeleteAllWidgets,
  widgetCount,
  isSaving,
  gridSnap,
  showGrid,
  gridSize,
  gridColor,
  gridLineWidth,
  gridBrightness,
  zoom,
  onToggleGridSnap,
  onToggleShowGrid,
  onGridSizeChange,
  onGridColorChange,
  onGridLineWidthChange,
  onGridBrightnessChange,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  drawerOpen,
  onToggleDrawer,
  onAlignLeft,
  onAlignRight,
  onAlignTop,
  onAlignBottom,
  onAlignCenterH,
  onAlignCenterV,
  onAlignToViewCenterH,
  onAlignToViewCenterV,
  onDistributeH,
  onDistributeV,
  onMakeSameWidth,
  onMakeSameHeight,
}) => {
  
  // Track sidebar width for dynamic positioning
  const [sidebarWidth, setSidebarWidth] = useState((window as any).HASidebarWidth || 56);

  useEffect(() => {
    console.log('[CanvasToolbar] Setting up sidebar width listener, initial width:', (window as any).HASidebarWidth);
    
    // Listen for sidebar width changes from the panel wrapper
    const handleSidebarChange = (event: CustomEvent) => {
      console.log('[CanvasToolbar] Sidebar width changed event received:', event.detail.width);
      setSidebarWidth(event.detail.width);
    };

    window.addEventListener('ha-sidebar-width-changed', handleSidebarChange as EventListener);
    
    return () => {
      console.log('[CanvasToolbar] Removing sidebar width listener');
      window.removeEventListener('ha-sidebar-width-changed', handleSidebarChange as EventListener);
    };
  }, []);
  
  // Open kiosk mode in HA panel (has access to Lovelace cards)
  const handleOpenKiosk = () => {
    const currentView = currentViewName.toLowerCase().replace(/\s+/g, '-');
    // Use HA panel URL so Lovelace cards work (hash-based navigation)
    const kioskUrl = `${window.location.origin}/canvas-kiosk#${currentView}`;
    window.open(kioskUrl, '_blank');
  };
  
  const groups: ToolbarGroup[] = useMemo(() => {
    const baseGroups: ToolbarGroup[] = [
      // View section
      {
        name: 'View',
        items: [
          [
            { type: 'text', text: currentViewName },
          ],
          [
            { 
              type: 'icon-button',
              icon: <ViewsIcon />,
              onAction: onViewsClick,
              tooltip: 'Views',
            },
          ],
          [            {
              type: 'icon-button',
              icon: <CloneIcon />,
              onAction: onCloneView,
              tooltip: 'Clone View',
            },
          ],
          ...(onExportView ? [[
            {
              type: 'icon-button' as const,
              icon: <ExportIcon />,
              onAction: onExportView,
              tooltip: 'Export View',
            },
          ]] : []),
          ...(onImportView ? [[
            {
              type: 'icon-button' as const,
              icon: <ImportIcon />,
              onAction: () => {
                // Trigger file input
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file && onImportView) {
                    onImportView(file);
                  }
                };
                input.click();
              },
              tooltip: 'Import View',
            },
          ]] : []),
          [
            {
              type: 'icon-button',
              icon: <DeleteViewIcon />,
              onAction: onDeleteView,
              tooltip: 'Delete View',
            },
          ],
        ],
      },
      // Tools section
      {
        name: 'Tools',
        items: [
          [
            {
              type: 'icon-button',
              icon: <FolderOpenIcon />,
              onAction: onFileManagerClick,
              tooltip: 'File Manager',
            },
          ],
          ...(onVariablesClick ? [[
            {
              type: 'icon-button' as const,
              icon: <DataObjectIcon />,
              onAction: onVariablesClick,
              tooltip: 'Canvas Variables',
            },
          ]] : []),
          ...(onFlowsClick ? [[
            {
              type: 'icon-button' as const,
              icon: <FlowsIcon />,
              onAction: onFlowsClick,
              tooltip: 'Flow Builder',
            },
          ]] : []),
          ...(onPromptTemplatesClick ? [[
            {
              type: 'icon-button' as const,
              icon: <AddCommentIcon />,
              onAction: onPromptTemplatesClick,
              tooltip: 'AI Settings',
            },
          ]] : []),
          ...(onSettingsClick ? [[
            {
              type: 'icon-button' as const,
              icon: <SettingsIcon />,
              onAction: onSettingsClick,
              tooltip: 'Canvas UI Settings',
            },
          ]] : []),
        ],
      },
      // Mode section
      {
        name: 'Mode',
        items: [
          [
            {
              type: 'custom',
              render: () => (
                <ButtonGroup size="small" sx={{ mx: 1 }}>
                  <Button
                    variant={mode === 'edit' ? 'contained' : 'outlined'}
                    onClick={() => onModeChange('edit')}
                    sx={{ fontSize: '12px', px: 1.5 }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant={mode === 'preview' ? 'contained' : 'outlined'}
                    onClick={() => onModeChange('preview')}
                    sx={{ fontSize: '12px', px: 1.5 }}
                  >
                    Preview
                  </Button>
                </ButtonGroup>
              ),
            },
          ],
          [
            {
              type: 'icon-button',
              icon: <OpenInNewIcon />,
              onAction: handleOpenKiosk,
              tooltip: 'Open Kiosk in New Window',
            },
          ],
        ],
      },
    ];

    // Only show edit tools in edit mode
    if (mode === 'edit') {
      baseGroups.push(
        // Widget section
        {
          name: 'Widget',
          items: [
            [
              { 
                type: 'icon-button',
                icon: <AddIcon />,
                onAction: onAddWidget,
                tooltip: 'Add Widget',
              },
            ],
            [
              { 
                type: 'icon-button',
                icon: <DeleteIcon />,
                onAction: onDelete,
                disabled: selectedCount === 0,
                tooltip: 'Delete (Del)',
              },
            ],
            [
              { 
                type: 'icon-button',
                icon: <DeleteAllIcon />,
                onAction: onDeleteAllWidgets,
                disabled: widgetCount === 0,
                tooltip: 'Delete All Widgets',
              },
            ],
          ],
        },
        // Edit section
        {
          name: 'Edit',
          items: [
            [
              { 
                type: 'icon-button',
                icon: <UndoIcon />,
                onAction: onUndo,
                disabled: !canUndo,
                tooltip: 'Undo (Ctrl+Z)',
              },
              { 
                type: 'icon-button',
                icon: <RedoIcon />,
                onAction: onRedo,
                disabled: !canRedo,
                tooltip: 'Redo (Ctrl+Shift+Z)',
              },
            ],
          ],
        },
        // Align section
        {
          name: 'Align',
          items: [
            [
              { 
                type: 'icon-button',
                icon: <AlignHorizontalLeft />,
                onAction: onAlignLeft,
                disabled: selectedCount < 2,
            tooltip: 'Align Left',
          },
          { 
            type: 'icon-button',
            icon: <AlignHorizontalCenter />,
            onAction: onAlignCenterH,
            disabled: selectedCount < 2,
            tooltip: 'Align Center Horizontal',
          },
          { 
            type: 'icon-button',
            icon: <AlignHorizontalRight />,
            onAction: onAlignRight,
            disabled: selectedCount < 2,
            tooltip: 'Align Right',
          },
        ],
        [
          { 
            type: 'icon-button',
            icon: <AlignVerticalTop />,
            onAction: onAlignTop,
            disabled: selectedCount < 2,
            tooltip: 'Align Top',
          },
          { 
            type: 'icon-button',
            icon: <AlignVerticalCenter />,
            onAction: onAlignCenterV,
            disabled: selectedCount < 2,
            tooltip: 'Align Center Vertical',
          },
          { 
            type: 'icon-button',
            icon: <AlignVerticalBottom />,
            onAction: onAlignBottom,
            disabled: selectedCount < 2,
            tooltip: 'Align Bottom',
          },
        ],
        ...(onAlignToViewCenterH && onAlignToViewCenterV ? [[
          { 
            type: 'icon-button' as const,
            icon: <CenterOnViewIcon sx={{ transform: 'rotate(90deg)' }} />,
            onAction: onAlignToViewCenterH,
            disabled: selectedCount !== 1,
            tooltip: 'Center on View Horizontally',
          },
          { 
            type: 'icon-button' as const,
            icon: <CenterOnViewIcon />,
            onAction: onAlignToViewCenterV,
            disabled: selectedCount !== 1,
            tooltip: 'Center on View Vertically',
          },
        ]] : []),
        [
          { 
            type: 'icon-button',
            icon: <DistributeHIcon />,
            onAction: onDistributeH,
            disabled: selectedCount < 3,
            tooltip: 'Distribute Horizontal',
          },
          { 
            type: 'icon-button',
            icon: <DistributeVIcon />,
            onAction: onDistributeV,
            disabled: selectedCount < 3,
            tooltip: 'Distribute Vertical',
          },
        ],
        [
          {
            type: 'icon-button' as const,
            icon: <HeightIcon sx={{ transform: 'rotate(90deg)' }} />,
            onAction: onMakeSameWidth,
            disabled: selectedCount < 2,
            tooltip: 'Make Same Width (matches first selected)',
          },
          {
            type: 'icon-button' as const,
            icon: <HeightIcon />,
            onAction: onMakeSameHeight,
            disabled: selectedCount < 2,
            tooltip: 'Make Same Height (matches first selected)',
          },
        ],
      ],
    },
    // Grid section
    {
      name: 'Grid',
      items: [
        [
          { 
            type: 'icon-button',
            icon: gridSnap ? <GridSnapIcon /> : <GridOffIcon />,
            onAction: onToggleGridSnap,
            selected: gridSnap,
            tooltip: 'Snap to Grid',
          },
          { 
            type: 'icon-button',
            icon: <GridSnapIcon />,
            onAction: onToggleShowGrid,
            selected: showGrid,
            tooltip: 'Show Grid',
          },
        ],
        [
          {
            type: 'custom' as const,
            render: () => (
              <Tooltip title="Grid Size">
                <Select
                  value={gridSize}
                  onChange={(e) => onGridSizeChange(Number(e.target.value))}
                  size="small"
                  variant="outlined"
                  sx={{
                    fontSize: '0.75rem',
                    height: 24,
                    minWidth: 58,
                    color: 'inherit',
                    '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.6)' },
                    '.MuiSvgIcon-root': { color: 'inherit' },
                  }}
                >
                  {[1, 2, 3, 4, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map(s => (
                    <MenuItem key={s} value={s} sx={{ fontSize: '0.8rem' }}>{s}px</MenuItem>
                  ))}
                </Select>
              </Tooltip>
            ),
          },
          {
            type: 'custom' as const,
            render: () => (
              <Tooltip title="Grid Line Width">
                <Select
                  value={gridLineWidth}
                  onChange={(e) => onGridLineWidthChange(Number(e.target.value))}
                  size="small"
                  variant="outlined"
                  sx={{
                    fontSize: '0.75rem',
                    height: 24,
                    minWidth: 54,
                    color: 'inherit',
                    '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.6)' },
                    '.MuiSvgIcon-root': { color: 'inherit' },
                  }}
                >
                  {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].map(w => (
                    <MenuItem key={w} value={w} sx={{ fontSize: '0.8rem' }}>{w}px</MenuItem>
                  ))}
                </Select>
              </Tooltip>
            ),
          },
          {
            type: 'custom' as const,
            render: () => (
              <Tooltip title="Grid Brightness">
                <Select
                  value={gridBrightness}
                  onChange={(e) => onGridBrightnessChange(Number(e.target.value))}
                  size="small"
                  variant="outlined"
                  sx={{
                    fontSize: '0.75rem',
                    height: 24,
                    minWidth: 54,
                    color: 'inherit',
                    '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.6)' },
                    '.MuiSvgIcon-root': { color: 'inherit' },
                  }}
                >
                  {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].map(b => (
                    <MenuItem key={b} value={b} sx={{ fontSize: '0.8rem' }}>{Math.round(b * 100)}%</MenuItem>
                  ))}
                </Select>
              </Tooltip>
            ),
          },
          {
            type: 'custom' as const,
            render: () => (
              <Tooltip title="Grid Color">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <input
                    type="color"
                    value={gridColor}
                    onChange={(e) => onGridColorChange(e.target.value)}
                    style={{
                      width: 24,
                      height: 24,
                      padding: 0,
                      border: '1px solid rgba(255,255,255,0.3)',
                      borderRadius: 4,
                      cursor: 'pointer',
                      backgroundColor: 'transparent',
                    }}
                  />
                </Box>
              </Tooltip>
            ),
          },
        ],
      ],
    },
    // Zoom section
    {
      name: 'Zoom',
      items: [
        [
          { 
            type: 'icon-button',
            icon: <ZoomOutIcon />,
            onAction: onZoomOut,
            disabled: zoom <= 50,
            tooltip: 'Zoom Out',
          },
          { 
            type: 'icon-button',
            icon: <ZoomInIcon />,
            onAction: onZoomIn,
            disabled: zoom >= 200,
            tooltip: 'Zoom In',
          },
        ],
        [
          { type: 'text', text: `${zoom}%` },
          { 
            type: 'icon-button',
            icon: <ZoomResetIcon />,
            onAction: onZoomReset,
            disabled: zoom === 100,
            tooltip: 'Reset Zoom',
          },
        ],
      ],
    });
    }
    
    return baseGroups;
  }, [
    currentViewName, onViewsClick, onCloneView, onDeleteView, onExportView, onImportView, onFileManagerClick, onVariablesClick, onFlowsClick, onPromptTemplatesClick, onSettingsClick, mode, onModeChange, handleOpenKiosk, onAddWidget, canUndo, canRedo, onUndo, onRedo, onMakeSameWidth, onMakeSameHeight,
    selectedCount, onDelete, onDeleteAllWidgets, widgetCount, gridSnap, showGrid, gridSize, gridColor, gridLineWidth, gridBrightness, zoom,
    onToggleGridSnap, onToggleShowGrid, onGridSizeChange, onGridColorChange, onGridLineWidthChange, onGridBrightnessChange, onZoomIn, onZoomOut, onZoomReset,
    onAlignLeft, onAlignRight, onAlignTop, onAlignBottom, onAlignCenterH, onAlignCenterV, onAlignToViewCenterH, onAlignToViewCenterV,
    onDistributeH, onDistributeV,
  ]);

  // Toolbar style with dynamic sidebar offset
  const toolbarStyle = {
    left: `${sidebarWidth}px`,
    width: `calc(100% - ${sidebarWidth}px)`,
    transition: 'left 0.2s ease, width 0.2s ease',
  };

  return (
    <AppBar position="fixed" className="canvas-toolbar-wrapper" elevation={0} sx={toolbarStyle}>
      <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1 }}>
        {groups.map((group, index) => (
          <ToolbarGroupComponent key={index} group={group} last={index === groups.length - 1} />
        ))}
        
        <Box sx={{ flexGrow: 1 }} />
        
        {/* Right side - version + Save indicator */}
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', mr: 2, fontFamily: 'monospace', fontSize: '0.7rem' }}>
          v{__APP_VERSION__}
        </Typography>

        {isSaving && (
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
            <SaveIcon sx={{ fontSize: 18, mr: 1, color: '#4caf50' }} />
            <Typography variant="body2" sx={{ color: '#4caf50' }}>Saving...</Typography>
          </Box>
        )}
        
        <Divider orientation="vertical" flexItem sx={{ mx: 1, bgcolor: 'rgba(255, 255, 255, 0.2)' }} />
        
        {/* Inspector toggle */}
        <Tooltip title="Inspector">
          <IconButton
            onClick={onToggleDrawer}
            sx={{
              color: drawerOpen ? 'primary.main' : 'inherit',
              backgroundColor: drawerOpen ? 'rgba(33, 150, 243, 0.2)' : 'transparent',
            }}
          >
            <InspectorIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </AppBar>
  );
};
