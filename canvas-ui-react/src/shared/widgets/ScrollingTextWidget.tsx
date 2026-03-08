/**
 * Scrolling Text Widget - Simple right-to-left scrolling ticker
 * Phase 44 standards (Feb 15, 2026)
 */

import React, { useEffect, useRef, useState } from 'react';
import { useEntityBinding } from '../../hooks/useEntityBinding';
import { useVisibility } from '../../hooks/useVisibility';
import type { WidgetProps } from '../types';
import type { WidgetMetadata } from '../types/metadata';
import { applyUniversalStyles } from '../utils/styleBuilder';

export const ScrollingTextWidgetMetadata: WidgetMetadata = {
  name: 'Scrolling Text',
  icon: 'TextRotationNone',
  category: 'display',
  description: 'Right-to-left scrolling ticker text',
  defaultSize: { w: 400, h: 60 },
  minSize: { w: 100, h: 30 },
  requiresEntity: false,
  fields: [
    // Layout
    { name: 'x', type: 'number', label: 'X Position', default: 0, category: 'layout' },
    { name: 'y', type: 'number', label: 'Y Position', default: 0, category: 'layout' },
    { name: 'width', type: 'number', label: 'Width', default: 400, min: 100, category: 'layout' },
    { name: 'height', type: 'number', label: 'Height', default: 60, min: 30, category: 'layout' },
    
    // Behavior
    { name: 'text', type: 'text', label: 'Text', default: 'Scrolling text goes here...', category: 'behavior', description: 'Static text to display' },
    { name: 'entity_id', type: 'entity', label: 'Entity ID (optional)', default: '', category: 'behavior', description: 'Use entity state instead of static text' },
    { name: 'scrollSpeed', type: 'number', label: 'Scroll Speed', default: 50, min: 10, max: 200, category: 'behavior', description: 'Pixels per second' },
    { name: 'pauseOnHover', type: 'checkbox', label: 'Pause on Hover', default: true, category: 'behavior', description: 'Stop scrolling when mouse over' },
    { name: 'separator', type: 'text', label: 'Separator', default: '  •  ', category: 'behavior', description: 'Text between repeated content' },
    
    // Style
    { name: 'textColor', type: 'color', label: 'Text Color', default: '#ffffff', category: 'style' },
    { name: 'backgroundColor', type: 'color', label: 'Background Color', default: '#2196f3', category: 'style' },
    { name: 'fontSize', type: 'number', label: 'Font Size', default: 18, min: 10, max: 72, category: 'style' },
    { name: 'fontFamily', type: 'font', label: 'Font Family', default: 'Arial, sans-serif', category: 'style' },
    { name: 'fontWeight', type: 'select', label: 'Font Weight', default: 'normal', category: 'style', options: [
      { value: 'normal', label: 'Normal' },
      { value: 'bold', label: 'Bold' },
      { value: '300', label: 'Light' },
      { value: '500', label: 'Medium' },
    ]},
  ],
};

const ScrollingTextWidget: React.FC<WidgetProps> = ({ config }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Phase 44: Config destructuring with defaults
  const {
    text: staticText = 'Scrolling text goes here...',
    entity_id = '',
    scrollSpeed = 50,
    pauseOnHover = true,
    separator = '  •  ',
    textColor = '#ffffff',
    backgroundColor = '#2196f3',
    fontSize = 18,
    fontFamily = 'Arial, sans-serif',
    fontWeight = 'normal',
    visibilityCondition,
  } = config.config;

  const isVisible = useVisibility(visibilityCondition);
  const universalStyle = config.config.style || config.config as any;

  // Use entity binding for dynamic text
  const displayText = useEntityBinding(entity_id ? '{entity.state}' : staticText, staticText);

  // Calculate animation duration based on text width and speed
  const [duration, setDuration] = useState(10);

  useEffect(() => {
    if (textRef.current && containerRef.current) {
      const textWidth = textRef.current.scrollWidth;
      const containerWidth = containerRef.current.offsetWidth;
      
      // Duration = distance / speed
      // Text needs to scroll its full width + container width (starting from right edge)
      const distance = textWidth + containerWidth;
      const calculatedDuration = distance / scrollSpeed;
      
      setDuration(calculatedDuration);
    }
  }, [displayText, scrollSpeed, fontSize, fontFamily]);

  if (!isVisible) return null;

  const baseStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    backgroundColor,
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  };

  const finalStyle = applyUniversalStyles(universalStyle, baseStyle);

  const scrollingContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
    animation: isPaused ? 'none' : `scroll-rtl ${duration}s linear infinite`,
    willChange: 'transform',
    paddingLeft: '100%', // Start text completely off-screen to the right
    boxSizing: 'border-box',
  };

  const textStyle: React.CSSProperties = {
    color: textColor,
    fontSize: `${fontSize}px`,
    fontFamily,
    fontWeight,
    marginRight: separator,
    display: 'inline-block',
  };

  return (
    <div 
      ref={containerRef}
      style={finalStyle}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >
      <style>{`
        @keyframes scroll-rtl {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
      
      <div ref={textRef} style={scrollingContainerStyle}>
        {/* Single text instance - padding and animation handle the looping */}
        <span style={textStyle}>{displayText}</span>
      </div>
    </div>
  );
};

export default ScrollingTextWidget;
