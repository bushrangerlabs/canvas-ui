/**
 * Shape Widget - Custom polygon with sharp, rounded, or chamfered corners
 * Pure decoration/layout widget (no entity binding)
 */

import React from 'react';
import { useVisibility } from '../../hooks/useVisibility';
import type { WidgetProps } from '../types';
import type { WidgetMetadata } from '../types/metadata';
import { buildSVGPath, SHAPE_PRESETS, type VertexPoint } from '../utils/buildSVGPath';

export { type VertexPoint } from '../utils/buildSVGPath';

const DEFAULT_POINTS: VertexPoint[] = SHAPE_PRESETS.rectangle;

export const ShapeWidgetMetadata: WidgetMetadata = {
  name: 'Shape',
  icon: 'HexagonOutlined',
  category: 'containers',
  description: 'Custom polygon shape — sharp, rounded, or chamfered corners. Use "Edit Shape" in the inspector or let AI generate the points array.',
  defaultSize: { w: 200, h: 200 },
  minSize: { w: 30, h: 30 },
  requiresEntity: false,
  fields: [
    // Layout
    { name: 'x',      type: 'number', label: 'X Position', default: 0,   category: 'layout' },
    { name: 'y',      type: 'number', label: 'Y Position', default: 0,   category: 'layout' },
    { name: 'width',  type: 'number', label: 'Width',      default: 200, min: 30, category: 'layout' },
    { name: 'height', type: 'number', label: 'Height',     default: 200, min: 30, category: 'layout' },
    // Fill, stroke, and shadow are controlled by the universal Background/Border/Shadow tabs.
  ],
};

const ShapeWidget: React.FC<WidgetProps> = ({ config }) => {
  const style = config.config.style || {};
  // Fill — from universal Background tab
  const fillColor    = style.backgroundColor ?? 'transparent';
  const fillOpacity  = style.backgroundOpacity ?? 1;
  // Stroke — from universal Border tab
  const strokeColor  = style.borderColor ?? '#00d4ff';
  const strokeWidth  = typeof style.borderWidth === 'number' ? style.borderWidth : 2;
  const strokeDashArray = (() => {
    switch (style.borderStyle) {
      case 'dashed': return '8 4';
      case 'dotted': return '2 4';
      default: return undefined;
    }
  })();

  const isVisible = useVisibility(config.config.visibilityCondition);
  if (!isVisible) return null;

  const points: VertexPoint[] = config.config.points ?? DEFAULT_POINTS;
  const w = config.position?.width  ?? 200;
  const h = config.position?.height ?? 200;

  const pathD = buildSVGPath(points, w, h);

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      overflow="visible"
      style={{ display: 'block' }}
    >
      <path
        d={pathD}
        fill={fillColor}
        fillOpacity={fillOpacity}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDashArray}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};

export default ShapeWidget;
