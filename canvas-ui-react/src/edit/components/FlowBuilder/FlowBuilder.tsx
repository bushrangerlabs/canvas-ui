/**
 * FlowBuilder Component - Main flow management interface
 * Drawer with tabs: Flow List, Flow Canvas, and Triggers
 */

import { Close as CloseIcon, DataObject as DataObjectIcon } from '@mui/icons-material';
import {
    Box,
    Drawer,
    IconButton,
    Tab,
    Tabs,
    Tooltip,
    Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { useWebSocket } from '../../../shared/providers/WebSocketProvider';
import { useConfigStore } from '../../../shared/stores/useConfigStore';
import type { FlowTriggerConfig } from '../../../shared/types/flow';
import { FlowCanvas } from './FlowCanvas';
import { FlowList } from './FlowList';
import { FlowTriggers } from './FlowTriggers';

interface FlowBuilderProps {
  open: boolean;
  onClose: () => void;
  onSave?: () => void;
  onVariablesClick?: () => void;
}

export const FlowBuilder: React.FC<FlowBuilderProps> = ({ open, onClose, onSave, onVariablesClick }) => {
  const [activeTab, setActiveTab] = useState<'list' | 'canvas' | 'triggers'>('list');
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
  const { config, currentViewId, setFlow, listVariables } = useConfigStore();
  const { entities } = useWebSocket();

  const handleEditFlow = (flowId: string) => {
    setSelectedFlowId(flowId);
    setActiveTab('canvas');
  };

  const handleConfigureTriggers = (flowId: string) => {
    setSelectedFlowId(flowId);
    setActiveTab('triggers');
  };

  // Get current flow
  const currentFlow = selectedFlowId ? config?.flows?.[selectedFlowId] : null;
  
  // Get current view widgets
  const currentView = config?.views.find(v => v.id === currentViewId);
  const widgets = currentView?.widgets || [];
  
  // Get variables
  const variables = listVariables();

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      disableEscapeKeyDown={false}
      ModalProps={{
        keepMounted: true,
        BackdropProps: {
          invisible: true, // Hide backdrop so clicking outside doesn't close
        },
      }}
      PaperProps={{
        sx: {
          width: '80vw',
          maxWidth: '1200px',
          top: '64px', // Offset below toolbar (MUI AppBar default height)
          height: 'calc(100% - 64px)', // Adjust height to fit below toolbar
        },
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Typography variant="h6">Flow Builder</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {onVariablesClick && (
              <Tooltip title="Manage Variables">
                <IconButton onClick={onVariablesClick} size="small">
                  <DataObjectIcon />
                </IconButton>
              </Tooltip>
            )}
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
            <Tab label="Flow List" value="list" />
            <Tab
              label="Flow Canvas"
              value="canvas"
              disabled={!selectedFlowId}
            />
            <Tab
              label="Triggers"
              value="triggers"
              disabled={!selectedFlowId}
            />
          </Tabs>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {activeTab === 'list' && (
            <FlowList 
              onEditFlow={handleEditFlow} 
              onConfigureTriggers={handleConfigureTriggers}
              onSave={onSave} 
            />
          )}
          {activeTab === 'canvas' && <FlowCanvas flowId={selectedFlowId} onSave={onSave} />}
          {activeTab === 'triggers' && currentFlow && (
            <FlowTriggers
              triggers={currentFlow.triggers || []}
              widgets={widgets}
              entities={entities || {}}
              variables={variables}
              onTriggersChange={(triggers: FlowTriggerConfig[]) => {
                if (currentFlow) {
                  setFlow({
                    ...currentFlow,
                    triggers,
                    metadata: {
                      createdAt: currentFlow.metadata?.createdAt || Date.now(),
                      updatedAt: Date.now(),
                    },
                  });
                  onSave?.();
                }
              }}
            />
          )}
        </Box>
      </Box>
    </Drawer>
  );
};
