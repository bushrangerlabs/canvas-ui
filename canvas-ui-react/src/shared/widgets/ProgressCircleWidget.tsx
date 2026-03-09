/**
 * Progress Circle Widget - Circular progress indicator
 * Migrated to Phase 44 standards (Feb 15, 2026)
 */

import React from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useVisibility } from '../../hooks/useVisibility';
import { useWidget } from '../hooks/useWidget';
import type { WidgetProps } from '../types';
import type { WidgetMetadata } from '../types/metadata';
import { applyUniversalStyles } from '../utils/styleBuilder';
import { useResolvedUniversalStyle } from '../../hooks/useResolvedUniversalStyle';

export const ProgressCircleWidgetMetadata: WidgetMetadata = {
  name: 'Progress Circle',
  icon: 'DonutLarge',
  category: 'display',
  description: 'Circular progress indicator',
  defaultSize: { w: 150, h: 150 },
  minSize: { w: 80, h: 80 },
  requiresEntity: false,
  fields: [
    // Layout
    { name: 'x', type: 'number', label: 'X Position', default: 0, category: 'layout' },
    { name: 'y', type: 'number', label: 'Y Position', default: 0, category: 'layout' },
    { name: 'width', type: 'number', label: 'Width', default: 150, min: 80, category: 'layout' },
    { name: 'height', type: 'number', label: 'Height', default: 150, min: 80, category: 'layout' },
    
    // Behavior
    { name: 'entity_id', type: 'entity', label: 'Entity ID', default: '', category: 'behavior', description: 'Entity to display value from' },
    { name: 'value', type: 'number', label: 'Value', default: 50, min: 0, max: 100, category: 'behavior', binding: true },
    { name: 'min', type: 'number', label: 'Min Value', default: 0, category: 'behavior' },
    { name: 'max', type: 'number', label: 'Max Value', default: 100, category: 'behavior' },
    { name: 'showValue', type: 'checkbox', label: 'Show Value', default: true, category: 'behavior' },
    { name: 'unit', type: 'text', label: 'Unit', default: '%', category: 'behavior' },
    { name: 'counterClockwise', type: 'checkbox', label: 'Counter-Clockwise', default: false, category: 'behavior' },
    { name: 'segmented', type: 'checkbox', label: 'Segmented Mode', default: false, category: 'behavior' },
    { name: 'segmentCount', type: 'number', label: 'Segment Count', default: 36, min: 12, max: 72, category: 'behavior' },
    { name: 'segmentGap', type: 'number', label: 'Segment Gap', default: 2, min: 0, max: 10, category: 'behavior', description: 'Gap between segments in degrees' },
    
    // Style
    { name: 'strokeWidth', type: 'number', label: 'Stroke Width', default: 8, min: 1, max: 50, category: 'style' },
    { name: 'pathColor', type: 'color', label: 'Progress Color', default: '#2196f3', category: 'style' },
    { name: 'trailColor', type: 'color', label: 'Trail Color', default: '#d6d6d6', category: 'style' },
    { name: 'textColor', type: 'color', label: 'Text Color', default: '#000000', category: 'style' },
    { name: 'textSize', type: 'number', label: 'Text Size', default: 16, min: 8, max: 48, category: 'style' },
    { name: 'backgroundColor', type: 'color', label: 'Background Color', default: 'transparent', category: 'style' },
    
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

const ProgressCircleWidget: React.FC<WidgetProps> = ({ config }) => {
  // Phase 44: Config destructuring with defaults
  const {
    value: staticValue = 50,
    min = 0,
    max = 100,
    showValue = true,
    unit = '%',
    strokeWidth = 8,
    pathColor = '#2196f3',
    trailColor = '#d6d6d6',
    textColor = '#000000',
    textSize = 16,
    backgroundColor: bgColor = 'transparent',
    counterClockwise = false,
    segmented = false,
    segmentCount = 36,
    segmentGap = 2,
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

  const isVisible = useVisibility(visibilityCondition);
  const universalStyle = useResolvedUniversalStyle(config.config.style || config.config as any);
  
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
    if (!useColorRanges) return pathColor;
    
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
    
    return pathColor;
  };
  
  const finalPathColor = getColorForValue(numValue);

  const baseStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: bgColor,
    padding: '10px',
    boxSizing: 'border-box',
  };

  const style = applyUniversalStyles(universalStyle, baseStyle);

  // Render segmented circular progress with SVG
  const renderSegmented = () => {
    const size = 200; // SVG viewBox size
    const center = size / 2;
    const radius = (size - strokeWidth) / 2;
    
    const anglePerSegment = 360 / segmentCount;
    const gapAngle = segmentGap;
    const segmentAngle = anglePerSegment - gapAngle;
    
    const fillRatio = percentage / 100;
    const totalFilled = fillRatio * segmentCount;
    const fullSegments = Math.floor(totalFilled);
    const partialFill = totalFilled - fullSegments;

    const segments: React.ReactNode[] = [];

    for (let i = 0; i < segmentCount; i++) {
      const startAngle = counterClockwise 
        ? -90 - (i * anglePerSegment) - segmentAngle
        : -90 + (i * anglePerSegment);
      
      const isFilled = i < fullSegments;
      const isPartial = i === fullSegments && partialFill > 0;
      
      const segmentArcAngle = isPartial ? segmentAngle * partialFill : segmentAngle;
      
      if (isFilled || isPartial) {
        const startRad = (startAngle * Math.PI) / 180;
        const endRad = ((startAngle + segmentArcAngle) * Math.PI) / 180;
        
        const x1 = center + radius * Math.cos(startRad);
        const y1 = center + radius * Math.sin(startRad);
        const x2 = center + radius * Math.cos(endRad);
        const y2 = center + radius * Math.sin(endRad);
        
        const largeArcFlag = segmentArcAngle > 180 ? 1 : 0;
        
        segments.push(
          <path
            key={i}
            d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`}
            stroke={finalPathColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
        );
      } else {
        // Empty segment - show trail
        const startRad = (startAngle * Math.PI) / 180;
        const endRad = ((startAngle + segmentAngle) * Math.PI) / 180;
        
        const x1 = center + radius * Math.cos(startRad);
        const y1 = center + radius * Math.sin(startRad);
        const x2 = center + radius * Math.cos(endRad);
        const y2 = center + radius * Math.sin(endRad);
        
        const largeArcFlag = segmentAngle > 180 ? 1 : 0;
        
        segments.push(
          <path
            key={i}
            d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`}
            stroke={trailColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            opacity={0.3}
          />
        );
      }
    }

    return (
      <svg 
        viewBox={`0 0 ${size} ${size}`}
        style={{ width: '100%', height: '100%' }}
      >
        {segments}
        {showValue && (
          <text
            x={center}
            y={center}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={textColor}
            fontSize={textSize}
            fontWeight="bold"
          >
            {numValue.toFixed(0)}{unit}
          </text>
        )}
      </svg>
    );
  };

  return (
    <div style={style}>
      {segmented ? (
        renderSegmented()
      ) : (
        <CircularProgressbar
          value={percentage}
          text={showValue ? `${numValue.toFixed(0)}${unit}` : ''}
          counterClockwise={counterClockwise}
          styles={buildStyles({
            strokeLinecap: 'round',
            pathColor: finalPathColor,
            trailColor: trailColor,
            textColor: textColor,
            textSize: `${textSize}px`,
            pathTransitionDuration: 0.5,
          })}
          strokeWidth={strokeWidth}
        />
      )}
    </div>
  );
};

export default ProgressCircleWidget;
