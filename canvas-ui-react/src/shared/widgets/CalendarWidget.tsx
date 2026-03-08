/**
 * Calendar Widget - Display upcoming calendar events
 * Migrated to Phase 44 standards (Feb 15, 2026)
 */

import React, { useEffect, useState } from 'react';
import { useVisibility } from '../../hooks/useVisibility';
import { useWebSocket } from '../providers/WebSocketProvider';
import type { WidgetProps } from '../types';
import type { WidgetMetadata } from '../types/metadata';
import { applyUniversalStyles } from '../utils/styleBuilder';

export const CalendarWidgetMetadata: WidgetMetadata = {
  name: 'Calendar',
  icon: 'CalendarMonthOutlined',
  category: 'display',
  description: 'Display upcoming calendar events',
  defaultSize: { w: 350, h: 300 },
  minSize: { w: 200, h: 150 },
  requiresEntity: true,
  fields: [
    // Layout
    { name: 'x', type: 'number', label: 'X Position', default: 0, category: 'layout' },
    { name: 'y', type: 'number', label: 'Y Position', default: 0, category: 'layout' },
    { name: 'width', type: 'number', label: 'Width', default: 350, min: 200, category: 'layout' },
    { name: 'height', type: 'number', label: 'Height', default: 300, min: 150, category: 'layout' },
    
    // Behavior
    { name: 'entity_id', type: 'entity', label: 'Calendar Entity', default: '', category: 'behavior', description: 'Calendar entity to display' },
    { name: 'maxEvents', type: 'number', label: 'Max Events', default: 5, min: 1, max: 20, category: 'behavior', description: 'Maximum number of events to show' },
    { name: 'daysAhead', type: 'number', label: 'Days Ahead', default: 7, min: 1, max: 365, category: 'behavior', description: 'Number of days to look ahead' },
    { name: 'showDate', type: 'checkbox', label: 'Show Date', default: true, category: 'behavior' },
    { name: 'showTime', type: 'checkbox', label: 'Show Time', default: true, category: 'behavior' },
    { name: 'showLocation', type: 'checkbox', label: 'Show Location', default: false, category: 'behavior' },
    { name: 'compactMode', type: 'checkbox', label: 'Compact Mode', default: false, category: 'behavior', description: 'Show events in compact list' },
    
    // Style
    { name: 'backgroundColor', type: 'color', label: 'Background Color', default: '#ffffff', category: 'style' },
    { name: 'headerColor', type: 'color', label: 'Header Color', default: '#2196f3', category: 'style' },
    { name: 'textColor', type: 'color', label: 'Text Color', default: '#000000', category: 'style' },
    { name: 'eventColor', type: 'color', label: 'Event Color', default: '#4caf50', category: 'style' },
    { name: 'borderRadius', type: 'number', label: 'Border Radius', default: 4, min: 0, max: 20, category: 'style' },
    { name: 'fontSize', type: 'number', label: 'Font Size', default: 14, min: 10, max: 24, category: 'style' },
  ],
};

interface CalendarEvent {
  summary: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
}

const CalendarWidget: React.FC<WidgetProps> = ({ config }) => {
  const { entities } = useWebSocket();
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // Phase 44: Config destructuring with defaults
  const {
    entity_id = '',
    showDate = true,
    showTime = true,
    showLocation = false,
    compactMode = false,
    backgroundColor: bgColor = '#ffffff',
    headerColor = '#2196f3',
    textColor = '#000000',
    eventColor = '#4caf50',
    borderRadius = 4,
    cornerRadius, // AI sometimes uses 'cornerRadius' (Lovelace card terminology)
    fontSize = 14,
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

  useEffect(() => {
    // Extract events from entity attributes if available
    if (entity && entity.attributes) {
      const message = entity.attributes.message || entity.state;
      const start = entity.attributes.start_time || new Date().toISOString();
      const end = entity.attributes.end_time || new Date().toISOString();
      
      if (message && message !== 'unavailable') {
        setEvents([{
          summary: message,
          start: start,
          end: end,
          location: entity.attributes.location,
          description: entity.attributes.description,
        }]);
      } else {
        setEvents([]);
      }
    }
  }, [entity]);

  if (!isVisible) return null;

  const baseStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    backgroundColor: bgColor,
    borderRadius: borderRadiusCSS,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
  };

  const style = applyUniversalStyles(universalStyle, baseStyle);

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    }
  };

  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={style}>
      {/* Header */}
      <div style={{
        backgroundColor: headerColor,
        color: '#ffffff',
        padding: compactMode ? '8px 12px' : '12px 16px',
        fontSize: fontSize + 2,
        fontWeight: 'bold',
      }}>
        📅 Upcoming Events
      </div>

      {/* Events */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: compactMode ? '8px' : '12px',
        boxSizing: 'border-box',
      }}>
        {events.length === 0 ? (
          <div style={{ color: textColor, padding: '16px', boxSizing: 'border-box', textAlign: 'center' }}>
            {entity_id ? 'No events scheduled' : 'Select a calendar entity'}
          </div>
        ) : (
          events.map((event, index) => (
            <div
              key={index}
              style={{
                borderLeft: `4px solid ${eventColor}`,
                padding: compactMode ? '8px' : '12px',
                boxSizing: 'border-box',
                marginBottom: compactMode ? '6px' : '10px',
                backgroundColor: 'rgba(0, 0, 0, 0.03)',
                borderRadius: '4px',
              }}
            >
              <div style={{
                color: textColor,
                fontSize: fontSize,
                fontWeight: 'bold',
                marginBottom: '4px',
              }}>
                {event.summary}
              </div>

              {(showDate || showTime) && (
                <div style={{
                  color: textColor,
                  fontSize: fontSize - 2,
                  opacity: 0.7,
                  marginBottom: '2px',
                }}>
                  {showDate && formatDate(event.start)}
                  {showDate && showTime && ' • '}
                  {showTime && formatTime(event.start)}
                </div>
              )}

              {showLocation && event.location && (
                <div style={{
                  color: textColor,
                  fontSize: fontSize - 2,
                  opacity: 0.6,
                  marginTop: '4px',
                }}>
                  📍 {event.location}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CalendarWidget;
