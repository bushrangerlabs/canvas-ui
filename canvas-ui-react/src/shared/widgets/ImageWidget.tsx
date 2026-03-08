/**
 * Image Widget - Display images from URLs or camera entities
 * Migrated to Phase 44 standards (Feb 15, 2026)
 */

import React from 'react';
import { useVisibility } from '../../hooks/useVisibility';
import { useWidget } from '../hooks/useWidget';
import type { WidgetProps } from '../types';
import type { WidgetMetadata } from '../types/metadata';
import { applyUniversalStyles } from '../utils/styleBuilder';

export const ImageWidgetMetadata: WidgetMetadata = {
  name: 'Image',
  icon: 'ImageOutlined',
  category: 'media',
  description: 'Display images from URLs or camera entities',
  defaultSize: { w: 300, h: 200 },
  minSize: { w: 100, h: 100 },
  requiresEntity: false,
  fields: [
    // Layout
    { name: 'x', type: 'number', label: 'X Position', default: 0, category: 'layout' },
    { name: 'y', type: 'number', label: 'Y Position', default: 0, category: 'layout' },
    { name: 'width', type: 'number', label: 'Width', default: 300, min: 100, category: 'layout' },
    { name: 'height', type: 'number', label: 'Height', default: 200, min: 100, category: 'layout' },
    
    // Behavior
    { name: 'entity_id', type: 'entity', label: 'Camera Entity', default: '', category: 'behavior', description: 'Select camera entity (uses entity_picture attribute)' },
    { name: 'localImagePath', type: 'file', label: 'Local Image Path', default: '', category: 'behavior', description: 'Browse for local image file (e.g., /local/images/photo.jpg)' },
    { name: 'imageUrl', type: 'text', label: 'External URL', default: '', category: 'behavior', description: 'Full URL to external image (e.g., https://...)' },
    { name: 'altText', type: 'text', label: 'Alt Text', default: 'Image', category: 'behavior' },
    { name: 'refreshInterval', type: 'number', label: 'Refresh Interval (ms)', default: 0, category: 'behavior', description: '0 = no auto-refresh' },
    
    // Style
    { name: 'objectFit', type: 'select', label: 'Object Fit', default: 'cover', category: 'style', options: [
      { value: 'contain', label: 'Contain' },
      { value: 'cover', label: 'Cover' },
      { value: 'fill', label: 'Fill' },
      { value: 'none', label: 'None' },
      { value: 'scale-down', label: 'Scale Down' },
    ]},
  ],
};

const ImageWidget: React.FC<WidgetProps> = ({ config }) => {
  // Extract config values with defaults (Phase 44 pattern)
  const {
    localImagePath = '',
    imageUrl: externalUrl = '',
    altText = 'Image',
    refreshInterval = 0,
    objectFit = 'cover',
    style,
  } = config.config;

  const isVisible = useVisibility(config.config.visibilityCondition);
  
  // Use useWidget hook for entity subscriptions
  const { getEntity } = useWidget(config);
  
  // Get image URL - priority: localImagePath > imageUrl > entity_picture
  const entity = getEntity('entity_id');
  const entityPicture = entity?.attributes?.entity_picture || '';
  const localPath = localImagePath;
  
  // Convert /config/www/ paths to /local/ for Home Assistant
  const convertToLocalPath = (path: string): string => {
    if (!path) return '';
    if (path.startsWith('/config/www/')) {
      return path.replace('/config/www/', '/local/');
    }
    return path;
  };
  
  // Determine final image URL (priority order)
  const rawImageUrl = localPath || externalUrl || entityPicture;
  const imageUrl = convertToLocalPath(rawImageUrl);

  // Add timestamp for auto-refresh
  const [timestamp, setTimestamp] = React.useState(Date.now());

  React.useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(() => {
        setTimestamp(Date.now());
      }, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  // Construct URL with timestamp if needed
  const finalUrl = imageUrl 
    ? (refreshInterval > 0 ? `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}t=${timestamp}` : imageUrl)
    : '';

  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#000000',
  };

  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: objectFit as any,
  };

  // Apply universal styles
  const finalStyle = applyUniversalStyles(style, containerStyle);

  // Don't render if visibility condition is false
  if (!isVisible) return null;

  return (
    <div style={finalStyle}>
      {finalUrl ? (
        <img 
          src={finalUrl} 
          alt={altText} 
          style={imageStyle}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <div style={{ color: '#666', fontSize: '14px', textAlign: 'center', padding: '20px', boxSizing: 'border-box' }}>
          No image URL configured
        </div>
      )}
    </div>
  );
};

export default ImageWidget;
