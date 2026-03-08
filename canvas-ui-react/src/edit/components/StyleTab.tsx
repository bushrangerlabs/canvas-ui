/**
 * StyleTab Component
 * Universal styling controls for all widgets: Position, Background, Border, Shadow
 */

import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    TextField,
    Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import type { WidgetConfig } from '../../shared/types';
import type { UniversalStyle } from '../../shared/types/universal-widget';

interface StyleTabProps {
  widget: WidgetConfig;
  onUpdate: (updates: Partial<WidgetConfig>) => void;
}

export const StyleTab: React.FC<StyleTabProps> = ({ widget, onUpdate }) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    Position: true,
    Background: false,
    Border: false,
    Shadow: false,
  });
  const [colorPickerField, setColorPickerField] = useState<string | null>(null);

  const style = widget.config.style || {};

  const handleSectionChange = (section: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedSections(prev => ({ ...prev, [section]: isExpanded }));
  };

  const handleStyleChange = (property: keyof UniversalStyle, value: any) => {
    onUpdate({
      config: {
        ...widget.config,
        style: {
          ...style,
          [property]: value,
        },
      },
    });
  };

  const renderColorField = (label: string, property: keyof UniversalStyle, value: string = '') => (
    <Box sx={{ mb: 2 }}>
      <TextField
        fullWidth
        label={label}
        value={value}
        onChange={(e) => handleStyleChange(property, e.target.value)}
        size="small"
        onClick={() => setColorPickerField(colorPickerField === property ? null : property)}
        InputProps={{
          endAdornment: (
            <Box
              sx={{
                width: 24,
                height: 24,
                backgroundColor: value || 'transparent',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                cursor: 'pointer',
              }}
            />
          ),
        }}
      />
      {colorPickerField === property && (
        <Box sx={{ mt: 1 }}>
          <HexColorPicker
            color={value}
            onChange={(color) => handleStyleChange(property, color)}
          />
        </Box>
      )}
    </Box>
  );

  return (
    <Box>
      {/* Position Section */}
      <Accordion
        expanded={expandedSections.Position}
        onChange={handleSectionChange('Position')}
        disableGutters
        sx={{ '&:before': { display: 'none' } }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2">Position & Transform</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextField
            fullWidth
            type="number"
            label="Z-Index (Layer)"
            value={style.zIndex ?? 0}
            onChange={(e) => handleStyleChange('zIndex', parseInt(e.target.value))}
            helperText="Higher values appear on top"
            size="small"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            type="number"
            label="Rotation (degrees)"
            value={style.rotation ?? 0}
            onChange={(e) => handleStyleChange('rotation', parseInt(e.target.value))}
            helperText="Rotate widget clockwise"
            inputProps={{ min: -180, max: 180, step: 1 }}
            size="small"
            sx={{ mb: 2 }}
          />
        </AccordionDetails>
      </Accordion>

      {/* Background Section */}
      <Accordion
        expanded={expandedSections.Background}
        onChange={handleSectionChange('Background')}
        disableGutters
        sx={{ '&:before': { display: 'none' } }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2">Background</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {renderColorField('Background Color', 'backgroundColor', style.backgroundColor)}
          
          <TextField
            fullWidth
            label="Background Image URL"
            value={style.backgroundImage ?? ''}
            onChange={(e) => handleStyleChange('backgroundImage', e.target.value)}
            helperText="URL to background image"
            size="small"
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            type="number"
            label="Opacity"
            value={style.backgroundOpacity ?? 1}
            onChange={(e) => handleStyleChange('backgroundOpacity', parseFloat(e.target.value))}
            inputProps={{ min: 0, max: 1, step: 0.1 }}
            size="small"
            sx={{ mb: 2 }}
          />
        </AccordionDetails>
      </Accordion>

      {/* Border Section */}
      <Accordion
        expanded={expandedSections.Border}
        onChange={handleSectionChange('Border')}
        disableGutters
        sx={{ '&:before': { display: 'none' } }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2">Border</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {renderColorField('Border Color', 'borderColor', style.borderColor)}

          <TextField
            fullWidth
            type="number"
            label="Border Width (px)"
            value={typeof style.borderWidth === 'number' ? style.borderWidth : 0}
            onChange={(e) => handleStyleChange('borderWidth', parseInt(e.target.value))}
            helperText="Width in pixels"
            inputProps={{ min: 0, max: 20, step: 1 }}
            size="small"
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            type="number"
            label="Border Radius (px)"
            value={typeof style.borderRadius === 'number' ? style.borderRadius : 0}
            onChange={(e) => handleStyleChange('borderRadius', parseInt(e.target.value))}
            helperText="Corner radius in pixels"
            inputProps={{ min: 0, max: 50, step: 1 }}
            size="small"
            sx={{ mb: 2 }}
          />
        </AccordionDetails>
      </Accordion>

      {/* Shadow Section */}
      <Accordion
        expanded={expandedSections.Shadow}
        onChange={handleSectionChange('Shadow')}
        disableGutters
        sx={{ '&:before': { display: 'none' } }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2">Shadow</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
            Basic shadow controls - Advanced editor coming soon
          </Typography>
          
          <TextField
            fullWidth
            label="Box Shadow CSS"
            value={style.boxShadow ? (Array.isArray(style.boxShadow) ? '' : style.boxShadow) : ''}
            onChange={(e) => handleStyleChange('boxShadow', e.target.value)}
            helperText="e.g., 0px 4px 8px rgba(0,0,0,0.3)"
            size="small"
            multiline
            rows={2}
            sx={{ mb: 2 }}
          />
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};
