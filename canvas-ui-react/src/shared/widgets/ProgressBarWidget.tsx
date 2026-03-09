/**
 * Progress Bar Widget - Linear progress indicator
 * Migrated to Phase 44 standards (Feb 15, 2026)
 */

import React from 'react';
import { useVisibility } from '../../hooks/useVisibility';
import { useWidget } from '../hooks/useWidget';
import type { WidgetProps } from '../types';
import type { WidgetMetadata } from '../types/metadata';
import { applyUniversalStyles } from '../utils/styleBuilder';
import { useResolvedUniversalStyle } from '../../hooks/useResolvedUniversalStyle';

export const ProgressBarWidgetMetadata: WidgetMetadata = {
  name: 'Progress Bar',
  icon: 'LinearScaleOutlined',
  category: 'display',
  description: 'Linear progress indicator',
  defaultSize: { w: 300, h: 40 },
  minSize: { w: 100, h: 20 },
  requiresEntity: false,
  fields: [
    // Layout
    { name: 'x', type: 'number', label: 'X Position', default: 0, category: 'layout' },
    { name: 'y', type: 'number', label: 'Y Position', default: 0, category: 'layout' },
    { name: 'width', type: 'number', label: 'Width', default: 300, min: 100, category: 'layout' },
    { name: 'height', type: 'number', label: 'Height', default: 40, min: 20, category: 'layout' },
    
    // Behavior
    { name: 'entity_id', type: 'entity', label: 'Entity ID', default: '', category: 'behavior', description: 'Entity to display value from' },
    { name: 'value', type: 'number', label: 'Value', default: 50, min: 0, max: 100, category: 'behavior', binding: true },
    { name: 'min', type: 'number', label: 'Min Value', default: 0, category: 'behavior' },
    { name: 'max', type: 'number', label: 'Max Value', default: 100, category: 'behavior' },
    { name: 'showValue', type: 'checkbox', label: 'Show Value', default: true, category: 'behavior' },
    { name: 'unit', type: 'text', label: 'Unit', default: '%', category: 'behavior' },
    { name: 'orientation', type: 'select', label: 'Orientation', default: 'horizontal', category: 'behavior', 
      options: [
        { value: 'horizontal', label: 'Horizontal' },
        { value: 'vertical', label: 'Vertical' }
      ]
    },
    { name: 'displayMode', type: 'select', label: 'Display Mode', default: 'standard', category: 'behavior',
      options: [
        { value: 'standard', label: 'Standard (Smooth)' },
        { value: 'segmented', label: 'Segmented (Blocks)' },
        { value: 'graduated', label: 'Graduated (WiFi Style)' },
        { value: 'striped', label: 'Striped (Animated)' }
      ]
    },
    { name: 'segmentCount', type: 'number', label: 'Segment Count', default: 10, min: 2, max: 50, category: 'behavior' },
    { name: 'segmentGap', type: 'number', label: 'Segment Gap', default: 4, min: 0, max: 20, category: 'behavior' },
    { name: 'emptySegmentMode', type: 'select', label: 'Empty Segments', default: 'outline', category: 'behavior',
      options: [
        { value: 'outline', label: 'Outline' },
        { value: 'dimmed', label: 'Dimmed' },
        { value: 'invisible', label: 'Invisible' }
      ]
    },
    { name: 'graduatedReverse', type: 'checkbox', label: 'Reverse Graduated', default: false, category: 'behavior', description: 'Reverse the graduated ramp direction' },
    
    // Style
    { name: 'barColor', type: 'color', label: 'Bar Color', default: '#2196f3', category: 'style' },
    { name: 'backgroundColor', type: 'color', label: 'Background Color', default: '#424242', category: 'style' },
    { name: 'textColor', type: 'color', label: 'Text Color', default: '#ffffff', category: 'style' },
    { name: 'borderRadius', type: 'number', label: 'Border Radius', default: 0, category: 'style' },
    
    // Color Ranges
    { name: 'useColorRanges', type: 'checkbox', label: 'Use Color Ranges', default: false, category: 'style' },
    { name: 'range1Min', type: 'number', label: 'Range 1 Min', default: 0, category: 'style' },
    { name: 'range1Max', type: 'number', label: 'Range 1 Max', default: 25, category: 'style' },
    { name: 'range1Color', type: 'color', label: 'Range 1 Color', default: '#f44336', category: 'style' },
    { name: 'range2Min', type: 'number', label: 'Range 2 Min', default: 26, category: 'style' },
    { name: 'range2Max', type: 'number', label: 'Range 2 Max', default: 50, category: 'style' },
    { name: 'range2Color', type: 'color', label: 'Range 2 Color', default: '#4caf50', category: 'style' },
    { name: 'range3Min', type: 'number', label: 'Range 3 Min', default: 51, category: 'style' },
    { name: 'range3Max', type: 'number', label: 'Range 3 Max', default: 75, category: 'style' },
    { name: 'range3Color', type: 'color', label: 'Range 3 Color', default: '#2196f3', category: 'style' },
    { name: 'range4Min', type: 'number', label: 'Range 4 Min', default: 76, category: 'style' },
    { name: 'range4Max', type: 'number', label: 'Range 4 Max', default: 100, category: 'style' },
    { name: 'range4Color', type: 'color', label: 'Range 4 Color', default: '#ffeb3b', category: 'style' },
  ],
};

const ProgressBarWidget: React.FC<WidgetProps> = ({ config }) => {
  // Phase 44: Config destructuring with defaults
  const {
    value: staticValue = 50,
    min = 0,
    max = 100,
    showValue = true,
    unit = '%',
    barColor = '#2196f3',
    backgroundColor: bgColor = '#424242',
    textColor = '#ffffff',
    borderRadius = 0,
    cornerRadius, // AI sometimes uses 'cornerRadius' (Lovelace card terminology)
    orientation = 'horizontal',
    displayMode = 'standard',
    segmentCount = 10,
    segmentGap = 4,
    emptySegmentMode = 'outline',
    graduatedReverse = false,
    useColorRanges = false,
    range1Min = 0,
    range1Max = 25,
    range1Color = '#f44336',
    range2Min = 26,
    range2Max = 50,
    range2Color = '#4caf50',
    range3Min = 51,
    range3Max = 75,
    range3Color = '#2196f3',
    range4Min = 76,
    range4Max = 100,
    range4Color = '#ffeb3b',
    visibilityCondition,
  } = config.config;

  // Support both borderRadius and cornerRadius (AI uses cornerRadius for Lovelace cards)
  // Can be either a number (all corners) or object (individual corners)
  const universalStyle = useResolvedUniversalStyle(config.config.style || config.config as any);
  const radiusValue = cornerRadius !== undefined ?cornerRadius : borderRadius;
  
  // Convert to CSS border-radius string
  const borderRadiusCSS = typeof radiusValue === 'object' && radiusValue !== null
    ? `${radiusValue.topLeft || 0}px ${radiusValue.topRight || 0}px ${radiusValue.bottomRight || 0}px ${radiusValue.bottomLeft || 0}px`
    : `${radiusValue}px`;

  const isVisible = useVisibility(visibilityCondition);
  
  // Use useWidget hook for entity subscriptions
  const { getEntityState } = useWidget(config);
  
  // Get value - prefer entity state, fall back to static value
  const entityValue = getEntityState('entity_id');
  const value = entityValue ? parseFloat(entityValue) : staticValue;
  
  if (!isVisible) return null;

  const numValue = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
  const percentage = Math.min(100, Math.max(0, ((numValue - min) / (max - min)) * 100));
  
  // Color range logic
  const getColorForValue = (val: number): string => {
    if (!useColorRanges) return barColor;
    
    const ranges = [
      { min: range1Min, max: range1Max, color: range1Color },
      { min: range2Min, max: range2Max, color: range2Color },
      { min: range3Min, max: range3Max, color: range3Color },
      { min: range4Min, max: range4Max, color: range4Color },
    ];
    
    for (const range of ranges) {
      if (val >= range.min && val <= range.max) {
        return range.color;
      }
    }
    
    return barColor;
  };
  
  const finalBarColor = getColorForValue(numValue);
  const isVertical = orientation === 'vertical';

  const baseStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: bgColor,
    borderRadius: borderRadiusCSS,
    overflow: 'hidden',
  };

  const style = applyUniversalStyles(universalStyle, baseStyle);

  const barStyle: React.CSSProperties = isVertical ? {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: '100%',
    height: `${percentage}%`,
    backgroundColor: finalBarColor,
    transition: 'height 0.3s ease',
  } : {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    width: `${percentage}%`,
    backgroundColor: finalBarColor,
    transition: 'width 0.3s ease',
  };

  const textStyle: React.CSSProperties = {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    color: textColor,
    fontSize: '14px',
    fontWeight: 'bold',
    zIndex: 1,
    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
  };

  // Render segmented progress
  const renderSegmented = () => {
    const segments: React.ReactNode[] = [];
    const fillRatio = percentage / 100;
    const totalFilled = fillRatio * segmentCount;
    const fullSegments = Math.floor(totalFilled);
    const partialFill = totalFilled - fullSegments;

    for (let i = 0; i < segmentCount; i++) {
      const isGraduated = displayMode === 'graduated';
      const isFilled = i < fullSegments;
      const isPartial = i === fullSegments && partialFill > 0;

      let segmentStyle: React.CSSProperties = {
        position: 'absolute',
        backgroundColor: isFilled || isPartial ? finalBarColor : getEmptySegmentColor(),
        transition: 'all 0.3s ease',
      };

      if (isVertical) {
        const segmentHeight = (100 - (segmentGap * (segmentCount - 1))) / segmentCount;
        segmentStyle.width = '100%';
        segmentStyle.height = `${segmentHeight}%`;
        segmentStyle.bottom = `${i * (segmentHeight + segmentGap)}%`;
        segmentStyle.left = '0';

        if (isGraduated) {
          const segmentIndex = graduatedReverse ? (segmentCount - i - 1) : i;
          const widthPercentage = ((segmentIndex + 1) / segmentCount) * 100;
          segmentStyle.width = `${widthPercentage}%`;
          segmentStyle.left = '0'; // Align to left edge
        }
      } else {
        const segmentWidth = (100 - (segmentGap * (segmentCount - 1))) / segmentCount;
        segmentStyle.width = `${segmentWidth}%`;
        segmentStyle.height = '100%';
        segmentStyle.left = `${i * (segmentWidth + segmentGap)}%`;
        segmentStyle.top = '0';

        if (isGraduated) {
          const segmentIndex = graduatedReverse ? (segmentCount - i - 1) : i;
          const heightPercentage = ((segmentIndex + 1) / segmentCount) * 100;
          segmentStyle.height = `${heightPercentage}%`;
          segmentStyle.top = `${100 - heightPercentage}%`;
        }
      }

      if (emptySegmentMode === 'outline' && !isFilled) {
        segmentStyle.backgroundColor = 'transparent';
        segmentStyle.border = `1px solid ${finalBarColor}`;
        segmentStyle.boxSizing = 'border-box';
      }

      if (isPartial) {
        const partialSegment = (
          <div key={`${i}-inner`} style={{
            position: 'absolute',
            backgroundColor: finalBarColor,
            [isVertical ? 'height' : 'width']: `${partialFill * 100}%`,
            [isVertical ? 'width' : 'height']: '100%',
            [isVertical ? 'bottom' : 'left']: 0,
            [isVertical ? 'left' : 'top']: 0,
          }} />
        );
        segments.push(
          <div key={i} style={segmentStyle}>
            {partialSegment}
          </div>
        );
      } else {
        segments.push(<div key={i} style={segmentStyle} />);
      }
    }

    return segments;
  };

  const getEmptySegmentColor = (): string => {
    switch (emptySegmentMode) {
      case 'dimmed':
        return adjustColorOpacity(finalBarColor, 0.3);
      case 'invisible':
        return 'transparent';
      default:
        return 'transparent';
    }
  };

  const adjustColorOpacity = (color: string, opacity: number): string => {
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    if (color.startsWith('rgba')) {
      return color.replace(/[\d.]+\)$/g, `${opacity})`);
    }
    if (color.startsWith('rgb')) {
      return color.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
    }
    return color;
  };

  // Striped pattern for animated mode
  const stripedBarStyle: React.CSSProperties = displayMode === 'striped' ? {
    ...barStyle,
    backgroundImage: `linear-gradient(
      45deg,
      rgba(255, 255, 255, 0.15) 25%,
      transparent 25%,
      transparent 50%,
      rgba(255, 255, 255, 0.15) 50%,
      rgba(255, 255, 255, 0.15) 75%,
      transparent 75%,
      transparent
    )`,
    backgroundSize: isVertical ? '40px 40px' : '40px 40px',
    animation: 'progress-stripes 1s linear infinite',
  } : barStyle;

  return (
    <div style={style}>
      <style>
        {`
          @keyframes progress-stripes {
            0% { background-position: ${isVertical ? '0 0' : '0 0'}; }
            100% { background-position: ${isVertical ? '0 40px' : '40px 0'}; }
          }
        `}
      </style>
      {displayMode === 'segmented' || displayMode === 'graduated' ? (
        renderSegmented()
      ) : (
        <div style={stripedBarStyle} />
      )}
      {showValue && (
        <div style={textStyle}>
          {numValue.toFixed(0)}{unit}
        </div>
      )}
    </div>
  );
};

export default ProgressBarWidget;
