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

    // Style
    { name: 'fillColor',      type: 'color',  label: 'Fill Color',   default: 'transparent', category: 'style' },
    { name: 'fillOpacity',    type: 'slider', label: 'Fill Opacity', default: 1,   min: 0, max: 1, step: 0.05, category: 'style' },
    { name: 'strokeColor',    type: 'color',  label: 'Border Color', default: '#00d4ff', category: 'style' },
    { name: 'strokeWidth',    type: 'number', label: 'Border Width', default: 2,   min: 0, max: 30, category: 'style' },
    { name: 'strokeDashArray',type: 'text',   label: 'Dash Pattern', default: '',  category: 'style',
      description: '"8 4" = dashed, "2 4" = dotted, empty = solid' },
    { name: 'glowColor',      type: 'color',  label: 'Glow Color',   default: '#00d4ff', category: 'style' },
    { name: 'glowBlur',       type: 'number', label: 'Glow Blur',    default: 0,   min: 0, max: 40, category: 'style',
      description: '0 = no glow' },
  ],
};

const ShapeWidget: React.FC<WidgetProps> = ({ config }) => {
  const {
    fillColor       = 'transparent',
    fillOpacity     = 1,
    strokeColor     = '#00d4ff',
    strokeWidth     = 2,
    strokeDashArray = '',
    glowBlur        = 0,
    visibilityCondition,
  } = config.config;

  const isVisible = useVisibility(visibilityCondition);
  if (!isVisible) return null;

  const points: VertexPoint[] = config.config.points ?? DEFAULT_POINTS;
  const w = config.position?.width  ?? 200;
  const h = config.position?.height ?? 200;

  const pathD = buildSVGPath(points, w, h);
  const filterId = `shape-glow-${config.id}`;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      overflow="visible"
      style={{ display: 'block' }}
    >
      {glowBlur > 0 && (
        <defs>
          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation={glowBlur / 2} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      )}
      <path
        d={pathD}
        fill={fillColor}
        fillOpacity={fillOpacity}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDashArray || undefined}
        strokeLinejoin="round"
        strokeLinecap="round"
        filter={glowBlur > 0 ? `url(#${filterId})` : undefined}
      />
    </svg>
  );
};

export default ShapeWidget;
