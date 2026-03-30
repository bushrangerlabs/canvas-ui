/**
 * ScrollableContainerWidget
 * A scrollable container that hosts a configurable grid of other widgets.
 * The grid layout (columns, rows, children) is managed entirely through the Inspector.
 */

import React, { Suspense, lazy } from 'react';
import type { WidgetConfig, WidgetProps } from '../types';
import type { WidgetMetadata } from '../types/metadata';
import { WIDGET_REGISTRY } from '../registry/widgetRegistry';
import { useContainerSelection } from '../contexts/ContainerSelectionContext';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ContainerChild {
  id: string;
  widgetType: string;
  row: number;       // 0-based
  col: number;       // 0-based
  colspan: number;   // default 1
  rowspan: number;   // default 1
  config: Record<string, any>;
}

// ─── Lazy child widget components ─────────────────────────────────────────────
// Mirrors the map in WidgetRenderer but without resize/drag overhead.
// Deliberately excludes scrollablecontainer (no nesting) and layout-only widgets.

const childComponents: Record<string, React.LazyExoticComponent<React.FC<WidgetProps>>> = {
  button:         lazy(() => import('./ButtonWidget')),
  text:           lazy(() => import('./TextWidget')),
  gauge:          lazy(() => import('./GaugeWidget')),
  camera:         lazy(() => import('./CameraWidget')),
  slider:         lazy(() => import('./SliderWidget')),
  switch:         lazy(() => import('./SwitchWidget')),
  image:          lazy(() => import('./ImageWidget')),
  icon:           lazy(() => import('./IconWidget')),
  progressbar:    lazy(() => import('./ProgressBarWidget')),
  progresscircle: lazy(() => import('./ProgressCircleWidget')),
  inputtext:      lazy(() => import('./InputTextWidget')),
  analogclock:    lazy(() => import('./AnalogClockWidget')),
  flipclock:      lazy(() => import('./FlipClockWidget')),
  digitalclock:   lazy(() => import('./DigitalClockWidget')),
  knob:           lazy(() => import('./KnobWidget')),
  border:         lazy(() => import('./BorderWidget')),
  value:          lazy(() => import('./ValueWidget')),
  radiobutton:    lazy(() => import('./RadioButtonWidget')),
  colorpicker:    lazy(() => import('./ColorPickerWidget')),
  weather:        lazy(() => import('./WeatherWidget')),
  html:           lazy(() => import('./HtmlWidget')),
  graph:          lazy(() => import('./GraphWidget')),
  calendar:       lazy(() => import('./CalendarWidget')),
  scrollingtext:  lazy(() => import('./ScrollingTextWidget')),
  iframe:         lazy(() => import('./IFrameWidget')),
  lovelacecard:   lazy(() => import('./LovelaceCardWidget')),
  keyboard:       lazy(() => import('./KeyboardWidget')),
  shape:          lazy(() => import('./ShapeWidget')),
};

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const scrollableContainerMetadata: WidgetMetadata = {
  name: 'Scrollable Container',
  icon: 'TableChartOutlined',
  category: 'layout',
  description: 'A scrollable container with a configurable grid layout that can host other widgets',
  defaultSize: { w: 500, h: 400 },
  minSize: { w: 100, h: 100 },
  fields: [
    // Layout
    { name: 'x',      type: 'number', label: 'X Position', default: 0,   category: 'layout' },
    { name: 'y',      type: 'number', label: 'Y Position', default: 0,   category: 'layout' },
    { name: 'width',  type: 'number', label: 'Width',  default: 500, min: 100, category: 'layout' },
    { name: 'height', type: 'number', label: 'Height', default: 400, min: 100, category: 'layout' },

    // Behavior
    {
      name: 'scrollDirection',
      type: 'select',
      label: 'Scroll Direction',
      default: 'vertical',
      category: 'behavior',
      options: [
        { value: 'vertical',   label: 'Vertical' },
        { value: 'horizontal', label: 'Horizontal' },
        { value: 'both',       label: 'Both' },
        { value: 'none',       label: 'None' },
      ],
    },

    // Style
    { name: 'gap',            type: 'number', label: 'Cell Gap (px)',      default: 4,   min: 0, max: 40, category: 'style' },
    { name: 'padding',        type: 'number', label: 'Padding (px)',        default: 8,   min: 0, max: 80, category: 'style' },
    { name: 'cellBackground', type: 'color',  label: 'Empty Cell Color',    default: 'rgba(255,255,255,0.04)', category: 'style' },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Compute total pixel span (width or height) across multiple cells, including inter-cell gaps. */
export const getSpanSize = (arr: number[], start: number, span: number, gap: number): number => {
  const count = Math.min(span, Math.max(0, arr.length - start));
  if (count <= 0) return 0;
  let total = 0;
  for (let i = 0; i < count; i++) total += arr[start + i] || 0;
  total += (count - 1) * Math.max(0, gap);
  return Math.max(total, 0);
};

// ─── Component ────────────────────────────────────────────────────────────────

const ScrollableContainerWidget: React.FC<WidgetProps> = ({ config, isEditMode }) => {
  const { selectedChild, setSelectedChild } = useContainerSelection();
  const {
    scrollDirection = 'vertical',
    columns        = [200, 200],
    rows           = [150, 150],
    gap            = 4,
    padding        = 8,
    cellBackground = 'rgba(255,255,255,0.04)',
    children       = [],
  } = config.config as {
    scrollDirection: string;
    columns: number[];
    rows: number[];
    gap: number;
    padding: number;
    cellBackground: string;
    children: ContainerChild[];
  };

  // Overflow style
  const overflowX: React.CSSProperties['overflowX'] =
    (scrollDirection === 'horizontal' || scrollDirection === 'both') ? 'auto' : 'hidden';
  const overflowY: React.CSSProperties['overflowY'] =
    (scrollDirection === 'vertical' || scrollDirection === 'both') ? 'auto' : 'hidden';

  const outerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    overflowX,
    overflowY,
    boxSizing: 'border-box',
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: columns.map(w => `${w}px`).join(' '),
    gridTemplateRows:    rows.map(h => `${h}px`).join(' '),
    gap:     `${gap}px`,
    padding: `${padding}px`,
    minWidth:  'fit-content',
    minHeight: 'fit-content',
  };

  // ── Build occupancy map (to know which cells are empty) ──
  const occupied = new Set<string>();
  children.forEach(child => {
    const cspan = child.colspan || 1;
    const rspan = child.rowspan || 1;
    for (let r = child.row; r < child.row + rspan; r++) {
      for (let c = child.col; c < child.col + cspan; c++) {
        occupied.add(`${r}:${c}`);
      }
    }
  });

  // ── Empty cell placeholders (edit mode only) ──
  const placeholders: React.ReactNode[] = [];
  if (isEditMode) {
    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < columns.length; c++) {
        if (!occupied.has(`${r}:${c}`)) {
          placeholders.push(
            <div
              key={`ph-${r}:${c}`}
              style={{
                gridColumn: `${c + 1}`,
                gridRow:    `${r + 1}`,
                border:          '1px dashed rgba(150,160,200,0.35)',
                borderRadius:    '3px',
                backgroundColor: cellBackground,
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
                fontSize:        10,
                color:           'rgba(180,190,220,0.4)',
                userSelect:      'none',
                pointerEvents:   'none',
              }}
            >
              [{r},{c}]
            </div>
          );
        }
      }
    }
  }

  // ── Render ──
  return (
    <div style={outerStyle}>
      <div style={gridStyle}>

        {/* Child widgets */}
        {children.map(child => {
          const ChildComp = childComponents[child.widgetType];
          const childMeta = WIDGET_REGISTRY[child.widgetType];
          const cspan = child.colspan || 1;
          const rspan = child.rowspan || 1;

          const cellW = getSpanSize(columns, child.col, cspan, gap);
          const cellH = getSpanSize(rows,    child.row, rspan, gap);

          const isSelectedCell = isEditMode && selectedChild?.containerId === config.id && selectedChild?.childId === child.id;

          const cellStyle: React.CSSProperties = {
            gridColumn: `${child.col + 1} / span ${cspan}`,
            gridRow:    `${child.row + 1} / span ${rspan}`,
            overflow:   'hidden',
            backgroundColor: cellBackground,
            cursor: isEditMode ? 'pointer' : 'default',
            // Highlight in edit mode; brighter ring when selected
            ...(isEditMode ? {
              outline: isSelectedCell
                ? '2px solid rgba(80,180,255,0.9)'
                : '1px solid rgba(80,160,255,0.25)',
              ...(isSelectedCell ? { boxShadow: '0 0 0 1px rgba(80,180,255,0.4)' } : {}),
            } : {}),
          };

          if (!ChildComp) {
            return (
              <div
                key={child.id}
                style={{
                  ...cellStyle,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  color: 'rgba(255,120,80,0.8)',
                  border: '1px dashed rgba(255,120,80,0.5)',
                }}
              >
                Unknown: {child.widgetType}
              </div>
            );
          }

          // Build a minimal WidgetConfig for the child component
          const childWidgetConfig: WidgetConfig = {
            id:       child.id,
            type:     child.widgetType,
            position: { x: 0, y: 0, width: cellW, height: cellH },
            config:   {
              ...child.config,
              // Ensure the widget sees correct dimensions
              width:  cellW,
              height: cellH,
            },
          };

          return (
            <div
              key={child.id}
              style={{ ...cellStyle, position: 'relative' }}
              title={isEditMode ? `Click to edit ${childMeta?.name ?? child.widgetType}` : undefined}
            >
              {/* Edit-mode click overlay: sits above child content to capture all clicks.
                  Child widgets rendered in view-mode (isEditMode=false) may call
                  stopPropagation on their own click handlers, which would prevent
                  bubbling to a parent onClick. The overlay intercepts first. */}
              {isEditMode && (
                <div
                  style={{ position: 'absolute', inset: 0, zIndex: 10, cursor: 'pointer' }}
                  onClick={(e) => { e.stopPropagation(); setSelectedChild({ containerId: config.id, childId: child.id }); }}
                />
              )}
              <Suspense
                fallback={
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                                width: '100%', height: '100%', fontSize: 11,
                                color: 'rgba(255,255,255,0.3)' }}>
                    …
                  </div>
                }
              >
                <ChildComp config={childWidgetConfig} isEditMode={false} />
              </Suspense>
            </div>
          );
        })}

        {/* Empty cell placeholders */}
        {placeholders}
      </div>
    </div>
  );
};

export default ScrollableContainerWidget;
