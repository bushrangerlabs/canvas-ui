/**
 * Alignment Guides - Shows visual guides when dragging widgets
 */

import React from 'react';

interface AlignmentGuidesProps {
  guides: {
    vertical: number[];
    horizontal: number[];
    verticalCenter: number[];
    horizontalCenter: number[];
  };
}

export const AlignmentGuides: React.FC<AlignmentGuidesProps> = ({ guides }) => {
  return (
    <>
      {/* Vertical edge guides (red) */}
      {guides.vertical.map((x, index) => (
        <div
          key={`v-${index}`}
          style={{
            position: 'absolute',
            left: x,
            top: 0,
            bottom: 0,
            width: 1,
            backgroundColor: '#ff6b6b',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        />
      ))}
      
      {/* Vertical center guides (yellow) */}
      {guides.verticalCenter.map((x, index) => (
        <div
          key={`vc-${index}`}
          style={{
            position: 'absolute',
            left: x,
            top: 0,
            bottom: 0,
            width: 1,
            backgroundColor: '#ffd93d',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        />
      ))}
      
      {/* Horizontal edge guides (red) */}
      {guides.horizontal.map((y, index) => (
        <div
          key={`h-${index}`}
          style={{
            position: 'absolute',
            top: y,
            left: 0,
            right: 0,
            height: 1,
            backgroundColor: '#ff6b6b',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        />
      ))}
      
      {/* Horizontal center guides (yellow) */}
      {guides.horizontalCenter.map((y, index) => (
        <div
          key={`hc-${index}`}
          style={{
            position: 'absolute',
            top: y,
            left: 0,
            right: 0,
            height: 1,
            backgroundColor: '#ffd93d',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        />
      ))}
    </>
  );
};
