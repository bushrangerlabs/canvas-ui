/**
 * Icon Widget - Display icons from Emoji and Iconify
 * Migrated to Phase 44 standards (Feb 15, 2026)
 */

import React from 'react';
import { useVisibility } from '../../hooks/useVisibility';
import { DynamicIcon } from '../components/DynamicIcon';
import { UniversalIcon } from '../components/UniversalIcon';
import { useWidget } from '../hooks/useWidget';
import type { WidgetProps } from '../types';
import type { WidgetMetadata } from '../types/metadata';
import { applyUniversalStyles } from '../utils/styleBuilder';
import { useResolvedUniversalStyle } from '../../hooks/useResolvedUniversalStyle';

export const iconWidgetMetadata: WidgetMetadata = {
  name: 'Icon',
  icon: 'StarOutlined',
  category: 'display',
  description: 'Display icons with dynamic colors and advanced effects',
  defaultSize: { w: 80, h: 80 },
  minSize: { w: 40, h: 40 },
  requiresEntity: false,
  fields: [
    // Layout
    { name: 'x', type: 'number', label: 'X Position', default: 0, category: 'layout' },
    { name: 'y', type: 'number', label: 'Y Position', default: 0, category: 'layout' },
    { name: 'width', type: 'number', label: 'Width', default: 80, min: 40, category: 'layout' },
    { name: 'height', type: 'number', label: 'Height', default: 80, min: 40, category: 'layout' },
    
    // Behavior
    { name: 'icon', type: 'icon', label: 'Icon', default: 'mdi:lightbulb', category: 'behavior', binding: true },
    { name: 'entity_id', type: 'entity', label: 'Entity ID', default: '', category: 'behavior', binding: true },
    
    // Style - Basic
    { name: 'color', type: 'color', label: 'Color', default: '#ffffff', category: 'style', binding: true },
    { name: 'activeColor', type: 'color', label: 'Active Color', default: '#ffc107', category: 'style' },
    { name: 'size', type: 'number', label: 'Icon Size (%)', default: 100, min: 10, max: 200, category: 'style' },
    
    // Style - Outline & Effects
    { 
      name: 'outlineMode', 
      type: 'select', 
      label: 'Outline Mode', 
      default: 'none', 
      category: 'style',
      options: [
        { value: 'none', label: 'No Outline' },
        { value: 'outline', label: 'Outline' },
        { value: 'filled', label: 'Filled Outline' }
      ]
    },
    { name: 'strokeWidth', type: 'slider', label: 'Stroke Width (px)', default: 2, min: 0, max: 10, step: 0.1, category: 'style' },
    { name: 'glowWidth', type: 'number', label: 'Glow Width (px)', default: 0, min: 0, max: 30, category: 'style' },
    { name: 'glowColor', type: 'color', label: 'Glow Color', default: '', category: 'style' },
    { name: 'shadowEnabled', type: 'checkbox', label: 'Enable Shadow', default: false, category: 'style' },
    { name: 'shadowColor', type: 'color', label: 'Shadow Color', default: '#000000', category: 'style' },
    { name: 'shadowOffsetX', type: 'slider', label: 'Shadow Offset X', default: 2, min: -20, max: 20, step: 1, category: 'style' },
    { name: 'shadowOffsetY', type: 'slider', label: 'Shadow Offset Y', default: 2, min: -20, max: 20, step: 1, category: 'style' },
    { name: 'shadowBlur', type: 'slider', label: 'Shadow Blur', default: 4, min: 0, max: 30, step: 1, category: 'style' },
    
    // Style - Rotation Animation
    { name: 'enableRotation', type: 'checkbox', label: 'Enable Rotation', default: false, category: 'style' },
    { name: 'rotationSpeed', type: 'slider', label: 'Rotation Speed (seconds)', default: 2, min: 0.5, max: 10, step: 0.5, category: 'style' },
    
    // Style - Fill Effect
    { 
      name: 'fillDirection', 
      type: 'select', 
      label: 'Fill Direction', 
      default: 'bottom-up', 
      category: 'style',
      options: [
        { value: 'bottom-up', label: 'Bottom Up' },
        { value: 'top-down', label: 'Top Down' },
        { value: 'left-to-right', label: 'Left to Right' },
        { value: 'right-to-left', label: 'Right to Left' }
      ]
    },
    { name: 'fillColor', type: 'color', label: 'Fill Color', default: '#00ff00', category: 'style' },
    { name: 'fillImage', type: 'text', label: 'Fill Image URL', default: '', category: 'style' },
    { name: 'coverColor', type: 'color', label: 'Cover Color', default: '#000000', category: 'style' },
    { name: 'fillEntity', type: 'entity', label: 'Fill Entity', default: '', category: 'behavior', binding: true },
    { name: 'fillMin', type: 'number', label: 'Fill Min Value', default: 0, category: 'style' },
    { name: 'fillMax', type: 'number', label: 'Fill Max Value', default: 100, category: 'style' },
  ],
};

const IconWidget: React.FC<WidgetProps> = ({ config }) => {
  // Phase 44: Config destructuring with defaults
  const {
    icon = 'mdi:lightbulb',
    color = '#ffffff',
    activeColor = '#ffc107',
    size: iconSize = 100,
    entity_id: _entity_id,
    outlineMode = 'none',
    strokeWidth = 2,
    glowWidth = 0,
    glowColor = '',
    shadowEnabled = false,
    shadowColor = '#000000',
    shadowOffsetX = 2,
    shadowOffsetY = 2,
    shadowBlur = 4,
    enableRotation = false,
    rotationSpeed = 2,
    fillDirection = 'bottom-up',
    fillColor = '#00ff00',
    fillImage = '',
    coverColor = '#000000',
    fillEntity: _fillEntity,
    fillMin = 0,
    fillMax = 100,
    width = 80,
    height = 80,
    visibilityCondition,
  } = config.config;

  // Use modern useWidget hook for entity subscriptions
  const { getEntityState, isEntityAvailable } = useWidget(config);
  const isVisible = useVisibility(visibilityCondition);
  
  if (!isVisible) return null;
  
  // Get live entity state for dynamic color (if entity_id is configured)
  const entityState = getEntityState('entity_id');
  const hasEntity = isEntityAvailable('entity_id');
  
  // Determine if entity is active (for dynamic color)
  const isActive = hasEntity && entityState && (
    entityState === 'on' || 
    entityState === 'open' || 
    entityState === 'home' || 
    entityState === 'unlocked'
  );

  const finalColor = isActive ? activeColor : color;

  // Get fill entity value
  const fillEntityState = getEntityState('fillEntity');
  const fillEntityValue = fillEntityState || '';
  const hasFillEntity = isEntityAvailable('fillEntity');
  
  // Calculate fill percentage
  const fillPercentage = fillEntityValue && hasFillEntity
    ? Math.max(0, Math.min(100, ((parseFloat(fillEntityValue) - fillMin) / (fillMax - fillMin)) * 100))
    : 0;

  // Auto-enable filled outline mode when fillEntity is configured
  let finalOutlineMode = outlineMode;
  if (hasFillEntity && outlineMode === 'none') {
    finalOutlineMode = 'filled';
  }

  // Build rotation animation
  const rotationAnimation = enableRotation
    ? `spin ${rotationSpeed}s linear infinite`
    : 'none';

  const baseStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: finalColor,
    userSelect: 'none',
    animation: rotationAnimation,
  };

  // Apply universal styles (border, background, shadow)
  const universalStyle = useResolvedUniversalStyle(config.config.style || config.config as any);
  const style = applyUniversalStyles(universalStyle, baseStyle);

  // Calculate icon size (percentage of container)
  const containerSize = Math.min(width, height);
  const calculatedSize = (containerSize * iconSize) / 100;

  // Use UniversalIcon for simple mode, DynamicIcon only for advanced features
  const useAdvancedFeatures = finalOutlineMode !== 'none' || hasFillEntity || glowWidth > 0 || shadowEnabled;

  return (
    <div style={style}>
      {useAdvancedFeatures ? (
        <DynamicIcon 
          icon={icon} 
          size={calculatedSize} 
          color={finalColor}
          outlineMode={finalOutlineMode}
          strokeWidth={strokeWidth}
          glowWidth={glowWidth}
          glowColor={glowColor}
          shadowEnabled={shadowEnabled}
          shadowColor={shadowColor}
          shadowOffsetX={shadowOffsetX}
          shadowOffsetY={shadowOffsetY}
          shadowBlur={shadowBlur}
          fillDirection={fillDirection}
          fillColor={fillColor}
          fillImage={fillImage}
          coverColor={coverColor}
          fillPercentage={fillPercentage}
        />
      ) : (
        <UniversalIcon 
          icon={icon} 
          size={calculatedSize} 
          color={finalColor}
        />
      )}
    </div>
  );
};

// CSS for rotation animation
const styleSheet = document.styleSheets[0];
if (styleSheet && !Array.from(styleSheet.cssRules).some(rule => rule instanceof CSSKeyframesRule && rule.name === 'spin')) {
  styleSheet.insertRule(`
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `, styleSheet.cssRules.length);
}

export default IconWidget;
