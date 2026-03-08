/**
 * Example modernized widget using new hooks
 * 
 * Demonstrates:
 * - useWidget hook for entity management
 * - Cleaner component logic
 * - Type-safe props
 */

import React from 'react';
import { useWidget } from '../hooks/useWidget';
import type { WidgetProps } from '../types';
import type { WidgetMetadata } from '../types/metadata';

/**
 * Example Widget Component
 * 
 * This demonstrates the modernized widget pattern with:
 * - Automatic entity subscription
 * - Clean helper methods
 * - Reduced boilerplate
 */
const ExampleModernWidget: React.FC<WidgetProps> = ({ config }) => {
  // Use modern widget hook (auto-subscribes to entities)
  const { getEntityState, isEntityAvailable } = useWidget(config);
  
  // Access config
  const {
    width = 200,
    height = 100,
    entity_id = '',
    backgroundColor = '#2196f3',
    textColor = '#ffffff',
    text = 'Example',
  } = config.config;
  
  // Get entity state (if entity_id configured)
  const state = getEntityState('entity_id');
  const isAvailable = isEntityAvailable('entity_id');
  
  // Handle click
  const handleClick = () => {
    // Update widget config - example only
    console.log(`Clicked! State: ${state || 'none'}`);
  };
  
  // Styles
  const containerStyle: React.CSSProperties = {
    width: `${width}px`,
    height: `${height}px`,
    backgroundColor,
    color: textColor,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    boxSizing: 'border-box',
    borderRadius: '8px',
    cursor: 'pointer',
    userSelect: 'none',
    opacity: isAvailable ? 1 : 0.5,
  };
  
  return (
    <div style={containerStyle} onClick={handleClick}>
      <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
        {text}
      </div>
      {entity_id && (
        <div style={{ fontSize: '12px', opacity: 0.8 }}>
          {isAvailable ? state : 'Unavailable'}
        </div>
      )}
    </div>
  );
};

/**
 * Widget Metadata
 */
export const exampleModernWidgetMetadata: WidgetMetadata = {
  name: 'Example Modern Widget',
  description: 'Demonstrates modernized widget pattern with hooks',
  icon: 'Science',
  category: 'display',
  defaultSize: { w: 200, h: 100 },
  fields: [
    {
      name: 'width',
      type: 'number',
      label: 'Width',
      default: 200,
      category: 'layout',
      min: 50,
      max: 2000,
    },
    {
      name: 'height',
      type: 'number',
      label: 'Height',
      default: 100,
      category: 'layout',
      min: 50,
      max: 2000,
    },
    {
      name: 'entity_id',
      type: 'entity',
      label: 'Entity',
      default: '',
      category: 'behavior',
    },
    {
      name: 'text',
      type: 'text',
      label: 'Text',
      default: 'Example',
      category: 'behavior',
    },
    {
      name: 'backgroundColor',
      type: 'color',
      label: 'Background Color',
      default: '#2196f3',
      category: 'style',
    },
    {
      name: 'textColor',
      type: 'color',
      label: 'Text Color',
      default: '#ffffff',
      category: 'style',
    },
  ],
};

export default ExampleModernWidget;
