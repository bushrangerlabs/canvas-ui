/**
 * Universal Icon Component
 * Supports both iconify-react (new) and react-icons (legacy during migration)
 */

import { Icon as IconifyIcon } from '@iconify/react';
import React from 'react';

interface UniversalIconProps {
  icon: string;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Renders icons from iconify (new system), custom icons, or emoji (always supported)
 * Legacy react-icons support removed - use iconify format instead
 */
export const UniversalIcon: React.FC<UniversalIconProps> = ({
  icon,
  size = 24,
  color = 'currentColor',
  style = {},
  className = '',
}) => {
  // Handle emoji icons (lightweight, no API needed)
  if (icon.startsWith('emoji:')) {
    const emoji = icon.replace('emoji:', '');
    return (
      <span
        className={className}
        style={{
          fontSize: size,
          color,
          lineHeight: 1,
          display: 'inline-block',
          ...style,
        }}
      >
        {emoji}
      </span>
    );
  }

  // Handle iconify icons (mdi:home, fa:rocket, etc.)
  // Uses @iconify/react which auto-loads from cache or online API
  return (
    <IconifyIcon
      icon={icon}
      width={size}
      height={size}
      color={color}
      style={style}
      className={className}
    />
  );
};
