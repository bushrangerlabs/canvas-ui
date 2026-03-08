/**
 * Slider Widget - Interactive range input for controlling entity values
 * Supports lights (brightness), covers (position), climate (temperature), etc.
 * Migrated to Phase 44 standards (Feb 15, 2026)
 */

import { Slider } from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { useEntityBinding } from '../../hooks/useEntityBinding';
import { useVisibility } from '../../hooks/useVisibility';
import { UniversalIcon } from '../components/UniversalIcon';
import { useWebSocket } from '../providers/WebSocketProvider';
import { useWidgetRuntimeStore } from '../stores/widgetRuntimeStore';
import type { WidgetProps } from '../types';
import type { WidgetMetadata } from '../types/metadata';
import { applyUniversalStyles } from '../utils/styleBuilder';

export const SliderWidgetMetadata: WidgetMetadata = {
  name: 'Slider',
  icon: 'TuneOutlined',
  category: 'control',
  description: 'Interactive slider for controlling entity values',
  defaultSize: { w: 300, h: 60 },
  minSize: { w: 100, h: 40 },
  requiresEntity: false,
  fields: [
    // Layout
    { name: 'x', type: 'number', label: 'X Position', default: 0, category: 'layout' },
    { name: 'y', type: 'number', label: 'Y Position', default: 0, category: 'layout' },
    { name: 'width', type: 'number', label: 'Width', default: 300, min: 100, category: 'layout' },
    { name: 'height', type: 'number', label: 'Height', default: 60, min: 40, category: 'layout' },
    
    // Behavior
    { name: 'label', type: 'text', label: 'Label', default: 'Slider', category: 'behavior' },
    { name: 'entity_id', type: 'entity', label: 'Entity ID', default: '', category: 'behavior', description: 'Entity to control' },
    { name: 'min', type: 'number', label: 'Minimum Value', default: 0, category: 'behavior' },
    { name: 'max', type: 'number', label: 'Maximum Value', default: 100, category: 'behavior' },
    { name: 'step', type: 'number', label: 'Step', default: 1, category: 'behavior' },
    { name: 'value', type: 'number', label: 'Initial Value', default: 50, category: 'behavior', description: 'Can use {entity.state} for dynamic value' },
    { name: 'showValue', type: 'checkbox', label: 'Show Value', default: true, category: 'behavior' },
    { name: 'orientation', type: 'select', label: 'Orientation', default: 'horizontal', category: 'behavior', options: [
      { value: 'horizontal', label: 'Horizontal' },
      { value: 'vertical', label: 'Vertical' }
    ]},
    
    // Style
    { name: 'trackColor', type: 'color', label: 'Track Color', default: '#424242', category: 'style' },
    { name: 'fillColor', type: 'color', label: 'Fill Color', default: '#2196f3', category: 'style' },
    { name: 'thumbColor', type: 'color', label: 'Thumb Color', default: '#2196f3', category: 'style' },
    { name: 'thumbIcon', type: 'icon', label: 'Thumb Icon', default: '', category: 'style', description: 'Optional icon for thumb (leave empty for circle)' },
    { name: 'thumbIconSize', type: 'number', label: 'Thumb Icon Size', default: 20, min: 12, max: 48, category: 'style' },
    { name: 'thumbIconOffsetX', type: 'number', label: 'Icon Offset X (%)', default: -50, min: -200, max: 200, category: 'style', description: 'Horizontal offset of icon' },
    { name: 'thumbIconOffsetY', type: 'number', label: 'Icon Offset Y (%)', default: -50, min: -200, max: 200, category: 'style', description: 'Vertical offset of icon' },
    { name: 'textColor', type: 'color', label: 'Text Color', default: '#ffffff', category: 'style' },
    { name: 'fontSize', type: 'number', label: 'Font Size', default: 14, min: 8, max: 32, category: 'style' },
  ],
};

const SliderWidget: React.FC<WidgetProps> = ({ config, entityState, isEditMode }) => {
  // Phase 44: Config destructuring with defaults
  const {
    visibilityCondition,
    label: labelConfig = 'Slider',
    value: valueConfig = 50,
    entity_id,
    min = 0,
    max = 100,
    step = 1,
    showValue = true,
    orientation = 'horizontal',
    thumbIcon = '',
    thumbIconSize = 20,
    thumbIconOffsetX = -50,
    thumbIconOffsetY = -50,
    trackColor = '#424242',
    fillColor = '#2196f3',
    thumbColor = '#2196f3',
    textColor = '#ffffff',
    fontSize = 14,
  } = config.config;

  const { hass } = useWebSocket();
  const { setWidgetState } = useWidgetRuntimeStore();
  const universalStyle = config.config.style || config.config as any;
  
  // Check visibility condition
  const isVisible = useVisibility(visibilityCondition);
  
  // Use entity bindings for dynamic properties
  const label = useEntityBinding(labelConfig, 'Slider');
  const boundValue = useEntityBinding(
    valueConfig,
    entityState ? parseFloat(entityState.state) || 0 : 50
  );
  
  // Local state for slider value (immediate feedback)
  const [localValue, setLocalValue] = useState(
    typeof boundValue === 'number' ? boundValue : parseFloat(String(boundValue)) || 0
  );
  
  // Sync with bound value when it changes
  useEffect(() => {
    const numValue = typeof boundValue === 'number' ? boundValue : parseFloat(String(boundValue)) || 0;
    setLocalValue(numValue);
  }, [boundValue]);
  
  // Publish runtime state for flow system access
  useEffect(() => {
    setWidgetState(config.id, {
      value: localValue,
      type: 'slider',
      metadata: { min, max, step, orientation }
    });
  }, [localValue, config.id, setWidgetState, min, max, step, orientation]);

  const handleRelease = async () => {
    if (isEditMode || !hass) return;

    if (!entity_id) return;

    // Auto-detect service configuration based on entity domain
    const domain = entity_id.split('.')[0];
    let serviceDomain: string;
    let serviceName: string;
    let serviceDataField: string;

    // Auto-detect based on entity type
    switch (domain) {
      case 'light':
        serviceDomain = 'light';
        serviceName = 'turn_on';
        serviceDataField = 'brightness';
        break;
      case 'cover':
        serviceDomain = 'cover';
        serviceName = 'set_cover_position';
        serviceDataField = 'position';
        break;
      case 'climate':
        serviceDomain = 'climate';
        serviceName = 'set_temperature';
        serviceDataField = 'temperature';
        break;
      case 'input_number':
        serviceDomain = 'input_number';
        serviceName = 'set_value';
        serviceDataField = 'value';
        break;
      case 'input_text':
        serviceDomain = 'input_text';
        serviceName = 'set_value';
        serviceDataField = 'value';
        break;
      case 'fan':
        serviceDomain = 'fan';
        serviceName = 'set_percentage';
        serviceDataField = 'percentage';
        break;
      default:
        serviceDomain = domain;
        serviceName = 'set_value';
        serviceDataField = 'value';
    }

    try {
      await hass.callService(serviceDomain, serviceName, {
        entity_id: entity_id,
        [serviceDataField]: localValue,
      });
    } catch (error) {
      console.error('[SliderWidget] Service call failed:', error);
    }
  };

  // Memoize thumb component to prevent flickering during drag  
  const ThumbComponent = useMemo(() => {
    if (!thumbIcon) {
      return undefined; // Use default thumb when no icon
    }
    
    return React.forwardRef((props: any, ref) => {
      const { children, ...other } = props;
      
      const iconTransform = `translate(${thumbIconOffsetX}%, ${thumbIconOffsetY}%)`;
      
      return (
        <span 
          {...other}
          ref={ref}
          style={{
            ...other.style,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <UniversalIcon 
            icon={thumbIcon}
            size={thumbIconSize}
            color={thumbColor}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: iconTransform,
            }}
          />
          {children}
        </span>
      );
    });
  }, [thumbIcon, thumbIconSize, thumbColor, thumbIconOffsetX, thumbIconOffsetY]);
  
  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '8px 12px',
    gap: '8px',
    boxSizing: 'border-box', // Ensure consistent padding across modes
  };

  const labelStyle: React.CSSProperties = {
    color: textColor,
    fontSize: `${fontSize}px`,
    fontWeight: '500',
    textAlign: 'center',
  };

  const valueStyle: React.CSSProperties = {
    color: textColor,
    fontSize: `${fontSize}px`,
    fontWeight: 'bold',
    minWidth: '40px',
    textAlign: 'center',
  };

  // Apply universal styles
  const finalStyle = applyUniversalStyles(universalStyle, containerStyle);

  // Don't render if visibility condition is false
  if (!isVisible) return null;

  return (
    <div style={finalStyle}>
      {orientation === 'vertical' ? (
        // Vertical layout: label, value, slider stacked
        <>
          <div style={labelStyle}>{label}</div>
          {showValue && <div style={valueStyle}>{Math.round(localValue)}</div>}
          <div style={{ 
            flex: 1, 
            width: '40px',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Slider
              orientation="vertical"
              value={localValue}
              onChange={(_event: Event, value: number | number[]) => {
                if (!isEditMode) {
                  setLocalValue(value as number);
                }
              }}
              onChangeCommitted={async () => {
                if (!isEditMode) {
                  await handleRelease();
                }
              }}
              min={min}
              max={max}
              step={step}
              disabled={isEditMode}
              {...(thumbIcon && {
                slots: {
                  thumb: ThumbComponent,
                },
              })}
              sx={{
                color: config.config.fillColor || '#2196f3',
                height: '100%',
                width: 6,
                '& .MuiSlider-track': {
                  backgroundColor: config.config.fillColor || '#2196f3',
                  border: 'none',
                },
                '& .MuiSlider-rail': {
                  backgroundColor: config.config.trackColor || '#424242',
                },
                '& .MuiSlider-thumb': {
                  width: thumbIcon ? thumbIconSize + 8 : 16,
                  height: thumbIcon ? thumbIconSize + 8 : 16,
                  backgroundColor: thumbIcon ? 'transparent' : (config.config.thumbColor || '#2196f3'),
                  '&:hover': {
                    boxShadow: thumbIcon ? 'none' : `0 0 0 8px ${config.config.thumbColor || '#2196f3'}33`,
                  },
                },
              }}
            />
          </div>
        </>
      ) : (
        // Horizontal layout: label/value above, slider below
        <>
          <div style={{ 
            width: '100%', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            gap: '8px',
          }}>
            <div style={{ ...labelStyle, textAlign: 'left', fontSize: `${fontSize - 2}px` }}>{label}</div>
            {showValue && <div style={{ ...valueStyle, textAlign: 'right', fontSize: `${fontSize - 2}px` }}>{Math.round(localValue)}</div>}
          </div>
          <div style={{ 
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
          }}>
            <Slider
              orientation="horizontal"
              value={localValue}
              onChange={(_event: Event, value: number | number[]) => {
                if (!isEditMode) {
                  setLocalValue(value as number);
                }
              }}
              onChangeCommitted={async () => {
                if (!isEditMode) {
                  await handleRelease();
                }
              }}
              min={min}
              max={max}
              step={step}
              disabled={isEditMode}
              slots={{
                thumb: ThumbComponent,
              }}
              sx={{
                color: fillColor,
                height: 6,
                width: '100%',
                '& .MuiSlider-track': {
                  backgroundColor: fillColor,
                  border: 'none',
                },
                '& .MuiSlider-rail': {
                  backgroundColor: trackColor,
                },
                '& .MuiSlider-thumb': {
                  width: thumbIcon ? thumbIconSize + 8 : 16,
                  height: thumbIcon ? thumbIconSize + 8 : 16,
                  backgroundColor: thumbIcon ? 'transparent' : thumbColor,
                  '&:hover': {
                    boxShadow: thumbIcon ? 'none' : `0 0 0 8px ${thumbColor}33`,
                  },
                },
              }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default SliderWidget;
