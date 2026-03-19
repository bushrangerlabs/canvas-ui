/**
 * Shape Widget - Custom polygon with sharp, rounded, or chamfered corners
 * Pure decoration/layout widget (no entity binding)
 */

import React, { useId, useEffect, useState } from 'react';
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
    // Fill, stroke, shadow, and background image are controlled by the universal Background/Border/Shadow tabs.
  ],
};

/** Extract the raw URL out of a CSS url(...) string produced by WidgetRenderer. */
function extractImageUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const m = value.match(/^url\(['"]?(.*?)['"]?\)$/);
  return m ? m[1] : value;
}

const ShapeWidget: React.FC<WidgetProps> = ({ config }) => {
  // useId gives a stable per-instance unique string — sanitise for use as XML id
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const clipId = `sc${uid}`;
  const patId  = `sp${uid}`;

  const style = config.config.style || {};

  // Fill — from universal Background tab
  const fillColor   = style.backgroundColor ?? 'transparent';
  const fillOpacity = style.backgroundOpacity ?? 1;

  // Background image — WidgetRenderer has already converted path + wrapped in url()
  const imageUrl  = extractImageUrl(style.backgroundImage as string | undefined);
  const bgSize    = (style.backgroundSize as string | undefined) ?? 'cover';
  const bgRepeat  = style.backgroundRepeat ?? 'no-repeat';
  const isTile    = bgRepeat !== 'no-repeat';

  // Map CSS backgroundSize → SVG preserveAspectRatio for non-tile modes
  const preserveAR = (() => {
    if (bgSize === 'contain')     return 'xMidYMid meet';
    if (bgSize === '100% 100%')   return 'none';           // stretch
    return 'xMidYMid slice';                               // cover (default)
  })();

  // Measure natural image size for tiling — falls back to 100×100 until loaded
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number }>({ w: 100, h: 100 });
  useEffect(() => {
    if (!imageUrl || !isTile) return;
    const img = new window.Image();
    img.onload = () => setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = imageUrl;
  }, [imageUrl, isTile]);

  // Stroke — from universal Border tab
  const strokeColor     = style.borderColor ?? '#00d4ff';
  const strokeWidth     = typeof style.borderWidth === 'number' ? style.borderWidth : 2;
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

  // Tile cell = natural image size (preserves original pixel dimensions)
  const tileW = naturalSize.w;
  const tileH = naturalSize.h;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      overflow="visible"
      style={{ display: 'block' }}
    >
      <defs>
        {/* Clip path so the image/pattern is masked to the polygon shape */}
        <clipPath id={clipId}>
          <path d={pathD} />
        </clipPath>
        {/* Pattern used for tile modes */}
        {imageUrl && isTile && (
          <pattern id={patId} patternUnits="userSpaceOnUse"
            width={bgRepeat === 'repeat-y' ? w : tileW}
            height={bgRepeat === 'repeat-x' ? h : tileH}>
            <image href={imageUrl} x="0" y="0" width={tileW} height={tileH} preserveAspectRatio="none" />
          </pattern>
        )}
      </defs>

      {/* 1 — solid colour fill (always rendered; sits behind image) */}
      <path d={pathD} fill={fillColor} fillOpacity={fillOpacity} stroke="none" />

      {/* 2 — background image, clipped to the shape path */}
      {imageUrl && !isTile && (
        <image
          href={imageUrl}
          x="0" y="0"
          width={w} height={h}
          preserveAspectRatio={preserveAR}
          clipPath={`url(#${clipId})`}
        />
      )}
      {imageUrl && isTile && (
        <rect x="0" y="0" width={w} height={h}
          fill={`url(#${patId})`}
          clipPath={`url(#${clipId})`}
        />
      )}

      {/* 3 — stroke on top of everything */}
      {strokeWidth > 0 && (
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDashArray}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
};

export default ShapeWidget;
