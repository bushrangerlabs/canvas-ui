/**
 * NodeConfigPanel Component - Edit node configuration
 * Opens as a drawer to configure node properties
 */

import {
    Box,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Drawer,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Tooltip,
    Typography
} from '@mui/material';
import { Add, ContentCopy as ContentCopyIcon, ContentPaste as ContentPasteIcon, Delete, Edit } from '@mui/icons-material';
import React, { useEffect, useMemo, useState } from 'react';
import { getWidgetProperties, getWritableWidgetProperties } from '../../../shared/flows/autoTriggers';

import { useWebSocket } from '../../../shared/providers/WebSocketProvider';
import { useConfigStore } from '../../../shared/stores/useConfigStore';
import { useFlowClipboardStore } from '../../../shared/stores/flowClipboardStore';
import type { FlowNodeData } from '../../../shared/types/flow';
import { getNodeMetadata } from '../../../shared/types/nodeRegistry';

// Predefined options for operation nodes
const HA_DOMAINS = [
  'light', 'switch', 'climate', 'cover', 'fan', 'lock', 'media_player',
  'camera', 'vacuum', 'alarm_control_panel', 'automation', 'script',
  'scene', 'input_boolean', 'input_number', 'input_select', 'input_text',
  'input_datetime', 'timer', 'sensor', 'binary_sensor', 'weather',
  'notify', 'persistent_notification', 'person', 'zone', 'device_tracker'
];

const HA_SERVICES: Record<string, string[]> = {
  light: ['turn_on', 'turn_off', 'toggle', 'turn_on_with_brightness', 'turn_on_with_color'],
  switch: ['turn_on', 'turn_off', 'toggle'],
  climate: ['set_temperature', 'set_hvac_mode', 'turn_on', 'turn_off'],
  cover: ['open_cover', 'close_cover', 'stop_cover', 'set_cover_position'],
  fan: ['turn_on', 'turn_off', 'toggle', 'set_percentage', 'oscillate'],
  lock: ['lock', 'unlock'],
  media_player: ['turn_on', 'turn_off', 'toggle', 'media_play', 'media_pause', 'media_stop', 'volume_up', 'volume_down', 'volume_mute'],
  automation: ['trigger', 'turn_on', 'turn_off', 'toggle'],
  script: ['turn_on', 'turn_off', 'toggle'],
  scene: ['turn_on'],
  input_boolean: ['turn_on', 'turn_off', 'toggle'],
  input_number: ['set_value', 'increment', 'decrement'],
  input_select: ['select_option', 'select_next', 'select_previous'],
  input_text: ['set_value'],
  notify: ['send_message'],
  persistent_notification: ['create', 'dismiss'],
};

const MATH_OPERATIONS = [
  { value: 'add', label: 'Add (+)' },
  { value: 'subtract', label: 'Subtract (-)' },
  { value: 'multiply', label: 'Multiply (×)' },
  { value: 'divide', label: 'Divide (÷)' },
  { value: 'modulo', label: 'Modulo (%)' },
  { value: 'power', label: 'Power (^)' },
];

const COMPARISON_OPERATORS = [
  { value: 'equals', label: 'Equals (==)' },
  { value: 'not-equals', label: 'Not Equals (!=)' },
  { value: 'greater-than', label: 'Greater Than (>)' },
  { value: 'less-than', label: 'Less Than (<)' },
  { value: 'greater-or-equal', label: 'Greater or Equal (>=)' },
  { value: 'less-or-equal', label: 'Less or Equal (<=)' },
];

const STRING_OPERATIONS = [
  { value: 'concat', label: 'Concatenate' },
  { value: 'uppercase', label: 'Uppercase' },
  { value: 'lowercase', label: 'Lowercase' },
  { value: 'trim', label: 'Trim' },
  { value: 'replace', label: 'Replace' },
];

const LOGIC_GATES = [
  { value: 'and', label: 'AND' },
  { value: 'or', label: 'OR' },
  { value: 'not', label: 'NOT' },
  { value: 'xor', label: 'XOR' },
];

interface NodeConfigPanelProps {
  open: boolean;
  nodeId: string | null;
  flowId: string;
  onClose: () => void;
  onSave?: () => void;
}

export const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
  open,
  nodeId,
  flowId,
  onClose,
  onSave,
}) => {
  const { getFlow, setFlow, config: appConfig } = useConfigStore();
  const { entities } = useWebSocket();
  
  // Local state for form fields
  const [config, setConfig] = useState<Record<string, any>>({});
  // Draft state for Set Widget Group entry builder
  const [draftEntry, setDraftEntry] = useState<{widget_id: string; property: string; value: string}>({widget_id: '', property: '', value: ''});
  // Index of the entry currently being edited (-1 = adding new)
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  // Widget filter state — main widget_id field (Widget Property / Set Widget nodes)
  const [widgetViewFilter, setWidgetViewFilter] = useState('');
  const [widgetSearch, setWidgetSearch] = useState('');
  // Widget filter state — Set Widget Group draft builder
  const [draftViewFilter, setDraftViewFilter] = useState('');
  const [draftWidgetSearch, setDraftWidgetSearch] = useState('');
  const [selectedEntries, setSelectedEntries] = useState<Set<number>>(new Set());
  const [pasteDialogOpen, setPasteDialogOpen] = useState(false);
  const { nodeType: clipNodeType, entries: clipEntries, copyEntries: copyToClipboard } = useFlowClipboardStore();
  const [mgDraftTab, setMgDraftTab] = useState<{widget_id: string; value: string}>({widget_id: '', value: ''});
  const [mgViewFilter, setMgViewFilter] = useState('');
  const [mgSearch, setMgSearch] = useState('');
  
  // Get flow and node data
  const flow = getFlow(flowId);
  const node = flow?.nodes.find((n) => n.id === nodeId);
  const nodeData = node?.data as FlowNodeData | undefined;
  const metadata = nodeData ? getNodeMetadata(nodeData.nodeType) : null;
  
  // Reset config when node changes (prevents config bleeding between nodes)
  useEffect(() => {
    const currentFlow = getFlow(flowId);
    const currentNode = currentFlow?.nodes.find((n) => n.id === nodeId);
    const currentNodeData = currentNode?.data as FlowNodeData | undefined;
    
    if (import.meta.env.DEV) console.log('[NodeConfigPanel] Loading node config:', {
      property: currentNodeData?.config?.property
    });
    
    if (currentNodeData?.config) {
      setConfig(currentNodeData.config);
    } else {
      setConfig({});
    }
    setDraftEntry({widget_id: '', property: '', value: ''});
    setEditingIndex(-1);
    setWidgetViewFilter('');
    setWidgetSearch('');
    setDraftViewFilter('');
    setDraftWidgetSearch('');
    setSelectedEntries(new Set());
    setMgDraftTab({widget_id: '', value: ''});
    setMgViewFilter('');
    setMgSearch('');
  }, [nodeId, flowId, getFlow]); // Fetch fresh data when nodeId changes
  
  // All widgets across ALL views — flows can target any widget regardless of which view it lives on
  const widgets = useMemo(
    () => appConfig?.views.flatMap(v => v.widgets || []) ?? [],
    [appConfig]
  );
  const views = useMemo(() => appConfig?.views ?? [], [appConfig]);
  const widgetViewInfo = useMemo(() => {
    const map = new Map<string, {name: string; id: string}>();
    appConfig?.views.forEach(v => (v.widgets || []).forEach(w => map.set(w.id, {name: v.name || v.id, id: v.id})));
    return map;
  }, [appConfig]);
  // Display helper: "Widget Name [View]" (falls back to ID if unnamed)
  const displayWidget = (widgetId: string) => {
    const widget = widgets.find(w => w.id === widgetId);
    const name = widget?.name;
    const info = widgetViewInfo.get(widgetId);
    if (name && info) return `${name} [${info.name}]`;
    if (name) return name;
    if (info) return `${widgetId} [${info.name}]`;
    return widgetId;
  };
  // Filtered widget lists for the two separate dropdowns
  const filteredWidgets = useMemo(() => widgets.filter(w => {
    const info = widgetViewInfo.get(w.id);
    const viewMatch = !widgetViewFilter || info?.id === widgetViewFilter;
    const s = widgetSearch.toLowerCase().trim();
    const nameMatch = !s || (w.name || '').toLowerCase().includes(s) || w.id.toLowerCase().includes(s);
    return viewMatch && nameMatch;
  }), [widgets, widgetViewFilter, widgetSearch, widgetViewInfo]);
  const draftFilteredWidgets = useMemo(() => widgets.filter(w => {
    const info = widgetViewInfo.get(w.id);
    const viewMatch = !draftViewFilter || info?.id === draftViewFilter;
    const s = draftWidgetSearch.toLowerCase().trim();
    const nameMatch = !s || (w.name || '').toLowerCase().includes(s) || w.id.toLowerCase().includes(s);
    return viewMatch && nameMatch;
  }), [widgets, draftViewFilter, draftWidgetSearch, widgetViewInfo]);
  const mgFilteredWidgets = useMemo(() => widgets.filter(w => {
    const info = widgetViewInfo.get(w.id);
    const viewMatch = !mgViewFilter || info?.id === mgViewFilter;
    const s = mgSearch.toLowerCase().trim();
    const nameMatch = !s || (w.name || '').toLowerCase().includes(s) || w.id.toLowerCase().includes(s);
    return viewMatch && nameMatch;
  }), [widgets, mgViewFilter, mgSearch, widgetViewInfo]);

  // Get widget properties appropriate for the current node type (memoized).
  // set-widget (write) uses getWritableWidgetProperties (content + universal style + layout).
  // widget-property (read) uses getWidgetProperties (runtime.value + key config props).
  const widgetProperties = useMemo(() => {
    const selectedWidget = widgets.find(w => w.id === config.widget_id);
    if (!selectedWidget) return [];

    const isSetWidget = nodeData?.nodeType === 'set-widget';
    const props = isSetWidget
      ? getWritableWidgetProperties(selectedWidget.type)
      : getWidgetProperties(selectedWidget.type);

    if (import.meta.env.DEV) console.log('[NodeConfigPanel] Properties for', selectedWidget.type, `(${nodeData?.nodeType}):`, props);

    return props;
  }, [config.widget_id, widgets, nodeData?.nodeType]);

  // Properties for the Set Widget Group draft entry row (dynamic per selected draft widget)
  const draftProperties = useMemo(() => {
    if (!draftEntry.widget_id) return [];
    const w = widgets.find(wid => wid.id === draftEntry.widget_id);
    if (!w) return [];
    return getWritableWidgetProperties(w.type);
  }, [draftEntry.widget_id, widgets]);

  if (!node || !nodeData || !metadata) {
    return null;
  }

  const handleSave = () => {
    if (!flow) return;

    if (import.meta.env.DEV) console.log('[NodeConfigPanel] Saving node config:', {
      nodeId,
      currentConfig: config,
      widget_id: config.widget_id,
      property: config.property
    });

    const updatedNodes = flow.nodes.map((n) =>
      n.id === nodeId
        ? {
            ...n,
            data: {
              ...n.data,
              config,
            },
          }
        : n
    );

    if (import.meta.env.DEV) console.log('[NodeConfigPanel] Updated node:', {
      nodeId,
      updatedNode: updatedNodes.find(n => n.id === nodeId),
      updatedNodeConfig: updatedNodes.find(n => n.id === nodeId)?.data?.config,
      fullUpdatedData: updatedNodes.find(n => n.id === nodeId)?.data
    });

    setFlow({
      ...flow,
      nodes: updatedNodes as any,
    });
    
    // Trigger save to HA
    onSave?.();

    onClose();
  };

  const handleCancel = () => {
    // Reset to original config
    setConfig(nodeData?.config || {});
    onClose();
  };

  const renderConfigField = (key: string, value: any) => {
    // Widget selector for widget_id fields
    if (key === 'widget_id') {
      if (import.meta.env.DEV) console.log('[NodeConfigPanel] Rendering widget_id field:', { value, configWidgetId: config.widget_id });
      
      return (
        <Box sx={{ mb: 2 }}>
          {/* View filter + search row */}
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <FormControl size="small" sx={{ flex: '0 0 130px' }}>
              <InputLabel>View</InputLabel>
              <Select
                value={widgetViewFilter}
                label="View"
                onChange={(e) => setWidgetViewFilter(e.target.value)}
              >
                <MenuItem value=""><em>All views</em></MenuItem>
                {views.map(v => (
                  <MenuItem key={v.id} value={v.id}>{v.name || v.id}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              size="small"
              placeholder="Search widgets…"
              value={widgetSearch}
              onChange={(e) => setWidgetSearch(e.target.value)}
              sx={{ flex: 1 }}
            />
          </Box>
          <FormControl fullWidth>
            <InputLabel>Widget</InputLabel>
            <Select
              value={value || ''}
              label="Widget"
              onChange={(e) => {
                const widgetId = e.target.value;
                const shouldResetProperty = config.widget_id && config.widget_id !== widgetId;
                setConfig({ 
                  ...config, 
                  [key]: widgetId, 
                  ...(shouldResetProperty ? { property: '' } : {})
                });
              }}
            >
              <MenuItem value=""><em>None</em></MenuItem>
              {filteredWidgets.map((widget) => (
                <MenuItem key={widget.id} value={widget.id}>
                  {displayWidget(widget.id)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      );
    }
    
    // Property selector for property fields (only if widget is selected)
    if (key === 'property') {
      if (import.meta.env.DEV) console.log('[NodeConfigPanel] Rendering property field:', { value, configProperty: config.property, hasWidgetId: !!config.widget_id });
      if (config.widget_id) {
        return (
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Property</InputLabel>
            <Select
              value={value || ''}
              label="Property"
              onChange={(e) => {
                if (import.meta.env.DEV) console.log('[NodeConfigPanel] Property changed:', e.target.value);
                setConfig({ ...config, [key]: e.target.value });
              }}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {widgetProperties.map((prop: { value: string; label: string; description: string }) => (
                <MenuItem key={prop.value} value={prop.value}>
                  <Box>
                    <Typography variant="body2">{prop.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {prop.description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      } else if (nodeData.nodeType === 'set-widget-group') {
        // Free text for group node — no single widget type to filter by
        return (
          <TextField
            fullWidth
            label="Property Path"
            value={value || ''}
            onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
            sx={{ mb: 2 }}
            placeholder="e.g. config.textColor"
            helperText="Property path applied to all widgets in the group"
          />
        );
      } else {
        // Show text field if no widget selected (preserves saved value)
        return (
          <TextField
            fullWidth
            label="Property (select widget first)"
            value={value || ''}
            disabled
            sx={{ mb: 2 }}
            helperText="Select a widget to choose from available properties"
          />
        );
      }
    }
    
    // Entity selector for entity_id fields
    if (key === 'entity_id') {
      const entityList = entities ? Object.keys(entities) : [];
      return (
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Entity</InputLabel>
          <Select
            value={value || ''}
            label="Entity"
            onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {entityList.map((entityId) => (
              <MenuItem key={entityId} value={entityId}>
                {entityId}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }

    // Domain selector for call-service node
    if (key === 'domain' && nodeData.nodeType === 'call-service') {
      return (
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Domain</InputLabel>
          <Select
            value={value || ''}
            label="Domain"
            onChange={(e) => {
              const newDomain = e.target.value;
              setConfig({ 
                ...config, 
                domain: newDomain,
                service: '' // Reset service when domain changes
              });
            }}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {HA_DOMAINS.map((domain) => (
              <MenuItem key={domain} value={domain}>
                {domain}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }

    // Service selector for call-service node (cascading from domain)
    if (key === 'service' && nodeData.nodeType === 'call-service') {
      const availableServices = config.domain ? HA_SERVICES[config.domain] || [] : [];
      return (
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Service</InputLabel>
          <Select
            value={value || ''}
            label="Service"
            onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
            disabled={!config.domain}
          >
            <MenuItem value="">
              <em>{config.domain ? 'None' : 'Select domain first'}</em>
            </MenuItem>
            {availableServices.map((service) => (
              <MenuItem key={service} value={service}>
                {service}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }

    // Math operation selector
    if (key === 'operation' && nodeData.nodeType === 'math') {
      return (
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Operation</InputLabel>
          <Select
            value={value || ''}
            label="Operation"
            onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {MATH_OPERATIONS.map((op) => (
              <MenuItem key={op.value} value={op.value}>
                {op.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }

    // Comparison operator selector
    if (key === 'operator' && nodeData.nodeType === 'comparison') {
      return (
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Operator</InputLabel>
          <Select
            value={value || ''}
            label="Operator"
            onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {COMPARISON_OPERATORS.map((op) => (
              <MenuItem key={op.value} value={op.value}>
                {op.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }

    // String operation selector
    if (key === 'operation' && nodeData.nodeType === 'string') {
      return (
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Operation</InputLabel>
          <Select
            value={value || ''}
            label="Operation"
            onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {STRING_OPERATIONS.map((op) => (
              <MenuItem key={op.value} value={op.value}>
                {op.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }

    // Coerce type selector (for Value processing node)
    if (key === 'coerce_type') {
      return (
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Output Type</InputLabel>
          <Select
            value={value || 'passthrough'}
            label="Output Type"
            onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
          >
            <MenuItem value="passthrough">Passthrough (no coercion)</MenuItem>
            <MenuItem value="string">String</MenuItem>
            <MenuItem value="number">Number</MenuItem>
            <MenuItem value="boolean">Boolean</MenuItem>
            <MenuItem value="color">Color (hex string)</MenuItem>
          </Select>
        </FormControl>
      );
    }


    // Logic gate selector
    if (key === 'logic_type' && nodeData.nodeType === 'logic') {
      return (
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Logic Gate</InputLabel>
          <Select
            value={value || ''}
            label="Logic Gate"
            onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {LOGIC_GATES.map((gate) => (
              <MenuItem key={gate.value} value={gate.value}>
                {gate.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }

    // Variable name selector with existing variables
    if (key === 'variable_name' && (nodeData.nodeType === 'canvas-variable' || nodeData.nodeType === 'set-variable')) {
      // Get existing variable names from all flows
      const existingVars = new Set<string>();
      if (appConfig?.flows) {
        Object.values(appConfig.flows).forEach((flow) => {
          flow.nodes.forEach((node) => {
            const nodeConfig = (node.data as FlowNodeData)?.config;
            if (nodeConfig?.variable_name) {
              existingVars.add(nodeConfig.variable_name);
            }
          });
        });
      }
      
      const varList = Array.from(existingVars).sort();
      
      return (
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Variable Name</InputLabel>
          <Select
            value={value || ''}
            label="Variable Name"
            onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
            // Allow custom input via TextField below if needed
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {varList.map((varName) => (
              <MenuItem key={varName} value={varName}>
                {varName}
              </MenuItem>
            ))}
            <MenuItem value="__custom__">
              <em>+ New Variable (type below)</em>
            </MenuItem>
          </Select>
          {(value === '__custom__' || (!varList.includes(value) && value)) && (
            <TextField
              fullWidth
              label="Custom Variable Name"
              value={value === '__custom__' ? '' : value}
              onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
              sx={{ mt: 2 }}
              placeholder="Enter new variable name"
            />
          )}
        </FormControl>
      );
    }

    // Text field for everything else
    return (
      <TextField
        key={key}
        fullWidth
        label={key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
        value={value || ''}
        onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
        sx={{ mb: 2 }}
      />
    );
  };

  return (
    <Drawer anchor="right" open={open} onClose={handleCancel}>
      <Box sx={{ width: 400, p: 3 }}>
        {/* Header */}
        <Typography variant="h6" sx={{ mb: 2 }}>
          Configure Node
        </Typography>

        {/* Node Info */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Type
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
            {metadata.label}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Category
          </Typography>
          <Typography variant="body2">{metadata.category}</Typography>
        </Box>

        {/* Configuration Fields */}
        <Typography variant="subtitle2" sx={{ mb: 2 }}>
          Configuration
        </Typography>

        {/* Type-specific fields based on node type */}
        {nodeData.nodeType === 'widget-property' && (
          <>
            {renderConfigField('widget_id', config.widget_id)}
            {renderConfigField('property', config.property)}
          </>
        )}
        {nodeData.nodeType === 'entity-state' && renderConfigField('entity_id', config.entity_id)}
        {nodeData.nodeType === 'canvas-variable' && renderConfigField('variable_name', config.variable_name)}
        {nodeData.nodeType === 'time-date' && renderConfigField('format', config.format)}
        {nodeData.nodeType === 'user-input' && (
          <>
            {renderConfigField('value_type', config.value_type)}
            {renderConfigField('default_value', config.default_value)}
          </>
        )}
        {nodeData.nodeType === 'http-request' && renderConfigField('url', config.url)}
        
        {/* Processing nodes */}
        {nodeData.nodeType === 'math' && (
          <>
            {renderConfigField('operation', config.operation)}
            {renderConfigField('value', config.value)}
          </>
        )}
        {nodeData.nodeType === 'string' && (
          <>
            {renderConfigField('operation', config.operation)}
            {renderConfigField('value', config.value)}
          </>
        )}
        {nodeData.nodeType === 'comparison' && (
          <>
            {renderConfigField('operator', config.operator)}
            {renderConfigField('compare_value', config.compare_value)}
          </>
        )}
        {nodeData.nodeType === 'logic' && renderConfigField('logic_type', config.logic_type)}
        {nodeData.nodeType === 'condition' && (
          <>
            {renderConfigField('condition', config.condition)}
            {renderConfigField('true_value', config.true_value)}
            {renderConfigField('false_value', config.false_value)}
          </>
        )}
        {nodeData.nodeType === 'delay' && renderConfigField('delay_ms', config.delay_ms)}
        {nodeData.nodeType === 'js-expression' && renderConfigField('expression', config.expression)}
        {nodeData.nodeType === 'value' && (
          <>
            {renderConfigField('coerce_type', config.coerce_type)}
            {renderConfigField('value', config.value)}
          </>
        )}
        
        {/* Output nodes */}
        {nodeData.nodeType === 'set-widget' && (
          <>
            {renderConfigField('widget_id', config.widget_id)}
            {renderConfigField('property', config.property)}
            {renderConfigField('value', config.value)}
          </>
        )}
        {nodeData.nodeType === 'set-widget-group' && (
          <>
            {/* Entry builder row */}
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
              {editingIndex >= 0 ? `Edit Entry ${editingIndex + 1}` : 'Add Entry'}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2, p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              {/* View filter + search for draft widget selector */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <FormControl size="small" sx={{ flex: '0 0 120px' }}>
                  <InputLabel>View</InputLabel>
                  <Select
                    value={draftViewFilter}
                    label="View"
                    onChange={(e) => setDraftViewFilter(e.target.value)}
                  >
                    <MenuItem value=""><em>All views</em></MenuItem>
                    {views.map(v => (
                      <MenuItem key={v.id} value={v.id}>{v.name || v.id}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  size="small"
                  placeholder="Search widgets…"
                  value={draftWidgetSearch}
                  onChange={(e) => setDraftWidgetSearch(e.target.value)}
                  sx={{ flex: 1 }}
                />
              </Box>
              <FormControl fullWidth size="small">
                <InputLabel>Widget</InputLabel>
                <Select
                  value={draftEntry.widget_id}
                  label="Widget"
                  onChange={(e) => setDraftEntry({ ...draftEntry, widget_id: e.target.value, property: '' })}
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {draftFilteredWidgets.map((w) => (
                    <MenuItem key={w.id} value={w.id}>{displayWidget(w.id)}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small" disabled={!draftEntry.widget_id}>
                <InputLabel>Property</InputLabel>
                <Select
                  value={draftEntry.property}
                  label="Property"
                  onChange={(e) => setDraftEntry({ ...draftEntry, property: e.target.value })}
                >
                  <MenuItem value=""><em>{draftEntry.widget_id ? 'None' : 'Select widget first'}</em></MenuItem>
                  {draftProperties.map((p: { value: string; label: string; description: string }) => (
                    <MenuItem key={p.value} value={p.value}>
                      <Box>
                        <Typography variant="body2">{p.label}</Typography>
                        <Typography variant="caption" color="text.secondary">{p.description}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                size="small"
                label="Value"
                value={draftEntry.value}
                onChange={(e) => setDraftEntry({ ...draftEntry, value: e.target.value })}
                placeholder="e.g. #ffff00"
              />
              <Button
                variant="outlined"
                size="small"
                startIcon={editingIndex >= 0 ? <Edit /> : <Add />}
                disabled={!draftEntry.widget_id || !draftEntry.property}
                onClick={() => {
                  const existing = (config.entries as Array<{widget_id: string; property: string; value: string}>) || [];
                  if (editingIndex >= 0) {
                    const updated = existing.map((e, i) => i === editingIndex ? { ...draftEntry } : e);
                    setConfig({ ...config, entries: updated });
                  } else {
                    setConfig({ ...config, entries: [...existing, { ...draftEntry }] });
                  }
                  setDraftEntry({ widget_id: '', property: '', value: '' });
                  setEditingIndex(-1);
                }}
              >
                {editingIndex >= 0 ? 'Update' : 'Add'}
              </Button>
              {editingIndex >= 0 && (
                <Button
                  variant="text"
                  size="small"
                  onClick={() => {
                    setDraftEntry({ widget_id: '', property: '', value: '' });
                    setEditingIndex(-1);
                  }}
                >
                  Cancel
                </Button>
              )}
            </Box>
            {/* Paste from clipboard */}
            {clipNodeType === 'set-widget-group' && clipEntries.length > 0 && (
              <Button
                fullWidth
                size="small"
                variant="outlined"
                color="secondary"
                startIcon={<ContentPasteIcon />}
                sx={{ mb: 2 }}
                onClick={() => setPasteDialogOpen(true)}
              >
                Paste {clipEntries.length} {clipEntries.length === 1 ? 'entry' : 'entries'} from clipboard
              </Button>
            )}
            {/* Entries list */}
            {((config.entries as any[]) || []).length > 0 && (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary', flex: 1 }}>
                    Entries ({(config.entries as any[]).length})
                  </Typography>
                  <Button
                    size="small"
                    variant="text"
                    sx={{ fontSize: '0.7rem', minWidth: 0, px: 0.5, textTransform: 'none' }}
                    onClick={() => {
                      const allCount = (config.entries as any[]).length;
                      if (selectedEntries.size === allCount) {
                        setSelectedEntries(new Set());
                      } else {
                        setSelectedEntries(new Set(Array.from({ length: allCount }, (_, i) => i)));
                      }
                    }}
                  >
                    {selectedEntries.size === (config.entries as any[]).length ? 'Deselect all' : 'Select all'}
                  </Button>
                  {selectedEntries.size > 0 && (
                    <Tooltip title="Copy selected entries to clipboard">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ContentCopyIcon />}
                        sx={{ fontSize: '0.7rem', textTransform: 'none' }}
                        onClick={() => {
                          const entriesToCopy = (config.entries as Array<{widget_id: string; property: string; value: string}>)
                            .filter((_, i) => selectedEntries.has(i));
                          copyToClipboard('set-widget-group', entriesToCopy);
                          setSelectedEntries(new Set());
                        }}
                      >
                        Copy ({selectedEntries.size})
                      </Button>
                    </Tooltip>
                  )}
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2 }}>
                  {(config.entries as Array<{widget_id: string; property: string; value: string}>).map((entry, idx) => {
                    const w = widgets.find(ww => ww.id === entry.widget_id);
                    const wLabel = w ? displayWidget(w.id) : entry.widget_id;
                    return (
                      <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, p: 1, bgcolor: editingIndex === idx ? 'action.selected' : (selectedEntries.has(idx) ? 'action.focus' : 'action.hover'), borderRadius: 1, border: (editingIndex === idx || selectedEntries.has(idx)) ? '1px solid' : 'none', borderColor: editingIndex === idx ? 'primary.main' : 'secondary.main' }}>
                        <Checkbox
                          size="small"
                          checked={selectedEntries.has(idx)}
                          onChange={(e) => {
                            const next = new Set(selectedEntries);
                            if (e.target.checked) next.add(idx);
                            else next.delete(idx);
                            setSelectedEntries(next);
                          }}
                          sx={{ p: 0, mt: 0.25 }}
                        />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="caption" display="block" noWrap sx={{ fontWeight: 600 }}>{wLabel}</Typography>
                          <Typography variant="caption" color="text.secondary" display="block" noWrap>
                            {entry.property} = &ldquo;{entry.value}&rdquo;
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setDraftEntry({ ...entry });
                            setEditingIndex(idx);
                          }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => {
                            const updated = (config.entries as any[]).filter((_, i) => i !== idx);
                            setConfig({ ...config, entries: updated });
                            if (editingIndex === idx) {
                              setDraftEntry({ widget_id: '', property: '', value: '' });
                              setEditingIndex(-1);
                            }
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    );
                  })}
                </Box>
              </>
            )}
            {/* Paste entries dialog */}
            <Dialog open={pasteDialogOpen} onClose={() => setPasteDialogOpen(false)}>
              <DialogTitle>Paste entries</DialogTitle>
              <DialogContent>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Paste {clipEntries.length} {clipEntries.length === 1 ? 'entry' : 'entries'} from clipboard.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Append adds them after existing entries. Replace overwrites all current entries.
                </Typography>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setPasteDialogOpen(false)}>Cancel</Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    const existing = (config.entries as Array<{widget_id: string; property: string; value: string}>) || [];
                    setConfig({ ...config, entries: [...existing, ...clipEntries] });
                    setPasteDialogOpen(false);
                  }}
                >
                  Append
                </Button>
                <Button
                  variant="contained"
                  onClick={() => {
                    setConfig({ ...config, entries: [...clipEntries] });
                    setPasteDialogOpen(false);
                  }}
                >
                  Replace
                </Button>
              </DialogActions>
            </Dialog>
          </>
        )}
        {nodeData.nodeType === 'menu-group' && (
          <>
            {/* Border colors */}
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>Border Colors</Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField size="small" label="Active" value={config.activeColor || '#ffffff'}
                onChange={(e) => setConfig({ ...config, activeColor: e.target.value })}
                sx={{ flex: 1 }}
                InputProps={{ startAdornment: <Box component="span" sx={{ display: 'inline-block', width: 16, height: 16, borderRadius: '3px', bgcolor: config.activeColor || '#ffffff', border: '1px solid rgba(255,255,255,0.3)', mr: 1, flexShrink: 0 }} /> }} />
              <TextField size="small" label="Inactive" value={config.inactiveColor || '#808080'}
                onChange={(e) => setConfig({ ...config, inactiveColor: e.target.value })}
                sx={{ flex: 1 }}
                InputProps={{ startAdornment: <Box component="span" sx={{ display: 'inline-block', width: 16, height: 16, borderRadius: '3px', bgcolor: config.inactiveColor || '#808080', border: '1px solid rgba(255,255,255,0.3)', mr: 1, flexShrink: 0 }} /> }} />
            </Box>
            {/* Optional colors */}
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>Optional: Background / Text / Icon colors</Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField size="small" label="Active BG" placeholder="none" value={config.activeBgColor || ''}
                onChange={(e) => setConfig({ ...config, activeBgColor: e.target.value })} sx={{ flex: 1 }} />
              <TextField size="small" label="Inactive BG" placeholder="none" value={config.inactiveBgColor || ''}
                onChange={(e) => setConfig({ ...config, inactiveBgColor: e.target.value })} sx={{ flex: 1 }} />
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField size="small" label="Active text" placeholder="none" value={config.activeTextColor || ''}
                onChange={(e) => setConfig({ ...config, activeTextColor: e.target.value })} sx={{ flex: 1 }} />
              <TextField size="small" label="Inactive text" placeholder="none" value={config.inactiveTextColor || ''}
                onChange={(e) => setConfig({ ...config, inactiveTextColor: e.target.value })} sx={{ flex: 1 }} />
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField size="small" label="Active icon" placeholder="none" value={config.activeIconColor || ''}
                onChange={(e) => setConfig({ ...config, activeIconColor: e.target.value })} sx={{ flex: 1 }} />
              <TextField size="small" label="Inactive icon" placeholder="none" value={config.inactiveIconColor || ''}
                onChange={(e) => setConfig({ ...config, inactiveIconColor: e.target.value })} sx={{ flex: 1 }} />
            </Box>
            {/* Tab builder */}
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>Add Tab</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2, p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <FormControl size="small" sx={{ flex: '0 0 120px' }}>
                  <InputLabel>View</InputLabel>
                  <Select value={mgViewFilter} label="View" onChange={(e) => setMgViewFilter(e.target.value)}>
                    <MenuItem value=""><em>All views</em></MenuItem>
                    {views.map(v => <MenuItem key={v.id} value={v.id}>{v.name || v.id}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField size="small" placeholder="Search widgets…" value={mgSearch}
                  onChange={(e) => setMgSearch(e.target.value)} sx={{ flex: 1 }} />
              </Box>
              <FormControl fullWidth size="small">
                <InputLabel>Button Widget</InputLabel>
                <Select value={mgDraftTab.widget_id} label="Button Widget"
                  onChange={(e) => setMgDraftTab({ ...mgDraftTab, widget_id: e.target.value })}>
                  <MenuItem value=""><em>None</em></MenuItem>
                  {mgFilteredWidgets.map((w) => (
                    <MenuItem key={w.id} value={w.id}>{displayWidget(w.id)}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField fullWidth size="small" label="Output value (emitted downstream)"
                value={mgDraftTab.value}
                placeholder="e.g. home, /canvas-kiosk#main_menu"
                onChange={(e) => setMgDraftTab({ ...mgDraftTab, value: e.target.value })}
                helperText="Value passed to downstream nodes when this tab is selected" />
              <Button variant="outlined" size="small" startIcon={<Add />}
                disabled={!mgDraftTab.widget_id}
                onClick={() => {
                  const existing = (config.tabs as any[]) || [];
                  setConfig({ ...config, tabs: [...existing, { ...mgDraftTab }] });
                  setMgDraftTab({ widget_id: '', value: '' });
                }}>
                Add Tab
              </Button>
            </Box>
            {/* Tabs list */}
            {((config.tabs as any[]) || []).length > 0 && (
              <>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Tabs ({(config.tabs as any[]).length})
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2 }}>
                  {(config.tabs as Array<{widget_id: string; value: string}>).map((tab, idx) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="caption" display="block" noWrap sx={{ fontWeight: 600 }}>{displayWidget(tab.widget_id)}</Typography>
                        {tab.value && <Typography variant="caption" color="text.secondary" display="block" noWrap>→ &ldquo;{tab.value}&rdquo;</Typography>}
                      </Box>
                      <IconButton size="small" onClick={() => {
                        const updated = (config.tabs as any[]).filter((_, i) => i !== idx);
                        setConfig({ ...config, tabs: updated });
                      }}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </>
        )}
        {nodeData.nodeType === 'call-service' && (
          <>
            {renderConfigField('domain', config.domain)}
            {renderConfigField('service', config.service)}
            {renderConfigField('entity_id', config.entity_id)}
            {renderConfigField('service_data', config.service_data)}
          </>
        )}
        {nodeData.nodeType === 'set-variable' && renderConfigField('variable_name', config.variable_name)}
        {nodeData.nodeType === 'http-post' && (
          <>
            {renderConfigField('url', config.url)}
            {renderConfigField('body', config.body)}
          </>
        )}
        {nodeData.nodeType === 'local-storage' && (
          <>
            {renderConfigField('key', config.key)}
            {renderConfigField('action', config.action)}
          </>
        )}
        {nodeData.nodeType === 'console-log' && renderConfigField('message', config.message)}

        {/* Show all existing config fields not already displayed */}
        {Object.entries(config)
          .filter(([key]) => !['domain', 'entity_id', 'operation', 'value', 'service', 'service_data', 'widget_id', 'widget_ids', 'entries', 'property', 'variable_name', 'format', 'value_type', 'default_value', 'url', 'operator', 'compare_value', 'logic_type', 'coerce_type', 'condition', 'true_value', 'false_value', 'delay_ms', 'expression', 'body', 'key', 'action', 'message'].includes(key))
          .map(([key, value]) => renderConfigField(key, value))}

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
          <Button variant="outlined" onClick={handleCancel} fullWidth>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave} fullWidth>
            Save
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};
