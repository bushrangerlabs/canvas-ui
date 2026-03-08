/**
 * Custom Digital Clock Icon - 7-segment LED display
 */

import type { SvgIconProps } from '@mui/material';
import { SvgIcon } from '@mui/material';
import React from 'react';

export const DigitalClockIcon: React.FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="-1 -1 12 20">
      {/* 7-segment display showing "8" (all segments on) */}
      <polygon id="a" fill="currentColor" stroke="currentColor" strokeWidth=".25" points="1, 1  2, 0  8, 0  9, 1  8, 2  2, 2"/>
      <polygon id="b" fill="currentColor" stroke="currentColor" strokeWidth=".25" points="9, 1 10, 2 10, 8  9, 9  8, 8  8, 2"/>
      <polygon id="c" fill="currentColor" stroke="currentColor" strokeWidth=".25" points="9, 9 10,10 10,16  9,17  8,16  8,10"/>
      <polygon id="d" fill="currentColor" stroke="currentColor" strokeWidth=".25" points="9,17  8,18  2,18  1,17  2,16  8,16"/>
      <polygon id="e" fill="currentColor" stroke="currentColor" strokeWidth=".25" points="1,17  0,16  0,10  1, 9  2,10  2,16"/>
      <polygon id="f" fill="currentColor" stroke="currentColor" strokeWidth=".25" points="1, 9  0, 8  0, 2  1, 1  2, 2  2, 8"/>
      <polygon id="g" fill="currentColor" stroke="currentColor" strokeWidth=".25" points="1, 9  2, 8  8, 8  9, 9  8,10  2,10"/>
    </SvgIcon>
  );
};
