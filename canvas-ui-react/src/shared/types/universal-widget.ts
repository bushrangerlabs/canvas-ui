/**
 * Universal Widget Styling Types
 * Phase 1: Universal Styling Implementation
 */

/**
 * Shadow configuration for box-shadow property
 */
export interface ShadowConfig {
  offsetX: number;
  offsetY: number;
  blur: number;
  spread: number;
  color: string;
  inset: boolean;
}

/**
 * Border width - can be uniform or per-side
 */
export type BorderWidth = number | {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
};

/**
 * Corner style: rounded uses CSS border-radius; chamfer cuts the corner at 45°
 */
export type CornerStyle = 'rounded' | 'chamfer';

/**
 * Border radius - can be uniform or per-corner (with optional per-corner chamfer style)
 * When any corner has style 'chamfer', clip-path polygon is used for that corner.
 */
export type BorderRadius = number | {
  topLeft?: number;
  topRight?: number;
  bottomRight?: number;
  bottomLeft?: number;
  topLeftStyle?: CornerStyle;
  topRightStyle?: CornerStyle;
  bottomRightStyle?: CornerStyle;
  bottomLeftStyle?: CornerStyle;
};

/**
 * Universal styling properties that ALL widgets support
 * These are applied in addition to widget-specific styles
 */
export interface UniversalStyle {
  // Position & Transform
  zIndex?: number;
  rotation?: number; // Degrees
  
  // Background
  backgroundColor?: string;
  backgroundImage?: string; // URL or data URI
  backgroundOpacity?: number; // 0-1
  backgroundSize?: string; // 'cover' | 'contain' | 'auto' | '100% 100%' etc.
  backgroundPosition?: string; // e.g., 'center', 'top left'
  backgroundRepeat?: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';
  
  // Border
  borderColor?: string;
  borderWidth?: BorderWidth;
  borderRadius?: BorderRadius;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'double';
  
  // Shadow
  boxShadow?: ShadowConfig[];
}

/**
 * Base widget configuration extended with universal properties
 */
export interface BaseWidgetConfig {
  // Existing position properties (already implemented)
  x: number;
  y: number;
  width: number;
  height: number;
  
  // Universal styling (new)
  style?: UniversalStyle;
  
  // Visibility control (Phase 3)
  visibilityCondition?: string; // Expression like "{entity.state} == 'on'"
  
  // Widget-specific configuration
  [key: string]: any;
}
