/**
 * Inspector Component
 * Tabbed inspector panel: View | Widget | Views | Widgets | AI
 */

import * as MuiIcons from '@mui/icons-material';
import { AutoAwesome as AutoAwesomeIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Autocomplete,
    Box,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    IconButton,
    InputLabel,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    MenuItem,
    Select,
    Tab,
    Tabs,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography
} from '@mui/material';
import React, { useContext, useRef, useState } from 'react';
import { ContainerSelectionContext } from '../../shared/contexts/ContainerSelectionContext';
import { useWebSocket } from '../../shared/providers/WebSocketProvider';
import { WIDGET_REGISTRY } from '../../shared/registry/widgetRegistry';
import type { ViewConfig, WidgetConfig } from '../../shared/types';
import type { FieldMetadata, WidgetMetadata } from '../../shared/types/metadata';
import type { VisibilityConfig } from '../../shared/types/visibility';
import { AITabPanel } from './AITabPanel';
import { ColorPicker } from './ColorPicker';
import { ConditionBuilder } from './ConditionBuilder';
import { EntityBrowser } from './EntityBrowser';
import { FilePicker } from './FilePicker';
import { IconPicker } from './IconPicker';
import { FontPicker } from './Inspector/FontPicker';
import { PixabayPickerDialog } from './PixabayPickerDialog';
import { ShapeEditorDialog } from './ShapeEditorDialog';
import { SHAPE_PRESETS } from '../../shared/utils/buildSVGPath';
import type { VertexPoint } from '../../shared/utils/buildSVGPath';
import type { ContainerChild } from '../../shared/widgets/ScrollableContainerWidget';

// ─── ContainerGridEditor ─────────────────────────────────────────────────────
// Rendered inside the Inspector Widget tab when the selected widget is a
// scrollablecontainer.  Handles column / row layout + child widget management.

interface ContainerGridEditorProps {
  widget: WidgetConfig;
  onUpdate: (updates: Partial<WidgetConfig>) => void;
}

const ContainerGridEditor: React.FC<ContainerGridEditorProps> = ({ widget, onUpdate }) => {
  const { setSelectedChild } = useContext(ContainerSelectionContext);
  const cfg = widget.config as {
    scrollDirection: string;
    columns: number[];
    rows:    number[];
    gap:     number;
    padding: number;
    cellBackground: string;
    children: ContainerChild[];
  };

  const columns:  number[]         = cfg.columns  ?? [200, 200];
  const rows:     number[]         = cfg.rows     ?? [150, 150];
  const children: ContainerChild[] = cfg.children ?? [];

  const [expandedChild, setExpandedChild] = React.useState<string | null>(null);
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [newWidgetType, setNewWidgetType] = React.useState('text');
  const [newRow,     setNewRow]     = React.useState(0);
  const [newCol,     setNewCol]     = React.useState(0);
  const [newColspan, setNewColspan] = React.useState(1);
  const [newRowspan, setNewRowspan] = React.useState(1);

  const patchConfig = (patch: Partial<typeof cfg>) => {
    onUpdate({ config: { ...widget.config, ...patch } });
  };

  const updateColumn = (idx: number, val: number) => {
    const next = [...columns]; next[idx] = Math.max(10, val); patchConfig({ columns: next });
  };
  const addColumn = () => patchConfig({ columns: [...columns, 150] });
  const removeColumn = (idx: number) => {
    if (columns.length <= 1) return;
    const next = columns.filter((_, i) => i !== idx);
    const updatedChildren = children
      .filter(c => !(c.col === idx && (c.colspan || 1) === 1))
      .map(c => ({
        ...c,
        col: c.col > idx ? c.col - 1 : c.col,
        colspan: c.col === idx ? Math.max(1, (c.colspan || 1) - 1) : (c.colspan || 1),
      }));
    patchConfig({ columns: next, children: updatedChildren });
  };

  const updateRow = (idx: number, val: number) => {
    const next = [...rows]; next[idx] = Math.max(10, val); patchConfig({ rows: next });
  };
  const addRow = () => patchConfig({ rows: [...rows, 150] });
  const removeRow = (idx: number) => {
    if (rows.length <= 1) return;
    const next = rows.filter((_, i) => i !== idx);
    const updatedChildren = children
      .filter(c => !(c.row === idx && (c.rowspan || 1) === 1))
      .map(c => ({
        ...c,
        row: c.row > idx ? c.row - 1 : c.row,
        rowspan: c.row === idx ? Math.max(1, (c.rowspan || 1) - 1) : (c.rowspan || 1),
      }));
    patchConfig({ rows: next, children: updatedChildren });
  };

  const deleteChild = (id: string) => { patchConfig({ children: children.filter(c => c.id !== id) }); };
  const updateChild = (id: string, patch: Partial<ContainerChild>) => {
    patchConfig({ children: children.map(c => c.id === id ? { ...c, ...patch } : c) });
  };

  const addChild = () => {
    const id = `child-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const meta = WIDGET_REGISTRY[newWidgetType];
    const defaultConfig: Record<string, any> = {};
    meta?.fields.forEach(f => {
      if (!['x','y','width','height'].includes(f.name)) defaultConfig[f.name] = f.default;
    });
    const child: ContainerChild = {
      id, widgetType: newWidgetType,
      row: Math.max(0, Math.min(newRow, rows.length - 1)),
      col: Math.max(0, Math.min(newCol, columns.length - 1)),
      colspan: Math.max(1, newColspan), rowspan: Math.max(1, newRowspan),
      config: defaultConfig,
    };
    patchConfig({ children: [...children, child] });
    setShowAddForm(false);
    setSelectedChild({ containerId: widget.id, childId: id });
  };

  const accordionSx = {
    mb: 1, '&:before': { display: 'none' }, boxShadow: 'none',
    border: '1px solid', borderColor: 'primary.main', bgcolor: 'background.paper',
  };
  const summarySx = {
    minHeight: 36, '&.Mui-expanded': { minHeight: 36 },
    '& .MuiAccordionSummary-content': { margin: '6px 0' }, bgcolor: 'background.default',
  };

  const childWidgetTypes = Object.keys(WIDGET_REGISTRY).filter(
    t => !['scrollablecontainer', 'resolution', 'screensaver'].includes(t)
  ).sort();

  return (
    <Box sx={{ px: 1 }}>

      {/* Columns */}
      <Accordion defaultExpanded disableGutters sx={accordionSx}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={summarySx}>
          <Typography variant="caption" fontWeight={600} textTransform="uppercase" color="primary">
            Columns ({columns.length})
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 1.5 }}>
          {columns.map((w, idx) => (
            <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" sx={{ minWidth: 18, color: 'text.secondary' }}>{idx + 1}</Typography>
              <TextField type="number" size="small" label="Width (px)" value={w}
                onChange={e => updateColumn(idx, parseInt(e.target.value) || 10)}
                inputProps={{ min: 10, step: 10 }} sx={{ flex: 1 }} />
              <IconButton size="small" onClick={() => removeColumn(idx)} disabled={columns.length <= 1} title="Remove column">
                <MuiIcons.DeleteOutlined fontSize="small" />
              </IconButton>
            </Box>
          ))}
          <Button size="small" startIcon={<MuiIcons.AddOutlined />} onClick={addColumn}
            fullWidth variant="outlined" sx={{ mt: 0.5, borderStyle: 'dashed' }}>Add Column</Button>
        </AccordionDetails>
      </Accordion>

      {/* Rows */}
      <Accordion defaultExpanded disableGutters sx={accordionSx}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={summarySx}>
          <Typography variant="caption" fontWeight={600} textTransform="uppercase" color="primary">
            Rows ({rows.length})
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 1.5 }}>
          {rows.map((h, idx) => (
            <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" sx={{ minWidth: 18, color: 'text.secondary' }}>{idx + 1}</Typography>
              <TextField type="number" size="small" label="Height (px)" value={h}
                onChange={e => updateRow(idx, parseInt(e.target.value) || 10)}
                inputProps={{ min: 10, step: 10 }} sx={{ flex: 1 }} />
              <IconButton size="small" onClick={() => removeRow(idx)} disabled={rows.length <= 1} title="Remove row">
                <MuiIcons.DeleteOutlined fontSize="small" />
              </IconButton>
            </Box>
          ))}
          <Button size="small" startIcon={<MuiIcons.AddOutlined />} onClick={addRow}
            fullWidth variant="outlined" sx={{ mt: 0.5, borderStyle: 'dashed' }}>Add Row</Button>
        </AccordionDetails>
      </Accordion>

      {/* Widgets */}
      <Accordion defaultExpanded disableGutters sx={accordionSx}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={summarySx}>
          <Typography variant="caption" fontWeight={600} textTransform="uppercase" color="primary">
            Widgets ({children.length})
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 1 }}>
          {children.length === 0 && !showAddForm && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, textAlign: 'center' }}>
              No widgets yet — click Add Widget below
            </Typography>
          )}

          {children.map(child => {
            const childMeta = WIDGET_REGISTRY[child.widgetType];
            const isOpen = expandedChild === child.id;
            return (
              <Accordion key={child.id} expanded={isOpen}
                onChange={(_, exp) => setExpandedChild(exp ? child.id : null)}
                disableGutters sx={{
                  mb: 0.5, '&:before': { display: 'none' }, boxShadow: 'none',
                  border: '1px solid rgba(100,150,255,0.3)', bgcolor: 'rgba(100,150,255,0.04)',
                }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}
                  sx={{ minHeight: 32, '&.Mui-expanded': { minHeight: 32 }, '& .MuiAccordionSummary-content': { margin: '4px 0' } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, mr: 1 }}>
                    <Typography variant="caption" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                      {childMeta?.name ?? child.widgetType}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      [{child.row},{child.col}]
                      {((child.colspan ?? 1) > 1 || (child.rowspan ?? 1) > 1) ? ` ${child.colspan ?? 1}×${child.rowspan ?? 1}` : ''}
                    </Typography>
                    <Tooltip title="Edit widget settings">
                      <IconButton size="small"
                        onClick={e => { e.stopPropagation(); setSelectedChild({ containerId: widget.id, childId: child.id }); }}
                        sx={{ ml: 'auto', color: 'primary.main', p: 0.3 }}>
                        <MuiIcons.SettingsOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <IconButton size="small"
                      onClick={e => { e.stopPropagation(); deleteChild(child.id); }}
                      sx={{ color: 'error.main', p: 0.3 }} title="Remove widget from container">
                      <MuiIcons.DeleteOutlined fontSize="small" />
                    </IconButton>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                    Grid placement — click <MuiIcons.SettingsOutlined sx={{ fontSize: 13 }} /> to edit settings
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                    <TextField type="number" size="small" label="Row" value={child.row}
                      onChange={e => updateChild(child.id, { row: Math.max(0, parseInt(e.target.value) || 0) })}
                      inputProps={{ min: 0, max: rows.length - 1 }} />
                    <TextField type="number" size="small" label="Column" value={child.col}
                      onChange={e => updateChild(child.id, { col: Math.max(0, parseInt(e.target.value) || 0) })}
                      inputProps={{ min: 0, max: columns.length - 1 }} />
                    <TextField type="number" size="small" label="Col Span" value={child.colspan ?? 1}
                      onChange={e => updateChild(child.id, { colspan: Math.max(1, parseInt(e.target.value) || 1) })}
                      inputProps={{ min: 1, max: columns.length }} />
                    <TextField type="number" size="small" label="Row Span" value={child.rowspan ?? 1}
                      onChange={e => updateChild(child.id, { rowspan: Math.max(1, parseInt(e.target.value) || 1) })}
                      inputProps={{ min: 1, max: rows.length }} />
                  </Box>
                </AccordionDetails>
              </Accordion>
            );
          })}

          {showAddForm ? (
            <Box sx={{ mt: 1, p: 1.5, border: '1px solid rgba(100,255,150,0.3)', borderRadius: 1, bgcolor: 'rgba(100,255,150,0.03)' }}>
              <Typography variant="caption" fontWeight={600} color="success.main" sx={{ display: 'block', mb: 1 }}>
                Add Widget to Container
              </Typography>
              <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                <InputLabel>Widget Type</InputLabel>
                <Select value={newWidgetType} label="Widget Type" onChange={e => setNewWidgetType(e.target.value)}>
                  {childWidgetTypes.map(t => (
                    <MenuItem key={t} value={t}>{WIDGET_REGISTRY[t]?.name ?? t}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1 }}>
                <TextField type="number" size="small" label="Row" value={newRow}
                  onChange={e => setNewRow(Math.max(0, parseInt(e.target.value)||0))} inputProps={{ min:0, max: rows.length-1 }} />
                <TextField type="number" size="small" label="Column" value={newCol}
                  onChange={e => setNewCol(Math.max(0, parseInt(e.target.value)||0))} inputProps={{ min:0, max: columns.length-1 }} />
                <TextField type="number" size="small" label="Col Span" value={newColspan}
                  onChange={e => setNewColspan(Math.max(1, parseInt(e.target.value)||1))} inputProps={{ min:1, max: columns.length }} />
                <TextField type="number" size="small" label="Row Span" value={newRowspan}
                  onChange={e => setNewRowspan(Math.max(1, parseInt(e.target.value)||1))} inputProps={{ min:1, max: rows.length }} />
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" variant="contained" color="success" onClick={addChild} fullWidth>Add</Button>
                <Button size="small" variant="outlined" onClick={() => setShowAddForm(false)} fullWidth>Cancel</Button>
              </Box>
            </Box>
          ) : (
            <Button size="small" startIcon={<MuiIcons.AddOutlined />}
              onClick={() => setShowAddForm(true)} fullWidth variant="outlined" color="success"
              sx={{ mt: 1, borderStyle: 'dashed' }}>
              Add Widget
            </Button>
          )}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};
// ─── End ContainerGridEditor ──────────────────────────────────────────────────

interface InspectorProps {
  widget: WidgetConfig | null;
  metadata: WidgetMetadata | null;
  onUpdate: (updates: Partial<WidgetConfig>) => void;
  currentView: ViewConfig | null;
  allViews: ViewConfig[];
  allWidgets: WidgetConfig[];
  allWidgetsForPicker?: WidgetConfig[]; // Cross-view list used by widget-picker fields
  onViewSwitch: (viewId: string) => void;
  onWidgetSelect: (widgetId: string) => void;
  onUpdateView: (viewId: string, updates: Partial<ViewConfig>) => void;
  onToggleWidgetHidden?: (widgetId: string) => void; // Toggle hiddenInEdit for any widget
  onClearSelection?: () => void; // Clear selected widgets
  selectedCount?: number;
  onUpdateStyle?: (styleUpdates: Record<string, any>) => void; // Update style across all selected widgets
  selectedWidgetIds?: string[]; // Currently selected widget IDs on canvas
}

export const Inspector: React.FC<InspectorProps> = ({ 
  widget, 
  metadata, 
  onUpdate,
  currentView,
  allViews,
  allWidgets,
  allWidgetsForPicker,
  onViewSwitch,
  onUpdateView,
  onToggleWidgetHidden,
  onClearSelection,
  selectedCount = 0,
  onWidgetSelect,
  selectedWidgetIds = [],
  onUpdateStyle,
}) => {
  const { entities } = useWebSocket();
  const { selectedChild, setSelectedChild } = useContext(ContainerSelectionContext);

  // ── Child widget mode: when a child inside a ScrollableContainer is selected ──
  const activeChild: ContainerChild | null = (
    selectedChild && widget?.type === 'scrollablecontainer' && selectedChild.containerId === widget.id
  ) ? ((widget.config as any).children as ContainerChild[] ?? []).find((c: ContainerChild) => c.id === selectedChild.childId) ?? null
    : null;
  const activeChildMeta = activeChild ? (WIDGET_REGISTRY[activeChild.widgetType] ?? null) : null;
  // When editing a child widget use its metadata; otherwise use the passed-in metadata
  const effectiveMeta = activeChildMeta ?? metadata;

  // Helpers for child mode ---
  const removeActiveChild = () => {
    if (!activeChild || !widget) return;
    const _ch: ContainerChild[] = (widget.config as any).children ?? [];
    onUpdate({ config: { ...widget.config, children: _ch.filter(c => c.id !== activeChild.id) } });
    setSelectedChild(null);
  };
  const updateChildPlacement = (patch: Partial<ContainerChild>) => {
    if (!activeChild || !widget) return;
    const _ch: ContainerChild[] = (widget.config as any).children ?? [];
    onUpdate({ config: { ...widget.config, children: _ch.map(c => c.id === activeChild.id ? { ...c, ...patch } : c) } });
  };

  const [tabValue, setTabValue] = useState(1); // Default to Widget tab
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    Position: true,        // Always expanded - most commonly adjusted
    Layout: false,
    Style: true,          // Expanded by default - colors, appearance
    Behavior: true,       // Expanded by default - main functionality
    'Background': false,
    'Border': false,
    'Shadow': false,
    'Visibility': false,
  });
  
  // Code editor modal state
  const [codeEditorOpen, setCodeEditorOpen] = useState(false);
  const [codeEditorField, setCodeEditorField] = useState<string>('');
  const [codeEditorValue, setCodeEditorValue] = useState<string>('');
  const [codeEditorLabel, setCodeEditorLabel] = useState<string>('');

  // Shape editor state
  const [shapeEditorOpen, setShapeEditorOpen] = useState(false);

  // Pixabay picker state
  const [pixabayOpen, setPixabayOpen] = useState(false);
  const pixabayCallback = useRef<((path: string) => void) | null>(null);
  const openPixabay = (onSelect: (path: string) => void) => {
    pixabayCallback.current = onSelect;
    setPixabayOpen(true);
  };

  const handleAccordionChange = (group: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedGroups(prev => ({ ...prev, [group]: isExpanded }));
  };

  const getGroupedFields = () => {
    if (!effectiveMeta) return {};
    
    const groups: Record<string, FieldMetadata[]> = {
      Position: [],
      Layout: [],
      Style: [],
      Behavior: [],
    };

    effectiveMeta.fields.forEach(field => {
      if (['x', 'y', 'width', 'height'].includes(field.name)) {
        // Skip position fields in child mode — grid controls layout
        if (!activeChild) groups.Position.push(field);
      } else if (field.category === 'layout') {
        groups.Layout.push(field);
      } else if (field.category === 'style') {
        groups.Style.push(field);
      } else if (field.category === 'behavior') {
        groups.Behavior.push(field);
      }
    });

    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) delete groups[key];
    });

    return groups;
  };

  const getValue = (fieldName: string, defaultValue: any) => {
    if (activeChild) {
      return (activeChild.config as any)[fieldName] ?? defaultValue;
    }
    if (!widget) return defaultValue;
    
    if (fieldName === 'x') return widget.position.x;
    if (fieldName === 'y') return widget.position.y;
    if (fieldName === 'width') return widget.position.width;
    if (fieldName === 'height') return widget.position.height;
    
    return widget.config[fieldName] ?? defaultValue;
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    if (activeChild) {
      // In child mode: update the child's config inside the container
      const _ch: ContainerChild[] = (widget!.config as any).children ?? [];
      onUpdate({
        config: {
          ...widget!.config,
          children: _ch.map(c =>
            c.id === activeChild.id ? { ...c, config: { ...(c.config as any), [fieldName]: value } } : c
          ),
        },
      });
      return;
    }
    if (!widget) return;
    
    if (['x', 'y', 'width', 'height'].includes(fieldName)) {
      onUpdate({
        position: {
          ...widget.position,
          [fieldName]: value,
        },
      });
    } else {
      onUpdate({
        config: {
          ...widget.config,
          [fieldName]: value,
        },
      });
    }
  };

  // Conditional field visibility logic
  const shouldShowField = (field: FieldMetadata): boolean => {
    if (!widget) return true;

    // Generic visibleWhen support from metadata
    if (field.visibleWhen) {
      const conditionValue = getValue(field.visibleWhen.field, null);
      if (conditionValue !== field.visibleWhen.value) {
        return false;
      }
    }

    // Gauge widget - hide arc options if needle-only mode
    if (effectiveMeta?.name === 'Gauge') {
      const needleOnly = getValue('needleOnly', false);
      if (needleOnly && ['showArc', 'arcWidth', 'zone1Color', 'zone1Limit', 'zone2Color', 'zone2Limit', 'zone3Color', 'showTicks'].includes(field.name)) {
        return false;
      }
    }

    // Button widget - show value field only for auto/toggle/turn_on/turn_off
    if (effectiveMeta?.name === 'Button') {
      const actionType = getValue('actionType', 'auto');
      
      // Show value field only for auto/toggle/turn_on/turn_off
      if (field.name === 'value') {
        return ['auto', 'toggle', 'turn_on', 'turn_off'].includes(actionType);
      }
      
      // Show confirmation message only if confirmAction is enabled
      if (field.name === 'confirmMessage') {
        return getValue('confirmAction', false);
      }
    }

    // Progress Circle - hide segment options if not segmented
    if (effectiveMeta?.name === 'Progress Circle') {
      const segmented = getValue('segmented', false);
      if (!segmented && ['segmentCount', 'segmentGap'].includes(field.name)) {
        return false;
      }
    }

    return true;
  };

  const renderField = (field: FieldMetadata) => {
    // Check conditional visibility
    if (!shouldShowField(field)) {
      return null;
    }

    const value = getValue(field.name, field.default);

    // Code editor modal handlers
    const handleOpenCodeEditor = () => {
      setCodeEditorField(field.name);
      setCodeEditorValue(value || '');
      setCodeEditorLabel(field.label);
      setCodeEditorOpen(true);
    };

    switch (field.type) {
      case 'code-editor':
        return (
          <Box key={field.name} sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label={field.label}
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              helperText={field.description}
              multiline
              rows={3}
              size="small"
              InputProps={{
                endAdornment: (
                  <IconButton
                    size="small"
                    onClick={handleOpenCodeEditor}
                    sx={{ position: 'absolute', right: 8, top: 8 }}
                    title="Open in larger editor"
                  >
                    <MuiIcons.OpenInFullOutlined fontSize="small" />
                  </IconButton>
                ),
              }}
              sx={{ '& .MuiInputBase-root': { pr: 5 } }}
            />
          </Box>
        );

      case 'text':
      case 'textarea':
        // Image widget URL field — show a Pixabay browse button
        if (field.name === 'imageUrl' && (widget?.type === 'image' || activeChild?.widgetType === 'image')) {
          return (
            <Box key={field.name} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <TextField
                  fullWidth
                  label={field.label}
                  value={value}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  helperText={field.description}
                  size="small"
                />
                <Tooltip title="Search Pixabay for free images">
                  <IconButton
                    size="small"
                    onClick={() => openPixabay((path) => handleFieldChange(field.name, path))}
                    sx={{ mt: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, px: 1 }}
                  >
                    <MuiIcons.ImageSearchOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          );
        }
        return (
          <TextField
            key={field.name}
            fullWidth
            label={field.label}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            helperText={field.description}
            multiline={field.type === 'textarea'}
            rows={field.type === 'textarea' ? 3 : 1}
            size="small"
            sx={{ mb: 2 }}
          />
        );

      case 'number':
      case 'slider':
        return (
          <TextField
            key={field.name}
            fullWidth
            type="number"
            label={field.label}
            value={value}
            onChange={(e) => handleFieldChange(field.name, parseFloat(e.target.value))}
            helperText={field.description}
            inputProps={{
              min: field.min,
              max: field.max,
              step: field.step || 1,
            }}
            size="small"
            sx={{ mb: 2 }}
          />
        );

      case 'color':
        return (
          <Box key={field.name} sx={{ mb: 2 }}>
            <ColorPicker
              label={field.label}
              value={value}
              onChange={(color) => handleFieldChange(field.name, color)}
            />
          </Box>
        );

      case 'select':
        return (
          <FormControl key={field.name} fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>{field.label}</InputLabel>
            <Select
              value={value}
              label={field.label}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
            >
              {field.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'checkbox':
        return (
          <FormControlLabel
            key={field.name}
            control={
              <Checkbox
                checked={value}
                onChange={(e) => handleFieldChange(field.name, e.target.checked)}
              />
            }
            label={field.label}
            sx={{ mb: 1, display: 'block' }}
          />
        );

      case 'widget': {
        const widgetOptions = allWidgetsForPicker ?? allWidgets;
        const selectedWidget = widgetOptions.find(w => w.id === value) || null;
        const getWidgetLabel = (w: WidgetConfig) => {
          const viewName = allViews.find(v => v.widgets?.some(ww => ww.id === w.id))?.name || '';
          return w.name ? `${w.name}${viewName ? ` [${viewName}]` : ''}` : w.id;
        };
        return (
          <Box key={field.name} sx={{ mb: 2 }}>
            <Autocomplete
              size="small"
              options={widgetOptions}
              getOptionLabel={getWidgetLabel}
              value={selectedWidget}
              onChange={(_, newVal) => handleFieldChange(field.name, newVal?.id || '')}
              renderInput={(params) => (
                <TextField {...params} label={field.label} helperText={field.description} />
              )}
            />
          </Box>
        );
      }

      case 'entity':
        return (
          <Box key={field.name} sx={{ mb: 2 }}>
            <EntityBrowser
              label={field.label}
              value={value}
              onChange={(entityId) => handleFieldChange(field.name, entityId)}
            />
          </Box>
        );

      case 'icon':
        return (
          <IconPicker
            key={field.name}
            label={field.label}
            value={value}
            onChange={(icon) => handleFieldChange(field.name, icon)}
          />
        );

      case 'font':
        return (
          <FontPicker
            key={field.name}
            label={field.label}
            value={value}
            onChange={(font) => handleFieldChange(field.name, font)}
          />
        );

      case 'file':
        return (
          <FilePicker
            key={field.name}
            label={field.label}
            value={value}
            onChange={(filePath) => handleFieldChange(field.name, filePath)}
            description={field.description}
          />
        );

      default:
        return (
          <TextField
            key={field.name}
            fullWidth
            label={field.label}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            size="small"
            sx={{ mb: 2 }}
          />
        );
    }
  };

  const groupedFields = getGroupedFields();

  // Helpers for unified single/multi style editing
  const styleWidget = selectedCount > 1
    ? allWidgets.find(w => selectedWidgetIds.includes(w.id)) || null
    : widget;

  const applyStyleUpdate = (styleUpdates: Record<string, any>) => {
    if (selectedCount > 1 && onUpdateStyle) {
      onUpdateStyle(styleUpdates);
    } else if (widget) {
      handleFieldChange('style', { ...widget.config.style, ...styleUpdates });
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Tabs 
        value={tabValue} 
        onChange={(_, v) => setTabValue(v)}
        variant="fullWidth"
        sx={{
          minHeight: 40,
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTab-root': {
            minHeight: 40,
            minWidth: 0,
            fontSize: '0.7rem',
            padding: '6px 4px',
            flex: 1,
          },
        }}
      >
        <Tab label="View" sx={{ minWidth: 0 }} />
        <Tab label="Widget" sx={{ minWidth: 0 }} />
        <Tab label="Views" sx={{ minWidth: 0 }} />
        <Tab label="Widgets" sx={{ minWidth: 0 }} />
        <Tab icon={<AutoAwesomeIcon fontSize="small" />} iconPosition="start" label="AI" sx={{ minWidth: 0 }} />
      </Tabs>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {/* View Tab */}
        {tabValue === 0 && (
          <Box>
            {!currentView ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No view selected
                </Typography>
              </Box>
            ) : (
              <>
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    View Properties
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {currentView.id}
                  </Typography>
                </Box>
                <Box sx={{ p: 2 }}>
                  {/* View Name */}
                  <TextField
                    fullWidth
                    label="View Name"
                    value={currentView.name}
                    size="small"
                    onChange={(e) => {
                      onUpdateView(currentView.id, { name: e.target.value });
                    }}
                    sx={{ mb: 2 }}
                    helperText="Display name for this view"
                  />

                  {/* Background Color */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                      Background Color
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <input
                        type="color"
                        value={currentView.style.backgroundColor || '#1c1c1c'}
                        onChange={(e) => {
                          onUpdateView(currentView.id, {
                            style: { ...currentView.style, backgroundColor: e.target.value }
                          });
                        }}
                        style={{
                          width: '60px',
                          height: '32px',
                          border: '1px solid rgba(255,255,255,0.23)',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      />
                      <TextField
                        size="small"
                        value={currentView.style.backgroundColor || '#1c1c1c'}
                        onChange={(e) => {
                          onUpdateView(currentView.id, {
                            style: { ...currentView.style, backgroundColor: e.target.value }
                          });
                        }}
                        sx={{ flex: 1 }}
                      />
                    </Box>
                  </Box>

                  {/* Background Opacity */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                      Background Opacity: {((currentView.style.backgroundOpacity ?? 1) * 100).toFixed(0)}%
                    </Typography>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={(currentView.style.backgroundOpacity ?? 1) * 100}
                      onChange={(e) => {
                        onUpdateView(currentView.id, {
                          style: { ...currentView.style, backgroundOpacity: Number(e.target.value) / 100 }
                        });
                      }}
                      style={{ width: '100%' }}
                    />
                  </Box>

                  {/* Background Image */}
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <FilePicker
                        label="Background Image"
                        value={currentView.style.backgroundImage || ''}
                        onChange={(filePath) => {
                          onUpdateView(currentView.id, {
                            style: { ...currentView.style, backgroundImage: filePath }
                          });
                        }}
                        description="Browse images from server or enter URL"
                      />
                    </Box>
                    <Tooltip title="Search Pixabay for free images">
                      <IconButton
                        size="small"
                        onClick={() => openPixabay((path) => onUpdateView(currentView.id, { style: { ...currentView.style, backgroundImage: path } }))}
                        sx={{ mt: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, px: 1, flexShrink: 0 }}
                      >
                        <MuiIcons.ImageSearchOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  {/* View Resolution */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                      View Resolution
                    </Typography>
                    <TextField
                      fullWidth
                      select
                      size="small"
                      value={currentView.resolution || 'none'}
                      onChange={(e) => {
                        const resolution = e.target.value;
                        if (resolution === 'none') {
                          onUpdateView(currentView.id, { 
                            resolution: 'none',
                            sizex: undefined,
                            sizey: undefined,
                          });
                        } else if (resolution === 'user') {
                          onUpdateView(currentView.id, { 
                            resolution: 'user',
                            sizex: currentView.sizex || 1920,
                            sizey: currentView.sizey || 1080,
                          });
                        } else {
                          const [width, height] = resolution.split('x').map(Number);
                          onUpdateView(currentView.id, { 
                            resolution,
                            sizex: width,
                            sizey: height,
                          });
                        }
                      }}
                      SelectProps={{ native: true }}
                    >
                      <option value="none">None (Flexible)</option>
                      <option value="1920x1080">1920x1080 (Full HD)</option>
                      <option value="1280x720">1280x720 (HD)</option>
                      <option value="1024x768">1024x768 (iPad)</option>
                      <option value="800x600">800x600 (Tablet)</option>
                      <option value="user">Custom</option>
                    </TextField>
                  </Box>

                  {/* Custom Dimensions (only if resolution is 'user') */}
                  {currentView.resolution === 'user' && (
                    <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
                      <TextField
                        label="Width (px)"
                        type="number"
                        size="small"
                        value={currentView.sizex || 1920}
                        onChange={(e) => {
                          onUpdateView(currentView.id, { sizex: Number(e.target.value) });
                        }}
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        label="Height (px)"
                        type="number"
                        size="small"
                        value={currentView.sizey || 1080}
                        onChange={(e) => {
                          onUpdateView(currentView.id, { sizey: Number(e.target.value) });
                        }}
                        sx={{ flex: 1 }}
                      />
                    </Box>
                  )}

                  {/* Preview of current settings */}
                  {currentView.style.backgroundImage && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                        Background Preview
                      </Typography>
                      <Box
                        sx={{
                          width: '100%',
                          height: '120px',
                          borderRadius: 1,
                          border: '1px solid rgba(255,255,255,0.23)',
                          backgroundColor: currentView.style.backgroundColor,
                          backgroundImage: `url(${currentView.style.backgroundImage.startsWith('/config/www/') ? currentView.style.backgroundImage.replace('/config/www/', '/local/') : currentView.style.backgroundImage})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          opacity: currentView.style.backgroundOpacity ?? 1,
                        }}
                      />
                    </Box>
                  )}
                </Box>
              </>
            )}
          </Box>
        )}

        {/* Widget Tab */}
        {tabValue === 1 && (
          <Box>
            {selectedCount > 1 ? (
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  {selectedCount} widgets selected
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Style changes apply to all selected widgets
                </Typography>
              </Box>
            ) : !widget || !effectiveMeta ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Select a widget to edit
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Click a widget on the canvas
                </Typography>
              </Box>
            ) : (
              <>
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                  {activeChild ? (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                        <IconButton size="small" onClick={() => setSelectedChild(null)} title="Back to container">
                          <MuiIcons.ArrowBackOutlined fontSize="small" />
                        </IconButton>
                        <Typography variant="caption" color="text.secondary">
                          Scrollable Container
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {activeChildMeta?.name ?? activeChild.widgetType}
                        </Typography>
                        <Button size="small" color="error" variant="outlined"
                          onClick={removeActiveChild} startIcon={<MuiIcons.DeleteOutlined />}
                          sx={{ fontSize: 11 }}>
                          Remove
                        </Button>
                      </Box>
                    </>
                  ) : (
                    <>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {effectiveMeta.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {widget.id}
                      </Typography>
                    </>
                  )}
                </Box>

                {/* Shape widget — Edit Shape button */}
                {widget?.type === 'shape' && !activeChild && (
                  <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<MuiIcons.PolylineOutlined />}
                      onClick={() => setShapeEditorOpen(true)}
                      sx={{ borderColor: 'rgba(0,212,255,0.5)', color: '#00d4ff', '&:hover': { borderColor: '#00d4ff', background: 'rgba(0,212,255,0.05)' } }}
                    >
                      Edit Shape
                    </Button>
                    <ShapeEditorDialog
                      open={shapeEditorOpen}
                      onClose={() => setShapeEditorOpen(false)}
                      points={(widget.config?.points as VertexPoint[]) ?? SHAPE_PRESETS.rectangle}
                      fillColor={widget.config?.style?.backgroundColor as string}
                      fillOpacity={widget.config?.style?.backgroundOpacity as number}
                      strokeColor={widget.config?.style?.borderColor as string}
                      strokeWidth={typeof widget.config?.style?.borderWidth === 'number' ? widget.config.style.borderWidth : undefined}
                      onApply={(newPoints) => {
                        handleFieldChange('points', newPoints);
                        setShapeEditorOpen(false);
                      }}
                    />
                  </Box>
                )}

                {/* Widget Name Field (Foundation for Flow System) */}
                {!activeChild && <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'rgba(33, 150, 243, 0.05)' }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Widget Name (optional)"
                    placeholder="e.g., bedroom_slider"
                    value={widget.name || ''}
                    onChange={(e) => {
                      const newName = e.target.value;
                      // Validation will be added by parent component
                      onUpdate({ name: newName || undefined });
                    }}
                    helperText="Alphanumeric + underscores. Used for flow/binding references."
                    sx={{
                      '& .MuiInputBase-root': {
                        fontFamily: 'monospace',
                        fontSize: '0.875rem'
                      }
                    }}
                  />
                </Box>}

                <Box sx={{ p: 1 }}>
                  {/* Grid Position — only shown when editing a child widget */}
                  {activeChild && (
                    <Accordion defaultExpanded disableGutters sx={{ mb: 1, '&:before': { display: 'none' }, boxShadow: 'none', border: '1px solid', borderColor: 'primary.main', bgcolor: 'background.paper' }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 36, '&.Mui-expanded': { minHeight: 36 }, '& .MuiAccordionSummary-content': { margin: '6px 0' }, bgcolor: 'background.default' }}>
                        <Typography variant="caption" fontWeight={600} textTransform="uppercase" color="primary">Grid Position</Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ p: 1.5 }}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                          <TextField type="number" size="small" label="Row" value={activeChild.row}
                            onChange={e => updateChildPlacement({ row: Math.max(0, parseInt(e.target.value) || 0) })}
                            inputProps={{ min: 0 }} />
                          <TextField type="number" size="small" label="Column" value={activeChild.col}
                            onChange={e => updateChildPlacement({ col: Math.max(0, parseInt(e.target.value) || 0) })}
                            inputProps={{ min: 0 }} />
                          <TextField type="number" size="small" label="Col Span" value={activeChild.colspan ?? 1}
                            onChange={e => updateChildPlacement({ colspan: Math.max(1, parseInt(e.target.value) || 1) })}
                            inputProps={{ min: 1 }} />
                          <TextField type="number" size="small" label="Row Span" value={activeChild.rowspan ?? 1}
                            onChange={e => updateChildPlacement({ rowspan: Math.max(1, parseInt(e.target.value) || 1) })}
                            inputProps={{ min: 1 }} />
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  )}

                  {/* Widget-specific property groups */}
                  {Object.entries(groupedFields).map(([groupName, fields]) => {
                    // Filter visible fields for count
                    const visibleFields = fields.filter(shouldShowField);
                    if (visibleFields.length === 0) return null;

                    return (
                      <Accordion
                        key={groupName}
                        expanded={expandedGroups[groupName] || false}
                        onChange={handleAccordionChange(groupName)}
                        disableGutters
                        sx={{
                          mb: 1,
                          '&:before': { display: 'none' },
                          boxShadow: 'none',
                          border: '1px solid',
                          borderColor: 'primary.main',
                          bgcolor: 'background.paper',
                        }}
                      >
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon />}
                          sx={{
                            minHeight: 36,
                            '&.Mui-expanded': { minHeight: 36 },
                            '& .MuiAccordionSummary-content': { margin: '6px 0' },
                            bgcolor: 'background.default',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                            <Typography variant="caption" fontWeight={600} textTransform="uppercase" color="primary">
                              {groupName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                              {visibleFields.length} {visibleFields.length === 1 ? 'field' : 'fields'}
                            </Typography>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 2 }}>
                          {visibleFields.map(renderField)}
                          {/* Add z-index and rotation to Position section */}
                          {groupName === 'Position' && !activeChild && (
                          <>
                            <TextField
                              fullWidth
                              type="number"
                              label="Z-Index (Layer)"
                              value={widget.config.style?.zIndex ?? 0}
                              onChange={(e) => handleFieldChange('style', { ...widget.config.style, zIndex: parseInt(e.target.value) })}
                              helperText="Higher values appear on top"
                              size="small"
                              sx={{ mb: 2 }}
                            />
                            <TextField
                              fullWidth
                              type="number"
                              label="Rotation (degrees)"
                              value={widget.config.style?.rotation ?? 0}
                              onChange={(e) => handleFieldChange('style', { ...widget.config.style, rotation: parseInt(e.target.value) })}
                              helperText="Rotate widget clockwise"
                              inputProps={{ min: -180, max: 180, step: 1 }}
                              size="small"
                              sx={{ mb: 2 }}
                            />
                          </>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  );
                  })}

                  {/* Scrollable Container — grid editor (hidden when a child widget is selected) */}
                  {widget?.type === 'scrollablecontainer' && !activeChild && (
                    <ContainerGridEditor widget={widget} onUpdate={onUpdate} />
                  )}
                </Box>
              </>
            )}

            {/* Universal Style Groups - Background, Border, Shadow for single and multi-select */}
            {styleWidget && !activeChild && (
              <Box sx={{ p: 1 }}>
                <Accordion
                    expanded={expandedGroups['Background'] || false}
                    onChange={handleAccordionChange('Background')}
                    disableGutters
                    sx={{
                      mb: 1,
                      '&:before': { display: 'none' },
                      boxShadow: 'none',
                      border: '1px solid',
                      borderColor: 'primary.main',
                      bgcolor: 'background.paper',
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{
                        minHeight: 36,
                        '&.Mui-expanded': { minHeight: 36 },
                        '& .MuiAccordionSummary-content': { margin: '6px 0' },
                        bgcolor: 'background.default',
                      }}
                    >
                      <Typography variant="caption" fontWeight={600} textTransform="uppercase" color="primary">
                        Background
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 2 }}>
                      <ColorPicker
                        label="Background Color"
                        value={styleWidget?.config.style?.backgroundColor ?? '#ffffff'}
                        onChange={(color) => applyStyleUpdate({ backgroundColor: color })}
                      />
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <FilePicker
                            label="Background Image"
                            value={styleWidget?.config.style?.backgroundImage ?? ''}
                            onChange={(filePath) => applyStyleUpdate({ backgroundImage: filePath })}
                            description="Select image from server or enter URL"
                          />
                        </Box>
                        <Tooltip title="Search Pixabay for free images">
                          <IconButton
                            size="small"
                            onClick={() => openPixabay((path) => applyStyleUpdate({ backgroundImage: path }))}
                            sx={{ mt: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, px: 1, flexShrink: 0 }}
                          >
                            <MuiIcons.ImageSearchOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <TextField
                        fullWidth
                        type="number"
                        label="Opacity"
                        value={styleWidget?.config.style?.backgroundOpacity ?? ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                          applyStyleUpdate({ backgroundOpacity: val });
                        }}
                        inputProps={{ min: 0, max: 1, step: 0.1 }}
                        size="small"
                        sx={{ mb: 2 }}
                      />
                      {/* Image Fit — only relevant when a background image is set */}
                      {styleWidget?.config.style?.backgroundImage && (
                        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                          <InputLabel>Image Fit</InputLabel>
                          <Select
                            value={(() => {
                              const sz = styleWidget?.config.style?.backgroundSize;
                              const rp = styleWidget?.config.style?.backgroundRepeat;
                              if (rp === 'repeat')   return 'tile';
                              if (rp === 'repeat-x') return 'tile-x';
                              if (rp === 'repeat-y') return 'tile-y';
                              if (sz === 'contain')     return 'contain';
                              if (sz === '100% 100%')   return 'stretch';
                              if (sz === 'auto' && (!rp || rp === 'no-repeat')) return 'auto';
                              return 'cover';
                            })()}
                            onChange={(e) => {
                              const fits: Record<string, object> = {
                                cover:   { backgroundSize: 'cover',     backgroundRepeat: 'no-repeat' },
                                contain: { backgroundSize: 'contain',   backgroundRepeat: 'no-repeat' },
                                stretch: { backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat' },
                                auto:    { backgroundSize: 'auto',      backgroundRepeat: 'no-repeat' },
                                tile:    { backgroundSize: 'auto',      backgroundRepeat: 'repeat' },
                                'tile-x':{ backgroundSize: 'auto',      backgroundRepeat: 'repeat-x' },
                                'tile-y':{ backgroundSize: 'auto',      backgroundRepeat: 'repeat-y' },
                              };
                              applyStyleUpdate(fits[e.target.value] ?? fits.cover);
                            }}
                            label="Image Fit"
                          >
                            <MenuItem value="cover">Cover (fill, crop to fit)</MenuItem>
                            <MenuItem value="contain">Contain (fit inside)</MenuItem>
                            <MenuItem value="stretch">Stretch (fill, distort)</MenuItem>
                            <MenuItem value="auto">Original size</MenuItem>
                            <MenuItem value="tile">Tile (repeat)</MenuItem>
                            <MenuItem value="tile-x">Tile horizontal</MenuItem>
                            <MenuItem value="tile-y">Tile vertical</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                      {styleWidget?.config.style?.backgroundImage && (
                        <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                          <InputLabel>Image Position</InputLabel>
                          <Select
                            value={styleWidget?.config.style?.backgroundPosition ?? 'center'}
                            onChange={(e) => applyStyleUpdate({ backgroundPosition: e.target.value })}
                            label="Image Position"
                          >
                            <MenuItem value="center">Center</MenuItem>
                            <MenuItem value="top center">Top center</MenuItem>
                            <MenuItem value="bottom center">Bottom center</MenuItem>
                            <MenuItem value="center left">Center left</MenuItem>
                            <MenuItem value="center right">Center right</MenuItem>
                            <MenuItem value="top left">Top left</MenuItem>
                            <MenuItem value="top right">Top right</MenuItem>
                            <MenuItem value="bottom left">Bottom left</MenuItem>
                            <MenuItem value="bottom right">Bottom right</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    </AccordionDetails>
                  </Accordion>

                  {/* Border */}
                  <Accordion
                    expanded={expandedGroups['Border'] || false}
                    onChange={handleAccordionChange('Border')}
                    disableGutters
                    sx={{
                      mb: 1,
                      '&:before': { display: 'none' },
                      boxShadow: 'none',
                      border: '1px solid',
                      borderColor: 'primary.main',
                      bgcolor: 'background.paper',
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{
                        minHeight: 36,
                        '&.Mui-expanded': { minHeight: 36 },
                        '& .MuiAccordionSummary-content': { margin: '6px 0' },
                        bgcolor: 'background.default',
                      }}
                    >
                      <Typography variant="caption" fontWeight={600} textTransform="uppercase" color="primary">
                        Border
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 2 }}>
                      <ColorPicker
                        label="Border Color"
                        value={styleWidget?.config.style?.borderColor ?? '#000000'}
                        onChange={(color) => applyStyleUpdate({ borderColor: color })}
                      />
                      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                        <InputLabel>Border Type</InputLabel>
                        <Select
                          value={styleWidget?.config.style?.borderStyle ?? 'solid'}
                          onChange={(e) => applyStyleUpdate({ borderStyle: e.target.value })}
                          label="Border Type"
                        >
                          <MenuItem value="solid">Solid</MenuItem>
                          <MenuItem value="dashed">Dashed</MenuItem>
                          <MenuItem value="dotted">Dotted</MenuItem>
                          <MenuItem value="double">Double</MenuItem>
                          <MenuItem value="groove">Groove</MenuItem>
                          <MenuItem value="ridge">Ridge</MenuItem>
                          <MenuItem value="inset">Inset</MenuItem>
                          <MenuItem value="outset">Outset</MenuItem>
                        </Select>
                      </FormControl>
                      <TextField
                        fullWidth
                        type="number"
                        label="Border Width (px)"
                        value={typeof styleWidget?.config.style?.borderWidth === 'number' ? styleWidget.config.style.borderWidth : ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? undefined : parseInt(e.target.value);
                          applyStyleUpdate({ borderWidth: val });
                        }}
                        helperText="Width in pixels"
                        inputProps={{ min: 0, max: 20, step: 1 }}
                        size="small"
                        sx={{ mb: 2 }}
                      />
                      {/* Border Radius — per corner, with rounded / chamfer style toggle */}
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        Corners
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 2 }}>
                        {/* Top Left */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="caption" color="text.secondary">Top Left</Typography>
                            <ToggleButtonGroup
                              exclusive
                              size="small"
                              value={(() => { const r = styleWidget?.config.style?.borderRadius; return (typeof r === 'object' && r !== null) ? ((r as any).topLeftStyle ?? 'rounded') : 'rounded'; })()}
                              onChange={(_, v) => {
                                if (!v) return;
                                const current = styleWidget?.config.style?.borderRadius;
                                const base = typeof current === 'object' ? current : { topLeft: current || 0, topRight: current || 0, bottomRight: current || 0, bottomLeft: current || 0 };
                                applyStyleUpdate({ borderRadius: { ...base, topLeftStyle: v } });
                              }}
                              sx={{ height: 22 }}
                            >
                              <Tooltip title="Rounded"><ToggleButton value="rounded" sx={{ px: 1, fontSize: 10, lineHeight: 1 }}>R</ToggleButton></Tooltip>
                              <Tooltip title="Chamfered (angled cut)"><ToggleButton value="chamfer" sx={{ px: 1, fontSize: 10, lineHeight: 1 }}>C</ToggleButton></Tooltip>
                            </ToggleButtonGroup>
                          </Box>
                          <TextField
                            type="number"
                            label="Size"
                            value={(() => { const r = styleWidget?.config.style?.borderRadius; return (typeof r === 'object' && r !== null) ? ((r as any).topLeft ?? '') : typeof r === 'number' ? r : ''; })()}
                            onChange={(e) => {
                              const value = e.target.value === '' ? undefined : parseInt(e.target.value);
                              const current = styleWidget?.config.style?.borderRadius;
                              const newRadius = typeof current === 'object' ? { ...current, topLeft: value } : { topLeft: value, topRight: current || 0, bottomRight: current || 0, bottomLeft: current || 0 };
                              applyStyleUpdate({ borderRadius: newRadius });
                            }}
                            inputProps={{ min: 0, max: 200, step: 1 }}
                            size="small"
                          />
                        </Box>
                        {/* Top Right */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="caption" color="text.secondary">Top Right</Typography>
                            <ToggleButtonGroup
                              exclusive
                              size="small"
                              value={(() => { const r = styleWidget?.config.style?.borderRadius; return (typeof r === 'object' && r !== null) ? ((r as any).topRightStyle ?? 'rounded') : 'rounded'; })()}
                              onChange={(_, v) => {
                                if (!v) return;
                                const current = styleWidget?.config.style?.borderRadius;
                                const base = typeof current === 'object' ? current : { topLeft: current || 0, topRight: current || 0, bottomRight: current || 0, bottomLeft: current || 0 };
                                applyStyleUpdate({ borderRadius: { ...base, topRightStyle: v } });
                              }}
                              sx={{ height: 22 }}
                            >
                              <Tooltip title="Rounded"><ToggleButton value="rounded" sx={{ px: 1, fontSize: 10, lineHeight: 1 }}>R</ToggleButton></Tooltip>
                              <Tooltip title="Chamfered (angled cut)"><ToggleButton value="chamfer" sx={{ px: 1, fontSize: 10, lineHeight: 1 }}>C</ToggleButton></Tooltip>
                            </ToggleButtonGroup>
                          </Box>
                          <TextField
                            type="number"
                            label="Size"
                            value={(() => { const r = styleWidget?.config.style?.borderRadius; return (typeof r === 'object' && r !== null) ? ((r as any).topRight ?? '') : typeof r === 'number' ? r : ''; })()}
                            onChange={(e) => {
                              const value = e.target.value === '' ? undefined : parseInt(e.target.value);
                              const current = styleWidget?.config.style?.borderRadius;
                              const newRadius = typeof current === 'object' ? { ...current, topRight: value } : { topLeft: current || 0, topRight: value, bottomRight: current || 0, bottomLeft: current || 0 };
                              applyStyleUpdate({ borderRadius: newRadius });
                            }}
                            inputProps={{ min: 0, max: 200, step: 1 }}
                            size="small"
                          />
                        </Box>
                        {/* Bottom Left */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="caption" color="text.secondary">Bottom Left</Typography>
                            <ToggleButtonGroup
                              exclusive
                              size="small"
                              value={(() => { const r = styleWidget?.config.style?.borderRadius; return (typeof r === 'object' && r !== null) ? ((r as any).bottomLeftStyle ?? 'rounded') : 'rounded'; })()}
                              onChange={(_, v) => {
                                if (!v) return;
                                const current = styleWidget?.config.style?.borderRadius;
                                const base = typeof current === 'object' ? current : { topLeft: current || 0, topRight: current || 0, bottomRight: current || 0, bottomLeft: current || 0 };
                                applyStyleUpdate({ borderRadius: { ...base, bottomLeftStyle: v } });
                              }}
                              sx={{ height: 22 }}
                            >
                              <Tooltip title="Rounded"><ToggleButton value="rounded" sx={{ px: 1, fontSize: 10, lineHeight: 1 }}>R</ToggleButton></Tooltip>
                              <Tooltip title="Chamfered (angled cut)"><ToggleButton value="chamfer" sx={{ px: 1, fontSize: 10, lineHeight: 1 }}>C</ToggleButton></Tooltip>
                            </ToggleButtonGroup>
                          </Box>
                          <TextField
                            type="number"
                            label="Size"
                            value={(() => { const r = styleWidget?.config.style?.borderRadius; return (typeof r === 'object' && r !== null) ? ((r as any).bottomLeft ?? '') : typeof r === 'number' ? r : ''; })()}
                            onChange={(e) => {
                              const value = e.target.value === '' ? undefined : parseInt(e.target.value);
                              const current = styleWidget?.config.style?.borderRadius;
                              const newRadius = typeof current === 'object' ? { ...current, bottomLeft: value } : { topLeft: current || 0, topRight: current || 0, bottomRight: current || 0, bottomLeft: value };
                              applyStyleUpdate({ borderRadius: newRadius });
                            }}
                            inputProps={{ min: 0, max: 200, step: 1 }}
                            size="small"
                          />
                        </Box>
                        {/* Bottom Right */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="caption" color="text.secondary">Bottom Right</Typography>
                            <ToggleButtonGroup
                              exclusive
                              size="small"
                              value={(() => { const r = styleWidget?.config.style?.borderRadius; return (typeof r === 'object' && r !== null) ? ((r as any).bottomRightStyle ?? 'rounded') : 'rounded'; })()}
                              onChange={(_, v) => {
                                if (!v) return;
                                const current = styleWidget?.config.style?.borderRadius;
                                const base = typeof current === 'object' ? current : { topLeft: current || 0, topRight: current || 0, bottomRight: current || 0, bottomLeft: current || 0 };
                                applyStyleUpdate({ borderRadius: { ...base, bottomRightStyle: v } });
                              }}
                              sx={{ height: 22 }}
                            >
                              <Tooltip title="Rounded"><ToggleButton value="rounded" sx={{ px: 1, fontSize: 10, lineHeight: 1 }}>R</ToggleButton></Tooltip>
                              <Tooltip title="Chamfered (angled cut)"><ToggleButton value="chamfer" sx={{ px: 1, fontSize: 10, lineHeight: 1 }}>C</ToggleButton></Tooltip>
                            </ToggleButtonGroup>
                          </Box>
                          <TextField
                            type="number"
                            label="Size"
                            value={(() => { const r = styleWidget?.config.style?.borderRadius; return (typeof r === 'object' && r !== null) ? ((r as any).bottomRight ?? '') : typeof r === 'number' ? r : ''; })()}
                            onChange={(e) => {
                              const value = e.target.value === '' ? undefined : parseInt(e.target.value);
                              const current = styleWidget?.config.style?.borderRadius;
                              const newRadius = typeof current === 'object' ? { ...current, bottomRight: value } : { topLeft: current || 0, topRight: current || 0, bottomRight: value, bottomLeft: current || 0 };
                              applyStyleUpdate({ borderRadius: newRadius });
                            }}
                            inputProps={{ min: 0, max: 200, step: 1 }}
                            size="small"
                          />
                        </Box>
                      </Box>
                    </AccordionDetails>
                  </Accordion>

                  {/* Shadow */}
                  <Accordion
                    expanded={expandedGroups['Shadow'] || false}
                    onChange={handleAccordionChange('Shadow')}
                    disableGutters
                    sx={{
                      mb: 1,
                      '&:before': { display: 'none' },
                      boxShadow: 'none',
                      border: '1px solid',
                      borderColor: 'primary.main',
                      bgcolor: 'background.paper',
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{
                        minHeight: 36,
                        '&.Mui-expanded': { minHeight: 36 },
                        '& .MuiAccordionSummary-content': { margin: '6px 0' },
                        bgcolor: 'background.default',
                      }}
                    >
                      <Typography variant="caption" fontWeight={600} textTransform="uppercase" color="primary">
                        Shadow
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 2 }}>
                      {(() => {
                        // Parse existing shadow value
                        const currentShadow = styleWidget?.config.style?.boxShadow || 'none';
                        const parseShadow = (shadow: string) => {
                          if (!shadow || shadow === 'none') {
                            return { x: 0, y: 4, blur: 8, spread: 0, color: 'rgba(0,0,0,0.3)', inset: false };
                          }
                          
                          const match = shadow.match(/(inset\s+)?(-?\d+)px\s+(-?\d+)px\s+(\d+)px\s+(\d+)px\s+(rgba?\([^)]+\)|#[0-9a-f]+|[a-z]+)/i);
                          if (match) {
                            return {
                              inset: !!match[1],
                              x: parseInt(match[2]),
                              y: parseInt(match[3]),
                              blur: parseInt(match[4]),
                              spread: parseInt(match[5]),
                              color: match[6],
                            };
                          }
                          
                          const simpleMatch = shadow.match(/(inset\s+)?(-?\d+)px\s+(-?\d+)px\s+(\d+)px\s+(rgba?\([^)]+\)|#[0-9a-f]+|[a-z]+)/i);
                          if (simpleMatch) {
                            return {
                              inset: !!simpleMatch[1],
                              x: parseInt(simpleMatch[2]),
                              y: parseInt(simpleMatch[3]),
                              blur: parseInt(simpleMatch[4]),
                              spread: 0,
                              color: simpleMatch[5],
                            };
                          }
                          
                          return { x: 0, y: 4, blur: 8, spread: 0, color: 'rgba(0,0,0,0.3)', inset: false };
                        };
                        
                        const shadowValues = parseShadow(currentShadow);
                        
                        const updateShadow = (updates: Partial<typeof shadowValues>) => {
                          const newValues = { ...shadowValues, ...updates };
                          const shadowString = `${newValues.inset ? 'inset ' : ''}${newValues.x}px ${newValues.y}px ${newValues.blur}px ${newValues.spread}px ${newValues.color}`;
                          applyStyleUpdate({ boxShadow: shadowString });
                        };
                        
                        return (
                          <>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={shadowValues.inset}
                                  onChange={(e) => updateShadow({ inset: e.target.checked })}
                                  size="small"
                                />
                              }
                              label={<Typography variant="caption">Inset Shadow</Typography>}
                              sx={{ mb: 1 }}
                            />
                            
                            <TextField
                              fullWidth
                              type="number"
                              label="Horizontal Offset (X)"
                              value={shadowValues.x ?? ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                updateShadow({ x: val });
                              }}
                              size="small"
                              sx={{ mb: 1.5 }}
                              inputProps={{ step: 1 }}
                            />
                            
                            <TextField
                              fullWidth
                              type="number"
                              label="Vertical Offset (Y)"
                              value={shadowValues.y ?? ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                updateShadow({ y: val });
                              }}
                              size="small"
                              sx={{ mb: 1.5 }}
                              inputProps={{ step: 1 }}
                            />
                            
                            <TextField
                              fullWidth
                              type="number"
                              label="Blur Radius"
                              value={shadowValues.blur ?? ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                updateShadow({ blur: val });
                              }}
                              size="small"
                              sx={{ mb: 1.5 }}
                              inputProps={{ min: 0, step: 1 }}
                            />
                            
                            <TextField
                              fullWidth
                              type="number"
                              label="Spread Radius"
                              value={shadowValues.spread ?? ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                updateShadow({ spread: val });
                              }}
                              size="small"
                              sx={{ mb: 1.5 }}
                              inputProps={{ step: 1 }}
                            />
                            
                            <Box sx={{ mb: 2 }}>
                              <ColorPicker
                                label="Shadow Color"
                                value={shadowValues.color}
                                onChange={(color) => updateShadow({ color })}
                              />
                            </Box>
                            
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontFamily: 'monospace', fontSize: '0.7rem' }}>
                              {currentShadow}
                            </Typography>
                          </>
                        );
                      })()}
                    </AccordionDetails>
                  </Accordion>

              {selectedCount <= 1 && widget && (
                  <Accordion
                    expanded={expandedGroups['Visibility'] || false}
                    onChange={handleAccordionChange('Visibility')}
                    disableGutters
                    sx={{
                      mb: 1,
                      '&:before': { display: 'none' },
                      boxShadow: 'none',
                      border: '1px solid',
                      borderColor: 'primary.main',
                      bgcolor: 'background.paper',
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{
                        minHeight: 36,
                        '&.Mui-expanded': { minHeight: 36 },
                        '& .MuiAccordionSummary-content': { margin: '6px 0' },
                        bgcolor: 'background.default',
                      }}
                    >
                      <Typography variant="caption" fontWeight={600} textTransform="uppercase" color="primary">
                        Visibility
                        {widget.visibility?.conditions && widget.visibility.conditions.length > 0 && (
                          <Typography component="span" variant="caption" color="success.main" sx={{ ml: 1 }}>
                            ({widget.visibility.conditions.length} condition{widget.visibility.conditions.length !== 1 ? 's' : ''})
                          </Typography>
                        )}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                        Show/hide widget based on entity state, screen size, time, or complex logic
                      </Typography>

                      {/* Mode Selector */}
                      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                        <InputLabel>Condition Mode</InputLabel>
                        <Select
                          value={widget.visibility?.mode || 'all'}
                          label="Condition Mode"
                          onChange={(e) => {
                            onUpdate({
                              visibility: {
                                ...widget.visibility,
                                conditions: widget.visibility?.conditions || [],
                                mode: e.target.value as 'all' | 'any',
                              } as VisibilityConfig,
                            });
                          }}
                        >
                          <MenuItem value="all">ALL (AND) - All conditions must be true</MenuItem>
                          <MenuItem value="any">ANY (OR) - At least one condition must be true</MenuItem>
                        </Select>
                      </FormControl>

                      {/* Condition Builder */}
                      <ConditionBuilder
                        conditions={widget.visibility?.conditions || []}
                        onChange={(conditions: any) => {
                          onUpdate({
                            visibility: {
                              conditions,
                              mode: widget.visibility?.mode || 'all',
                            } as VisibilityConfig,
                          });
                        }}
                        entities={Object.keys(entities || {})}
                      />

                      {/* Helper Text */}
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                        💡 Tip: Widget always visible in edit mode for easy configuration
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
              )}
              </Box>
            )}
          </Box>
        )}

        {/* Views Tab */}
        {tabValue === 2 && (
          <Box>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Views
              </Typography>
            </Box>
            {allViews.length === 0 ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No views available
                </Typography>
              </Box>
            ) : (
              <List dense sx={{ p: 0 }}>
                {allViews.map((view) => {
                  const isActive = currentView?.id === view.id;
                  return (
                    <ListItem
                      key={view.id}
                      disablePadding
                      sx={{ borderBottom: 1, borderColor: 'divider' }}
                    >
                      <ListItemButton
                        selected={isActive}
                        onClick={() => onViewSwitch(view.id)}
                        sx={{
                          py: 1.5,
                          '&.Mui-selected': {
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            '&:hover': { bgcolor: 'primary.dark' },
                          },
                        }}
                      >
                        <ListItemText
                          primary={view.name || view.id}
                          secondary={`ID: ${view.id}`}
                          primaryTypographyProps={{
                            variant: 'body2',
                            fontWeight: isActive ? 600 : 400,
                          }}
                          secondaryTypographyProps={{
                            variant: 'caption',
                            sx: { color: isActive ? 'inherit' : 'text.secondary' },
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Box>
        )}

        {/* Widgets Tab */}
        {tabValue === 3 && (
          <Box>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Widgets
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {allWidgets.length} widget{allWidgets.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
            {allWidgets.length === 0 ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No widgets on view
                </Typography>
              </Box>
            ) : (
              <List dense sx={{ p: 0 }}>
                {allWidgets.map((w) => {
                  const isSelected = widget?.id === w.id;
                  const widgetMetadata = WIDGET_REGISTRY[w.type];
                  const widgetType = widgetMetadata?.name || w.type.charAt(0).toUpperCase() + w.type.slice(1);
                  
                  // Get the icon component from MUI icons
                  const iconName = widgetMetadata?.icon || 'WidgetsOutlined';
                  const IconComponent = (MuiIcons as any)[iconName] || MuiIcons.WidgetsOutlined;
                  
                  return (
                    <ListItem
                      key={w.id}
                      disablePadding
                      sx={{ borderBottom: 1, borderColor: 'divider' }}
                      secondaryAction={
                        <Checkbox
                          edge="end"
                          checked={!(w.hiddenInEdit || false)}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (onToggleWidgetHidden) {
                              onToggleWidgetHidden(w.id);
                            }
                          }}
                          title={w.hiddenInEdit ? 'Show widget in edit mode' : 'Hide widget in edit mode'}
                          sx={{ color: isSelected ? 'inherit' : undefined }}
                        />
                      }
                    >
                      <ListItemButton
                        selected={isSelected}
                        onClick={() => onWidgetSelect(w.id)}
                        sx={{
                          py: 1.5,
                          '&.Mui-selected': {
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            '&:hover': { bgcolor: 'primary.dark' },
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 40, color: isSelected ? 'inherit' : 'text.secondary' }}>
                          <IconComponent fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={widgetType}
                          secondary={`ID: ${w.id}`}
                          primaryTypographyProps={{
                            variant: 'body2',
                            fontWeight: isSelected ? 600 : 400,
                          }}
                          secondaryTypographyProps={{
                            variant: 'caption',
                            sx: { color: isSelected ? 'inherit' : 'text.secondary' },
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Box>
        )}

        {/* AI Tab */}
        {tabValue === 4 && (
          <AITabPanel 
            currentView={currentView}
            selectedWidgetIds={selectedWidgetIds}
            onClearSelection={onClearSelection}
          />
        )}
      </Box>

      {/* Code Editor Modal */}
      <Dialog
        open={codeEditorOpen}
        onClose={() => setCodeEditorOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            height: '80vh',
            maxHeight: '80vh',
          },
        }}
      >
        <DialogTitle>
          {codeEditorLabel}
          <IconButton
            onClick={() => setCodeEditorOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <MuiIcons.CloseOutlined />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={20}
            value={codeEditorValue}
            onChange={(e) => setCodeEditorValue(e.target.value)}
            variant="outlined"
            sx={{
              mt: 1,
              fontFamily: 'monospace',
              '& .MuiInputBase-root': {
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                fontSize: '0.9rem',
              },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCodeEditorOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={() => {
              // Handle boxShadow specially since it's in style object
              if (codeEditorField === 'boxShadow' && widget) {
                handleFieldChange('style', { ...widget.config.style, boxShadow: codeEditorValue });
              } else {
                handleFieldChange(codeEditorField, codeEditorValue);
              }
              setCodeEditorOpen(false);
            }}
            variant="contained"
            color="primary"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Pixabay Image Picker */}
      <PixabayPickerDialog
        open={pixabayOpen}
        onClose={() => setPixabayOpen(false)}
        onSelect={(localPath) => {
          pixabayCallback.current?.(localPath);
          setPixabayOpen(false);
        }}
      />
    </Box>
  );
};
