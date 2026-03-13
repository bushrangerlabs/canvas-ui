/**
 * Canvas Component - Renders view background and positions widgets
 * 
 * Shared by all 3 modes (edit, preview, kiosk)
 */

import React, { useRef, useState } from 'react';
import { AlignmentGuides } from '../../edit/components/AlignmentGuides';
import type { ViewConfig } from '../types';
import { WidgetRenderer } from './WidgetRenderer';

interface CanvasProps {
  view: ViewConfig;
  isEditMode?: boolean;
  selectedWidgetIds?: string[];
  onWidgetUpdate?: (widgetId: string, updates: any) => void;
  onWidgetSelect?: (widgetId: string, ctrlKey: boolean, shiftKey: boolean) => void;
  onBoxSelect?: (widgetIds: string[]) => void; // NEW: Box selection callback
  onDragStart?: () => void; // Called when any drag starts
  onDragEnd?: () => void;
  gridSnap?: boolean;
  gridSize?: number;
  showGrid?: boolean;
  gridColor?: string; // CSS color for grid lines, e.g. '#ffffff'
  zoom?: number;
}

export const Canvas: React.FC<CanvasProps> = ({ 
  view, 
  isEditMode = false, 
  selectedWidgetIds = [], 
  onWidgetUpdate,
  onWidgetSelect,
  onBoxSelect, // NEW
  onDragStart,
  onDragEnd,
  gridSnap = false,
  gridSize = 10,
  showGrid = false,
  gridColor = '#ffffff',
  zoom = 100
}) => {
  const [alignmentGuides, setAlignmentGuides] = useState<{ 
    vertical: number[]; 
    horizontal: number[];
    verticalCenter: number[];
    horizontalCenter: number[];
  }>({
    vertical: [],
    horizontal: [],
    verticalCenter: [],
    horizontalCenter: [],
  });

  // Box selection state
  const [isBoxSelecting, setIsBoxSelecting] = useState(false);
  const [boxStart, setBoxStart] = useState({ x: 0, y: 0 });
  const [boxCurrent, setBoxCurrent] = useState({ x: 0, y: 0 });
  const [justCompletedBoxSelection, setJustCompletedBoxSelection] = useState(false);
  const isGroupDraggingRef = useRef(false);
  
  // Group drag state (Moveable-inspired pattern) - using refs to avoid closure issues
  const groupDragStart = useRef({ x: 0, y: 0 });
  const groupDragStartPositions = useRef<Record<string, { x: number; y: number }>>({});

  // Handle group drag start - set persistent flag to prevent selection clearing
  const handleGroupDragStart = () => {
    isGroupDraggingRef.current = true;
  };

  // Handle group drag end - clear persistent flag
  const handleGroupDragEnd = () => {
    isGroupDraggingRef.current = false;
  };

  // Handle group movement (multiple selected widgets)
  const handleGroupMove = (delta: { x: number; y: number }) => {
    if (!isEditMode || !onWidgetUpdate || selectedWidgetIds.length === 0) return;

    // Calculate the maximum allowed delta for ALL widgets to keep them together
    let maxDeltaX = delta.x;
    let maxDeltaY = delta.y;

    // Check boundaries for all selected widgets to find the limiting factor
    for (const widgetId of selectedWidgetIds) {
      const widget = view.widgets.find(w => w.id === widgetId);
      if (!widget) continue;

      const newX = widget.position.x + delta.x;
      const newY = widget.position.y + delta.y;

      // Check X boundaries
      if (newX < 0) {
        maxDeltaX = Math.max(maxDeltaX, -widget.position.x);
      } else if (view.sizex && newX + widget.position.width > view.sizex) {
        maxDeltaX = Math.min(maxDeltaX, view.sizex - widget.position.width - widget.position.x);
      }

      // Check Y boundaries
      if (newY < 0) {
        maxDeltaY = Math.max(maxDeltaY, -widget.position.y);
      } else if (view.sizey && newY + widget.position.height > view.sizey) {
        maxDeltaY = Math.min(maxDeltaY, view.sizey - widget.position.height - widget.position.y);
      }
    }

    // Apply the constrained delta to ALL selected widgets (keeps them together)
    for (const widgetId of selectedWidgetIds) {
      const widget = view.widgets.find(w => w.id === widgetId);
      if (!widget) continue;

      onWidgetUpdate(widgetId, {
        position: {
          ...widget.position,
          x: widget.position.x + maxDeltaX,
          y: widget.position.y + maxDeltaY,
        },
      });
    }
  };

  // Convert /config/www/ server paths to /local/ so the browser can fetch them
  const convertPath = (path: string): string => {
    if (!path) return path;
    if (path.startsWith('/config/www/')) return path.replace('/config/www/', '/local/');
    return path;
  };

  const rawBgImage = view.style?.backgroundImage;
  const bgImageUrl = rawBgImage ? convertPath(rawBgImage) : undefined;

  const canvasStyle: React.CSSProperties = {
    position: 'relative',
    // Canvas uses view dimensions or fills container
    width: view.sizex ? `${view.sizex}px` : '100%',
    height: view.sizey ? `${view.sizey}px` : '100%',
    flexShrink: 0, // Don't shrink - trigger scrollbars instead
    backgroundColor: view.style?.backgroundColor || '#1a1a2e',
    // Background image — may be overridden below when grid is shown to layer both together
    backgroundImage: bgImageUrl ? `url(${bgImageUrl})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    // Only apply transform if zoom is not 100% (prevents CSS cascade issues)
    ...(zoom !== 100 && {
      transform: `scale(${zoom / 100})`,
      transformOrigin: 'top left',
    }),
    ...(showGrid && (() => {
      const gridLines = [
        `linear-gradient(to right, ${gridColor} 1px, transparent 1px)`,
        `linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)`,
      ];
      return {
        // Layer grid on top of background image (if any)
        backgroundImage: bgImageUrl
          ? `${gridLines.join(', ')}, url(${bgImageUrl})`
          : gridLines.join(', '),
        // Grid tiles first, then cover for the image layer
        backgroundSize: bgImageUrl
          ? `${gridSize}px ${gridSize}px, ${gridSize}px ${gridSize}px, cover`
          : `${gridSize}px ${gridSize}px`,
        // Grid must start at 0,0; image centers
        backgroundPosition: bgImageUrl
          ? `0px 0px, 0px 0px, center`
          : '0px 0px',
      };
    })()),
  };

  // DEBUG: Log canvas sizing and browser metrics
  const canvasRef = React.useRef<HTMLDivElement>(null);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Only start box selection if clicking canvas background (not a widget)
    if (e.target === e.currentTarget && isEditMode) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      // Convert from screen space to canvas space (account for zoom)
      const x = (e.clientX - rect.left) / (zoom / 100);
      const y = (e.clientY - rect.top) / (zoom / 100);
      
      setBoxStart({ x, y });
      setBoxCurrent({ x, y });
      setIsBoxSelecting(true);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isBoxSelecting) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    // Convert from screen space to canvas space (account for zoom)
    const x = (e.clientX - rect.left) / (zoom / 100);
    const y = (e.clientY - rect.top) / (zoom / 100);
    
    setBoxCurrent({ x, y });
  };

  const handleCanvasMouseUp = (e: React.MouseEvent) => {
    if (!isBoxSelecting) return;
    
    // Stop propagation to prevent widgets from receiving click events
    e.stopPropagation();
    e.preventDefault();
    
    setIsBoxSelecting(false);
    
    // Check if this was just a click (no drag)
    const deltaX = Math.abs(boxCurrent.x - boxStart.x);
    const deltaY = Math.abs(boxCurrent.y - boxStart.y);
    const isClick = deltaX < 5 && deltaY < 5;
    
    if (isClick) {
      // Click on canvas background (not dragging) - deselect all
      if (e.target === e.currentTarget && onWidgetSelect && isEditMode) {
        onWidgetSelect('', false, false);
      }
      return;
    } else {
      // Box selection - find intersecting widgets
      const boxLeft = Math.min(boxStart.x, boxCurrent.x);
      const boxTop = Math.min(boxStart.y, boxCurrent.y);
      const boxRight = Math.max(boxStart.x, boxCurrent.x);
      const boxBottom = Math.max(boxStart.y, boxCurrent.y);
      
      const selectedIds: string[] = [];
      
      for (const widget of view.widgets) {
        const wx = widget.position.x;
        const wy = widget.position.y;
        const wr = wx + widget.position.width;
        const wb = wy + widget.position.height;
        
        // Check if widget intersects with selection box
        const intersects = !(
          wx > boxRight ||
          wr < boxLeft ||
          wy > boxBottom ||
          wb < boxTop
        );
        
        if (intersects) {
          selectedIds.push(widget.id);
        }
      }
      
      // Set flag to prevent onClick from clearing selection
      setJustCompletedBoxSelection(true);
      setTimeout(() => setJustCompletedBoxSelection(false), 100);
      
      // Notify parent of box selection
      if (onBoxSelect && selectedIds.length > 0) {
        onBoxSelect(selectedIds);
      } else if (onWidgetSelect && selectedIds.length === 0) {
        // No widgets selected - clear selection
        onWidgetSelect('', false, false);
      }
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    // Deselect all when clicking canvas background
    // Skip if we just completed a box selection or if group drag is in progress
    if (e.target === e.currentTarget && onWidgetSelect && isEditMode && !justCompletedBoxSelection && !isGroupDraggingRef.current) {
      onWidgetSelect('', false, false);
    }
  };

  // Render view boundary guide (edit mode only, when view has dimensions)
  const renderViewBoundary = () => {
    if (!isEditMode || !view.sizex || !view.sizey) {
      return null;
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${view.sizex}px`,
          height: `${view.sizey}px`,
          border: '2px dashed red',
          boxSizing: 'border-box',
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: 1000,
        }}
      />
    );
  };

  // Render box selection rectangle
  const renderSelectionBox = () => {
    if (!isBoxSelecting) return null;
    
    const boxLeft = Math.min(boxStart.x, boxCurrent.x);
    const boxTop = Math.min(boxStart.y, boxCurrent.y);
    const boxWidth = Math.abs(boxCurrent.x - boxStart.x);
    const boxHeight = Math.abs(boxCurrent.y - boxStart.y);
    
    return (
      <div
        style={{
          position: 'absolute',
          left: `${boxLeft}px`,
          top: `${boxTop}px`,
          width: `${boxWidth}px`,
          height: `${boxHeight}px`,
          border: '2px dashed #2196f3',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          pointerEvents: 'none',
          zIndex: 1001,
        }}
      />
    );
  };

  // Calculate bounding box for all selected widgets (Moveable pattern)
  const calculateGroupBounds = () => {
    if (selectedWidgetIds.length <= 1) return null;
    
    const selectedWidgets = view.widgets.filter(w => selectedWidgetIds.includes(w.id));
    if (selectedWidgets.length === 0) return null;
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    selectedWidgets.forEach(widget => {
      const { x, y, width, height } = widget.position;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height);
    });
    
    return {
      left: minX,
      top: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  };

  // Handle group drag overlay mousedown (Moveable-inspired)
  const handleGroupOverlayMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Notify parent that drag has started
    if (onDragStart) onDragStart();
    
    isGroupDraggingRef.current = true;
    groupDragStart.current = { x: e.clientX, y: e.clientY };
    
    // Store initial positions
    groupDragStartPositions.current = {};
    selectedWidgetIds.forEach(widgetId => {
      const widget = view.widgets.find(w => w.id === widgetId);
      if (widget) {
        groupDragStartPositions.current[widgetId] = {
          x: widget.position.x,
          y: widget.position.y,
        };
      }
    });
    
    // Add global mouse move/up listeners
    document.addEventListener('mousemove', handleGroupOverlayMouseMove);
    document.addEventListener('mouseup', handleGroupOverlayMouseUp);
  };

  const handleGroupOverlayMouseMove = (e: MouseEvent) => {
    if (!isGroupDraggingRef.current) return;
    
    const deltaX = (e.clientX - groupDragStart.current.x) / (zoom / 100);
    const deltaY = (e.clientY - groupDragStart.current.y) / (zoom / 100);
    
    // Move widgets from their INITIAL positions (stored at drag start)
    // This prevents accumulation/jumping issues
    selectedWidgetIds.forEach(widgetId => {
      const widget = view.widgets.find(w => w.id === widgetId);
      const initialPos = groupDragStartPositions.current[widgetId];
      
      if (!widget || !initialPos || !onWidgetUpdate) return;
      
      let newX = initialPos.x + deltaX;
      let newY = initialPos.y + deltaY;
      
      // Apply boundary constraints
      if (newX < 0) newX = 0;
      if (newY < 0) newY = 0;
      if (view.sizex && newX + widget.position.width > view.sizex) {
        newX = view.sizex - widget.position.width;
      }
      if (view.sizey && newY + widget.position.height > view.sizey) {
        newY = view.sizey - widget.position.height;
      }
      
      onWidgetUpdate(widgetId, {
        position: {
          ...widget.position,
          x: newX,
          y: newY,
        },
      });
    });
  };

  const handleGroupOverlayMouseUp = () => {
    isGroupDraggingRef.current = false;
    
    document.removeEventListener('mousemove', handleGroupOverlayMouseMove);
    document.removeEventListener('mouseup', handleGroupOverlayMouseUp);
    
    if (onDragEnd) {
      onDragEnd();
    }
  };

  // Render group drag overlay (Moveable pattern - outside widget hierarchy)
  const renderGroupDragOverlay = () => {
    if (!isEditMode || selectedWidgetIds.length <= 1) return null;
    
    const bounds = calculateGroupBounds();
    if (!bounds) return null;
    
    // Style for drag handles at corners (small clickable areas)
    const handleStyle: React.CSSProperties = {
      position: 'absolute',
      width: '20px',
      height: '20px',
      backgroundColor: '#2196f3',
      border: '2px solid white',
      borderRadius: '50%',
      cursor: 'move',
      zIndex: 1002,
    };
    
    return (
      <>
        {/* Border outline - non-interactive */}
        <div
          style={{
            position: 'absolute',
            left: `${bounds.left}px`,
            top: `${bounds.top}px`,
            width: `${bounds.width}px`,
            height: `${bounds.height}px`,
            border: '2px solid #2196f3',
            backgroundColor: 'transparent',
            pointerEvents: 'none', // Allow clicks to pass through to widgets
            zIndex: 999,
          }}
        />
        
        {/* Drag handle at center-top - this is what you grab to drag */}
        <div
          style={{
            ...handleStyle,
            left: `${bounds.left + bounds.width / 2 - 10}px`,
            top: `${bounds.top - 10}px`,
          }}
          onMouseDown={handleGroupOverlayMouseDown}
        />
      </>
    );
  };

  // Outer wrapper style - ALWAYS fills the full width between viewport edge and inspector
  const outerWrapperStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    overflow: 'auto', // Always allow scrolling if content exceeds bounds
    display: 'flex',
    justifyContent: 'flex-start', // Align view to top-left (consistent 0,0 origin)
    alignItems: 'flex-start',
  };

  const content = (
    <div 
      ref={canvasRef} 
      style={canvasStyle} 
      onClick={handleCanvasClick}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
    >
      {renderViewBoundary()}
      {renderSelectionBox()}
      {renderGroupDragOverlay()}
      {view.widgets
        .filter(widget => !isEditMode || !widget.hiddenInEdit)
        .map((widget) => (
        <WidgetRenderer
          key={widget.id}
          widget={widget}
          isEditMode={isEditMode}
          isSelected={selectedWidgetIds.includes(widget.id)}
          isSingleSelection={selectedWidgetIds.length === 1}
          selectedWidgetIds={selectedWidgetIds}
          ignoreClicks={justCompletedBoxSelection}
          onUpdate={onWidgetUpdate ? (updates) => onWidgetUpdate(widget.id, updates) : undefined}
          onSelect={onWidgetSelect ? (ctrlKey, shiftKey) => onWidgetSelect(widget.id, ctrlKey, shiftKey) : undefined}
          onGroupMove={handleGroupMove}
          onGroupDragStart={handleGroupDragStart}
          onGroupDragEnd={handleGroupDragEnd}
          allWidgets={view.widgets}
          onAlignmentGuides={isEditMode ? setAlignmentGuides : undefined}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          viewBoundaries={{ maxX: view.sizex, maxY: view.sizey }}
          gridSnap={gridSnap}
          gridSize={gridSize}
          zoom={zoom}
        />
      ))}
      {isEditMode && <AlignmentGuides guides={alignmentGuides} />}
    </div>
  );

  return (
    <div style={outerWrapperStyle}>
      {content}
    </div>
  );
};
