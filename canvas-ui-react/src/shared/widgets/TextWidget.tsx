/**
 * Text Widget - Displays static or dynamic text from entity states
 * Migrated to Phase 44 standards (Feb 15, 2026)
 */

import React from 'react';
import { useVisibility } from '../../hooks/useVisibility';
import { useWidget } from '../hooks/useWidget';
import type { WidgetProps } from '../types';
import type { WidgetMetadata } from '../types/metadata';
import { applyUniversalStyles } from '../utils/styleBuilder';

// Static metadata for inspector
export const TextWidgetMetadata: WidgetMetadata = {
  name: 'Text',
  icon: 'TextFields',
  category: 'basic',
  description: 'Display static or dynamic text from entity states',
  defaultSize: { w: 200, h: 50 },
  minSize: { w: 50, h: 20 },
  requiresEntity: false,
  fields: [
    // Layout
    { name: 'x', type: 'number', label: 'X Position', default: 0, category: 'layout' },
    { name: 'y', type: 'number', label: 'Y Position', default: 0, category: 'layout' },
    { name: 'width', type: 'number', label: 'Width', default: 200, min: 50, category: 'layout' },
    { name: 'height', type: 'number', label: 'Height', default: 50, min: 20, category: 'layout' },
    
    // Behavior
    { name: 'entity_id', type: 'entity', label: 'Entity ID', default: '', category: 'behavior', binding: true, description: 'Entity to display text from' },
    { name: 'text', type: 'text', label: 'Static Text', default: 'Text', category: 'behavior', binding: true, description: 'Static text (used when no entity selected)' },
    { name: 'prefix', type: 'text', label: 'Prefix', default: '', category: 'behavior', description: 'Text before value' },
    { name: 'unit', type: 'text', label: 'Unit Suffix', default: '', category: 'behavior', description: 'e.g. °C, %, W' },
    
    // Style
    { name: 'textColor', type: 'color', label: 'Text Color', default: '#ffffff', category: 'style' },
    { name: 'fontFamily', type: 'font', label: 'Font Family', default: 'Arial, sans-serif', category: 'style' },
    { name: 'fontSize', type: 'number', label: 'Font Size', default: 16, min: 8, max: 72, category: 'style' },
    { name: 'fontWeight', type: 'select', label: 'Font Weight', default: 'normal', category: 'style', options: [
      { value: 'normal', label: 'Normal' },
      { value: 'bold', label: 'Bold' },
      { value: '300', label: 'Light' },
      { value: '500', label: 'Medium' },
    ]},
    { name: 'textAlign', type: 'select', label: 'Text Align', default: 'left', category: 'style', options: [
      { value: 'left', label: 'Left' },
      { value: 'center', label: 'Center' },
      { value: 'right', label: 'Right' },
    ]},
    { name: 'verticalAlign', type: 'select', label: 'Vertical Align', default: 'center', category: 'style', options: [
      { value: 'flex-start', label: 'Top' },
      { value: 'center', label: 'Center' },
      { value: 'flex-end', label: 'Bottom' },
    ]},
  ],
};

const TextWidget: React.FC<WidgetProps> = ({ config }) => {
  // Extract config values with defaults (Phase 44 pattern)
  const {
    text: staticText = 'Text',
    prefix = '',
    unit = '',
    textColor = '#ffffff',
    fontFamily = 'Arial, sans-serif',
    fontSize = 16,
    fontWeight = 'normal',
    textAlign = 'left',
    verticalAlign = 'center',
  } = config.config;

  const isVisible = useVisibility(config.config.visibilityCondition);
  
  // Use useWidget hook for entity subscriptions
  const { getEntityState } = useWidget(config);
  
  // Get text - prefer entity state, fall back to static text
  const entityState = getEntityState('entity_id');
  const textValue = entityState || staticText;
  
  // Add prefix and unit if configured
  const displayText = `${prefix}${textValue}${unit}`;

  const textStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    color: textColor,
    fontFamily: fontFamily,
    fontSize: `${fontSize}px`,
    fontWeight: fontWeight,
    textAlign: (textAlign as any),
    display: 'flex',
    alignItems: verticalAlign,
    justifyContent: textAlign === 'center' ? 'center' : 
                     textAlign === 'right' ? 'flex-end' : 'flex-start',
    padding: '8px',
    boxSizing: 'border-box',
    wordWrap: 'break-word',
    overflow: 'hidden',
  };

  // Apply universal styles (border, background, shadow)
  // Accept styles from either config.config.style (inspector) or config.config (AI/import)
  const universalStyle = config.config.style || config.config as any;
  const finalStyle = applyUniversalStyles(universalStyle, textStyle);

  // Don't render if visibility condition is false
  if (!isVisible) return null;

  return <div style={finalStyle}>{displayText}</div>;
};

export default TextWidget;
