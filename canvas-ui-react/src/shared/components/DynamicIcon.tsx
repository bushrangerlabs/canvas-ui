/**
 * DynamicIcon Component
 * Renders icons from different libraries with lazy loading
 */

import React, { useEffect, useState } from 'react';
import { loadMDIIcons, loadReactIcons, parseIconString } from '../utils/iconLoader';
import { UniversalIcon } from './UniversalIcon';

interface DynamicIconProps {
  icon: string;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  outlineMode?: 'none' | 'outline' | 'filled';
  strokeWidth?: number;
  glowWidth?: number;
  glowColor?: string;
  shadowEnabled?: boolean;
  shadowColor?: string;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowBlur?: number;
  fillDirection?: 'bottom-up' | 'top-down' | 'left-to-right' | 'right-to-left';
  fillColor?: string;
  fillImage?: string;
  coverColor?: string;
  fillPercentage?: number;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ 
  icon, 
  size = 24, 
  color = 'currentColor',
  style = {},
  outlineMode = 'none',
  strokeWidth = 2,
  glowWidth = 0,
  glowColor = '',
  shadowEnabled = false,
  shadowColor = '#000000',
  shadowOffsetX = 2,
  shadowOffsetY = 2,
  shadowBlur = 4,
  fillDirection = 'bottom-up',
  fillColor = '#00ff00',
  fillImage = '',
  coverColor = '#000000',
  fillPercentage = 0,
}) => {
  const [IconComponent, setIconComponent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const loadIcon = async () => {
      setLoading(true);
      const { type, name } = parseIconString(icon);

      try {
        // Check for iconify collections FIRST (before emoji check)
        // This handles fa6-solid:, material-symbols:, bi:, ion:, etc.
        if (icon.includes(':') && !icon.startsWith('emoji:') && type !== 'mdi' && 
            type !== 'fa' && type !== 'md' && type !== 'io' && type !== 'bi') {
          // Modern iconify collection - use UniversalIcon
          if (mounted) {
            setIconComponent(() => () => (
              <UniversalIcon 
                icon={icon} 
                size={size} 
                color={color}
                style={style}
              />
            ));
            setLoading(false);
          }
        } else if (type === 'emoji') {
          if (mounted) {
            if (outlineMode === 'none') {
              // Normal mode - just show the emoji with color
              const emojiStyle: React.CSSProperties = {
                fontSize: size,
                color: color,
                ...style,
              };
              setIconComponent(() => () => (
                <span style={emojiStyle}>{name}</span>
              ));
            } else if (outlineMode === 'outline') {
              // Outline mode - stroke and glow only
              const shadows = [];
              
              if (strokeWidth > 0) {
                shadows.push(
                  `-${strokeWidth}px -${strokeWidth}px 0 ${color}`,
                  `${strokeWidth}px -${strokeWidth}px 0 ${color}`,
                  `-${strokeWidth}px ${strokeWidth}px 0 ${color}`,
                  `${strokeWidth}px ${strokeWidth}px 0 ${color}`
                );
              }
              
              if (glowWidth > 0) {
                shadows.push(`0 0 ${glowWidth}px ${color}`);
              }
              
              const emojiStyle: React.CSSProperties = {
                fontSize: size,
                textShadow: shadows.join(', '),
                WebkitTextStroke: strokeWidth > 0 ? `${strokeWidth}px ${color}` : undefined,
                color: 'transparent',
                ...style,
              };
              setIconComponent(() => () => (
                <span style={emojiStyle}>{name}</span>
              ));
            } else if (outlineMode === 'filled') {
              // Filled outline mode - layered rendering with cover
              const isVertical = fillDirection === 'bottom-up' || fillDirection === 'top-down';
              const isHorizontal = fillDirection === 'left-to-right' || fillDirection === 'right-to-left';
              
              const coverSize = `${100 - fillPercentage}%`;
              const coverHeight = isVertical ? coverSize : '100%';
              const coverWidth = isHorizontal ? coverSize : '100%';
              
              const coverTop = fillDirection === 'bottom-up' ? '0' : 'auto';
              const coverBottom = fillDirection === 'top-down' ? '0' : 'auto';
              const coverLeft = fillDirection === 'right-to-left' ? '0' : (isHorizontal ? 'auto' : '0');
              const coverRight = fillDirection === 'left-to-right' ? '0' : (isHorizontal ? 'auto' : '0');
              
              setIconComponent(() => () => (
                <div style={{ position: 'relative', width: size, height: size, display: 'inline-block' }}>
                  {/* Base layer with fill */}
                  <span style={{
                    position: 'absolute',
                    fontSize: size,
                    color: fillImage ? 'transparent' : fillColor,
                    backgroundImage: fillImage ? `url(${fillImage})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    WebkitBackgroundClip: fillImage ? 'text' : undefined,
                    backgroundClip: fillImage ? 'text' : undefined,
                    ...style,
                  }}>{name}</span>
                  
                  {/* Cover layer */}
                  <div style={{
                    position: 'absolute',
                    top: coverTop,
                    bottom: coverBottom,
                    left: coverLeft,
                    right: coverRight,
                    width: coverWidth,
                    height: coverHeight,
                    overflow: 'hidden',
                    pointerEvents: 'none',
                  }}>
                    <span style={{
                      position: 'absolute',
                      top: fillDirection === 'top-down' ? 'auto' : '0',
                      bottom: fillDirection === 'top-down' ? '0' : 'auto',
                      left: fillDirection === 'left-to-right' ? 'auto' : '0',
                      right: fillDirection === 'left-to-right' ? '0' : 'auto',
                      fontSize: size,
                      color: coverColor,
                    }}>{name}</span>
                  </div>
                  
                  {/* Outline layer on top */}
                  {(strokeWidth > 0 || glowWidth > 0) && (
                    <span style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      fontSize: size,
                      textShadow: [
                        ...(strokeWidth > 0 ? [
                          `-${strokeWidth}px -${strokeWidth}px 0 ${color}`,
                          `${strokeWidth}px -${strokeWidth}px 0 ${color}`,
                          `-${strokeWidth}px ${strokeWidth}px 0 ${color}`,
                          `${strokeWidth}px ${strokeWidth}px 0 ${color}`
                        ] : []),
                        ...(glowWidth > 0 ? [`0 0 ${glowWidth}px ${color}`] : [])
                      ].join(', '),
                      WebkitTextStroke: strokeWidth > 0 ? `${strokeWidth}px ${color}` : undefined,
                      color: 'transparent',
                    }}>{name}</span>
                  )}
                </div>
              ));
            }
            setLoading(false);
          }
        } else if (type === 'mdi') {
          const { icons, Icon } = await loadMDIIcons();
          // Convert dash-case back to camelCase: account-arrow-down -> mdiAccountArrowDown
          const camelName = 'mdi' + name.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join('');
          
          const iconPath = icons[camelName];
          
          if (iconPath && mounted) {
            if (outlineMode === 'none') {
              // Normal mode
              setIconComponent(() => () => (
                <Icon path={iconPath} size={`${size}px`} color={color} style={style} />
              ));
            } else if (outlineMode === 'outline') {
              // Outline mode
              const filters: string[] = [];
              if (glowWidth > 0) {
                const effectiveGlowColor = glowColor || color;
                filters.push(`drop-shadow(0 0 ${glowWidth}px ${effectiveGlowColor})`);
              }
              if (shadowEnabled) {
                filters.push(`drop-shadow(${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px ${shadowColor})`);
              }
              
              setIconComponent(() => () => (
                <Icon 
                  path={iconPath} 
                  size={`${size}px`} 
                  color="transparent"
                  style={{
                    ...style,
                    stroke: color,
                    strokeWidth: strokeWidth,
                    fill: 'none',
                    filter: filters.length > 0 ? filters.join(' ') : undefined,
                  }} 
                />
              ));
            } else if (outlineMode === 'filled') {
              // Filled outline mode with cover layer
              const isVertical = fillDirection === 'bottom-up' || fillDirection === 'top-down';
              const isHorizontal = fillDirection === 'left-to-right' || fillDirection === 'right-to-left';
              
              const coverSize = `${100 - fillPercentage}%`;
              const coverHeight = isVertical ? coverSize : '100%';
              const coverWidth = isHorizontal ? coverSize : '100%';
              
              const coverTop = fillDirection === 'bottom-up' ? '0' : 'auto';
              const coverBottom = fillDirection === 'top-down' ? '0' : 'auto';
              const coverLeft = fillDirection === 'right-to-left' ? '0' : (isHorizontal ? 'auto' : '0');
              const coverRight = fillDirection === 'left-to-right' ? '0' : (isHorizontal ? 'auto' : '0');
              
              setIconComponent(() => () => (
                <div style={{ position: 'relative', width: size, height: size, display: 'inline-block' }}>
                  {/* Fill layer */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: size,
                    height: size,
                    backgroundImage: fillImage ? `url(${fillImage})` : undefined,
                    backgroundColor: fillImage ? undefined : fillColor,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    WebkitMaskImage: `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='${iconPath}'/></svg>`)}")`,
                    maskImage: `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='${iconPath}'/></svg>`)}")`,
                    WebkitMaskSize: 'contain',
                    maskSize: 'contain',
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center',
                    maskPosition: 'center',
                  }} />
                  
                  {/* Cover layer */}
                  <div style={{
                    position: 'absolute',
                    top: coverTop,
                    bottom: coverBottom,
                    left: coverLeft,
                    right: coverRight,
                    width: coverWidth,
                    height: coverHeight,
                    overflow: 'hidden',
                    pointerEvents: 'none',
                  }}>
                    <Icon 
                      path={iconPath} 
                      size={`${size}px`} 
                      color={coverColor}
                      style={{ 
                        position: 'absolute', 
                        top: fillDirection === 'top-down' ? 'auto' : '0', 
                        bottom: fillDirection === 'top-down' ? '0' : 'auto', 
                        left: fillDirection === 'left-to-right' ? 'auto' : '0',
                        right: fillDirection === 'left-to-right' ? '0' : 'auto'
                      }}
                    />
                  </div>
                  
                  {/* Outline layer */}
                  {(strokeWidth > 0 || glowWidth > 0 || shadowEnabled) && (
                    <Icon 
                      path={iconPath} 
                      size={`${size}px`} 
                      color="transparent"
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        stroke: color,
                        strokeWidth: strokeWidth,
                        fill: 'none',
                        filter: [
                          glowWidth > 0 ? `drop-shadow(0 0 ${glowWidth}px ${glowColor || color})` : '',
                          shadowEnabled ? `drop-shadow(${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px ${shadowColor})` : ''
                        ].filter(Boolean).join(' ') || undefined,
                      }} 
                    />
                  )}
                </div>
              ));
            }
          }
          if (mounted) setLoading(false);
        } else {
          // React Icons (fa, md, io, bi) - OLD FORMAT
          const iconLib = await loadReactIcons(type as any);
          const Component = iconLib[name];
          
          if (Component && mounted) {
            if (outlineMode === 'none') {
              // Normal mode
              setIconComponent(() => () => (
                <Component size={size} color={color} style={style} />
              ));
            } else if (outlineMode === 'outline') {
              // Outline mode
              const filters: string[] = [];
              if (glowWidth > 0) {
                const effectiveGlowColor = glowColor || color;
                filters.push(`drop-shadow(0 0 ${glowWidth}px ${effectiveGlowColor})`);
              }
              if (shadowEnabled) {
                filters.push(`drop-shadow(${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px ${shadowColor})`);
              }
              
              const outlineStyle: React.CSSProperties = {
                ...style,
                filter: filters.length > 0 ? filters.join(' ') : undefined,
                color: 'transparent',
                stroke: color,
                strokeWidth: strokeWidth,
              };
              setIconComponent(() => () => (
                <Component size={size} style={outlineStyle} />
              ));
            } else if (outlineMode === 'filled') {
              // Filled outline mode
              const isVertical = fillDirection === 'bottom-up' || fillDirection === 'top-down';
              const isHorizontal = fillDirection === 'left-to-right' || fillDirection === 'right-to-left';
              
              const coverSize = `${100 - fillPercentage}%`;
              const coverHeight = isVertical ? coverSize : '100%';
              const coverWidth = isHorizontal ? coverSize : '100%';
              
              const coverTop = fillDirection === 'bottom-up' ? '0' : 'auto';
              const coverBottom = fillDirection === 'top-down' ? '0' : 'auto';
              const coverLeft = fillDirection === 'right-to-left' ? '0' : (isHorizontal ? 'auto' : '0');
              const coverRight = fillDirection === 'left-to-right' ? '0' : (isHorizontal ? 'auto' : '0');
              
              setIconComponent(() => () => (
                <div style={{ position: 'relative', width: size, height: size, display: 'inline-block' }}>
                  {/* Fill layer */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: size,
                    height: size,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: fillImage ? 'transparent' : fillColor,
                    backgroundImage: fillImage ? `url(${fillImage})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    WebkitBackgroundClip: fillImage ? 'text' : undefined,
                    backgroundClip: fillImage ? 'text' : undefined,
                  }}>
                    <Component size={size} />
                  </div>
                  
                  {/* Cover layer */}
                  <div style={{
                    position: 'absolute',
                    top: coverTop,
                    bottom: coverBottom,
                    left: coverLeft,
                    right: coverRight,
                    width: coverWidth,
                    height: coverHeight,
                    overflow: 'hidden',
                    pointerEvents: 'none',
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: fillDirection === 'top-down' ? 'auto' : '0',
                      bottom: fillDirection === 'top-down' ? '0' : 'auto',
                      left: fillDirection === 'left-to-right' ? 'auto' : '0',
                      right: fillDirection === 'left-to-right' ? '0' : 'auto',
                      width: size,
                      height: size,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Component size={size} color={coverColor} />
                    </div>
                  </div>
                  
                  {/* Outline layer */}
                  {(strokeWidth > 0 || glowWidth > 0 || shadowEnabled) && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: size,
                      height: size,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Component 
                        size={size} 
                        style={{
                          color: 'transparent',
                          stroke: color,
                          strokeWidth: strokeWidth,
                          filter: [
                            glowWidth > 0 ? `drop-shadow(0 0 ${glowWidth}px ${glowColor || color})` : '',
                            shadowEnabled ? `drop-shadow(${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px ${shadowColor})` : ''
                          ].filter(Boolean).join(' ') || undefined,
                        }}
                      />
                    </div>
                  )}
                </div>
              ));
            }
          }
          if (mounted) setLoading(false);
        }
      } catch (error) {
        console.error('Error loading icon:', error);
        if (mounted) {
          setIconComponent(() => () => (
            <span style={{ fontSize: size, ...style }}>⚙️</span>
          ));
          setLoading(false);
        }
      }
    };

    loadIcon();

    return () => {
      mounted = false;
    };
  }, [icon, size, color, outlineMode, strokeWidth, glowWidth, glowColor, shadowEnabled, shadowColor, shadowOffsetX, shadowOffsetY, shadowBlur, fillDirection, fillColor, fillImage, coverColor, fillPercentage]);

  if (loading || !IconComponent) {
    return <span style={{ fontSize: size, ...style }}>⏳</span>;
  }

  return <IconComponent />;
};
