/**
 * Style Builder Utilities
 * Convert universal style configurations to CSS strings
 */

import type { BorderRadius, BorderWidth, ShadowConfig, UniversalStyle } from '../types/universal-widget';

/**
 * Build border-width CSS string from BorderWidth config
 */
export function buildBorderWidth(width: BorderWidth | undefined): string | undefined {
  if (width === undefined) return undefined;
  
  if (typeof width === 'number') {
    return `${width}px`;
  }
  
  const { top = 0, right = 0, bottom = 0, left = 0 } = width;
  return `${top}px ${right}px ${bottom}px ${left}px`;
}

/**
 * Build border-radius CSS string from BorderRadius config
 */
export function buildBorderRadius(radius: BorderRadius | undefined): string | undefined {
  if (radius === undefined) return undefined;
  
  if (typeof radius === 'number') {
    return `${radius}px`;
  }
  
  const { topLeft = 0, topRight = 0, bottomRight = 0, bottomLeft = 0 } = radius;
  return `${topLeft}px ${topRight}px ${bottomRight}px ${bottomLeft}px`;
}

/**
 * Build box-shadow CSS string from array of ShadowConfig
 */
export function buildBoxShadow(shadows: ShadowConfig[] | undefined): string | undefined {
  if (!shadows || !Array.isArray(shadows) || shadows.length === 0) return undefined;
  
  return shadows
    .map(
      (s) =>
        `${s.inset ? 'inset ' : ''}${s.offsetX}px ${s.offsetY}px ${s.blur}px ${s.spread}px ${s.color}`
    )
    .join(', ');
}

/**
 * Convert any CSS color to rgba with specified opacity
 * Handles hex, rgb, rgba, and named colors
 */
export function applyColorOpacity(color: string, opacity: number): string {
  if (!color) return color;
  
  // Already rgba - extract rgb and apply new opacity
  const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
  if (rgbaMatch) {
    return `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, ${opacity})`;
  }
  
  // Hex color - convert to rgba
  const hexMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (hexMatch) {
    const r = parseInt(hexMatch[1], 16);
    const g = parseInt(hexMatch[2], 16);
    const b = parseInt(hexMatch[3], 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  
  // Short hex (#fff)
  const shortHexMatch = color.match(/^#?([a-f\d])([a-f\d])([a-f\d])$/i);
  if (shortHexMatch) {
    const r = parseInt(shortHexMatch[1] + shortHexMatch[1], 16);
    const g = parseInt(shortHexMatch[2] + shortHexMatch[2], 16);
    const b = parseInt(shortHexMatch[3] + shortHexMatch[3], 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  
  // Named colors - use a temporary element to get computed color
  // For common colors, handle directly
  const namedColors: Record<string, string> = {
    black: `rgba(0, 0, 0, ${opacity})`,
    white: `rgba(255, 255, 255, ${opacity})`,
    red: `rgba(255, 0, 0, ${opacity})`,
    green: `rgba(0, 128, 0, ${opacity})`,
    blue: `rgba(0, 0, 255, ${opacity})`,
    gray: `rgba(128, 128, 128, ${opacity})`,
    grey: `rgba(128, 128, 128, ${opacity})`,
  };
  
  const lowerColor = color.toLowerCase();
  if (namedColors[lowerColor]) {
    return namedColors[lowerColor];
  }
  
  // Fallback - return original color (opacity won't be applied)
  return color;
}

/**
 * Apply universal styles to a React CSSProperties object
 * This function merges universal styling with widget-specific styles
 */
export function applyUniversalStyles(
  universalStyle: UniversalStyle | undefined,
  widgetStyles: React.CSSProperties = {}
): React.CSSProperties {
  if (!universalStyle) return widgetStyles;

  const {
    zIndex,
    rotation,
    backgroundColor,
    backgroundImage,
    backgroundOpacity,
    backgroundSize,
    backgroundPosition,
    backgroundRepeat,
    borderColor,
    borderWidth,
    borderRadius,
    borderStyle,
    boxShadow,
  } = universalStyle;

  // Build CSS properties
  const universalCSS: React.CSSProperties = {};

  // Ensure box-sizing is border-box so borders are included in width/height
  universalCSS.boxSizing = 'border-box';

  // Z-index & Rotation
  if (zIndex !== undefined) universalCSS.zIndex = zIndex;
  if (rotation !== undefined) universalCSS.transform = `rotate(${rotation}deg)`;

  // Border - Apply first so background can reference it
  if (borderColor) universalCSS.borderColor = borderColor;
  if (borderWidth) universalCSS.borderWidth = buildBorderWidth(borderWidth);
  if (borderRadius) universalCSS.borderRadius = buildBorderRadius(borderRadius);
  if (borderStyle) universalCSS.borderStyle = borderStyle;

  // Background - Apply after border with proper clipping
  // Apply opacity to backgroundColor directly using rgba (not to entire element)
  // If both color and image, layer color OVER image using linear-gradient
  
  // Check for background properties from BOTH sources (widgetStyles and universalStyle)
  const finalBackgroundColor = backgroundColor || (widgetStyles.backgroundColor as string);
  const finalBackgroundImage = backgroundImage || (widgetStyles.backgroundImage as string);
  
  // If BOTH color and image exist (from any source), layer them
  if (finalBackgroundColor && finalBackgroundImage) {
    const colorWithOpacity = (backgroundOpacity !== undefined && backgroundOpacity !== 1) 
      ? (applyColorOpacity(finalBackgroundColor, backgroundOpacity) || finalBackgroundColor)
      : finalBackgroundColor;
    
    // Create gradient layer (solid color) over the image
    universalCSS.backgroundImage = `linear-gradient(${colorWithOpacity}, ${colorWithOpacity}), ${finalBackgroundImage}`;
    // Don't set backgroundColor - it's now in the gradient
    if (backgroundSize) universalCSS.backgroundSize = backgroundSize;
    if (backgroundPosition) universalCSS.backgroundPosition = backgroundPosition;
    if (backgroundRepeat) universalCSS.backgroundRepeat = backgroundRepeat;
  } else {
    // Only color or only image (or neither)
    if (finalBackgroundColor) {
      if (backgroundOpacity !== undefined && backgroundOpacity !== 1) {
        // Apply opacity to the resolved color (whether it came from universal style or widget's own field)
        const colorWithOpacity = applyColorOpacity(finalBackgroundColor, backgroundOpacity);
        universalCSS.backgroundColor = colorWithOpacity || finalBackgroundColor;
      } else if (backgroundColor) {
        // Universal style explicitly sets a new color (no opacity change)
        universalCSS.backgroundColor = backgroundColor;
      }
    }
    
    if (backgroundImage) universalCSS.backgroundImage = backgroundImage;
    if (backgroundSize) universalCSS.backgroundSize = backgroundSize;
    if (backgroundPosition) universalCSS.backgroundPosition = backgroundPosition;
    if (backgroundRepeat) universalCSS.backgroundRepeat = backgroundRepeat;
  }
  
  // Ensure background stays inside border area (not under it)
  // padding-box = background stops at inner edge of border
  const hasBorder = borderWidth || borderStyle || widgetStyles.border;
  const hasAnyBackground = finalBackgroundColor || finalBackgroundImage;
  if (hasAnyBackground && hasBorder) {
    universalCSS.backgroundClip = 'padding-box';
    universalCSS.backgroundOrigin = 'padding-box';
  }

  // Shadow - handle both string (direct CSS) and array (ShadowConfig[]) formats
  if (boxShadow) {
    if (typeof boxShadow === 'string') {
      // Direct CSS string from Inspector
      universalCSS.boxShadow = boxShadow;
    } else if (Array.isArray(boxShadow)) {
      // Array of ShadowConfig objects
      universalCSS.boxShadow = buildBoxShadow(boxShadow);
    }
  }

  // Merge: widget base styles first, universal styles override
  // If we layered backgrounds, remove conflicting properties from widgetStyles
  let cleanedWidgetStyles = widgetStyles;
  if (finalBackgroundColor && finalBackgroundImage) {
    cleanedWidgetStyles = { ...widgetStyles };
    delete cleanedWidgetStyles.backgroundColor;
    delete cleanedWidgetStyles.backgroundImage;
  }
  
  return {
    ...cleanedWidgetStyles,
    ...universalCSS,
  };
}
