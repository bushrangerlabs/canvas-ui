/**
 * SVG path builder for ShapeWidget
 * Converts a vertex array with per-vertex corner modes into an SVG path string.
 */

export interface VertexPoint {
  x: number;       // 0–1 fraction of widget width
  y: number;       // 0–1 fraction of widget height
  corner: 'sharp' | 'rounded' | 'chamfer';
  radius?: number; // pixels; used by rounded and chamfer modes
}

function f(n: number): string {
  return (Math.round(n * 10) / 10).toString();
}

interface Seg {
  approach: { x: number; y: number };
  departure: { x: number; y: number };
  vertex: { x: number; y: number };
  corner: 'sharp' | 'rounded' | 'chamfer';
}

/**
 * Build an SVG path string from vertices.
 * @param points  Array of VertexPoint (fractions 0–1)
 * @param width   Pixel width of the bounding box
 * @param height  Pixel height of the bounding box
 */
export function buildSVGPath(points: VertexPoint[], width: number, height: number): string {
  if (!points || points.length < 3) return '';

  const n = points.length;

  // Resolve per-vertex approach/departure points in pixel space
  const segs: Seg[] = [];

  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n];
    const curr = points[i];
    const next = points[(i + 1) % n];

    const cx = curr.x * width;
    const cy = curr.y * height;
    const r = curr.radius ?? 0;

    if (curr.corner === 'sharp' || r <= 0) {
      segs.push({
        approach:  { x: cx, y: cy },
        departure: { x: cx, y: cy },
        vertex:    { x: cx, y: cy },
        corner: 'sharp',
      });
      continue;
    }

    // Incoming direction: prev → curr
    const px = prev.x * width;
    const py = prev.y * height;
    const inDx = cx - px;
    const inDy = cy - py;
    const inLen = Math.sqrt(inDx * inDx + inDy * inDy);
    const inUx = inLen > 0 ? inDx / inLen : 0;
    const inUy = inLen > 0 ? inDy / inLen : 0;

    // Outgoing direction: curr → next
    const nx = next.x * width;
    const ny = next.y * height;
    const outDx = nx - cx;
    const outDy = ny - cy;
    const outLen = Math.sqrt(outDx * outDx + outDy * outDy);
    const outUx = outLen > 0 ? outDx / outLen : 0;
    const outUy = outLen > 0 ? outDy / outLen : 0;

    // Clamp radius to at most half of the shorter adjacent edge
    const clampedR = Math.min(r, inLen / 2, outLen / 2);

    segs.push({
      approach:  { x: cx - inUx  * clampedR, y: cy - inUy  * clampedR },
      departure: { x: cx + outUx * clampedR, y: cy + outUy * clampedR },
      vertex:    { x: cx, y: cy },
      corner: curr.corner,
    });
  }

  // Assemble path
  const parts: string[] = [];

  // Start at departure of vertex 0
  parts.push(`M ${f(segs[0].departure.x)} ${f(segs[0].departure.y)}`);

  for (let i = 1; i < n; i++) {
    const seg = segs[i];
    // Edge: previous departure → this approach
    parts.push(`L ${f(seg.approach.x)} ${f(seg.approach.y)}`);
    // Corner at vertex i
    if (seg.corner === 'rounded') {
      parts.push(`Q ${f(seg.vertex.x)} ${f(seg.vertex.y)} ${f(seg.departure.x)} ${f(seg.departure.y)}`);
    } else if (seg.corner === 'chamfer') {
      parts.push(`L ${f(seg.departure.x)} ${f(seg.departure.y)}`);
    }
    // sharp: approach == departure == vertex, already there
  }

  // Close loop: back to vertex 0
  const first = segs[0];
  parts.push(`L ${f(first.approach.x)} ${f(first.approach.y)}`);
  if (first.corner === 'rounded') {
    parts.push(`Q ${f(first.vertex.x)} ${f(first.vertex.y)} ${f(first.departure.x)} ${f(first.departure.y)}`);
  } else if (first.corner === 'chamfer') {
    parts.push(`L ${f(first.departure.x)} ${f(first.departure.y)}`);
  }
  parts.push('Z');

  return parts.join(' ');
}

/**
 * Preset shape definitions (vertices as 0–1 fractions)
 */
export const SHAPE_PRESETS: Record<string, VertexPoint[]> = {
  rectangle: [
    { x: 0, y: 0, corner: 'sharp' },
    { x: 1, y: 0, corner: 'sharp' },
    { x: 1, y: 1, corner: 'sharp' },
    { x: 0, y: 1, corner: 'sharp' },
  ],
  rounded: [
    { x: 0, y: 0, corner: 'rounded', radius: 20 },
    { x: 1, y: 0, corner: 'rounded', radius: 20 },
    { x: 1, y: 1, corner: 'rounded', radius: 20 },
    { x: 0, y: 1, corner: 'rounded', radius: 20 },
  ],
  chamfered: [
    { x: 0, y: 0, corner: 'chamfer', radius: 24 },
    { x: 1, y: 0, corner: 'chamfer', radius: 24 },
    { x: 1, y: 1, corner: 'chamfer', radius: 24 },
    { x: 0, y: 1, corner: 'chamfer', radius: 24 },
  ],
  singleCut: [
    { x: 0, y: 0, corner: 'chamfer', radius: 30 },
    { x: 1, y: 0, corner: 'sharp' },
    { x: 1, y: 1, corner: 'chamfer', radius: 30 },
    { x: 0, y: 1, corner: 'sharp' },
  ],
  topLeftCut: [
    { x: 0, y: 0, corner: 'chamfer', radius: 30 },
    { x: 1, y: 0, corner: 'sharp' },
    { x: 1, y: 1, corner: 'sharp' },
    { x: 0, y: 1, corner: 'sharp' },
  ],
  diamond: [
    { x: 0.5, y: 0,   corner: 'sharp' },
    { x: 1,   y: 0.5, corner: 'sharp' },
    { x: 0.5, y: 1,   corner: 'sharp' },
    { x: 0,   y: 0.5, corner: 'sharp' },
  ],
  parallelogram: [
    { x: 0.2, y: 0,   corner: 'sharp' },
    { x: 1,   y: 0,   corner: 'sharp' },
    { x: 0.8, y: 1,   corner: 'sharp' },
    { x: 0,   y: 1,   corner: 'sharp' },
  ],
  arrowRight: [
    { x: 0,    y: 0.2,  corner: 'sharp' },
    { x: 0.65, y: 0.2,  corner: 'sharp' },
    { x: 0.65, y: 0,    corner: 'sharp' },
    { x: 1,    y: 0.5,  corner: 'sharp' },
    { x: 0.65, y: 1,    corner: 'sharp' },
    { x: 0.65, y: 0.8,  corner: 'sharp' },
    { x: 0,    y: 0.8,  corner: 'sharp' },
  ],
  tShape: [
    { x: 0.3,  y: 0,   corner: 'sharp' },
    { x: 0.7,  y: 0,   corner: 'sharp' },
    { x: 0.7,  y: 0.4, corner: 'sharp' },
    { x: 1,    y: 0.4, corner: 'sharp' },
    { x: 1,    y: 1,   corner: 'sharp' },
    { x: 0,    y: 1,   corner: 'sharp' },
    { x: 0,    y: 0.4, corner: 'sharp' },
    { x: 0.3,  y: 0.4, corner: 'sharp' },
  ],
  lShape: [
    { x: 0,   y: 0,   corner: 'sharp' },
    { x: 0.5, y: 0,   corner: 'sharp' },
    { x: 0.5, y: 0.6, corner: 'sharp' },
    { x: 1,   y: 0.6, corner: 'sharp' },
    { x: 1,   y: 1,   corner: 'sharp' },
    { x: 0,   y: 1,   corner: 'sharp' },
  ],
  hexagon: [
    { x: 0.5,  y: 0,    corner: 'sharp' },
    { x: 1,    y: 0.25, corner: 'sharp' },
    { x: 1,    y: 0.75, corner: 'sharp' },
    { x: 0.5,  y: 1,    corner: 'sharp' },
    { x: 0,    y: 0.75, corner: 'sharp' },
    { x: 0,    y: 0.25, corner: 'sharp' },
  ],
};

export const PRESET_LABELS: Record<string, string> = {
  rectangle:    'Rectangle',
  rounded:      'Rounded',
  chamfered:    'Chamfered (all)',
  singleCut:    'Single Cut (sci-fi)',
  topLeftCut:   'Top-Left Cut',
  diamond:      'Diamond',
  parallelogram:'Parallelogram',
  arrowRight:   'Arrow Right',
  tShape:       'T-Shape',
  lShape:       'L-Shape',
  hexagon:      'Hexagon',
};
