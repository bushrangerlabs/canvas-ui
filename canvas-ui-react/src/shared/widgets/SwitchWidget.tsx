/**
 * Switch Widget - Toggle switch for binary entities (lights, switches, etc.)
 * Migrated to Phase 44 standards (Feb 15, 2026)
 */

import React from 'react';
import { useVisibility } from '../../hooks/useVisibility';
import { useWidget } from '../hooks/useWidget';
import { useWebSocket } from '../providers/WebSocketProvider';
import type { WidgetProps } from '../types';
import type { WidgetMetadata } from '../types/metadata';
import { applyUniversalStyles } from '../utils/styleBuilder';

export const SwitchWidgetMetadata: WidgetMetadata = {
  name: 'Switch',
  icon: 'ToggleOnOutlined',
  category: 'control',
  description: 'Toggle switch for binary entities',
  defaultSize: { w: 200, h: 60 },
  minSize: { w: 80, h: 40 },
  requiresEntity: false,
  fields: [
    // Layout
    { name: 'x', type: 'number', label: 'X Position', default: 0, category: 'layout' },
    { name: 'y', type: 'number', label: 'Y Position', default: 0, category: 'layout' },
    { name: 'width', type: 'number', label: 'Width', default: 200, min: 80, category: 'layout' },
    { name: 'height', type: 'number', label: 'Height', default: 60, min: 40, category: 'layout' },
    
    // Behavior
    { name: 'label', type: 'text', label: 'Label', default: 'Switch', category: 'behavior' },
    { name: 'labelPosition', type: 'select', label: 'Label Position', default: 'left', category: 'behavior', options: [
      { value: 'left', label: 'Left' },
      { value: 'right', label: 'Right' },
      { value: 'top', label: 'Top' },
      { value: 'bottom', label: 'Bottom' },
    ]},
    { name: 'service_domain', type: 'text', label: 'Service Domain', default: 'homeassistant', category: 'behavior', description: 'e.g. light, switch, input_boolean (or use "homeassistant" for auto-detect)' },
    { name: 'entity_id', type: 'entity', label: 'Entity ID', default: '', category: 'behavior', description: 'Entity to control and monitor' },
    { name: 'state', type: 'text', label: 'State', default: 'off', category: 'behavior', description: 'Can use {entity.state} for dynamic state' },
    
    // Style
    { name: 'onColor', type: 'color', label: 'On Color', default: '#4caf50', category: 'style' },
    { name: 'offColor', type: 'color', label: 'Off Color', default: '#757575', category: 'style' },
    { name: 'textColor', type: 'color', label: 'Text Color', default: '#ffffff', category: 'style' },
    { name: 'fontFamily', type: 'font', label: 'Font Family', default: 'Arial, sans-serif', category: 'style' },
    { name: 'fontSize', type: 'number', label: 'Font Size', default: 14, min: 8, max: 32, category: 'style' },
  ],
};

const SwitchWidget: React.FC<WidgetProps> = ({ config, isEditMode }) => {
  // Phase 44: Config destructuring with defaults
  const {
    label = 'Switch',
    labelPosition = 'left',
    service_domain,
    entity_id,
    onColor = '#4caf50',
    offColor = '#757575',
    textColor = '#ffffff',
    fontFamily = 'Arial, sans-serif',
    fontSize = 14,
    visibilityCondition,
  } = config.config;

  const { hass } = useWebSocket();
  const isVisible = useVisibility(visibilityCondition);
  const universalStyle = config.config.style || config.config as any;
  
  // Use useWidget hook for entity subscriptions
  const { getEntityState } = useWidget(config);
  
  // Get switch state from entity
  const entityStateValue = getEntityState('entity_id');
  const isOn = entityStateValue ? String(entityStateValue).toLowerCase() === 'on' : false;

  const handleToggle = async () => {
    if (isEditMode || !hass) return;

    let domain = service_domain;
    
    // Auto-detect domain from entity_id if service_domain is homeassistant or empty
    if (!domain || domain === 'homeassistant') {
      domain = entity_id?.split('.')[0] || 'homeassistant';
    }
    
    if (domain && entity_id) {
      try {
        // Toggle service name based on current state
        const service_name = isOn ? 'turn_off' : 'turn_on';
        
        await hass.callService(domain, service_name, {
          entity_id: entity_id,
        });
      } catch (error) {
        console.error('[SwitchWidget] Service call failed:', error);
      }
    }
  };

  // Determine flex direction based on label position
  let flexDirection: 'row' | 'row-reverse' | 'column' | 'column-reverse' = 'row';
  let justifyContent = 'space-between';
  let alignItems = 'center';
  
  if (labelPosition === 'right') {
    flexDirection = 'row-reverse';
  } else if (labelPosition === 'top') {
    flexDirection = 'column';
    justifyContent = 'center';
  } else if (labelPosition === 'bottom') {
    flexDirection = 'column-reverse';
    justifyContent = 'center';
  }

  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection,
    alignItems,
    justifyContent,
    gap: '8px',
    padding: '8px 12px',
    boxSizing: 'border-box',
    cursor: isEditMode ? 'default' : 'pointer',
    pointerEvents: isEditMode ? 'none' : 'auto',
  };

  const labelStyle: React.CSSProperties = {
    color: textColor,
    fontFamily: fontFamily,
    fontSize: `${fontSize}px`,
    fontWeight: '500',
    flex: labelPosition === 'left' || labelPosition === 'right' ? 1 : 0,
    textAlign: labelPosition === 'top' || labelPosition === 'bottom' ? 'center' : 'left',
  };

  const switchTrackStyle: React.CSSProperties = {
    width: '50px',
    height: '26px',
    backgroundColor: isOn ? onColor : offColor,
    borderRadius: '13px',
    position: 'relative',
    transition: 'background-color 0.2s ease',
    flexShrink: 0,
  };

  const switchThumbStyle: React.CSSProperties = {
    width: '22px',
    height: '22px',
    backgroundColor: '#ffffff',
    borderRadius: '50%',
    position: 'absolute',
    top: '2px',
    left: isOn ? '26px' : '2px',
    transition: 'left 0.2s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
  };

  // Apply universal styles
  const finalStyle = applyUniversalStyles(universalStyle, containerStyle);

  // Don't render if visibility condition is false
  if (!isVisible) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    handleToggle();
  };

  return (
    <div style={finalStyle} onClick={handleClick}>
      <div style={labelStyle}>{label}</div>
      <div style={switchTrackStyle}>
        <div style={switchThumbStyle}></div>
      </div>
    </div>
  );
};

export default SwitchWidget;
