/**
 * Value Widget - Display formatted numeric values
 * Migrated to Phase 44 standards (Feb 15, 2026)
 */

import React from 'react';
import { useVisibility } from '../../hooks/useVisibility';
import { useWidget } from '../hooks/useWidget';
import type { WidgetProps } from '../types';
import type { WidgetMetadata } from '../types/metadata';
import { applyUniversalStyles } from '../utils/styleBuilder';
import { useResolvedUniversalStyle } from '../../hooks/useResolvedUniversalStyle';

export const ValueWidgetMetadata: WidgetMetadata = {
  name: 'Value',
  icon: 'Pin',
  category: 'display',
  description: 'Display formatted numeric values with prefix/suffix',
  defaultSize: { w: 150, h: 60 },
  minSize: { w: 50, h: 20 },
  requiresEntity: false,
  fields: [
    // Layout
    { name: 'x', type: 'number', label: 'X Position', default: 0, category: 'layout' },
    { name: 'y', type: 'number', label: 'Y Position', default: 0, category: 'layout' },
    { name: 'width', type: 'number', label: 'Width', default: 150, min: 50, category: 'layout' },
    { name: 'height', type: 'number', label: 'Height', default: 60, min: 20, category: 'layout' },
    
    // Behavior
    { name: 'entity_id', type: 'entity', label: 'Entity ID', default: '', category: 'behavior', binding: true, description: 'Entity to display value from' },
    { name: 'value', type: 'text', label: 'Static Value', default: '0', category: 'behavior', binding: true, description: 'Static value (used when no entity selected)' },
    { name: 'prefix', type: 'text', label: 'Prefix', default: '', category: 'behavior', description: 'Text before value' },
    { name: 'suffix', type: 'text', label: 'Suffix', default: '', category: 'behavior', description: 'Text after value (e.g., °C, %, W)' },
    { name: 'decimals', type: 'number', label: 'Decimal Places', default: 1, min: 0, max: 10, category: 'behavior' },
    { name: 'formatThousands', type: 'checkbox', label: 'Thousands Separator', default: true, category: 'behavior', description: 'Format with commas (1,000)' },
    
    // Style
    { name: 'fontFamily', type: 'font', label: 'Font Family', default: 'Arial, sans-serif', category: 'style' },
    { name: 'fontSize', type: 'number', label: 'Font Size', default: 32, min: 8, max: 120, category: 'style' },
    { name: 'fontWeight', type: 'select', label: 'Font Weight', default: 'bold', category: 'style', options: [
      { value: 'normal', label: 'Normal' },
      { value: 'bold', label: 'Bold' },
      { value: '300', label: 'Light' },
      { value: '500', label: 'Medium' },
    ]},
    { name: 'textAlign', type: 'select', label: 'Text Align', default: 'center', category: 'style', options: [
      { value: 'left', label: 'Left' },
      { value: 'center', label: 'Center' },
      { value: 'right', label: 'Right' },
    ]},
    { name: 'textColor', type: 'color', label: 'Text Color', default: '#ffffff', category: 'style' },
    { name: 'backgroundColor', type: 'color', label: 'Background Color', default: 'transparent', category: 'style' },
  ],
};

const ValueWidget: React.FC<WidgetProps> = ({ config }) => {
  // Extract config values with defaults (Phase 44 pattern)
  const {
    value: configValue = '0',
    prefix = '',
    suffix = '',
    decimals = 1,
    formatThousands = true,
    fontFamily = 'Arial, sans-serif',
    fontSize = 32,
    fontWeight = 'bold',
    textAlign = 'center',
    textColor = '#ffffff',
    backgroundColor = 'transparent',
  } = config.config;

  const isVisible = useVisibility(config.config.visibilityCondition);
  const universalStyle = useResolvedUniversalStyle(config.config.style || config.config as any);
  
  // Use useWidget hook for entity subscriptions
  const { getEntityState } = useWidget(config);
  
  // Get value - prefer entity state, fall back to static value
  const entityState = getEntityState('entity_id');
  const valueStr = entityState || configValue;

  // Parse and format the value
  const numValue = parseFloat(String(valueStr)) || 0;
  let formattedValue = numValue.toFixed(decimals);
  
  if (formatThousands) {
    const parts = formattedValue.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    formattedValue = parts.join('.');
  }

  const displayText = `${prefix}${formattedValue}${suffix}`;

  // Base styles
  const baseStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: isVisible ? 'flex' : 'none',
    alignItems: 'center',
    justifyContent: textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center',
    fontFamily,
    fontSize: `${fontSize}px`,
    fontWeight,
    color: textColor,
    backgroundColor,
    textAlign,
    padding: '8px',
    boxSizing: 'border-box',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  // Apply universal styles
  const finalStyle = applyUniversalStyles(universalStyle, baseStyle);

  return <div style={finalStyle}>{displayText}</div>;
};

export default ValueWidget;
