/**
 * Flip Clock Widget - Realistic mechanical flip clock with animations
 * Migrated to Phase 44 standards (Feb 15, 2026)
 * 
 * Time-only widget with no entity dependencies
 * Based on https://codepen.io/gametroll/pen/wvozJKv
 */

import React, { useEffect, useRef, useState } from 'react';
import { useVisibility } from '../../hooks/useVisibility';
import type { WidgetProps } from '../types';
import type { WidgetMetadata } from '../types/metadata';
import { applyUniversalStyles } from '../utils/styleBuilder';

const FlipClockWidgetMetadata: WidgetMetadata = {
  name: 'Flip Clock',
  icon: 'FlipClock',
  category: 'display',
  description: 'Mechanical-style flip clock with realistic animations',
  defaultSize: { w: 400, h: 240 },
  minSize: { w: 300, h: 180 },
  requiresEntity: false,
  fields: [
    // Layout
    { name: 'x', type: 'number', label: 'X Position', default: 0, category: 'layout' },
    { name: 'y', type: 'number', label: 'Y Position', default: 0, category: 'layout' },
    { name: 'width', type: 'number', label: 'Width', default: 400, min: 300, category: 'layout' },
    { name: 'height', type: 'number', label: 'Height', default: 240, min: 180, category: 'layout' },
    
    // Behavior
    { name: 'format', type: 'select', label: 'Time Format', default: '12', category: 'behavior', options: [
      { value: '12', label: '12 Hour' },
      { value: '24', label: '24 Hour' }
    ]},
    { name: 'showSeconds', type: 'checkbox', label: 'Show Seconds', default: true, category: 'behavior' },
    
    // Style
    { name: 'bgColor', type: 'color', label: 'Background Color', default: 'rgb(38, 37, 41)', category: 'style' },
    { name: 'cardTopColor', type: 'color', label: 'Card Top Color', default: 'rgb(48, 49, 53)', category: 'style' },
    { name: 'cardBottomColor', type: 'color', label: 'Card Bottom Color', default: 'rgb(57, 58, 63)', category: 'style' },
    { name: 'textColor', type: 'color', label: 'Text Color', default: '#ffffff', category: 'style' },
    { name: 'fontFamily', type: 'font', label: 'Font Family', default: '"Saira Extra Condensed", sans-serif', category: 'style' },
    { name: 'fontSizeScale', type: 'slider', label: 'Font Size Scale (%)', default: 100, min: 50, max: 150, step: 5, category: 'style' },
    { name: 'showGears', type: 'checkbox', label: 'Show Gears', default: true, category: 'style' },
    { name: 'showBorders', type: 'checkbox', label: 'Show Card Borders', default: true, category: 'style' },
    { name: 'showContainerBorder', type: 'checkbox', label: 'Show Container Border', default: true, category: 'style' },
  ],
};

interface FlipperState {
  current: string;
  isFlipping: boolean;
}

const Flipper: React.FC<{
  value: string;
  cardTopColor: string;
  cardBottomColor: string;
  textColor: string;
  fontFamily: string;
  fontSizeScale: number;
  showGears: boolean;
  showBorders: boolean;
  clockHeight: number;
  radius: number;
}> = ({ value, cardTopColor, cardBottomColor, textColor, fontFamily, fontSizeScale, showGears, showBorders, clockHeight, radius }) => {
  const [state, setState] = useState<FlipperState>({ current: value, isFlipping: false });
  const [nextValue, setNextValue] = useState<string>(value);

  useEffect(() => {
    if (value !== state.current) {
      setNextValue(value);
      setState({ current: state.current, isFlipping: true });
      
      setTimeout(() => {
        setState({ current: value, isFlipping: false });
      }, 550);
    }
  }, [value, state.current]);

  const fontSize = clockHeight * 0.64 * (fontSizeScale / 100);
  // Calculate lineHeight to maintain perfect vertical centering for 50/50 split
  // The card height is (50% - gap), so we need to calculate the actual card height
  const cardGapPixels = clockHeight * 0.068; // 15/220
  const cardHeight = (clockHeight / 2) - cardGapPixels;
  // lineHeight should be 2x the card height to center text vertically in top half
  const lineHeight = cardHeight * 2;
  const gearWidth = clockHeight * 0.055; // 12/220 ratio
  const gearOutline = Math.max(2, clockHeight * 0.014); // 3/220 ratio, min 2px

  const gearStyle: React.CSSProperties = {
    position: 'absolute',
    top: `${clockHeight / 3}px`,
    width: `${gearWidth}px`,
    height: `${clockHeight / 3}px`,
    background: 'linear-gradient(to bottom, #000000 0%, #666666 17%, #7f7f7f 52%, #0c0c0c 53%, #595959 87%, #131313 100%)',
    outline: `${gearOutline}px solid #000`,
    zIndex: 99,
    transform: 'translateZ(10px)',
  };

  const marginTop = clockHeight * 0.045; // 10/220
  const marginBottom = marginTop / 2; // 5/220
  const borderWidth = Math.max(1, clockHeight * 0.009); // 2/220, min 1px
  const shadowBlur = clockHeight * 0.027; // 6/220

  const topBottomBase: React.CSSProperties = {
    boxShadow: `0 ${shadowBlur}px ${shadowBlur}px 1px rgba(0, 0, 0, 0.5), 0 2px 2px 1px rgba(255, 255, 255, 0.15)`,
    ...(showBorders && {
      borderTop: `${borderWidth}px solid rgb(102, 103, 110)`,
      borderBottom: `${borderWidth}px solid #000`,
    }),
    position: 'relative',
    width: '100%',
  };

  const topStyle: React.CSSProperties = {
    ...topBottomBase,
    height: `calc(50% - ${cardGapPixels}px)`,
    backgroundImage: `linear-gradient(${cardTopColor} 0%, rgb(56, 57, 62) 100%)`,
    marginTop: `${marginTop}px`,
    marginBottom: `${marginBottom}px`,
    borderTopLeftRadius: `${radius * 0.65}px`,
    borderTopRightRadius: `${radius * 0.65}px`,
    overflow: 'hidden',
  };

  const bottomStyle: React.CSSProperties = {
    ...topBottomBase,
    height: `calc(50% - ${cardGapPixels}px)`,
    backgroundImage: `linear-gradient(${cardBottomColor} 0%, rgb(65, 65, 71) 100%)`,
    marginTop: `${marginBottom}px`,
    marginBottom: `${marginTop}px`,
    borderBottomLeftRadius: `${radius * 0.65}px`,
    borderBottomRightRadius: `${radius * 0.65}px`,
    overflow: 'hidden',
  };

  const textStyle: React.CSSProperties = {
    fontSize: `${fontSize}px`,
    display: 'block',
    position: 'absolute',
    overflow: 'hidden',
    width: '100%',
    height: '100%',
    lineHeight: `${lineHeight}px`,
    textAlign: 'center',
    color: textColor,
    fontFamily: fontFamily,
    fontWeight: 600,
  };

  const bottomTextStyle: React.CSSProperties = {
    ...textStyle,
    lineHeight: '0',
  };

  const newTopStyle: React.CSSProperties = {
    ...topStyle,
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: state.isFlipping ? 12 : 1,
    transformOrigin: 'bottom center',
    animation: state.isFlipping ? 'flipTop 0.55s ease-in-out forwards' : 'none',
  };

  const newBottomStyle: React.CSSProperties = {
    ...bottomStyle,
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    transform: 'rotateX(0.5turn)',
    zIndex: 1,
    opacity: state.isFlipping ? 1 : 0,
    animation: state.isFlipping ? 'flipBottom 0.55s ease-in-out forwards' : 'none',
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      minWidth: '150px',
      height: '100%',
      transformStyle: 'preserve-3d',
      perspective: '1600px',
    }}>
      {showGears && (
        <>
          <div style={{ ...gearStyle, left: 0 }} />
          <div style={{ ...gearStyle, left: `calc(100% - ${gearWidth}px)` }} />
        </>
      )}
      
      {/* Static top */}
      <div style={topStyle}>
        <div style={textStyle}>{state.current}</div>
      </div>
      
      {/* Static bottom */}
      <div style={bottomStyle}>
        <div style={bottomTextStyle}>{state.current}</div>
      </div>

      {/* Animated top (flips down) */}
      {state.isFlipping && (
        <div style={newTopStyle}>
          <div style={textStyle}>{state.current}</div>
          <div style={newBottomStyle}>
            <div style={bottomTextStyle}>{nextValue}</div>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes flipTop {
            0% { transform: rotateX(0) translateY(0px); }
            100% { transform: rotateX(-180deg) translateY(-10px); }
          }
          @keyframes flipBottom {
            0% { opacity: 0; }
            49% { opacity: 0; }
            50% { opacity: 1; }
            100% { opacity: 1; }
          }
        `}
      </style>
    </div>
  );
};

const FlipClockWidget: React.FC<WidgetProps> = ({ config, isEditMode }) => {
  // Extract config values
  const {
    visibilityCondition,
    format = '12',
    showSeconds = true,
    bgColor = 'rgb(38, 37, 41)',
    cardTopColor = 'rgb(48, 49, 53)',
    cardBottomColor = 'rgb(57, 58, 63)',
    textColor = '#ffffff',
    fontFamily = '"Saira Extra Condensed", sans-serif',
    fontSizeScale = 100,
    showGears = true,
    showBorders = true,
    showContainerBorder = true,
  } = config.config;

  const [time, setTime] = useState({ hour: '00', minute: '00', second: '00' });
  const isVisible = useVisibility(visibilityCondition);

  useEffect(() => {
    if (!isVisible && !isEditMode) return;

    const updateTime = () => {
      const date = new Date();
      let hour = date.getHours();
      
      if (format === '12') {
        if (hour > 12) hour = hour - 12;
        if (hour === 0) hour = 12;
      }
      
      const hourStr = hour.toString().padStart(2, '0');
      const minuteStr = date.getMinutes().toString().padStart(2, '0');
      const secondStr = date.getSeconds().toString().padStart(2, '0');
      
      setTime({ hour: hourStr, minute: minuteStr, second: secondStr });
    };

    updateTime();
    const interval = setInterval(updateTime, 500);
    return () => clearInterval(interval);
  }, [isVisible, isEditMode, format]);

  if (!isVisible && !isEditMode) {
    return null;
  }

  // Use actual widget dimensions for true resizability
  const clockWidth = config.position.width;
  const clockHeight = config.position.height;
  
  // Size correction - detect rendering size mismatch and fix it
  const clockRef = useRef<HTMLDivElement>(null);
  const [sizeCorrection, setSizeCorrection] = useState<{ scaleX: number; scaleY: number }>({ scaleX: 1, scaleY: 1 });
  
  useEffect(() => {
    if (clockRef.current) {
      const rect = clockRef.current.getBoundingClientRect();
      
      // Calculate actual vs expected size ratio
      const scaleX = config.position.width / rect.width;
      const scaleY = config.position.height / rect.height;
      
      // Only apply correction if mismatch is > 1% (to avoid float precision issues)
      const needsCorrection = Math.abs(1 - scaleX) > 0.01 || Math.abs(1 - scaleY) > 0.01;
      
      if (needsCorrection) {
        console.log('[FlipClock] Size correction needed:', {
          expected: { width: config.position.width, height: config.position.height },
          actual: { width: rect.width, height: rect.height },
          correction: { scaleX, scaleY }
        });
        setSizeCorrection({ scaleX, scaleY });
      } else {
        setSizeCorrection({ scaleX: 1, scaleY: 1 });
      }
    }
  }, [config.position.width, config.position.height, config.id]);
  
  // Scale everything proportionally based on height
  const radius = clockHeight * 0.136; // 30/220 ratio from original
  const padding = clockWidth * 0.03; // 12px relative to 400px width
  const columnGap = clockWidth * 0.03;

  const clockStyle: React.CSSProperties = {
    ...applyUniversalStyles(config.config),
    display: 'grid',
    padding: `0 ${padding}px`,
    boxSizing: 'border-box',
    gridTemplateColumns: showSeconds ? '1fr 1fr 1fr' : '1fr 1fr',
    gridColumnGap: `${columnGap}px`,
    width: '100%',
    height: '100%',
    borderRadius: `${radius}px`,
    backgroundImage: 'linear-gradient(rgb(14, 14, 15) 0%, rgb(26, 25, 28) 20%, rgb(44, 44, 52) 50%, rgb(20, 20, 27) 100%)',
    ...(showContainerBorder && {
      boxShadow: 'inset 0 -3px 6px 3px rgba(0, 0, 0, 0.2), inset 0 4px 8px 3px rgba(0, 0, 0, 0.4), 0 2px 3px 1px rgba(255, 255, 255, 0.3), 0 -2px 4px 4px rgba(56, 56, 61, 0.5)',
    }),
    backgroundColor: bgColor,
    // Apply size correction transform if needed
    ...(sizeCorrection.scaleX !== 1 || sizeCorrection.scaleY !== 1 ? {
      transform: `scale(${sizeCorrection.scaleX}, ${sizeCorrection.scaleY})`,
      transformOrigin: 'top left',
    } : {}),
  };

  return (
    <div ref={clockRef} style={clockStyle}>
      <Flipper
        value={time.hour}
        cardTopColor={cardTopColor}
        cardBottomColor={cardBottomColor}
        textColor={textColor}
        fontFamily={fontFamily}
        fontSizeScale={fontSizeScale}
        showGears={showGears}
        showBorders={showBorders}
        clockHeight={clockHeight}
        radius={radius}
      />
      <Flipper
        value={time.minute}
        cardTopColor={cardTopColor}
        cardBottomColor={cardBottomColor}
        textColor={textColor}
        fontFamily={fontFamily}
        fontSizeScale={fontSizeScale}
        showGears={showGears}
        showBorders={showBorders}
        clockHeight={clockHeight}
        radius={radius}
      />
      {showSeconds && (
        <Flipper
          value={time.second}
          cardTopColor={cardTopColor}
          cardBottomColor={cardBottomColor}
          textColor={textColor}
          fontFamily={fontFamily}
          fontSizeScale={fontSizeScale}
          showGears={showGears}
          showBorders={showBorders}
          clockHeight={clockHeight}
          radius={radius}
        />
      )}
    </div>
  );
};
export { FlipClockWidget as default, FlipClockWidgetMetadata };
