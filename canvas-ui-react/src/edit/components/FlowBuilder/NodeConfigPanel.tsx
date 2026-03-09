/**
 * NodeConfigPanel Component - Edit node configuration
 * Opens as a drawer to configure node properties
 */

import {
    Box,
    Button,
    Drawer,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography
} from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { getWidgetProperties, getWritableWidgetProperties } from '../../../shared/flows/autoTriggers';
import { formatWidgetDisplay, parseWidgetId } from '../../../shared/flows/widgetDisplayUtils';
import { useWebSocket } from '../../../shared/providers/WebSocketProvider';
import { useConfigStore } from '../../../shared/stores/useConfigStore';
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
  const { getFlow, setFlow, config: appConfig, currentViewId } = useConfigStore();
  const { entities } = useWebSocket();
  
  // Local state for form fields
  const [config, setConfig] = useState<Record<string, any>>({});
  
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
  }, [nodeId, flowId, getFlow]); // Fetch fresh data when nodeId changes
  
  // Get current view's widgets
  const currentView = appConfig?.views.find(v => v.id === currentViewId);
  const widgets = currentView?.widgets || [];
  
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
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Widget</InputLabel>
          <Select
            value={value || ''}
            label="Widget"
            onChange={(e) => {
              // Parse widget ID from display string (removes custom name)
              const displayValue = e.target.value;
              const widgetId = parseWidgetId(displayValue);
              const shouldResetProperty = config.widget_id && config.widget_id !== widgetId;
              if (import.meta.env.DEV) console.log('[NodeConfigPanel] Widget changed:', { displayValue, widgetId, shouldResetProperty });
              setConfig({ 
                ...config, 
                [key]: widgetId, 
                ...(shouldResetProperty ? { property: '' } : {})
              });
            }}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {widgets.map((widget) => {
              // Use centralized display formatter: "widget-id (CustomName)"
              const displayValue = formatWidgetDisplay(widget.id, widgets);
              
              return (
                <MenuItem key={widget.id} value={widget.id}>
                  {displayValue}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
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
        
        {/* Output nodes */}
        {nodeData.nodeType === 'set-widget' && (
          <>
            {renderConfigField('widget_id', config.widget_id)}
            {renderConfigField('property', config.property)}
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
          .filter(([key]) => !['domain', 'entity_id', 'operation', 'value', 'service', 'service_data', 'widget_id', 'property', 'variable_name', 'format', 'value_type', 'default_value', 'url', 'operator', 'compare_value', 'logic_type', 'condition', 'true_value', 'false_value', 'delay_ms', 'expression', 'body', 'key', 'action', 'message'].includes(key))
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
