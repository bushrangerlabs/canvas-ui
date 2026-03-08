/**
 * FlowCanvas Component - React Flow canvas with node editor
 * Visual programming interface with drag-drop nodes
 */

import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Paper, Tooltip, Typography } from '@mui/material';
import React, { useCallback, useRef, useState } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    ReactFlowProvider,
    addEdge,
    useEdgesState,
    useNodesState,
    useReactFlow,
    type Connection,
    type EdgeChange,
    type Node,
    type NodeChange,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { generateAutoTriggers } from '../../../shared/flows/autoTriggers';
import { useConfigStore } from '../../../shared/stores/useConfigStore';
import type { FlowDefinition, FlowNodeData, FlowNodeType } from '../../../shared/types/flow';
import { getNodeMetadata } from '../../../shared/types/nodeRegistry';
import { CustomNode } from './CustomNode';
import { NodeConfigPanel } from './NodeConfigPanel';
import { NodePalette } from './NodePalette';

interface FlowCanvasProps {
  flowId: string | null;
  onSave?: () => void;
}

const FlowCanvasInner: React.FC<FlowCanvasProps> = ({ flowId, onSave }) => {
  const { getFlow, setFlow } = useConfigStore();
  const flow = flowId ? getFlow(flowId) : null;
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState(flow?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flow?.edges || []);
  const [configPanelOpen, setConfigPanelOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  // Delete confirmation dialog state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeletes, setPendingDeletes] = useState<{
    nodes?: NodeChange[];
    edges?: EdgeChange[];
  } | null>(null);
  
  // Track if we're syncing FROM store (to prevent circular updates)
  const isSyncingFromStore = useRef(false);
  
  // Track last saved state to prevent unnecessary saves
  const lastSavedState = useRef<{ nodes: any[]; edges: any[] } | null>(null);

  // Intercept node changes to add confirmation for deletes
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    const deleteChanges = changes.filter(c => c.type === 'remove');
    const otherChanges = changes.filter(c => c.type !== 'remove');
    
    // Apply non-delete changes immediately
    if (otherChanges.length > 0) {
      onNodesChange(otherChanges);
    }
    
    // Show confirmation for deletes
    if (deleteChanges.length > 0) {
      setPendingDeletes({ nodes: deleteChanges });
      setDeleteConfirmOpen(true);
    }
  }, [onNodesChange]);

  // Intercept edge changes to add confirmation for deletes
  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    const deleteChanges = changes.filter(c => c.type === 'remove');
    const otherChanges = changes.filter(c => c.type !== 'remove');
    
    // Apply non-delete changes immediately
    if (otherChanges.length > 0) {
      onEdgesChange(otherChanges);
    }
    
    // Show confirmation for deletes
    if (deleteChanges.length > 0) {
      setPendingDeletes({ edges: deleteChanges });
      setDeleteConfirmOpen(true);
    }
  }, [onEdgesChange]);

  // Handle delete confirmation
  const handleConfirmDelete = useCallback(() => {
    if (pendingDeletes?.nodes) {
      onNodesChange(pendingDeletes.nodes);
    }
    if (pendingDeletes?.edges) {
      onEdgesChange(pendingDeletes.edges);
    }
    setDeleteConfirmOpen(false);
    setPendingDeletes(null);
  }, [pendingDeletes, onNodesChange, onEdgesChange]);

  const handleCancelDelete = useCallback(() => {
    setDeleteConfirmOpen(false);
    setPendingDeletes(null);
  }, []);

  // Handle delete button click
  const handleDeleteSelected = useCallback(() => {
    const selectedNodes = nodes.filter(node => node.selected);
    const selectedEdges = edges.filter(edge => edge.selected);
    
    if (selectedNodes.length === 0 && selectedEdges.length === 0) {
      return; // Nothing selected
    }
    
    const nodeChanges: NodeChange[] = selectedNodes.map(node => ({
      type: 'remove' as const,
      id: node.id,
    }));
    
    const edgeChanges: EdgeChange[] = selectedEdges.map(edge => ({
      type: 'remove' as const,
      id: edge.id,
    }));
    
    // Trigger confirmation dialog
    setPendingDeletes({
      nodes: nodeChanges.length > 0 ? nodeChanges : undefined,
      edges: edgeChanges.length > 0 ? edgeChanges : undefined,
    });
    setDeleteConfirmOpen(true);
  }, [nodes, edges]);

  // Check if any nodes or edges are selected
  const hasSelection = nodes.some(n => n.selected) || edges.some(e => e.selected);

  // Create node types with onConfigure callback
  const nodeTypes = React.useMemo(
    () => ({
      'custom-node': (props: any) => (
        <CustomNode
          {...props}
          onConfigure={(nodeId: string) => {
            setSelectedNodeId(nodeId);
            setConfigPanelOpen(true);
          }}
        />
      ),
    }),
    []
  );

  // Sync nodes/edges when flowId changes or when flow data changes externally (e.g., NodeConfigPanel updates)
  React.useEffect(() => {
    if (flow) {
      // Check if the flow data in store differs from our local state
      const storeNodesStr = JSON.stringify(flow.nodes || []);
      const localNodesStr = JSON.stringify(nodes);
      const storeEdgesStr = JSON.stringify(flow.edges || []);
      const localEdgesStr = JSON.stringify(edges);
      
      const flowDataChanged = storeNodesStr !== localNodesStr || storeEdgesStr !== localEdgesStr;
      
      if (flowDataChanged) {
        if (import.meta.env.DEV) console.log('[FlowCanvas] Loading flow from store:', {
          flowId,
          nodeCount: flow.nodes?.length,
        });
        isSyncingFromStore.current = true;
        setNodes(flow.nodes || []);
        setEdges(flow.edges || []);
        // Update last saved state to match loaded flow
        lastSavedState.current = {
          nodes: flow.nodes || [],
          edges: flow.edges || [],
        };
        // Reset flag after sync completes
        setTimeout(() => {
          isSyncingFromStore.current = false;
        }, 0);
      }
    }
  }, [flowId, flow]); // Watch both flowId and flow object for changes

  // Update flow when nodes/edges change (but not during store sync)
  React.useEffect(() => {
    if (flow && flowId && !isSyncingFromStore.current) {
      // Check if nodes/edges actually changed (deep equality)
      const nodesChanged = JSON.stringify(lastSavedState.current?.nodes) !== JSON.stringify(nodes);
      const edgesChanged = JSON.stringify(lastSavedState.current?.edges) !== JSON.stringify(edges);
      
      if (nodesChanged || edgesChanged) {
        if (import.meta.env.DEV) console.log('[FlowCanvas] Saving user changes to store');
        
        // Create updated flow with auto-generated triggers
        const updatedFlow: FlowDefinition = {
          ...flow,
          nodes: nodes as any,
          edges: edges as any,
        };
        
        // Auto-generate triggers from node configuration
        const autoGeneratedTriggers = generateAutoTriggers(updatedFlow);
        updatedFlow.triggers = autoGeneratedTriggers;
        
        if (import.meta.env.DEV) console.log(`[FlowCanvas] Auto-generated ${autoGeneratedTriggers.length} trigger(s)`);
        
        setFlow(updatedFlow);
        onSave?.(); // Save to HA
        
        // Update last saved state
        lastSavedState.current = { nodes, edges };
      }
    }
  }, [nodes, edges]);

  // Handle new connections
  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges]
  );

  // Handle drag over
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle drop - create new node
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const nodeType = event.dataTransfer.getData('application/reactflow') as FlowNodeType;
      if (!nodeType) return;

      const metadata = getNodeMetadata(nodeType);
      if (!metadata) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node<FlowNodeData> = {
        id: `node_${Date.now()}`,
        type: 'custom-node',
        position,
        data: {
          category: metadata.category,
          nodeType,
          label: metadata.label,
          config: {},
          outputs: {},
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes]
  );

  if (!flowId || !flow) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
        }}
      >
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Select a flow from the list or create a new one
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', width: '100%', display: 'flex' }}>
      <NodePalette />
      <Box ref={reactFlowWrapper} sx={{ flex: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-right"
          deleteKeyCode={['Backspace', 'Delete']}
          multiSelectionKeyCode="Control"
          selectNodesOnDrag={false}
        >
          <Background />
          <Controls />
          <MiniMap />
          
          {/* Delete Button */}
          {hasSelection && (
            <Box
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                zIndex: 10,
              }}
            >
              <Tooltip title="Delete selected (Del)">
                <IconButton
                  onClick={handleDeleteSelected}
                  color="error"
                  sx={{
                    bgcolor: 'background.paper',
                    boxShadow: 2,
                    '&:hover': {
                      bgcolor: 'error.main',
                      color: 'white',
                    },
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </ReactFlow>
      </Box>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleCancelDelete}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            {pendingDeletes?.nodes 
              ? `Are you sure you want to delete ${pendingDeletes.nodes.length} node${pendingDeletes.nodes.length > 1 ? 's' : ''}? This action cannot be undone.`
              : `Are you sure you want to delete ${pendingDeletes?.edges?.length || 0} connection${(pendingDeletes?.edges?.length || 0) > 1 ? 's' : ''}? This action cannot be undone.`
            }
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Node Configuration Panel */}
      {flowId && (
        <NodeConfigPanel
          open={configPanelOpen}
          nodeId={selectedNodeId}
          flowId={flowId}
          onSave={onSave}
          onClose={() => {
            setConfigPanelOpen(false);
            setSelectedNodeId(null);
          }}
        />
      )}
    </Box>
  );
};

export const FlowCanvas: React.FC<FlowCanvasProps> = ({ flowId, onSave }) => {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner flowId={flowId} onSave={onSave} />
    </ReactFlowProvider>
  );
};
