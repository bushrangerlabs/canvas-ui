/**
 * Widget Renderer - Dynamically loads and renders widgets
 */

import React, { Suspense, lazy } from 'react';
import { ResizeHandle } from '../../edit/components/ResizeHandle';
import { useVisibility } from '../hooks/useVisibility';
import { useWebSocket } from '../providers/WebSocketProvider';
import type { WidgetConfig, WidgetProps } from '../types';

interface WidgetRendererProps {
  widget: WidgetConfig;
  isEditMode: boolean;
  isSelected?: boolean;
  isSingleSelection?: boolean;
  selectedWidgetIds?: string[]; // NEW: All selected widget IDs for group movement
  ignoreClicks?: boolean; // NEW: Ignore clicks temporarily (e.g., after box selection)
  onUpdate?: (updates: any) => void;
  onSelect?: (ctrlKey: boolean, shiftKey: boolean) => void;
  onGroupMove?: (delta: { x: number; y: number }) => void; // NEW: Group move callback
  onGroupDragStart?: () => void; // NEW: Called when group drag starts
  onGroupDragEnd?: () => void; // NEW: Called when group drag ends
  allWidgets?: WidgetConfig[];
  onAlignmentGuides?: (guides: { 
    vertical: number[]; 
    horizontal: number[];
    verticalCenter: number[];
    horizontalCenter: number[];
  }) => void;
  onDragStart?: () => void; // Called when any drag starts
  onDragEnd?: () => void;
  gridSnap?: boolean;
  gridSize?: number;
  viewBoundaries?: { maxX?: number; maxY?: number };
  zoom?: number; // Canvas zoom level (default 100)
}

// Widget registry - lazy load widgets
const widgetComponents: Record<string, React.LazyExoticComponent<React.FC<WidgetProps>>> = {
  button: lazy(() => import('../widgets/ButtonWidget')),
  text: lazy(() => import('../widgets/TextWidget')),
  gauge: lazy(() => import('../widgets/GaugeWidget')),
  camera: lazy(() => import('../widgets/CameraWidget')),
  slider: lazy(() => import('../widgets/SliderWidget')),
  switch: lazy(() => import('../widgets/SwitchWidget')),
  image: lazy(() => import('../widgets/ImageWidget')),
  icon: lazy(() => import('../widgets/IconWidget')),
  progressbar: lazy(() => import('../widgets/ProgressBarWidget')),
  progresscircle: lazy(() => import('../widgets/ProgressCircleWidget')),
  inputtext: lazy(() => import('../widgets/InputTextWidget')),
  keyboard: lazy(() => import('../widgets/KeyboardWidget')),
  flipclock: lazy(() => import('../widgets/FlipClockWidget')),
  digitalclock: lazy(() => import('../widgets/DigitalClockWidget')),
  knob: lazy(() => import('../widgets/KnobWidget')),
  iframe: lazy(() => import('../widgets/IFrameWidget')),
  border: lazy(() => import('../widgets/BorderWidget')),
  lovelacecard: lazy(() => import('../widgets/LovelaceCardWidget')),
  value: lazy(() => import('../widgets/ValueWidget')),
  radiobutton: lazy(() => import('../widgets/RadioButtonWidget')),
  colorpicker: lazy(() => import('../widgets/ColorPickerWidget')),
  weather: lazy(() => import('../widgets/WeatherWidget')),
  resolution: lazy(() => import('../widgets/ResolutionWidget')),
  html: lazy(() => import('../widgets/HtmlWidget')),
  graph: lazy(() => import('../widgets/GraphWidget')),
  calendar: lazy(() => import('../widgets/CalendarWidget')),
  scrollingtext: lazy(() => import('../widgets/ScrollingTextWidget')),
  screensaver: lazy(() => import('../widgets/ScreensaverWidget')),
};

const SNAP_THRESHOLD = 5; // pixels

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({
  widget, 
  isEditMode, 
  isSelected = false, 
  isSingleSelection = false,
  selectedWidgetIds = [],
  ignoreClicks = false,
  onUpdate, 
  onSelect,
  // onGroupMove, onGroupDragStart, onGroupDragEnd - Now handled by Canvas overlay
  allWidgets = [],
  onAlignmentGuides,
  onDragStart,
  onDragEnd,
  gridSnap = false,
  gridSize = 10,
  viewBoundaries,
  zoom = 100
}) => {
  const { entities } = useWebSocket();
  const WidgetComponent = widgetComponents[widget.type];
  
  // Check visibility conditions (Phase 46 - Advanced Conditional Visibility)
  const isVisible = useVisibility(widget.visibility, entities || {});
  
  // All hooks must be at the top (before any conditional returns)
  const [isDraggingManually, setIsDraggingManually] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const [dragStartPosition, setDragStartPosition] = React.useState({ x: 0, y: 0 });
  const [tempPosition, setTempPosition] = React.useState<{ x: number; y: number } | null>(null);
  const [tempSize, setTempSize] = React.useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isResizing, setIsResizing] = React.useState(false);
  
  // Use refs for immediate access (not async like state) - critical for event handling
  const isDraggingRef = React.useRef(false);
  const dragDistanceRef = React.useRef(0);
  const containerRef = React.useRef<HTMLDivElement>(null); // Reference to widget container for click blocking
  const DRAG_THRESHOLD = 3; // pixels - distinguish click from drag
  const multipleSelected = (selectedWidgetIds?.length ?? 0) > 1;

  // Get entity state if widget has entity binding
  // Check both 'entity' and 'entity_id' fields for compatibility
  // Prefer entity_id over entity (entity_id is the standard field)
  const entityId = widget.config.entity_id || widget.config.entity;
  const entityState = entityId ? entities[entityId] : undefined;

  // CRITICAL: Handle selection in mousedown, NOT click
  // This prevents timing issues with drag-then-click event sequence
  const handleContainerMouseDown = (e: React.MouseEvent) => {
    if (!isEditMode || ignoreClicks) return;
    
    // ✅ CHECK EVENT TARGET FIRST (Production Pattern)
    // Ignore if clicking a control element (drag handle, resize handle, etc.)
    const target = e.target as HTMLElement;
    const controlElement = target.closest('.drag-handle, .resize-handle, .widget-control');
    
    if (controlElement) {
      return; // Let the control handle it
    }
    
    // NOTE: Group drag now handled by Canvas overlay (Moveable pattern)
    // This only handles single-widget selection
    
    e.stopPropagation(); // Prevent canvas from clearing selection
    
    const isMultiSelectKey = e.ctrlKey || e.metaKey;
    
    // Selection logic based on current state
    if (!isSelected) {
      // Widget not selected: select it (either single or add to multi-select)
      if (onSelect) {
        onSelect(isMultiSelectKey, e.shiftKey);
      }
    } else if (isMultiSelectKey) {
      // Ctrl+click on already-selected widget: deselect it
      if (onSelect) {
        onSelect(true, false); // This signals to toggle off
      }
    }
    // CRITICAL: If widget is already selected WITHOUT multi-select key:
    // DO NOTHING - preserve selection for potential group drag
    // This is the key to making group drag work
  };

  // Click handler now only needed to prevent click after drag
  const handleClick = (e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      e.preventDefault();
      e.stopPropagation();
      isDraggingRef.current = false;
    }
  };

  // Handler to prevent click events on drag handle from bubbling to container
  const handleDragHandleClick = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  }, []);

  // NOTE: Group drag now handled by Canvas overlay (Moveable pattern)
  // Individual widgets only handle single-widget dragging

  const handleResize = (direction: 'n' | 'e' | 's' | 'w' | 'nw' | 'ne' | 'sw' | 'se') => (deltaX: number, deltaY: number) => {
    if (!onUpdate) return;

    setIsResizing(true);
    
    const current = tempSize || { ...widget.position };
    const newSize: any = { ...current };

    switch (direction) {
      // Corners
      case 'se': // Bottom-right: increase width/height
        newSize.width = Math.max(50, current.width + deltaX);
        newSize.height = Math.max(30, current.height + deltaY);
        break;
      case 'sw': // Bottom-left: move x, increase height, decrease width
        newSize.x = current.x + deltaX;
        newSize.width = Math.max(50, current.width - deltaX);
        newSize.height = Math.max(30, current.height + deltaY);
        break;
      case 'ne': // Top-right: move y, increase width, decrease height
        newSize.y = current.y + deltaY;
        newSize.width = Math.max(50, current.width + deltaX);
        newSize.height = Math.max(30, current.height - deltaY);
        break;
      case 'nw': // Top-left: move x/y, decrease width/height
        newSize.x = current.x + deltaX;
        newSize.y = current.y + deltaY;
        newSize.width = Math.max(50, current.width - deltaX);
        newSize.height = Math.max(30, current.height - deltaY);
        break;
      
      // Edges
      case 'n': // Top: move y, decrease height
        newSize.y = current.y + deltaY;
        newSize.height = Math.max(30, current.height - deltaY);
        break;
      case 's': // Bottom: increase height
        newSize.height = Math.max(30, current.height + deltaY);
        break;
      case 'w': // Left: move x, decrease width
        newSize.x = current.x + deltaX;
        newSize.width = Math.max(50, current.width - deltaX);
        break;
      case 'e': // Right: increase width
        newSize.width = Math.max(50, current.width + deltaX);
        break;
    }

    // Apply boundary constraints after resize calculation
    // Prevent negative coordinates
    if (newSize.x !== undefined) {
      newSize.x = Math.max(0, newSize.x);
    }
    if (newSize.y !== undefined) {
      newSize.y = Math.max(0, newSize.y);
    }

    // Prevent exceeding view boundaries
    if (viewBoundaries?.maxX && newSize.x !== undefined) {
      newSize.x = Math.min(newSize.x, viewBoundaries.maxX - newSize.width);
    }
    if (viewBoundaries?.maxY && newSize.y !== undefined) {
      newSize.y = Math.min(newSize.y, viewBoundaries.maxY - newSize.height);
    }
    // Constrain width/height to not exceed view boundaries
    if (viewBoundaries?.maxX) {
      const maxWidth = viewBoundaries.maxX - (newSize.x ?? widget.position.x);
      newSize.width = Math.min(newSize.width, maxWidth);
    }
    if (viewBoundaries?.maxY) {
      const maxHeight = viewBoundaries.maxY - (newSize.y ?? widget.position.y);
      newSize.height = Math.min(newSize.height, maxHeight);
    }

    // Calculate alignment guides during resize (similar to drag)
    const SNAP_THRESHOLD = 5;
    const guides: {
      vertical: number[];
      horizontal: number[];
      verticalCenter: number[];
      horizontalCenter: number[];
    } = {
      vertical: [],
      horizontal: [],
      verticalCenter: [],
      horizontalCenter: [],
    };

    if (onAlignmentGuides && allWidgets.length > 0) {
      const otherWidgets = allWidgets.filter(w => w.id !== widget.id);
      
      // Calculate current edges with fallback to original position
      const thisX = newSize.x ?? widget.position.x;
      const thisY = newSize.y ?? widget.position.y;
      const thisRight = thisX + newSize.width;
      const thisBottom = thisY + newSize.height;

      otherWidgets.forEach(other => {
        const otherRight = other.position.x + other.position.width;
        const otherBottom = other.position.y + other.position.height;

        // Vertical alignment (X-axis) - snap edges during horizontal resize
        if (direction === 'e' || direction === 'se' || direction === 'ne') {
          // Right edge aligns with other's right edge
          if (Math.abs(thisRight - otherRight) < SNAP_THRESHOLD) {
            newSize.width = otherRight - thisX;
            guides.vertical.push(otherRight);
          }
          // Right edge aligns with other's left edge
          if (Math.abs(thisRight - other.position.x) < SNAP_THRESHOLD) {
            newSize.width = other.position.x - thisX;
            guides.vertical.push(other.position.x);
          }
        }
        if (direction === 'w' || direction === 'sw' || direction === 'nw') {
          // Left edge aligns with other's left edge
          if (Math.abs(thisX - other.position.x) < SNAP_THRESHOLD) {
            const diff = thisX - other.position.x;
            newSize.x = other.position.x;
            newSize.width = newSize.width + diff;
            guides.vertical.push(other.position.x);
          }
          // Left edge aligns with other's right edge
          if (Math.abs(thisX - otherRight) < SNAP_THRESHOLD) {
            const diff = thisX - otherRight;
            newSize.x = otherRight;
            newSize.width = newSize.width + diff;
            guides.vertical.push(otherRight);
          }
        }

        // Horizontal alignment (Y-axis) - snap edges during vertical resize
        if (direction === 's' || direction === 'se' || direction === 'sw') {
          // Bottom edge aligns with other's bottom edge
          if (Math.abs(thisBottom - otherBottom) < SNAP_THRESHOLD) {
            newSize.height = otherBottom - thisY;
            guides.horizontal.push(otherBottom);
          }
          // Bottom edge aligns with other's top edge
          if (Math.abs(thisBottom - other.position.y) < SNAP_THRESHOLD) {
            newSize.height = other.position.y - thisY;
            guides.horizontal.push(other.position.y);
          }
        }
        if (direction === 'n' || direction === 'ne' || direction === 'nw') {
          // Top edge aligns with other's top edge
          if (Math.abs(thisY - other.position.y) < SNAP_THRESHOLD) {
            const diff = thisY - other.position.y;
            newSize.y = other.position.y;
            newSize.height = newSize.height + diff;
            guides.horizontal.push(other.position.y);
          }
          // Top edge aligns with other's bottom edge
          if (Math.abs(thisY - otherBottom) < SNAP_THRESHOLD) {
            const diff = thisY - otherBottom;
            newSize.y = otherBottom;
            newSize.height = newSize.height + diff;
            guides.horizontal.push(otherBottom);
          }
        }
      });

      onAlignmentGuides(guides);
    }

    setTempSize(newSize);
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
    
    // Clear alignment guides
    if (onAlignmentGuides) {
      onAlignmentGuides({ vertical: [], horizontal: [], verticalCenter: [], horizontalCenter: [] });
    }
    
    // Save the final size to config
    if (tempSize && onUpdate) {
      onUpdate({
        position: tempSize,
      });
    }
    
    setTempSize(null);
  };

  const handleDragStart = (e: React.MouseEvent) => {
    // Event target checking in handleContainerMouseDown prevents selection changes
    e.stopPropagation();
    e.preventDefault();
    
    // Notify parent that drag is starting
    if (onDragStart) onDragStart();
    
    // Reset drag tracking
    isDraggingRef.current = false;
    dragDistanceRef.current = 0;
    
    setIsDraggingManually(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragStartPosition({ x: widget.position.x, y: widget.position.y });
    setTempPosition(null);
  };

  React.useEffect(() => {
    if (!isDraggingManually || !onUpdate) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Calculate delta in screen space
      const screenDeltaX = e.clientX - dragStart.x;
      const screenDeltaY = e.clientY - dragStart.y;
      
      // Track total drag distance
      const totalDistance = Math.sqrt(screenDeltaX * screenDeltaX + screenDeltaY * screenDeltaY);
      dragDistanceRef.current = totalDistance;
      
      // Mark as dragging if threshold exceeded
      if (totalDistance > DRAG_THRESHOLD && !isDraggingRef.current) {
        isDraggingRef.current = true;
      }
      
      // Apply zoom correction to convert screen space to canvas space
      const zoomFactor = zoom / 100;
      const deltaX = screenDeltaX / zoomFactor;
      const deltaY = screenDeltaY / zoomFactor;

      let newX = dragStartPosition.x + deltaX;
      let newY = dragStartPosition.y + deltaY;

      // Apply grid snap first (if enabled)
      if (gridSnap && gridSize) {
        newX = Math.round(newX / gridSize) * gridSize;
        newY = Math.round(newY / gridSize) * gridSize;
      }

      const guides: { 
        vertical: number[]; 
        horizontal: number[];
        verticalCenter: number[];
        horizontalCenter: number[];
      } = { 
        vertical: [], 
        horizontal: [],
        verticalCenter: [],
        horizontalCenter: [],
      };

      // Calculate alignment guides and snapping (overrides grid snap for precision)
      if (onAlignmentGuides && allWidgets.length > 0) {
        const otherWidgets = allWidgets.filter(w => w.id !== widget.id);
        
        otherWidgets.forEach(other => {
          const otherRight = other.position.x + other.position.width;
          const otherBottom = other.position.y + other.position.height;
          const thisRight = newX + widget.position.width;
          const thisBottom = newY + widget.position.height;
          const otherCenterX = other.position.x + other.position.width / 2;
          const otherCenterY = other.position.y + other.position.height / 2;
          const thisCenterX = newX + widget.position.width / 2;
          const thisCenterY = newY + widget.position.height / 2;

          // Vertical alignment (X-axis)
          // Left edges align
          if (Math.abs(newX - other.position.x) < SNAP_THRESHOLD) {
            newX = other.position.x;
            guides.vertical.push(other.position.x);
          }
          // Right edges align
          if (Math.abs(thisRight - otherRight) < SNAP_THRESHOLD) {
            newX = otherRight - widget.position.width;
            guides.vertical.push(otherRight);
          }
          // Left to right edge
          if (Math.abs(newX - otherRight) < SNAP_THRESHOLD) {
            newX = otherRight;
            guides.vertical.push(otherRight);
          }
          // Right to left edge
          if (Math.abs(thisRight - other.position.x) < SNAP_THRESHOLD) {
            newX = other.position.x - widget.position.width;
            guides.vertical.push(other.position.x);
          }
          // Horizontal center alignment (vertical guide)
          if (Math.abs(thisCenterX - otherCenterX) < SNAP_THRESHOLD) {
            newX = otherCenterX - widget.position.width / 2;
            guides.verticalCenter.push(otherCenterX);
          }

          // Horizontal alignment (Y-axis)
          // Top edges align
          if (Math.abs(newY - other.position.y) < SNAP_THRESHOLD) {
            newY = other.position.y;
            guides.horizontal.push(other.position.y);
          }
          // Bottom edges align
          if (Math.abs(thisBottom - otherBottom) < SNAP_THRESHOLD) {
            newY = otherBottom - widget.position.height;
            guides.horizontal.push(otherBottom);
          }
          // Top to bottom edge
          if (Math.abs(newY - otherBottom) < SNAP_THRESHOLD) {
            newY = otherBottom;
            guides.horizontal.push(otherBottom);
          }
          // Bottom to top edge
          if (Math.abs(thisBottom - other.position.y) < SNAP_THRESHOLD) {
            newY = other.position.y - widget.position.height;
            guides.horizontal.push(other.position.y);
          }
          // Vertical center alignment (horizontal guide)
          if (Math.abs(thisCenterY - otherCenterY) < SNAP_THRESHOLD) {
            newY = otherCenterY - widget.position.height / 2;
            guides.horizontalCenter.push(otherCenterY);
          }
        });

        onAlignmentGuides(guides);
      }

      // Update temp position for visual feedback without saving
      setTempPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      const wasDragging = isDraggingRef.current;
      
      setIsDraggingManually(false);
      if (onAlignmentGuides) {
        onAlignmentGuides({ vertical: [], horizontal: [], verticalCenter: [], horizontalCenter: [] });
      }
      
      // Keep flag set briefly to suppress click event that fires after mouseup
      if (wasDragging) {
        // Reset after click event would have fired
        setTimeout(() => {
          isDraggingRef.current = false;
        }, 0);
      } else {
        isDraggingRef.current = false;
      }
      
      // Only save once at the end of drag
      if (tempPosition) {
        onUpdate({
          position: {
            ...widget.position,
            x: tempPosition.x,
            y: tempPosition.y,
          },
        });
      }
      
      setTempPosition(null);
      
      // Snapshot history after drag ends
      if (onDragEnd) {
        onDragEnd();
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingManually, dragStart, dragStartPosition, onUpdate, allWidgets, onAlignmentGuides, tempPosition, widget.position, widget.id, onDragEnd, zoom, gridSnap, gridSize, viewBoundaries]);

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: tempSize ? tempSize.x : (tempPosition ? tempPosition.x : widget.position.x),
    top: tempSize ? tempSize.y : (tempPosition ? tempPosition.y : widget.position.y),
    width: tempSize ? tempSize.width : widget.position.width,
    height: tempSize ? tempSize.height : widget.position.height,
    zIndex: widget.config.style?.zIndex ?? widget.position.zIndex ?? 1,
    cursor: isEditMode && !isSelected ? 'pointer' : 'default',
    // Apply border-radius to container for background clipping
    borderRadius: widget.config.style?.borderRadius ? (typeof widget.config.style.borderRadius === 'number' ? `${widget.config.style.borderRadius}px` : undefined) : undefined,
    // Selection border in edit mode
    border: isEditMode && isSelected ? '2px solid #2196f3' : isEditMode ? '1px dashed rgba(255, 255, 255, 0.3)' : 'none',
    // Only apply opacity during resize (backgroundOpacity is now handled in styleBuilder via rgba)
    opacity: isResizing ? 0.7 : 1,
    overflow: 'hidden', // Ensure background stays within container bounds
  };

  // Convert /config/www/ paths to /local/ for browser access
  const convertImagePath = (path: string): string => {
    if (!path) return path;
    // Convert Home Assistant server paths to browser-accessible paths
    if (path.startsWith('/config/www/')) {
      return path.replace('/config/www/', '/local/');
    }
    return path;
  };

  // Convert background image path for widget consumption
  const widgetConfig = widget.config.style?.backgroundImage ? {
    ...widget,
    config: {
      ...widget.config,
      style: {
        ...widget.config.style,
        backgroundImage: `url(${convertImagePath(widget.config.style.backgroundImage)})`
      }
    }
  } : widget;

  const dragHandleStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    cursor: 'move',
    pointerEvents: 'auto',
    zIndex: 10,
  };

  // If widget component is not found, render error
  if (!WidgetComponent) {
    return (
      <div style={{
        position: 'absolute',
        left: widget.position.x,
        top: widget.position.y,
        width: widget.position.width,
        height: widget.position.height,
        border: '2px dashed red',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'red',
      }}>
        Unknown widget: {widget.type}
      </div>
    );
  }

  // Hide widget if visibility conditions are not met (Phase 46)
  // Skip visibility check in edit mode - always show for editing
  if (!isEditMode && !isVisible) {
    return null;
  }

  return (
    <div 
      ref={containerRef}
      style={containerStyle}
      onMouseDown={isEditMode ? handleContainerMouseDown : undefined}
      onClick={isEditMode ? handleClick : undefined}
    >
      {/* Drag handle - only for single widget drag (group drag handled by Canvas overlay) */}
      {isEditMode && isSelected && !multipleSelected && (
        <div 
          className="drag-handle"
          style={dragHandleStyle} 
          onMouseDown={handleDragStart}
          onClick={handleDragHandleClick}
        />
      )}
      
      {/* Resize handles - only show when single selected widget */}
      {isEditMode && isSelected && isSingleSelection && onUpdate && (
        <>
          {/* Corners */}
          <ResizeHandle position="nw" onResize={handleResize('nw')} onResizeEnd={handleResizeEnd} />
          <ResizeHandle position="ne" onResize={handleResize('ne')} onResizeEnd={handleResizeEnd} />
          <ResizeHandle position="sw" onResize={handleResize('sw')} onResizeEnd={handleResizeEnd} />
          <ResizeHandle position="se" onResize={handleResize('se')} onResizeEnd={handleResizeEnd} />
          {/* Edges */}
          <ResizeHandle position="n" onResize={handleResize('n')} onResizeEnd={handleResizeEnd} />
          <ResizeHandle position="s" onResize={handleResize('s')} onResizeEnd={handleResizeEnd} />
          <ResizeHandle position="w" onResize={handleResize('w')} onResizeEnd={handleResizeEnd} />
          <ResizeHandle position="e" onResize={handleResize('e')} onResizeEnd={handleResizeEnd} />
        </>
      )}
      
      {/* Widget content layer - sits above background */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%' }}>
        <Suspense fallback={<div style={{ color: '#666' }}>Loading...</div>}>
          <WidgetComponent
            config={widgetConfig}
            entityState={entityState}
            isEditMode={isEditMode}
            onUpdate={onUpdate}
          />
        </Suspense>
      </div>
    </div>
  );
};
