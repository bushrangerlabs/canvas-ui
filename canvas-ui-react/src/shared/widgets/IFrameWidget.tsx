/**
 * IFrame Widget - Embed external URLs or internal views
 * Migrated to Phase 44 standards (Feb 15, 2026)
 */

import React from 'react';
import { useVisibility } from '../../hooks/useVisibility';
import type { WidgetProps } from '../types';
import type { WidgetMetadata } from '../types/metadata';
import { applyUniversalStyles } from '../utils/styleBuilder';
import { useResolvedUniversalStyle } from '../../hooks/useResolvedUniversalStyle';

export const IFrameWidgetMetadata: WidgetMetadata = {
  name: 'IFrame',
  icon: 'Web',
  category: 'containers',
  description: 'Embed external websites or internal views',
  defaultSize: { w: 400, h: 300 },
  minSize: { w: 100, h: 100 },
  requiresEntity: false,
  fields: [
    // Layout
    { name: 'x', type: 'number', label: 'X Position', default: 0, category: 'layout' },
    { name: 'y', type: 'number', label: 'Y Position', default: 0, category: 'layout' },
    { name: 'width', type: 'number', label: 'Width', default: 400, min: 100, category: 'layout' },
    { name: 'height', type: 'number', label: 'Height', default: 300, min: 100, category: 'layout' },
    
    // Behavior
    { name: 'urlType', type: 'select', label: 'URL Type', default: 'external', category: 'behavior', options: [
      { value: 'external', label: 'External URL' },
      { value: 'view', label: 'Embed View' },
      { value: 'entity', label: 'Entity State URL' }
    ]},
    { name: 'url', type: 'text', label: 'URL', default: '', category: 'behavior', description: 'External URL to embed' },
    { name: 'viewId', type: 'text', label: 'View ID', default: '', category: 'behavior', description: 'View to embed (for urlType=view)' },
    { name: 'entity_id', type: 'entity', label: 'URL Entity', default: '', category: 'behavior', description: 'Entity containing URL (for urlType=entity)' },
    { name: 'allowFullscreen', type: 'checkbox', label: 'Allow Fullscreen', default: true, category: 'behavior' },
    { name: 'sandbox', type: 'text', label: 'Sandbox', default: '', category: 'behavior', description: 'Security sandbox flags (e.g., allow-scripts allow-same-origin)' },
    { name: 'scrolling', type: 'select', label: 'Scrollbars', default: 'auto', category: 'behavior', options: [
      { value: 'auto', label: 'Auto' },
      { value: 'yes', label: 'Always Show' },
      { value: 'no', label: 'Hide' }
    ]},
  ],
};

const IFrameWidget: React.FC<WidgetProps> = ({ config, entityState, isEditMode }) => {
  // Phase 44: Config destructuring with defaults
  const {
    urlType = 'external',
    url = '',
    viewId = '',
    allowFullscreen = true,
    sandbox = '',
    scrolling = 'auto',
    visibilityCondition,
  } = config.config;

  const isVisible = useVisibility(visibilityCondition);
  const universalStyle = useResolvedUniversalStyle(config.config.style || config.config as any);

  // Get URL from entity if urlType is 'entity'
  const entityUrl = entityState?.state || '';

  // Determine final URL
  let finalUrl = '';
  if (urlType === 'entity') {
    finalUrl = String(entityUrl) || url;
  } else if (urlType === 'view') {
    // Construct URL to embed current app in kiosk mode with specified view
    finalUrl = viewId ? `${window.location.origin}${window.location.pathname}#kiosk=${viewId}` : '';
  } else {
    finalUrl = url;
  }

  // Container fills widget area
  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: isVisible ? 'block' : 'none',
    position: 'relative',
    overflow: 'hidden',
    boxSizing: 'border-box',
  };

  // Apply universal styles to container
  const finalContainerStyle = applyUniversalStyles(universalStyle, containerStyle);

  // IFrame fills container completely
  // When hiding scrollbars, make iframe larger and let container clip them
  const iframeStyle: React.CSSProperties = {
    width: scrolling === 'no' ? 'calc(100% + 20px)' : '100%',
    height: scrolling === 'no' ? 'calc(100% + 20px)' : '100%',
    border: 'none',
    display: 'block',
    pointerEvents: isEditMode ? 'none' : 'auto', // Disable iframe interaction in edit mode
  };

  if (!finalUrl) {
    return (
      <div style={{ ...finalContainerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
        No URL configured
      </div>
    );
  }

  return (
    <div style={finalContainerStyle}>
      <iframe
        key={`${finalUrl}-${scrolling}`}
        src={finalUrl}
        style={iframeStyle}
        scrolling={scrolling}
        allowFullScreen={allowFullscreen}
        sandbox={sandbox || undefined}
        title="IFrame Widget"
      />
    </div>
  );
};

export default IFrameWidget;
