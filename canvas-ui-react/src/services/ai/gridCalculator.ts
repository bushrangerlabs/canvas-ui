/**
 * Grid Calculator - Convert grid positions to pixel coordinates
 * 
 * Transforms logical grid positions (row, col, colSpan, rowSpan)
 * into absolute pixel positions (x, y, width, height) for Canvas UI
 */

/**
 * Grid position from AI (Stage 2 output)
 */
export interface GridPosition {
  row: number;      // 1-indexed row number
  col: number;      // 1-indexed column number
  colSpan?: number; // Number of columns to span (default: 1)
  rowSpan?: number; // Number of rows to span (default: 1)
}

/**
 * Layout configuration
 */
export interface GridLayout {
  columns: number;  // Number of columns in grid
  spacing: number;  // Spacing between widgets (pixels)
  padding: number;  // Padding from edges (pixels)
}

/**
 * Pixel position for Canvas UI
 */
export interface PixelPosition {
  x: number;      // Absolute X coordinate
  y: number;      // Absolute Y coordinate
  width: number;  // Widget width in pixels
  height: number; // Widget height in pixels
}

/**
 * Default widget dimensions
 */
const DEFAULT_WIDGET_WIDTH = 150;  // pixels
const DEFAULT_WIDGET_HEIGHT = 80;  // pixels

/**
 * Calculate absolute pixel position from grid coordinates
 * 
 * Formula:
 * - X = padding + (col - 1) * (width + spacing)
 * - Y = padding + (row - 1) * (height + spacing)
 * - Width = baseWidth * colSpan + spacing * (colSpan - 1)
 * - Height = baseHeight * rowSpan + spacing * (rowSpan - 1)
 * 
 * @param grid - Grid position (row, col, spans)
 * @param layout - Layout configuration (columns, spacing, padding)
 * @param baseWidth - Base width for a single cell (default: 150px)
 * @param baseHeight - Base height for a single cell (default: 80px)
 * @returns Absolute pixel position
 */
export function calculatePosition(
  grid: GridPosition,
  layout: GridLayout,
  baseWidth: number = DEFAULT_WIDGET_WIDTH,
  baseHeight: number = DEFAULT_WIDGET_HEIGHT
): PixelPosition {
  const colSpan = grid.colSpan || 1;
  const rowSpan = grid.rowSpan || 1;

  // Validate grid position
  if (grid.row < 1 || grid.col < 1) {
    throw new Error('Grid row and col must be >= 1 (1-indexed)');
  }

  if (grid.col + colSpan - 1 > layout.columns) {
    throw new Error(
      `Widget at col ${grid.col} with colSpan ${colSpan} exceeds grid columns (${layout.columns})`
    );
  }

  return {
    x: layout.padding + (grid.col - 1) * (baseWidth + layout.spacing),
    y: layout.padding + (grid.row - 1) * (baseHeight + layout.spacing),
    width: baseWidth * colSpan + layout.spacing * (colSpan - 1),
    height: baseHeight * rowSpan + layout.spacing * (rowSpan - 1)
  };
}

/**
 * Calculate grid layout bounds (for view sizing)
 * 
 * @param widgets - Array of grid positions
 * @param layout - Layout configuration
 * @param baseWidth - Base width for a single cell
 * @param baseHeight - Base height for a single cell
 * @returns Total width and height needed for this grid
 */
export function calculateGridBounds(
  widgets: GridPosition[],
  layout: GridLayout,
  baseWidth: number = DEFAULT_WIDGET_WIDTH,
  baseHeight: number = DEFAULT_WIDGET_HEIGHT
): { width: number; height: number } {
  if (widgets.length === 0) {
    return { width: 0, height: 0 };
  }

  // Find maximum row and column
  let maxRow = 0;
  let maxCol = 0;

  widgets.forEach(widget => {
    const endRow = widget.row + (widget.rowSpan || 1) - 1;
    const endCol = widget.col + (widget.colSpan || 1) - 1;
    
    maxRow = Math.max(maxRow, endRow);
    maxCol = Math.max(maxCol, endCol);
  });

  return {
    width: layout.padding * 2 + maxCol * baseWidth + (maxCol - 1) * layout.spacing,
    height: layout.padding * 2 + maxRow * baseHeight + (maxRow - 1) * layout.spacing
  };
}

/**
 * Validate grid layout doesn't have overlapping widgets
 * 
 * @param widgets - Array of grid positions to check
 * @returns Array of overlap errors (empty if no overlaps)
 */
export function validateGridLayout(widgets: GridPosition[]): string[] {
  const errors: string[] = [];
  const occupied = new Set<string>();

  widgets.forEach((widget, index) => {
    const colSpan = widget.colSpan || 1;
    const rowSpan = widget.rowSpan || 1;

    // Check each cell this widget occupies
    for (let r = 0; r < rowSpan; r++) {
      for (let c = 0; c < colSpan; c++) {
        const row = widget.row + r;
        const col = widget.col + c;
        const cellKey = `${row},${col}`;

        if (occupied.has(cellKey)) {
          errors.push(
            `Widget ${index + 1} at (${widget.row},${widget.col}) overlaps cell (${row},${col})`
          );
        }
        occupied.add(cellKey);
      }
    }
  });

  return errors;
}
