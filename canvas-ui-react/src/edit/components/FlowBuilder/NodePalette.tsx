/**
 * NodePalette Component - Drag-drop node palette for Flow Builder
 * Organized by category: Input, Processing, Output
 */

import {
    AccountTree,
    BugReport,
    Calculate,
    CallSplit,
    Code,
    CompareArrows,
    DataObject,
    ExpandMore,
    Http,
    Input as InputIcon,
    Loop,
    PlayArrow,
    Schedule,
    Sensors,
    Storage,
    TextFields,
    Timer,
    Widgets,
} from '@mui/icons-material';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Typography,
} from '@mui/material';
import React from 'react';
import type { FlowNodeType } from '../../../shared/types/flow';
import { getNodesByCategory } from '../../../shared/types/nodeRegistry';

const ICON_MAP: Record<string, React.ReactElement> = {
  Widgets: <Widgets fontSize="small" />,
  Sensors: <Sensors fontSize="small" />,
  DataObject: <DataObject fontSize="small" />,
  Schedule: <Schedule fontSize="small" />,
  Input: <InputIcon fontSize="small" />,
  Http: <Http fontSize="small" />,
  Calculate: <Calculate fontSize="small" />,
  TextFields: <TextFields fontSize="small" />,
  CompareArrows: <CompareArrows fontSize="small" />,
  AccountTree: <AccountTree fontSize="small" />,
  CallSplit: <CallSplit fontSize="small" />,
  Loop: <Loop fontSize="small" />,
  Timer: <Timer fontSize="small" />,
  Code: <Code fontSize="small" />,
  PlayArrow: <PlayArrow fontSize="small" />,
  Storage: <Storage fontSize="small" />,
  BugReport: <BugReport fontSize="small" />,
};

export const NodePalette: React.FC = () => {
  const inputNodes = getNodesByCategory('input');
  const processingNodes = getNodesByCategory('processing');
  const outputNodes = getNodesByCategory('output');

  const onDragStart = (event: React.DragEvent, nodeType: FlowNodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <Box
      sx={{
        width: 280,
        height: '100%',
        borderRight: 1,
        borderColor: 'divider',
        overflowY: 'auto',
        bgcolor: 'background.paper',
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">Node Palette</Typography>
        <Typography variant="caption" color="text.secondary">
          Drag nodes to canvas
        </Typography>
      </Box>

      {/* Input Nodes */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography>📥 Input Nodes</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0 }}>
          <List dense>
            {inputNodes.map((node) => (
              <ListItem
                key={node.type}
                draggable
                onDragStart={(e) => onDragStart(e, node.type)}
                sx={{
                  cursor: 'grab',
                  '&:hover': { bgcolor: 'action.hover' },
                  '&:active': { cursor: 'grabbing' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {ICON_MAP[node.icon]}
                </ListItemIcon>
                <ListItemText
                  primary={node.label}
                  secondary={node.description}
                  primaryTypographyProps={{ variant: 'body2' }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>

      {/* Processing Nodes */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography>⚙️ Processing Nodes</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0 }}>
          <List dense>
            {processingNodes.map((node) => (
              <ListItem
                key={node.type}
                draggable
                onDragStart={(e) => onDragStart(e, node.type)}
                sx={{
                  cursor: 'grab',
                  '&:hover': { bgcolor: 'action.hover' },
                  '&:active': { cursor: 'grabbing' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {ICON_MAP[node.icon]}
                </ListItemIcon>
                <ListItemText
                  primary={node.label}
                  secondary={node.description}
                  primaryTypographyProps={{ variant: 'body2' }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>

      {/* Output Nodes */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography>📤 Output Nodes</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0 }}>
          <List dense>
            {outputNodes.map((node) => (
              <ListItem
                key={node.type}
                draggable
                onDragStart={(e) => onDragStart(e, node.type)}
                sx={{
                  cursor: 'grab',
                  '&:hover': { bgcolor: 'action.hover' },
                  '&:active': { cursor: 'grabbing' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {ICON_MAP[node.icon]}
                </ListItemIcon>
                <ListItemText
                  primary={node.label}
                  secondary={node.description}
                  primaryTypographyProps={{ variant: 'body2' }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};
