/**
 * FlowTriggers Component - Display auto-generated flow triggers
 * Shows triggers that are automatically created from node connections
 */

import AutoModeIcon from '@mui/icons-material/AutoMode';
import InfoIcon from '@mui/icons-material/Info';
import {
    Alert,
    Box,
    Chip,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import React from 'react';
import { formatWidgetDisplay } from '../../../shared/flows/widgetDisplayUtils';
import type { FlowTriggerConfig } from '../../../shared/types/flow';

interface FlowTriggersProps {
  triggers: FlowTriggerConfig[];
  widgets: any[]; // All widgets from current view
  entities: Record<string, any>; // All HA entities
  variables: Record<string, any>; // All canvas variables
  onTriggersChange: (triggers: FlowTriggerConfig[]) => void;
}

const TRIGGER_TYPE_LABELS: Record<string, string> = {
  manual: 'Manual',
  'widget-change': 'Widget Change',
  'entity-change': 'Entity Change',
  'variable-change': 'Variable Change',
  'time-interval': 'Time Interval',
  'time-schedule': 'Time Schedule (Cron)',
};

export const FlowTriggers: React.FC<FlowTriggersProps> = ({
  triggers,
  widgets,
}) => {
  const getTriggerDescription = (trigger: FlowTriggerConfig): string => {
    switch (trigger.type) {
      case 'widget-change': {
        const widgetId = trigger.config?.widgetId || '';
        // Use centralized display formatter
        const widgetDisplay = formatWidgetDisplay(widgetId, widgets);
        const prop = trigger.config?.property || 'any property';
        return `${widgetDisplay}.${prop}`;
      }
      case 'entity-change':
        return trigger.config?.entityId || 'Unknown entity';
      case 'variable-change':
        return trigger.config?.variableName || 'Unknown variable';
      case 'time-interval':
        return `Every ${trigger.config?.interval || 60000}ms`;
      case 'time-schedule':
        return trigger.config?.cron || 'Unknown schedule';
      case 'manual':
        return 'Manual execution only';
      default:
        return 'Unknown';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <AutoModeIcon color="primary" />
        <Typography variant="h6">Auto-Generated Triggers</Typography>
      </Box>

      <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3 }}>
        Triggers are automatically created from your flow nodes. Add a widget-property node with a runtime property (like runtime.value) and it will auto-create a trigger when you save.
      </Alert>

      {triggers.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'background.default' }}>
          <Typography variant="body2" color="text.secondary" paragraph>
            No triggers yet. Add nodes to your flow to auto-generate triggers.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Example: Add a widget-property node → select a slider → select "runtime.value" property
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Configuration</TableCell>
                <TableCell>Source</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {triggers.map((trigger, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Chip
                      label={TRIGGER_TYPE_LABELS[trigger.type]}
                      size="small"
                      color={trigger.type === 'manual' ? 'default' : 'primary'}
                      icon={<AutoModeIcon />}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {getTriggerDescription(trigger)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      Auto-generated
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};
