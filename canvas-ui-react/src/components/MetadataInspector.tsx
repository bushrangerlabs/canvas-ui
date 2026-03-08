/**
 * Metadata-Driven React Inspector
 * 
 * Dynamically generates inspector UI from widget metadata (configSchema)
 * Supports all field types, conditional visibility, and category grouping
 */
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Paper,
    Typography,
} from '@mui/material';
import React from 'react';
import { useWidgetStore } from '../store/widgetStore';
import { DynamicFieldRenderer, type FieldDefinition } from './DynamicFieldRenderer';

/**
 * Widget manifest structure
 */
interface WidgetManifest {
  type: string;
  name: string;
  configSchema: Record<string, FieldDefinition>;
  features?: string[];
}

/**
 * Group fields by category
 */
function groupFieldsByCategory(
  configSchema: Record<string, FieldDefinition>
): Record<string, Array<{ name: string; def: FieldDefinition }>> {
  const groups: Record<string, Array<{ name: string; def: FieldDefinition }>> = {};

  Object.entries(configSchema).forEach(([name, def]) => {
    const category = def.category || 'General';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push({ name, def });
  });

  return groups;
}

export const MetadataInspector: React.FC = () => {
  const { selectedWidget } = useWidgetStore();

  if (!selectedWidget) {
    return (
      <Box
        sx={{
          p: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Select a widget to view properties
        </Typography>
      </Box>
    );
  }

  // TODO: In production, get manifest from widget.getMetadata() via bridge
  // For now, we'll need the widget to send its manifest when selected
  const manifest = selectedWidget.metadata as WidgetManifest | undefined;

  if (!manifest || !manifest.configSchema) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Widget metadata not available
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Widget ID: {selectedWidget.id}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Type: {selectedWidget.type}
        </Typography>
      </Box>
    );
  }

  const groupedFields = groupFieldsByCategory(manifest.configSchema);

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6">{manifest.name}</Typography>
        <Typography variant="caption" color="text.secondary">
          {selectedWidget.id}
        </Typography>
      </Paper>

      {Object.entries(groupedFields).map(([category, fields]) => (
        <Accordion key={category} defaultExpanded={category === 'General'}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">{category}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              {fields.map(({ name, def }) => (
                <DynamicFieldRenderer
                  key={name}
                  fieldName={name}
                  fieldDef={def}
                  widgetConfig={selectedWidget.config}
                />
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};
