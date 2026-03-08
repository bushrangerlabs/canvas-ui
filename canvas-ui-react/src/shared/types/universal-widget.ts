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
 * Border radius - can be uniform or per-corner
 */
export type BorderRadius = number | {
  topLeft?: number;
  topRight?: number;
  bottomRight?: number;
  bottomLeft?: number;
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
  backgroundSize?: 'cover' | 'contain' | 'auto';
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
