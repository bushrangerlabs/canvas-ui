/**
 * Visibility Condition Builder Component
 * UI for creating and editing visibility conditions in Inspector
 */

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {
    Box,
    Button,
    Checkbox,
    Chip,
    FormControl,
    FormControlLabel,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import React from 'react';
import type { Condition, LogicCondition, NumericStateCondition, ScreenCondition, StateCondition, TimeCondition } from '../../shared/types/visibility';

interface ConditionBuilderProps {
  conditions: Condition[];
  onChange: (conditions: Condition[]) => void;
  entities?: string[]; // Available entity IDs for picker
}

export const ConditionBuilder: React.FC<ConditionBuilderProps> = ({
  conditions,
  onChange,
  entities = [],
}) => {
  const generateId = () => `cond-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addCondition = (type: Condition['type']) => {
    let newCondition: Condition;

    switch (type) {
      case 'state':
        newCondition = {
          id: generateId(),
          type: 'state',
          entity: '',
          state: '',
        } as StateCondition;
        break;
      case 'numeric_state':
        newCondition = {
          id: generateId(),
          type: 'numeric_state',
          entity: '',
        } as NumericStateCondition;
        break;
      case 'screen':
        newCondition = {
          id: generateId(),
          type: 'screen',
        } as ScreenCondition;
        break;
      case 'time':
        newCondition = {
          id: generateId(),
          type: 'time',
        } as TimeCondition;
        break;
      case 'and':
      case 'or':
        newCondition = {
          id: generateId(),
          type,
          conditions: [],
        } as LogicCondition;
        break;
      default:
        return;
    }

    onChange([...conditions, newCondition]);
  };

  const updateCondition = (index: number, updates: Partial<Condition>) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], ...updates } as Condition;
    onChange(updated);
  };

  const deleteCondition = (index: number) => {
    onChange(conditions.filter((_, i) => i !== index));
  };

  return (
    <Box>
      {/* Add Condition Buttons */}
      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
        <Button size="small" startIcon={<AddIcon />} onClick={() => addCondition('state')}>
          State
        </Button>
        <Button size="small" startIcon={<AddIcon />} onClick={() => addCondition('numeric_state')}>
          Numeric
        </Button>
        <Button size="small" startIcon={<AddIcon />} onClick={() => addCondition('screen')}>
          Screen
        </Button>
        <Button size="small" startIcon={<AddIcon />} onClick={() => addCondition('time')}>
          Time
        </Button>
        <Button size="small" startIcon={<AddIcon />} onClick={() => addCondition('and')}>
          AND
        </Button>
        <Button size="small" startIcon={<AddIcon />} onClick={() => addCondition('or')}>
          OR
        </Button>
      </Stack>

      {/* Condition List */}
      {conditions.length === 0 ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', py: 2 }}>
          No conditions - widget always visible
        </Typography>
      ) : (
        conditions.map((condition, index) => (
          <Paper key={condition.id} elevation={1} sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Chip label={condition.type.toUpperCase()} size="small" color="primary" />
              <IconButton size="small" onClick={() => deleteCondition(index)} color="error">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>

            {condition.type === 'state' && (
              <StateConditionEditor
                condition={condition as StateCondition}
                onChange={(updates) => updateCondition(index, updates)}
                entities={entities}
              />
            )}

            {condition.type === 'numeric_state' && (
              <NumericConditionEditor
                condition={condition as NumericStateCondition}
                onChange={(updates) => updateCondition(index, updates)}
                entities={entities}
              />
            )}

            {condition.type === 'screen' && (
              <ScreenConditionEditor
                condition={condition as ScreenCondition}
                onChange={(updates) => updateCondition(index, updates)}
              />
            )}

            {condition.type === 'time' && (
              <TimeConditionEditor
                condition={condition as TimeCondition}
                onChange={(updates) => updateCondition(index, updates)}
              />
            )}

            {(condition.type === 'and' || condition.type === 'or') && (
              <LogicConditionEditor
                condition={condition as LogicCondition}
                onChange={(updates) => updateCondition(index, updates)}
                entities={entities}
              />
            )}
          </Paper>
        ))
      )}
    </Box>
  );
};

// State Condition Editor
const StateConditionEditor: React.FC<{
  condition: StateCondition;
  onChange: (updates: Partial<StateCondition>) => void;
  entities: string[];
}> = ({ condition, onChange, entities }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
    <FormControl fullWidth size="small">
      <InputLabel>Entity</InputLabel>
      <Select
        value={condition.entity}
        label="Entity"
        onChange={(e) => onChange({ entity: e.target.value })}
      >
        {entities.map((entity) => (
          <MenuItem key={entity} value={entity}>
            {entity}
          </MenuItem>
        ))}
      </Select>
    </FormControl>

    <TextField
      fullWidth
      size="small"
      label="State Value"
      value={condition.state}
      onChange={(e) => onChange({ state: e.target.value })}
      placeholder="e.g., on, off, home, away"
    />

    <FormControlLabel
      control={
        <Checkbox
          checked={condition.not || false}
          onChange={(e) => onChange({ not: e.target.checked })}
        />
      }
      label="NOT (invert condition)"
    />
  </Box>
);

// Numeric Condition Editor
const NumericConditionEditor: React.FC<{
  condition: NumericStateCondition;
  onChange: (updates: Partial<NumericStateCondition>) => void;
  entities: string[];
}> = ({ condition, onChange, entities }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
    <FormControl fullWidth size="small">
      <InputLabel>Entity</InputLabel>
      <Select
        value={condition.entity}
        label="Entity"
        onChange={(e) => onChange({ entity: e.target.value })}
      >
        {entities.filter(e => e.startsWith('sensor.') || e.startsWith('input_number.')).map((entity) => (
          <MenuItem key={entity} value={entity}>
            {entity}
          </MenuItem>
        ))}
      </Select>
    </FormControl>

    <TextField
      fullWidth
      size="small"
      type="number"
      label="Above (optional)"
      value={condition.above ?? ''}
      onChange={(e) => onChange({ above: e.target.value ? Number(e.target.value) : undefined })}
      placeholder="Show if greater than..."
    />

    <TextField
      fullWidth
      size="small"
      type="number"
      label="Below (optional)"
      value={condition.below ?? ''}
      onChange={(e) => onChange({ below: e.target.value ? Number(e.target.value) : undefined })}
      placeholder="Show if less than..."
    />
  </Box>
);

// Screen Condition Editor
const ScreenConditionEditor: React.FC<{
  condition: ScreenCondition;
  onChange: (updates: Partial<ScreenCondition>) => void;
}> = ({ condition, onChange }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
    <Typography variant="caption" color="text.secondary">
      Leave empty to ignore that dimension
    </Typography>

    <TextField
      fullWidth
      size="small"
      type="number"
      label="Min Width (px)"
      value={condition.minWidth ?? ''}
      onChange={(e) => onChange({ minWidth: e.target.value ? Number(e.target.value) : undefined })}
      placeholder="e.g., 768"
    />

    <TextField
      fullWidth
      size="small"
      type="number"
      label="Max Width (px)"
      value={condition.maxWidth ?? ''}
      onChange={(e) => onChange({ maxWidth: e.target.value ? Number(e.target.value) : undefined })}
      placeholder="e.g., 1920"
    />

    <TextField
      fullWidth
      size="small"
      type="number"
      label="Min Height (px)"
      value={condition.minHeight ?? ''}
      onChange={(e) => onChange({ minHeight: e.target.value ? Number(e.target.value) : undefined })}
    />

    <TextField
      fullWidth
      size="small"
      type="number"
      label="Max Height (px)"
      value={condition.maxHeight ?? ''}
      onChange={(e) => onChange({ maxHeight: e.target.value ? Number(e.target.value) : undefined })}
    />
  </Box>
);

// Time Condition Editor
const TimeConditionEditor: React.FC<{
  condition: TimeCondition;
  onChange: (updates: Partial<TimeCondition>) => void;
}> = ({ condition, onChange }) => {
  const weekdays = [
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
  ];

  const toggleWeekday = (day: number) => {
    const current = condition.weekday || [];
    const updated = current.includes(day)
      ? current.filter((d: number) => d !== day)
      : [...current, day].sort();
    onChange({ weekday: updated.length > 0 ? updated : undefined });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <TextField
        fullWidth
        size="small"
        type="time"
        label="After (optional)"
        value={condition.after ?? ''}
        onChange={(e) => onChange({ after: e.target.value || undefined })}
        InputLabelProps={{ shrink: true }}
      />

      <TextField
        fullWidth
        size="small"
        type="time"
        label="Before (optional)"
        value={condition.before ?? ''}
        onChange={(e) => onChange({ before: e.target.value || undefined })}
        InputLabelProps={{ shrink: true }}
      />

      <Box>
        <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>
          Days (optional - leave empty for all days)
        </Typography>
        <Stack direction="row" spacing={0.5}>
          {weekdays.map(({ value, label }) => (
            <Chip
              key={value}
              label={label}
              size="small"
              onClick={() => toggleWeekday(value)}
              color={(condition.weekday || []).includes(value) ? 'primary' : 'default'}
              variant={(condition.weekday || []).includes(value) ? 'filled' : 'outlined'}
            />
          ))}
        </Stack>
      </Box>
    </Box>
  );
};

// Logic Condition Editor (nested conditions)
const LogicConditionEditor: React.FC<{
  condition: LogicCondition;
  onChange: (updates: Partial<LogicCondition>) => void;
  entities: string[];
}> = ({ condition, onChange, entities }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
      Nested {condition.type.toUpperCase()} condition - add sub-conditions below
    </Typography>
    <ConditionBuilder
      conditions={condition.conditions}
      onChange={(conditions) => onChange({ conditions })}
      entities={entities}
    />
  </Box>
);
