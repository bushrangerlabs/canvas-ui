/**
 * Digital Clock Widget - Simple LED-style digital clock
 * Migrated to Phase 44 standards (Feb 15, 2026)
 * 
 * Time-only widget with no entity dependencies
 * Inspired by https://github.com/esadakman/reactjs-digital-clock
 */

import React, { useEffect, useState } from 'react';
import { useVisibility } from '../../hooks/useVisibility';
import type { WidgetProps } from '../types';
import type { WidgetMetadata } from '../types/metadata';
import { applyUniversalStyles } from '../utils/styleBuilder';

export const DigitalClockWidgetMetadata: WidgetMetadata = {
  name: 'Digital Clock',
  icon: 'DigitalClock',
  category: 'display',
  description: 'LED-style digital clock with date display',
  defaultSize: { w: 300, h: 120 },
  minSize: { w: 200, h: 80 },
  requiresEntity: false,
  fields: [
    // Layout
    { name: 'x', type: 'number', label: 'X Position', default: 0, category: 'layout' },
    { name: 'y', type: 'number', label: 'Y Position', default: 0, category: 'layout' },
    { name: 'width', type: 'number', label: 'Width', default: 300, min: 200, category: 'layout' },
    { name: 'height', type: 'number', label: 'Height', default: 120, min: 80, category: 'layout' },
    
    // Behavior
    { name: 'format', type: 'select', label: 'Time Format', default: '12', category: 'behavior', options: [
      { value: '12', label: '12 Hour' },
      { value: '24', label: '24 Hour' }
    ]},
    { name: 'showSeconds', type: 'checkbox', label: 'Show Seconds', default: true, category: 'behavior' },
    { name: 'showDate', type: 'checkbox', label: 'Show Date', default: true, category: 'behavior' },
    { name: 'showDay', type: 'checkbox', label: 'Show Day of Week', default: true, category: 'behavior' },
    
    // Style
    { name: 'backgroundColor', type: 'color', label: 'Background Color', default: '#1a1a1a', category: 'style' },
    { name: 'timeColor', type: 'color', label: 'Time Color', default: '#00ff00', category: 'style' },
    { name: 'dateColor', type: 'color', label: 'Date Color', default: '#00ff00', category: 'style' },
    { name: 'fontFamily', type: 'font', label: 'Time Font', default: '"DSEG7 Classic", monospace', category: 'style' },
    { name: 'fontFamilySecondary', type: 'font', label: 'AM/PM & Date Font', default: 'Arial, sans-serif', category: 'style' },
    { name: 'fontSize', type: 'number', label: 'Font Size', default: 48, min: 20, max: 120, category: 'style' },
    { name: 'glow', type: 'checkbox', label: 'Glow Effect', default: true, category: 'style' },
    { name: 'blinkColon', type: 'checkbox', label: 'Blinking Colon', default: true, category: 'style' },
  ],
};

const DigitalClockWidget: React.FC<WidgetProps> = ({ config }) => {
  // Extract config values with defaults (Phase 44 pattern)
  const {
    format = '12',
    showSeconds = true,
    showDate = true,
    showDay = true,
    backgroundColor = '#1a1a1a',
    timeColor = '#00ff00',
    dateColor = '#00ff00',
    fontSize = 48,
    fontFamily = 'digital',
    fontFamilySecondary = 'Arial, sans-serif',
    glow = true,
    blinkColon = true,
  } = config.config;

  // State
  const [time, setTime] = useState(new Date());
  const [colonVisible, setColonVisible] = useState(true);

  // Check visibility condition
  const isVisible = useVisibility(config.config.visibilityCondition);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!config.config.blinkColon) return;
    
    const blinker = setInterval(() => {
      setColonVisible(prev => !prev);
    }, 500);

    return () => clearInterval(blinker);
  }, [blinkColon]);

  if (!isVisible) return null;

  // Format time
  let hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();
  let ampm = '';

  if (format === '12') {
    ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours || 12;
  }

  const hoursStr = String(hours).padStart(2, '0');
  const minutesStr = String(minutes).padStart(2, '0');
  const secondsStr = String(seconds).padStart(2, '0');

  // Format date
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const dayName = days[time.getDay()];
  const monthName = months[time.getMonth()];
  const date = time.getDate();
  const year = time.getFullYear();

  // Use configured font family
  const selectedFont = fontFamily || '"DSEG7 Classic", monospace';

  // Styles
  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    backgroundColor,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: selectedFont,
    padding: '10px',
    boxSizing: 'border-box',
  };

  const timeStyle: React.CSSProperties = {
    fontSize: `${fontSize}px`,
    fontWeight: 'bold',
    color: timeColor,
    letterSpacing: '0.05em',
    textShadow: glow ? `0 0 ${fontSize * 0.2}px ${timeColor}` : 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
  };

  const colonStyle: React.CSSProperties = {
    opacity: (blinkColon && colonVisible) || !blinkColon ? 1 : 0,
    transition: 'opacity 0.1s',
  };

  const ampmStyle: React.CSSProperties = {
    fontSize: `${fontSize * 0.35}px`,
    marginLeft: '8px',
    fontWeight: 'bold',
    fontFamily: fontFamilySecondary,
  };

  const dateStyle: React.CSSProperties = {
    fontSize: `${fontSize * 0.3}px`,
    color: dateColor,
    marginTop: '8px',
    textAlign: 'center',
    textShadow: glow ? `0 0 ${fontSize * 0.1}px ${dateColor}` : 'none',
    fontFamily: fontFamilySecondary,
  };

  const dayStyle: React.CSSProperties = {
    fontSize: `${fontSize * 0.25}px`,
    color: dateColor,
    marginTop: '4px',
    textAlign: 'center',
    textShadow: glow ? `0 0 ${fontSize * 0.1}px ${dateColor}` : 'none',
    fontFamily: fontFamilySecondary,
  };

  // Apply universal styles
  const finalStyle = applyUniversalStyles(config.config.style, containerStyle);

  return (
    <div style={finalStyle}>
      <div style={timeStyle}>
        <span>{hoursStr}</span>
        <span style={colonStyle}>:</span>
        <span>{minutesStr}</span>
        {showSeconds && (
          <>
            <span style={colonStyle}>:</span>
            <span>{secondsStr}</span>
          </>
        )}
        {format === '12' && <span style={ampmStyle}>{ampm}</span>}
      </div>
      
      {showDate && (
        <div style={dateStyle}>
          {monthName} {date}, {year}
        </div>
      )}
      
      {showDay && (
        <div style={dayStyle}>
          {dayName}
        </div>
      )}
    </div>
  );
};

export default DigitalClockWidget;
