/**
 * ShapeEditorDialog - Visual drag-and-drop editor for ShapeWidget polygon points
 * Zero external dependencies: plain SVG + React pointer events
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  Tooltip,
} from '@mui/material';
import * as MuiIcons from '@mui/icons-material';
import { buildSVGPath, SHAPE_PRESETS, PRESET_LABELS, type VertexPoint } from '../../shared/utils/buildSVGPath';

// Editor canvas dimensions (fixed display size)
const CANVAS_W = 480;
const CANVAS_H = 320;

// Grid snap interval (fraction of canvas)
const SNAP = 0.025; // 2.5% grid

interface Props {
  open: boolean;
  onClose: () => void;
  points: VertexPoint[];
  fillColor?: string;
  fillOpacity?: number;
  strokeColor?: string;
  strokeWidth?: number;
  onApply: (newPoints: VertexPoint[]) => void;
}

function snapVal(v: number): number {
  return Math.round(v / SNAP) * SNAP;
}

function clamp(v: number, lo = 0, hi = 1): number {
  return Math.max(lo, Math.min(hi, v));
}

function edgeMidpoints(pts: VertexPoint[]): Array<{ fx: number; fy: number; afterIdx: number }> {
  return pts.map((pt, i) => {
    const next = pts[(i + 1) % pts.length];
    return { fx: (pt.x + next.x) / 2, fy: (pt.y + next.y) / 2, afterIdx: i };
  });
}

export const ShapeEditorDialog: React.FC<Props> = ({
  open,
  onClose,
  points: initialPoints,
  fillColor   = 'rgba(0, 212, 255, 0.15)',
  fillOpacity = 1,
  strokeColor = '#00d4ff',
  strokeWidth = 2,
  onApply,
}) => {
  const [points, setPoints]       = useState<VertexPoint[]>(initialPoints);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [showGrid,    setShowGrid]    = useState(true);

  // Drag tracking via ref to avoid stale closures
  const dragRef = useRef<{
    idx: number;
    hasMoved: boolean;
    startMouseX: number;
    startMouseY: number;
    startFx: number;
    startFy: number;
  } | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);

  // Reset to initial points when dialog opens
  useEffect(() => {
    if (open) {
      setPoints(initialPoints);
      setSelectedIdx(null);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Grid dots ──────────────────────────────────────────────────────────────
  const gridDots = React.useMemo(() => {
    if (!showGrid) return null;
    const dots: React.ReactNode[] = [];
    const stepX = CANVAS_W * SNAP;
    const stepY = CANVAS_H * SNAP;
    for (let gx = 0; gx <= CANVAS_W; gx += stepX) {
      for (let gy = 0; gy <= CANVAS_H; gy += stepY) {
        dots.push(<circle key={`${gx}-${gy}`} cx={gx} cy={gy} r={1} fill="rgba(255,255,255,0.18)" />);
      }
    }
    return dots;
  }, [showGrid]);

  // ── Derive canvas px from fraction ─────────────────────────────────────────
  const toPx = (f: number, dim: number) => f * dim;

  // ── Path for editor canvas ─────────────────────────────────────────────────
  const pathD = buildSVGPath(points, CANVAS_W, CANVAS_H);

  // ── Edge midpoint handles ──────────────────────────────────────────────────
  const mids = edgeMidpoints(points);

  // ── Vertex drag ────────────────────────────────────────────────────────────
  const handleVertexPointerDown = useCallback((e: React.PointerEvent<SVGCircleElement>, idx: number) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setSelectedIdx(idx);
    dragRef.current = {
      idx,
      hasMoved: false,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startFx: points[idx].x,
      startFy: points[idx].y,
    };
  }, [points]);

  const handleVertexPointerMove = useCallback((e: React.PointerEvent<SVGCircleElement>, idx: number) => {
    const drag = dragRef.current;
    if (!drag || drag.idx !== idx) return;

    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;

    const scaleX = CANVAS_W / svgRect.width;
    const scaleY = CANVAS_H / svgRect.height;

    const dFx = (e.clientX - drag.startMouseX) * scaleX / CANVAS_W;
    const dFy = (e.clientY - drag.startMouseY) * scaleY / CANVAS_H;

    let newFx = clamp(drag.startFx + dFx);
    let newFy = clamp(drag.startFy + dFy);

    if (snapEnabled) {
      newFx = snapVal(newFx);
      newFy = snapVal(newFy);
    }

    if (Math.abs(e.clientX - drag.startMouseX) > 2 || Math.abs(e.clientY - drag.startMouseY) > 2) {
      drag.hasMoved = true;
    }

    setPoints(prev => prev.map((p, i) => i === idx ? { ...p, x: newFx, y: newFy } : p));
  }, [snapEnabled]);

  const handleVertexPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  // ── Corner cycling on click (no drag) ─────────────────────────────────────
  const handleVertexClick = useCallback((_e: React.MouseEvent, idx: number) => {
    const drag = dragRef.current;
    if (drag?.hasMoved) return; // was a drag, not a click
    setSelectedIdx(idx);
  }, []);

  // ── Insert vertex at edge midpoint ─────────────────────────────────────────
  const insertVertex = useCallback((afterIdx: number, fx: number, fy: number) => {
    setPoints(prev => {
      const next = [...prev];
      next.splice(afterIdx + 1, 0, { x: fx, y: fy, corner: 'sharp' });
      return next;
    });
    setSelectedIdx(afterIdx + 1);
  }, []);

  // ── Delete selected vertex ─────────────────────────────────────────────────
  const deleteVertex = useCallback((idx: number) => {
    if (points.length <= 3) return; // minimum 3 vertices
    setPoints(prev => prev.filter((_, i) => i !== idx));
    setSelectedIdx(null);
  }, [points.length]);

  // ── Update selected vertex fields ─────────────────────────────────────────
  const updateSelected = useCallback((patch: Partial<VertexPoint>) => {
    if (selectedIdx === null) return;
    setPoints(prev => prev.map((p, i) => i === selectedIdx ? { ...p, ...patch } : p));
  }, [selectedIdx]);

  // ── Load preset ────────────────────────────────────────────────────────────
  const loadPreset = useCallback((key: string) => {
    const preset = SHAPE_PRESETS[key];
    if (preset) {
      setPoints(preset.map(p => ({ ...p })));
      setSelectedIdx(null);
    }
  }, []);

  // ── Keyboard handler (Delete to remove selected vertex) ───────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIdx !== null) {
        deleteVertex(selectedIdx);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, selectedIdx, deleteVertex]);

  const selectedPt = selectedIdx !== null ? points[selectedIdx] : null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { background: '#1a1a2e', color: '#fff' } }}>
      <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MuiIcons.PolylineOutlined />
          <span>Edit Shape</span>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2, pb: 1 }}>
        {/* ── Toolbar ─────────────────────────────────────────────────── */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 170 }}>
            <InputLabel sx={{ color: 'rgba(255,255,255,0.6)' }}>Load Preset</InputLabel>
            <Select
              label="Load Preset"
              value=""
              onChange={(e) => loadPreset(e.target.value as string)}
              sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' } }}
            >
              {Object.entries(PRESET_LABELS).map(([key, label]) => (
                <MenuItem key={key} value={key}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <ToggleButtonGroup size="small" value={snapEnabled ? 'snap' : ''}>
            <ToggleButton
              value="snap"
              onClick={() => setSnapEnabled(v => !v)}
              sx={{ color: snapEnabled ? '#00d4ff' : 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.2) !important' }}
            >
              <MuiIcons.GridOnOutlined fontSize="small" sx={{ mr: 0.5 }} />
              Snap
            </ToggleButton>
          </ToggleButtonGroup>

          <ToggleButtonGroup size="small" value={showGrid ? 'grid' : ''}>
            <ToggleButton
              value="grid"
              onClick={() => setShowGrid(v => !v)}
              sx={{ color: showGrid ? '#00d4ff' : 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.2) !important' }}
            >
              <MuiIcons.GridViewOutlined fontSize="small" sx={{ mr: 0.5 }} />
              Grid
            </ToggleButton>
          </ToggleButtonGroup>

          <Typography variant="caption" color="rgba(255,255,255,0.4)" sx={{ ml: 'auto' }}>
            Click edge midpoints (+) to add vertices • Click vertex to select • Delete key to remove
          </Typography>
        </Box>

        {/* ── Main editor area ────────────────────────────────────────── */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          {/* SVG Canvas */}
          <Box sx={{
            flex: '0 0 auto',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 1,
            background: '#0d0d1a',
            overflow: 'hidden',
            cursor: 'default',
          }}>
            <svg
              ref={svgRef}
              width={CANVAS_W}
              height={CANVAS_H}
              viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
              style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
            >
              {/* Grid */}
              {gridDots}

              {/* Shape fill */}
              <path
                d={pathD}
                fill={fillColor}
                fillOpacity={fillOpacity * 0.6}
                stroke={strokeColor}
                strokeWidth={Math.max(strokeWidth, 1)}
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Edge midpoint handles (+) */}
              {mids.map((mid) => (
                <g
                  key={`mid-${mid.afterIdx}`}
                  style={{ cursor: 'copy' }}
                  onClick={() => insertVertex(mid.afterIdx, mid.fx, mid.fy)}
                >
                  <circle
                    cx={toPx(mid.fx, CANVAS_W)}
                    cy={toPx(mid.fy, CANVAS_H)}
                    r={7}
                    fill="rgba(0,0,0,0.5)"
                    stroke="rgba(255,255,255,0.4)"
                    strokeWidth={1}
                  />
                  <text
                    x={toPx(mid.fx, CANVAS_W)}
                    y={toPx(mid.fy, CANVAS_H) + 4}
                    textAnchor="middle"
                    fontSize={12}
                    fill="rgba(255,255,255,0.6)"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >+</text>
                </g>
              ))}

              {/* Vertex handles */}
              {points.map((pt, idx) => {
                const cx = toPx(pt.x, CANVAS_W);
                const cy = toPx(pt.y, CANVAS_H);
                const isSelected = idx === selectedIdx;
                const cornerColors: Record<string, string> = {
                  sharp:   '#ffffff',
                  rounded: '#4fc3f7',
                  chamfer: '#ffb74d',
                };
                return (
                  <g key={idx}>
                    {/* Larger hit area */}
                    <circle cx={cx} cy={cy} r={14} fill="transparent"
                      style={{ cursor: 'grab' }}
                      onPointerDown={(e) => handleVertexPointerDown(e, idx)}
                      onPointerMove={(e) => handleVertexPointerMove(e, idx)}
                      onPointerUp={handleVertexPointerUp}
                      onClick={(e) => handleVertexClick(e, idx)}
                      onContextMenu={(e) => { e.preventDefault(); deleteVertex(idx); }}
                    />
                    {/* Visual circle */}
                    <circle
                      cx={cx} cy={cy}
                      r={isSelected ? 9 : 6}
                      fill={isSelected ? '#00d4ff' : cornerColors[pt.corner]}
                      stroke={isSelected ? '#fff' : 'rgba(0,0,0,0.6)'}
                      strokeWidth={isSelected ? 2 : 1.5}
                      style={{ pointerEvents: 'none' }}
                    />
                    {/* Index label */}
                    <text
                      x={cx}
                      y={cy - 13}
                      textAnchor="middle"
                      fontSize={9}
                      fill="rgba(255,255,255,0.5)"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >{idx}</text>
                  </g>
                );
              })}
            </svg>
          </Box>

          {/* ── Right panel: selected vertex controls ─────────────────── */}
          <Box sx={{ flex: '1 1 160px', minWidth: 140 }}>
            <Typography variant="caption" color="rgba(255,255,255,0.5)" sx={{ display: 'block', mb: 1.5 }}>
              SELECTED VERTEX
            </Typography>

            {selectedPt === null ? (
              <Typography variant="body2" color="rgba(255,255,255,0.3)">
                Click a vertex to edit
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {/* X / Y */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    label="X %"
                    size="small"
                    type="number"
                    value={Math.round(selectedPt.x * 1000) / 10}
                    onChange={(e) => updateSelected({ x: clamp(parseFloat(e.target.value) / 100) })}
                    inputProps={{ min: 0, max: 100, step: 1 }}
                    sx={{ width: '80px', '& input': { color: '#fff' }, '& label': { color: 'rgba(255,255,255,0.5)' } }}
                  />
                  <TextField
                    label="Y %"
                    size="small"
                    type="number"
                    value={Math.round(selectedPt.y * 1000) / 10}
                    onChange={(e) => updateSelected({ y: clamp(parseFloat(e.target.value) / 100) })}
                    inputProps={{ min: 0, max: 100, step: 1 }}
                    sx={{ width: '80px', '& input': { color: '#fff' }, '& label': { color: 'rgba(255,255,255,0.5)' } }}
                  />
                </Box>

                {/* Corner mode */}
                <Box>
                  <Typography variant="caption" color="rgba(255,255,255,0.5)" sx={{ display: 'block', mb: 0.5 }}>
                    Corner Mode
                  </Typography>
                  <ToggleButtonGroup
                    exclusive
                    size="small"
                    value={selectedPt.corner}
                    onChange={(_, val) => val && updateSelected({ corner: val })}
                    sx={{ flexWrap: 'wrap' }}
                  >
                    <Tooltip title="Sharp (hard point)">
                      <ToggleButton value="sharp" sx={{ color: '#fff', border: '1px solid rgba(255,255,255,0.2) !important', px: 1 }}>
                        <MuiIcons.ChangeHistoryOutlined fontSize="small" />
                      </ToggleButton>
                    </Tooltip>
                    <Tooltip title="Rounded (bezier arc)">
                      <ToggleButton value="rounded" sx={{ color: '#4fc3f7', border: '1px solid rgba(255,255,255,0.2) !important', px: 1 }}>
                        <MuiIcons.RoundedCornerOutlined fontSize="small" />
                      </ToggleButton>
                    </Tooltip>
                    <Tooltip title="Chamfer (angled cut)">
                      <ToggleButton value="chamfer" sx={{ color: '#ffb74d', border: '1px solid rgba(255,255,255,0.2) !important', px: 1 }}>
                        <MuiIcons.CallMadeOutlined fontSize="small" />
                      </ToggleButton>
                    </Tooltip>
                  </ToggleButtonGroup>
                </Box>

                {/* Radius (only for rounded/chamfer) */}
                {selectedPt.corner !== 'sharp' && (
                  <TextField
                    label="Radius (px)"
                    size="small"
                    type="number"
                    value={selectedPt.radius ?? 20}
                    onChange={(e) => updateSelected({ radius: Math.max(1, parseInt(e.target.value) || 1) })}
                    inputProps={{ min: 1, max: 200, step: 1 }}
                    sx={{ '& input': { color: '#fff' }, '& label': { color: 'rgba(255,255,255,0.5)' } }}
                    helperText={selectedPt.corner === 'rounded' ? 'Arc size' : 'Cut depth'}
                    FormHelperTextProps={{ sx: { color: 'rgba(255,255,255,0.4)' } }}
                  />
                )}

                {/* Delete */}
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<MuiIcons.DeleteOutlineOutlined />}
                  onClick={() => selectedIdx !== null && deleteVertex(selectedIdx)}
                  disabled={points.length <= 3}
                  sx={{ mt: 0.5 }}
                >
                  Delete vertex
                </Button>
              </Box>
            )}

            {/* ── Legend ─────────────────────────────────────────────── */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="caption" color="rgba(255,255,255,0.5)" sx={{ display: 'block', mb: 1 }}>
                VERTEX LEGEND
              </Typography>
              {[
                { color: '#ffffff', label: 'Sharp' },
                { color: '#4fc3f7', label: 'Rounded' },
                { color: '#ffb74d', label: 'Chamfer' },
              ].map(({ color, label }) => (
                <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                  <Typography variant="caption" color="rgba(255,255,255,0.6)">{label}</Typography>
                </Box>
              ))}
              <Typography variant="caption" color="rgba(255,255,255,0.3)" sx={{ display: 'block', mt: 1.5, lineHeight: 1.4 }}>
                Total vertices: {points.length}
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', px: 3, py: 1.5, gap: 1 }}>
        <Button onClick={onClose} sx={{ color: 'rgba(255,255,255,0.6)' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => onApply(points)}
          startIcon={<MuiIcons.CheckOutlined />}
          sx={{ background: '#00d4ff', color: '#000', '&:hover': { background: '#00b8d9' } }}
        >
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShapeEditorDialog;
