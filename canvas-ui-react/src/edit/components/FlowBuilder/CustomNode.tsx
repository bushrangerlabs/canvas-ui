/**
 * CustomNode Component - Base component for all custom node types
 * Displays node with handles, icon, label, and configuration
 */

import { Settings as SettingsIcon } from '@mui/icons-material';
import { Box, IconButton, Paper, Typography } from '@mui/material';
import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { formatWidgetDisplay } from '../../../shared/flows/widgetDisplayUtils';
import { useConfigStore } from '../../../shared/stores/useConfigStore';
import type { FlowNodeData } from '../../../shared/types/flow';
import { getNodeMetadata } from '../../../shared/types/nodeRegistry';

interface CustomNodeProps {
  data: FlowNodeData;
  id: string;
  onConfigure?: (nodeId: string) => void;
}

export const CustomNode: React.FC<CustomNodeProps> = memo(({ data, id, onConfigure }) => {
  const metadata = getNodeMetadata(data.nodeType);
  const { config: appConfig, currentViewId } = useConfigStore();
  
  // Get current view's widgets for name resolution
  const currentView = appConfig?.views.find(v => v.id === currentViewId);
  const widgets = currentView?.widgets || [];

  if (!metadata) {
    return (
      <Paper sx={{ p: 1, bgcolor: 'error.main' }}>
        <Typography variant="caption">Unknown node type</Typography>
      </Paper>
    );
  }
  
  // Format config display with widget custom names
  const getConfigDisplay = () => {
    if (!data.config || Object.keys(data.config).length === 0) {
      return null;
    }
    
    // If config has widget_id, format it with custom name
    if (data.config.widget_id) {
      const widgetDisplay = formatWidgetDisplay(data.config.widget_id, widgets);
      const property = data.config.property ? `.${data.config.property}` : '';
      return `${widgetDisplay}${property}`;
    }
    
    // Otherwise show raw config (truncated)
    return JSON.stringify(data.config).substring(0, 30) + '...';
  };

  return (
    <Paper
      elevation={3}
      sx={{
        minWidth: 180,
        bgcolor: metadata.color,
        color: 'white',
        border: '2px solid',
        borderColor: 'rgba(255, 255, 255, 0.3)',
        '&:hover': {
          borderColor: 'rgba(255, 255, 255, 0.6)',
        },
      }}
    >
      {/* Input Handles */}
      {metadata.inputs > 0 &&
        Array.from({ length: metadata.inputs }).map((_, i) => (
          <Handle
            key={`input-${i}`}
            type="target"
            position={Position.Left}
            id={`input-${i}`}
            style={{
              top: `${((i + 1) / (metadata.inputs + 1)) * 100}%`,
              background: '#fff',
              border: '2px solid ' + metadata.color,
            }}
          />
        ))}

      {/* Node Content */}
      <Box sx={{ p: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" sx={{ fontWeight: 'bold', fontSize: '0.7rem' }}>
            {metadata.label.toUpperCase()}
          </Typography>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onConfigure?.(id);
            }}
            sx={{
              p: 0.25,
              color: 'white',
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' },
            }}
          >
            <SettingsIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Box>
        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
          {data.label}
        </Typography>
        {data.config && Object.keys(data.config).length > 0 && (
          <Typography variant="caption" sx={{ fontSize: '0.65rem', opacity: 0.8 }}>
            {getConfigDisplay()}
          </Typography>
        )}
      </Box>

      {/* Output Handles */}
      {metadata.outputs > 0 &&
        Array.from({ length: metadata.outputs }).map((_, i) => (
          <Handle
            key={`output-${i}`}
            type="source"
            position={Position.Right}
            id={`output-${i}`}
            style={{
              top: `${((i + 1) / (metadata.outputs + 1)) * 100}%`,
              background: '#fff',
              border: '2px solid ' + metadata.color,
            }}
          />
        ))}
    </Paper>
  );
});

CustomNode.displayName = 'CustomNode';
