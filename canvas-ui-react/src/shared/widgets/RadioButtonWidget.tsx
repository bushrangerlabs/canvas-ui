/**
 * Radio Button Widget - Single selection from multiple options
 * Migrated to Phase 44 standards (Feb 15, 2026)
 */

import { FormControl, FormControlLabel, Radio, RadioGroup } from '@mui/material';
import React from 'react';
import { useVisibility } from '../../hooks/useVisibility';
import { useWebSocket } from '../providers/WebSocketProvider';
import type { WidgetProps } from '../types';
import type { WidgetMetadata } from '../types/metadata';
import { applyUniversalStyles } from '../utils/styleBuilder';

export const RadioButtonWidgetMetadata: WidgetMetadata = {
  name: 'Radio Button',
  icon: 'RadioButtonChecked',
  category: 'controls',
  description: 'Single selection from multiple options',
  defaultSize: { w: 200, h: 150 },
  minSize: { w: 100, h: 80 },
  requiresEntity: false,
  fields: [
    // Layout
    { name: 'x', type: 'number', label: 'X Position', default: 0, category: 'layout' },
    { name: 'y', type: 'number', label: 'Y Position', default: 0, category: 'layout' },
    { name: 'width', type: 'number', label: 'Width', default: 200, min: 100, category: 'layout' },
    { name: 'height', type: 'number', label: 'Height', default: 150, min: 80, category: 'layout' },
    
    // Behavior
    { name: 'entity_id', type: 'entity', label: 'Entity ID', default: '', category: 'behavior', description: 'Entity to control' },
    { name: 'options', type: 'text', label: 'Options', default: 'Option 1,Option 2,Option 3', category: 'behavior', description: 'Comma-separated options' },
    { name: 'values', type: 'text', label: 'Values', default: '1,2,3', category: 'behavior', description: 'Comma-separated values (optional, defaults to options)' },
    { name: 'orientation', type: 'select', label: 'Orientation', default: 'vertical', category: 'behavior', options: [
      { value: 'vertical', label: 'Vertical' },
      { value: 'horizontal', label: 'Horizontal' }
    ]},
    
    // Style
    { name: 'fontFamily', type: 'font', label: 'Font Family', default: 'Arial, sans-serif', category: 'style' },
    { name: 'fontSize', type: 'number', label: 'Font Size', default: 14, min: 8, max: 24, category: 'style' },
    { name: 'textColor', type: 'color', label: 'Text Color', default: '#ffffff', category: 'style' },
    { name: 'activeColor', type: 'color', label: 'Active Color', default: '#2196f3', category: 'style' },
    { name: 'backgroundColor', type: 'color', label: 'Background Color', default: 'transparent', category: 'style' },
  ],
};

const RadioButtonWidget: React.FC<WidgetProps> = ({ config, entityState }) => {
  // Phase 44: Config destructuring with defaults
  const {
    entity_id = '',
    options = 'Option 1,Option 2,Option 3',
    values = '',
    orientation = 'vertical',
    fontFamily = 'Arial, sans-serif',
    fontSize = 14,
    textColor = '#ffffff',
    activeColor = '#2196f3',
    backgroundColor = 'transparent',
    visibilityCondition,
  } = config.config;

  const isVisible = useVisibility(visibilityCondition);
  const universalStyle = config.config.style || config.config as any;
  const { hass } = useWebSocket();

  // Parse options and values
  const optionsList = options.split(',').map((o: string) => o.trim());
  const valuesList = values ? values.split(',').map((v: string) => v.trim()) : optionsList;

  // Get current value from entity state
  const currentValue = entityState?.state || valuesList[0];

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    
    if (!entity_id) return;

    // Determine service based on entity domain
    const domain = entity_id.split('.')[0];
    let service = 'set_value';
    let serviceData: Record<string, unknown> = {
      entity_id,
      value: newValue,
    };

    // Use appropriate service for input_select
    if (domain === 'input_select') {
      service = 'select_option';
      serviceData = {
        entity_id,
        option: newValue,
      };
    }

    try {
      await hass?.callService(domain, service, serviceData);
    } catch (error) {
      console.error('Failed to set radio value:', error);
    }
  };

  // Base styles
  const baseStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: isVisible ? 'flex' : 'none',
    alignItems: 'flex-start',
    padding: '8px',
    backgroundColor,
    boxSizing: 'border-box',
  };

  // Apply universal styles
  const finalStyle = applyUniversalStyles(universalStyle, baseStyle);

  return (
    <div style={finalStyle}>
      <FormControl component="fieldset">
        <RadioGroup
          value={currentValue}
          onChange={handleChange}
          row={orientation === 'horizontal'}
        >
          {optionsList.map((option: string, index: number) => (
            <FormControlLabel
              key={valuesList[index]}
              value={valuesList[index]}
              control={
                <Radio
                  sx={{
                    color: textColor,
                    '&.Mui-checked': {
                      color: activeColor,
                    },
                  }}
                />
              }
              label={option}
              sx={{
                color: textColor,
                fontFamily: fontFamily,
                fontSize: `${fontSize}px`,
                '& .MuiFormControlLabel-label': {
                  fontFamily: fontFamily,
                  fontSize: `${fontSize}px`,
                },
              }}
            />
          ))}
        </RadioGroup>
      </FormControl>
    </div>
  );
};

export default RadioButtonWidget;
