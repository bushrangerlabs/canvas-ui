/**
 * Gauge Widget - Uses react-gauge-component for professional gauges
 * Migrated to Phase 44 standards (Feb 15, 2026)
 */

import React from 'react';
import GaugeComponent from 'react-gauge-component';
import { useVisibility } from '../../hooks/useVisibility';
import { useWidget } from '../hooks/useWidget';
import type { WidgetProps } from '../types';
import type { WidgetMetadata } from '../types/metadata';
import { applyUniversalStyles } from '../utils/styleBuilder';
import { useResolvedUniversalStyle } from '../../hooks/useResolvedUniversalStyle';

// Static metadata for inspector
export const GaugeWidgetMetadata: WidgetMetadata = {
  name: 'Gauge',
  icon: 'Speed',
  category: 'display',
  description: 'Circular gauge for displaying numeric sensor values',
  defaultSize: { w: 200, h: 200 },
  minSize: { w: 100, h: 100 },
  requiresEntity: true,
  fields: [
    // Layout
    { name: 'x', type: 'number', label: 'X Position', default: 0, category: 'layout' },
    { name: 'y', type: 'number', label: 'Y Position', default: 0, category: 'layout' },
    { name: 'width', type: 'number', label: 'Width', default: 200, min: 100, category: 'layout' },
    { name: 'height', type: 'number', label: 'Height', default: 200, min: 100, category: 'layout' },
    
    // Behavior
    { name: 'entity_id', type: 'entity', label: 'Entity ID', default: '', category: 'behavior', description: 'Sensor entity to display' },
    { name: 'value', type: 'number', label: 'Override Value', default: 0, category: 'behavior', description: 'Direct value override (used when no entity is set)' },
    { name: 'min', type: 'number', label: 'Minimum Value', default: 0, category: 'behavior' },
    { name: 'max', type: 'number', label: 'Maximum Value', default: 100, category: 'behavior' },
    { name: 'unit', type: 'text', label: 'Unit', default: '', category: 'behavior', description: 'e.g. °C, %, W' },
    
    // Gauge Type
    { name: 'gaugeType', type: 'select', label: 'Gauge Type', default: 'radial', category: 'style', 
      options: [
        { value: 'radial', label: 'Radial (Semicircle)' },
        { value: 'grafana', label: 'Grafana (3/4 Circle)' },
        { value: 'semicircle', label: 'Semicircle' }
      ]
    },
    { name: 'needleOnly', type: 'checkbox', label: 'Needle Only Mode', default: false, category: 'style', description: 'Show only needle (for custom gauge overlays)' },
    
    // Needle/Pointer
    { name: 'pointerType', type: 'select', label: 'Needle Type', default: 'needle', category: 'style',
      options: [
        { value: 'needle', label: 'Needle' },
        { value: 'arrow', label: 'Arrow' },
        { value: 'blob', label: 'Blob' }
      ]
    },
    { name: 'pointerColor', type: 'color', label: 'Needle Color', default: '#ffffff', category: 'style' },
    { name: 'pointerLength', type: 'number', label: 'Needle Length', default: 0.7, min: 0.3, max: 1, step: 0.05, category: 'style' },
    { name: 'pointerWidth', type: 'number', label: 'Needle Width', default: 15, min: 5, max: 30, category: 'style' },
    { name: 'pointerElastic', type: 'checkbox', label: 'Elastic Animation', default: true, category: 'style' },
    
    // Arc/Zones
    { name: 'showArc', type: 'checkbox', label: 'Show Arc/Zones', default: true, category: 'style' },
    { name: 'arcWidth', type: 'number', label: 'Arc Width', default: 0.2, min: 0.05, max: 0.5, step: 0.05, category: 'style' },
    { name: 'zone1Color', type: 'color', label: 'Zone 1 Color', default: '#5BE12C', category: 'style' },
    { name: 'zone1Limit', type: 'number', label: 'Zone 1 Limit (%)', default: 33, min: 0, max: 100, category: 'style' },
    { name: 'zone2Color', type: 'color', label: 'Zone 2 Color', default: '#F5CD19', category: 'style' },
    { name: 'zone2Limit', type: 'number', label: 'Zone 2 Limit (%)', default: 66, min: 0, max: 100, category: 'style' },
    { name: 'zone3Color', type: 'color', label: 'Zone 3 Color', default: '#EA4228', category: 'style' },
    
    // Labels
    { name: 'showValue', type: 'checkbox', label: 'Show Value Label', default: true, category: 'style' },
    { name: 'showTicks', type: 'checkbox', label: 'Show Tick Labels', default: true, category: 'style' },
    { name: 'textColor', type: 'color', label: 'Text Color', default: '#ffffff', category: 'style' },
    { name: 'valueSize', type: 'number', label: 'Value Font Size', default: 24, min: 12, max: 48, category: 'style' },
  ],
};

const GaugeWidget: React.FC<WidgetProps> = ({ config }) => {
  // Phase 44: Config destructuring with defaults
  const {
    min = 0,
    max = 100,
    unit = '',
    value: gaugeValue = 0,
    gaugeType = 'radial',
    needleOnly = false,
    pointerType = 'needle',
    pointerColor = '#ffffff',
    pointerLength = 0.7,
    pointerWidth = 15,
    pointerElastic = true,
    showArc = true,
    arcWidth = 0.2,
    zone1Color = '#5BE12C',
    zone1Limit = 33,
    zone2Color = '#F5CD19',
    zone2Limit = 66,
    zone3Color = '#EA4228',
    showValue = true,
    showTicks = true,
    textColor = '#ffffff',
    valueSize = 24,
    visibilityCondition,
  } = config.config;

  const isVisible = useVisibility(visibilityCondition);
  const universalStyle = useResolvedUniversalStyle(config.config.style || config.config as any);
  
  // Use useWidget hook for entity subscriptions
  const { getEntityState } = useWidget(config);

  // Get value: use entity state when entity_id is configured, otherwise fall back to static override
  const entityState = getEntityState('entity_id');
  const isEntityConfigured = !!(config.config.entity_id);
  const rawValue = isEntityConfigured ? (entityState || 0) : (gaugeValue || 0);
  const value = typeof rawValue === 'number' ? rawValue : parseFloat(String(rawValue)) || 0;

  // Adjust showArc based on needleOnly mode
  const finalShowArc = needleOnly ? false : showArc;

  // Calculate zone limits based on min/max range
  const zone1Value = (max - min) * (zone1Limit / 100) + min;
  const zone2Value = (max - min) * (zone2Limit / 100) + min;

  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: needleOnly ? 'transparent' : undefined,
  };

  // Apply universal styles
  const finalStyle = applyUniversalStyles(universalStyle, containerStyle);

  // Don't render if visibility condition is false
  if (!isVisible) return null;

  return (
    <div style={finalStyle}>
      <GaugeComponent
        value={value}
        minValue={min}
        maxValue={max}
        type={gaugeType as any}
        arc={finalShowArc ? {
          width: arcWidth,
          padding: 0.005,
          cornerRadius: 1,
          subArcs: [
            {
              limit: zone1Value,
              color: zone1Color,
              showTick: showTicks,
            },
            {
              limit: zone2Value,
              color: zone2Color,
              showTick: showTicks,
            },
            {
              color: zone3Color,
              showTick: showTicks,
            },
          ],
        } : {
          width: 0,
          padding: 0,
          nbSubArcs: 0,
          colorArray: ['transparent'],
        }}
        pointer={{
          type: pointerType as any,
          elastic: pointerElastic,
          animationDelay: 0,
          color: pointerColor,
          length: pointerLength,
          width: pointerWidth,
        }}
        labels={{
          valueLabel: showValue ? {
            formatTextValue: (value) => `${value}${unit}`,
            style: { fill: textColor, fontSize: `${valueSize}px` },
          } : {
            hide: true,
          },
          tickLabels: showTicks && finalShowArc ? {
            type: 'outer',
            ticks: [
              { value: min },
              { value: (max - min) * 0.5 + min },
              { value: max },
            ],
            defaultTickValueConfig: {
              style: { fill: textColor },
            },
          } : {
            hideMinMax: true,
            ticks: [],
          },
        }}
      />
    </div>
  );
};

export default GaugeWidget;
