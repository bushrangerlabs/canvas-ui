/**
 * ResizeHandle Component - Corner and edge handles for resizing widgets
 */

import React, { useState } from 'react';

interface ResizeHandleProps {
  onResize: (deltaX: number, deltaY: number) => void;
  onResizeEnd?: () => void;
  position: 'n' | 'e' | 's' | 'w' | 'nw' | 'ne' | 'sw' | 'se';
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({ onResize, onResizeEnd, position }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDragging(true);
    setStartPos({ x: e.clientX, y: e.clientY });
  };

  React.useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startPos.x;
      const deltaY = e.clientY - startPos.y;
      
      onResize(deltaX, deltaY);
      setStartPos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // Notify parent that resize is complete
      if (onResizeEnd) {
        onResizeEnd();
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, startPos, onResize, onResizeEnd]);

  const getPositionStyles = (): React.CSSProperties => {
    const cornerBase = {
      position: 'absolute' as const,
      width: 10,
      height: 10,
      backgroundColor: '#2196f3',
      border: '2px solid #fff',
      borderRadius: '50%',
      zIndex: 1001,
      pointerEvents: 'auto' as const,
    };

    const edgeBase = {
      position: 'absolute' as const,
      backgroundColor: 'transparent',
      border: '1px dashed #2196f3',
      zIndex: 1001,
      pointerEvents: 'auto' as const,
    };

    switch (position) {
      // Corners (circles)
      case 'nw':
        return { ...cornerBase, top: -5, left: -5, cursor: 'nw-resize' };
      case 'ne':
        return { ...cornerBase, top: -5, right: -5, cursor: 'ne-resize' };
      case 'sw':
        return { ...cornerBase, bottom: -5, left: -5, cursor: 'sw-resize' };
      case 'se':
        return { ...cornerBase, bottom: -5, right: -5, cursor: 'se-resize' };
      
      // Edges (lines)
      case 'n':
        return { ...edgeBase, top: -2, left: 10, right: 10, height: 4, cursor: 'ns-resize', borderTop: '2px solid #2196f3', borderLeft: 'none', borderRight: 'none', borderBottom: 'none' };
      case 's':
        return { ...edgeBase, bottom: -2, left: 10, right: 10, height: 4, cursor: 'ns-resize', borderBottom: '2px solid #2196f3', borderLeft: 'none', borderRight: 'none', borderTop: 'none' };
      case 'w':
        return { ...edgeBase, left: -2, top: 10, bottom: 10, width: 4, cursor: 'ew-resize', borderLeft: '2px solid #2196f3', borderTop: 'none', borderBottom: 'none', borderRight: 'none' };
      case 'e':
        return { ...edgeBase, right: -2, top: 10, bottom: 10, width: 4, cursor: 'ew-resize', borderRight: '2px solid #2196f3', borderTop: 'none', borderBottom: 'none', borderLeft: 'none' };
    }
  };

  return <div className="resize-handle" style={getPositionStyles()} onMouseDown={handleMouseDown} />;
};
