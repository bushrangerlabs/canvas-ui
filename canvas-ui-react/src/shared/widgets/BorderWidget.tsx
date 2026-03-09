/**
 * Border Widget - Decorative border/frame
 * Migrated to Phase 44 standards (Feb 15, 2026)
 * 
 * Pure layout/styling widget with no entity logic
 */

import React from 'react';
import { useVisibility } from '../../hooks/useVisibility';
import type { WidgetProps } from '../types';
import type { WidgetMetadata } from '../types/metadata';
import { applyUniversalStyles } from '../utils/styleBuilder';
import { useResolvedUniversalStyle } from '../../hooks/useResolvedUniversalStyle';

export const BorderWidgetMetadata: WidgetMetadata = {
  name: 'Border',
  icon: 'BorderOuter',
  category: 'containers',
  description: 'Decorative border or frame',
  defaultSize: { w: 200, h: 200 },
  minSize: { w: 50, h: 50 },
  requiresEntity: false,
  fields: [
    // Layout
    { name: 'x', type: 'number', label: 'X Position', default: 0, category: 'layout' },
    { name: 'y', type: 'number', label: 'Y Position', default: 0, category: 'layout' },
    { name: 'width', type: 'number', label: 'Width', default: 200, min: 50, category: 'layout' },
    { name: 'height', type: 'number', label: 'Height', default: 200, min: 50, category: 'layout' },
  ],
};

const BorderWidget: React.FC<WidgetProps> = ({ config }) => {
  const isVisible = useVisibility(config.config.visibilityCondition);

  // Base container style (no hardcoded border - let universal styles handle it)
  const baseStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'block',
    boxSizing: 'border-box',
  };

  // Apply universal styles (border, background, shadow)
  // Accept styles from inspector (config.config.style) or flat AI-generated config (config.config).
  // After normalizeConfig runs, styles are always in config.config.style. However, fall back to the
  // full config object in case normalizeConfig hasn't run yet (e.g., first render before store init).
  const universalStyle = useResolvedUniversalStyle((config.config.style && Object.keys(config.config.style).length > 0)
    ? config.config.style
    : (config.config as any));
  const styleWithDefaults = {
    ...universalStyle,
    // Support both canonical names (borderColor/borderWidth/borderStyle) and legacy names
    // (strokeColor/strokeWidth/dashStyle) that older AI prompts used to generate.
    borderWidth: universalStyle?.borderWidth
      ?? (typeof universalStyle?.strokeWidth === 'string' ? (parseInt(universalStyle.strokeWidth, 10) || 2) : universalStyle?.strokeWidth)
      ?? 2,
    borderStyle: universalStyle?.borderStyle ?? universalStyle?.dashStyle ?? 'solid',
    borderColor: universalStyle?.borderColor ?? universalStyle?.strokeColor ?? 'rgba(128, 128, 128, 0.3)',
  };
  
  const finalStyle = applyUniversalStyles(styleWithDefaults, baseStyle);

  if (!isVisible) return null;

  return <div style={finalStyle} />;
};

export default BorderWidget;
