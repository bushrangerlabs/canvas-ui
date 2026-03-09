/**
 * Resolution Widget - Display viewport resolution and aspect ratio
 * Migrated to Phase 44 standards (Feb 15, 2026)
 */

import React, { useEffect, useState } from 'react';
import type { WidgetProps } from '../types';
import type { WidgetMetadata } from '../types/metadata';
import { applyUniversalStyles } from '../utils/styleBuilder';
import { useResolvedUniversalStyle } from '../../hooks/useResolvedUniversalStyle';

const ResolutionWidget: React.FC<WidgetProps> = ({ config }) => {
  // Phase 44: Config destructuring with defaults
  const {
    showResolution = true,
    showRatio = true,
    showLabel = true,
    textColor = '#ffffff',
    labelColor = '#cccccc',
    backgroundColor = 'rgba(0, 0, 0, 0.5)',
    fontSize = 24,
    labelSize = 14,
  } = config.config;
  const universalStyle = useResolvedUniversalStyle(config.config.style || config.config as any);

  const [resolution, setResolution] = useState({ width: 0, height: 0 });

  // Update resolution on mount and resize
  useEffect(() => {
    const updateResolution = () => {
      setResolution({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateResolution();
    window.addEventListener('resize', updateResolution);

    return () => {
      window.removeEventListener('resize', updateResolution);
    };
  }, []);

  // Calculate aspect ratio
  const getAspectRatio = (): string => {
    const gcd = (a: number, b: number): number => {
      return b === 0 ? a : gcd(b, a % b);
    };

    const divisor = gcd(resolution.width, resolution.height);
    const ratioW = resolution.width / divisor;
    const ratioH = resolution.height / divisor;

    // Check for common aspect ratios
    const ratio = resolution.width / resolution.height;
    if (Math.abs(ratio - 16 / 9) < 0.01) return '16:9';
    if (Math.abs(ratio - 16 / 10) < 0.01) return '16:10';
    if (Math.abs(ratio - 4 / 3) < 0.01) return '4:3';
    if (Math.abs(ratio - 21 / 9) < 0.01) return '21:9';
    if (Math.abs(ratio - 3 / 2) < 0.01) return '3:2';

    return `${ratioW}:${ratioH}`;
  };

  const baseStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor,
    padding: '16px',
    boxSizing: 'border-box',
    userSelect: 'none',
  };
  const finalStyle = applyUniversalStyles(universalStyle, baseStyle);

  return (
    <div style={finalStyle}>
      {showLabel && (
        <div
          style={{
            fontSize: `${labelSize}px`,
            color: labelColor,
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          Resolution
        </div>
      )}

      {showResolution && (
        <div
          style={{
            fontSize: `${fontSize}px`,
            fontWeight: 'bold',
            color: textColor,
            fontFamily: 'monospace',
            marginBottom: showRatio ? '8px' : '0',
          }}
        >
          {resolution.width} × {resolution.height}
        </div>
      )}

      {showRatio && (
        <div
          style={{
            fontSize: `${fontSize * 0.7}px`,
            color: labelColor,
            fontFamily: 'monospace',
          }}
        >
          {getAspectRatio()}
        </div>
      )}
    </div>
  );
};

export const resolutionWidgetMetadata: WidgetMetadata = {
  name: 'Resolution',
  description: 'Display viewport resolution and aspect ratio (developer tool)',
  icon: 'MonitorOutlined',
  category: 'display',
  defaultSize: { w: 200, h: 150 },
  fields: [
    // Layout
    { name: 'width', type: 'number', label: 'Width', default: 200, min: 100, category: 'layout' },
    { name: 'height', type: 'number', label: 'Height', default: 150, min: 80, category: 'layout' },

    // Behavior
    { name: 'showResolution', type: 'checkbox', label: 'Show Resolution', default: true, category: 'behavior' },
    { name: 'showRatio', type: 'checkbox', label: 'Show Aspect Ratio', default: true, category: 'behavior' },
    { name: 'showLabel', type: 'checkbox', label: 'Show Label', default: true, category: 'behavior' },

    // Style
    { name: 'textColor', type: 'color', label: 'Text Color', default: '#ffffff', category: 'style' },
    { name: 'labelColor', type: 'color', label: 'Label Color', default: '#cccccc', category: 'style' },
    { name: 'backgroundColor', type: 'color', label: 'Background Color', default: 'rgba(0, 0, 0, 0.5)', category: 'style' },
    { name: 'fontSize', type: 'number', label: 'Font Size', default: 24, min: 12, max: 72, category: 'style' },
    { name: 'labelSize', type: 'number', label: 'Label Size', default: 14, min: 10, max: 32, category: 'style' },
  ],
};

export default ResolutionWidget;
