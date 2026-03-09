/**
 * Camera Widget - Display live camera streams
 * Migrated to Phase 44 standards (Feb 15, 2026)
 * Updated to use Home Assistant's native camera-stream component (March 3, 2026)
 * 
 * Uses HA's built-in streaming - no manual stream configuration needed
 */

import React, { useEffect, useRef, useState } from 'react';
import { useVisibility } from '../../hooks/useVisibility';
import { useWidget } from '../hooks/useWidget';
import type { WidgetProps } from '../types';
import type { WidgetMetadata } from '../types/metadata';
import { applyUniversalStyles } from '../utils/styleBuilder';
import { useResolvedUniversalStyle } from '../../hooks/useResolvedUniversalStyle';

export const cameraWidgetMetadata: WidgetMetadata = {
  name: 'Camera',
  description: 'Display live camera streams from Home Assistant (uses native HA streaming)',
  icon: 'VideocamOutlined',
  category: 'media',
  defaultSize: { w: 400, h: 300 },
  minSize: { w: 200, h: 150 },
  requiresEntity: true,
  fields: [
    // Layout
    { name: 'x', type: 'number', label: 'X Position', default: 0, category: 'layout' },
    { name: 'y', type: 'number', label: 'Y Position', default: 0, category: 'layout' },
    { name: 'width', type: 'number', label: 'Width', default: 400, min: 200, category: 'layout' },
    { name: 'height', type: 'number', label: 'Height', default: 300, min: 150, category: 'layout' },
    
    // Behavior
    { 
      name: 'entity_id', 
      type: 'entity', 
      label: 'Camera Entity', 
      default: '', 
      category: 'behavior',
      description: 'Select camera entity to display'
    },
    { name: 'showControls', type: 'checkbox', label: 'Show Controls', default: true, category: 'behavior', description: 'Show video playback controls' },
    { name: 'muted', type: 'checkbox', label: 'Muted', default: true, category: 'behavior', description: 'Mute audio by default' },
    
    // Style
    {
      name: 'objectFit',
      type: 'select',
      label: 'Object Fit',
      default: 'cover',
      category: 'style',
      options: [
        { value: 'cover', label: 'Cover' },
        { value: 'contain', label: 'Contain' },
        { value: 'fill', label: 'Fill' },
        { value: 'none', label: 'None' },
        { value: 'scale-down', label: 'Scale Down' },
      ],
    },
  ],
};

const CameraWidget: React.FC<WidgetProps> = ({ config }) => {
  const isVisible = useVisibility(config.config.visibilityCondition);
  const { getEntity } = useWidget(config);
  
  // Refs for camera stream container
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Extract config values with defaults
  const {
    entity_id: entityId = '',
    showControls = true,
    muted = true,
    objectFit = 'cover',
  } = config.config;

  // Get entity via useWidget hook (Phase 44 pattern)
  // Get entity via useWidget hook (Phase 44 pattern)
  const entity = getEntity('entity_id');

  // Use Home Assistant's native camera-stream component (handles all streaming automatically)
  useEffect(() => {
    if (!entityId || !entity || !containerRef.current) {
      return;
    }

    const container = containerRef.current; // Capture for cleanup

    // Create ha-camera-stream element (HA's built-in streaming component)
    const createHACameraStream = async () => {
      try {
        setIsLoading(true);

        // Get hass object from window (Home Assistant frontend)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const windowHass = (window as any).hass;
        if (!windowHass) {
          setError('Home Assistant not available');
          setIsLoading(false);
          return;
        }

        // Create ha-camera-stream element
        const cameraStream = document.createElement('ha-camera-stream');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (cameraStream as any).hass = windowHass;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (cameraStream as any).stateObj = entity;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (cameraStream as any).showControls = showControls;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (cameraStream as any).muted = muted;

        // Apply styling
        cameraStream.style.width = '100%';
        cameraStream.style.height = '100%';
        cameraStream.style.display = 'block';
        cameraStream.style.objectFit = objectFit;

        // Clear container and append camera stream
        if (container) {
          container.innerHTML = '';
          container.appendChild(cameraStream);
        }

        setIsLoading(false);
        console.log('[Camera] Using HA native camera-stream for', entityId);
      } catch (err) {
        setError('Failed to create camera stream');
        setIsLoading(false);
        console.error('[Camera] Error:', err);
      }
    };

    createHACameraStream();

    // Cleanup
    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [entityId, entity, showControls, muted, objectFit]);

  // Old streaming implementations removed - now using HA native camera-stream component

  // Styles
  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#000000',
    position: 'relative',
  };

  const errorStyle: React.CSSProperties = {
    color: '#ffffff',
    fontSize: '14px',
    textAlign: 'center',
    padding: '20px',
    boxSizing: 'border-box',
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    borderRadius: '4px',
  };

  // Apply universal styles (bindings, shadows, borders, etc.)
  const universalStyle = useResolvedUniversalStyle(config.config.style);
  const finalStyle = applyUniversalStyles(universalStyle, containerStyle);

  // Hide if visibility condition is false
  if (!isVisible) return null;

  // Render HA native camera stream
  return (
    <div style={finalStyle}>
      {error && <div style={errorStyle}>{error}</div>}
      {isLoading && (
        <div style={{ color: '#888888', fontSize: '14px', textAlign: 'center' }}>
          Initializing camera...
        </div>
      )}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default CameraWidget;
