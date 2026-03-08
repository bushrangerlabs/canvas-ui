import {
    Box,
    FormControl,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import React from 'react';
import { useWidgetStore } from '../../store/widgetStore';

interface DimensionFieldComponentProps {
  label: string;
  propertyPath: string;
  units?: string[];
  allowAuto?: boolean;
  description?: string;
}

const DEFAULT_UNITS = ['px', '%', 'em', 'rem', 'vw', 'vh'];

export const DimensionFieldComponent: React.FC<DimensionFieldComponentProps> = ({
  label,
  propertyPath,
  units = DEFAULT_UNITS,
  allowAuto = true,
  description,
}) => {
  const { selectedWidget, updateConfig } = useWidgetStore();

  if (!selectedWidget) {
    return null;
  }

  const fullValue = selectedWidget.config[propertyPath] || '';

  // Parse value and unit
  const parseValue = (val: string): { value: string; unit: string } => {
    if (!val) return { value: '', unit: units[0] };
    if (val === 'auto' || val === 'inherit') return { value: val, unit: '' };

    const match = val.match(/^([-\d.]+)(.*)$/);
    if (match) {
      const [, numStr, unitStr] = match;
      return {
        value: numStr,
        unit: unitStr || units[0],
      };
    }
    return { value: val, unit: units[0] };
  };

  const { value, unit } = parseValue(fullValue);

  const handleValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;

    if (newValue === 'auto' || newValue === 'inherit') {
      updateConfig(propertyPath, newValue);
      return;
    }

    if (newValue === '') {
      updateConfig(propertyPath, '');
      return;
    }

    // Combine value with current unit
    const combined = unit ? `${newValue}${unit}` : newValue;
    updateConfig(propertyPath, combined);
  };

  const handleUnitChange = (event: any) => {
    const newUnit = event.target.value;

    if (value === 'auto' || value === 'inherit') {
      updateConfig(propertyPath, `0${newUnit}`);
      return;
    }

    const combined = `${value}${newUnit}`;
    updateConfig(propertyPath, combined);
  };

  const isSpecialValue = value === 'auto' || value === 'inherit';

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="body2" gutterBottom>
        {label}
        {description && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 0.5 }}
          >
            {description}
          </Typography>
        )}
      </Typography>
      <Stack direction="row" spacing={1}>
        <TextField
          value={value}
          onChange={handleValueChange}
          size="small"
          placeholder={allowAuto ? 'auto' : '0'}
          sx={{ flexGrow: 1 }}
          inputProps={{
            type: isSpecialValue ? 'text' : 'number',
            step: 'any',
          }}
        />
        {!isSpecialValue && (
          <FormControl size="small" sx={{ minWidth: 70 }}>
            <Select value={unit} onChange={handleUnitChange}>
              {units.map((u) => (
                <MenuItem key={u} value={u}>
                  {u}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Stack>
    </Box>
  );
};
