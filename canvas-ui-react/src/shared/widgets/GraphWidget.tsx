/**
 * Graph Widget - Display sensor history as charts using MUI X Charts
 * Migrated to Phase 44 standards (Feb 15, 2026)
 */

import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';
import React, { useEffect, useState } from 'react';
import { useVisibility } from '../../hooks/useVisibility';
import { useWebSocket } from '../providers/WebSocketProvider';
import type { WidgetProps } from '../types';
import type { WidgetMetadata } from '../types/metadata';
import { applyUniversalStyles } from '../utils/styleBuilder';

export const GraphWidgetMetadata: WidgetMetadata = {
  name: 'Graph',
  icon: 'ShowChartOutlined',
  category: 'display',
  description: 'Display sensor history as line, bar, or area charts',
  defaultSize: { w: 400, h: 250 },
  minSize: { w: 200, h: 150 },
  requiresEntity: true,
  fields: [
    // Layout
    { name: 'x', type: 'number', label: 'X Position', default: 0, category: 'layout' },
    { name: 'y', type: 'number', label: 'Y Position', default: 0, category: 'layout' },
    { name: 'width', type: 'number', label: 'Width', default: 400, min: 200, category: 'layout' },
    { name: 'height', type: 'number', label: 'Height', default: 250, min: 150, category: 'layout' },
    
    // Behavior
    { name: 'entity_id', type: 'entity', label: 'Entity ID', default: '', category: 'behavior', description: 'Sensor entity to graph' },
    { name: 'chartType', type: 'select', label: 'Chart Type', default: 'line', category: 'behavior', options: [
      { value: 'line', label: 'Line Chart' },
      { value: 'bar', label: 'Bar Chart' },
      { value: 'area', label: 'Area Chart' },
    ]},
    { name: 'dataPoints', type: 'number', label: 'Data Points', default: 50, min: 10, max: 500, category: 'behavior', description: 'Number of data points to display' },
    { name: 'showLegend', type: 'checkbox', label: 'Show Legend', default: true, category: 'behavior' },
    { name: 'showTooltip', type: 'checkbox', label: 'Show Tooltip', default: true, category: 'behavior' },
    { name: 'showGrid', type: 'checkbox', label: 'Show Grid', default: true, category: 'behavior' },
    { name: 'smooth', type: 'checkbox', label: 'Smooth Lines', default: true, category: 'behavior', description: 'Smooth line charts with curves' },
    { name: 'showAxisLabels', type: 'checkbox', label: 'Show Axis Labels', default: true, category: 'behavior' },
    { name: 'animationDuration', type: 'number', label: 'Animation Duration (ms)', default: 300, min: 0, max: 2000, category: 'behavior' },
    
    // Style
    { name: 'lineColor', type: 'color', label: 'Line/Bar Color', default: '#2196f3', category: 'style' },
    { name: 'fillColor', type: 'color', label: 'Fill Color', default: 'rgba(33, 150, 243, 0.2)', category: 'style' },
    { name: 'backgroundColor', type: 'color', label: 'Background Color', default: '#ffffff', category: 'style' },
    { name: 'gridColor', type: 'color', label: 'Grid Color', default: 'rgba(0, 0, 0, 0.1)', category: 'style' },
    { name: 'textColor', type: 'color', label: 'Text Color', default: '#000000', category: 'style' },
    { name: 'borderRadius', type: 'number', label: 'Border Radius', default: 4, min: 0, max: 20, category: 'style' },
  ],
};

const GraphWidget: React.FC<WidgetProps> = ({ config }) => {
  const { entities } = useWebSocket();
  const [historyData, setHistoryData] = useState<number[]>([]);

  // Phase 44: Config destructuring with defaults
  const {
    entity_id = '',
    chartType = 'line',
    dataPoints = 50,
    showLegend = true,
    showGrid = true,
    smooth = true,
    showAxisLabels = true,
    lineColor = '#2196f3',
    backgroundColor: bgColor = '#ffffff',
    textColor = '#000000',
    borderRadius = 4,
    cornerRadius, // AI sometimes uses 'cornerRadius' (Lovelace card terminology)
    visibilityCondition,
  } = config.config;

  // Support both borderRadius and cornerRadius (AI uses cornerRadius for Lovelace cards)
  // Can be either a number (all corners) or object (individual corners)
  const universalStyle = config.config.style || config.config as any;
  const radiusValue = cornerRadius !== undefined ? cornerRadius : borderRadius;
  
  // Convert to CSS border-radius string
  const borderRadiusCSS = typeof radiusValue === 'object' && radiusValue !== null
    ? `${radiusValue.topLeft || 0}px ${radiusValue.topRight || 0}px ${radiusValue.bottomRight || 0}px ${radiusValue.bottomLeft || 0}px`
    : `${radiusValue}px`;

  const isVisible = useVisibility(visibilityCondition);
  const entity = entity_id && entities?.[entity_id];
  const currentValue = entity ? parseFloat(entity.state) || 0 : 0;

  useEffect(() => {
    // Update history with current value
    if (entity_id && currentValue !== undefined && !isNaN(currentValue)) {
      setHistoryData(prev => {
        const newData = [...prev, currentValue].slice(-dataPoints);
        return newData;
      });
    }
  }, [currentValue, entity_id, dataPoints]);

  if (!isVisible) return null;

  const baseStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    backgroundColor: bgColor,
    borderRadius: borderRadiusCSS,
    padding: '8px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
  };

  const style = applyUniversalStyles(universalStyle, baseStyle);

  // Prepare data for MUI X Charts
  const xAxisData = historyData.map((_, index) => index);
  const entityName = entity_id ? entity_id.split('.')[1]?.replace(/_/g, ' ') : 'Sensor';
  const unit = entity?.attributes?.unit_of_measurement || '';

  const renderChart = () => {
    if (historyData.length === 0) {
      return (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%', 
          color: textColor 
        }}>
          {entity_id ? 'Waiting for data...' : 'Select an entity'}
        </div>
      );
    }

    const width = config.position.width || 400;
    const height = (config.position.height || 250) - 16;

    // Common chart props
    const chartProps = {
      xAxis: [{ 
        data: xAxisData,
        scaleType: chartType === 'bar' ? ('band' as const) : ('point' as const),
        label: showAxisLabels ? 'Time' : undefined,
        tickLabelStyle: { fill: textColor, fontSize: 10 },
        labelStyle: { fill: textColor, fontSize: 12 },
      }],
      yAxis: [{ 
        label: showAxisLabels ? `${entityName} ${unit}`.trim() : undefined,
        tickLabelStyle: { fill: textColor, fontSize: 10 },
        labelStyle: { fill: textColor, fontSize: 12 },
      }],
      grid: showGrid ? { horizontal: true } : undefined,
      slotProps: {
        legend: showLegend ? {
          labelStyle: { fill: textColor, fontSize: 12 },
          position: { vertical: 'top', horizontal: 'end' } as const,
        } : { hidden: true },
      },
      sx: {
        '& .MuiChartsAxis-line': { stroke: textColor },
        '& .MuiChartsAxis-tick': { stroke: textColor },
        '& .MuiChartsGrid-line': { stroke: textColor, strokeOpacity: 0.2 },
      },
    };

    if (chartType === 'bar') {
      return (
        <BarChart
          width={width}
          height={height}
          series={[
            {
              data: historyData,
              label: showLegend ? entityName : undefined,
              color: lineColor,
            },
          ]}
          {...chartProps}
        />
      );
    }

    // Line and Area charts
    return (
      <LineChart
        width={width}
        height={height}
        series={[
          {
            data: historyData,
            label: showLegend ? entityName : undefined,
            color: lineColor,
            curve: smooth ? 'natural' : 'linear',
            area: chartType === 'area',
            showMark: historyData.length < 20,
          },
        ]}
        {...chartProps}
      />
    );
  };

  return (
    <div style={style}>
      {renderChart()}
    </div>
  );
};

export default GraphWidget;
