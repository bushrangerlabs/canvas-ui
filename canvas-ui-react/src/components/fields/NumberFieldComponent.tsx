import { Box, InputAdornment, TextField, Typography } from '@mui/material';
import React from 'react';
import { useWidgetStore } from '../../store/widgetStore';

interface NumberFieldComponentProps {
  label: string;
  propertyPath: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  description?: string;
}

export function NumberFieldComponent({
  label,
  propertyPath,
  min,
  max,
  step = 1,
  unit,
  description,
}: NumberFieldComponentProps) {
  const { selectedWidget, updateConfig } = useWidgetStore();

  if (!selectedWidget) {
    return null;
  }

  const value = selectedWidget.config[propertyPath] ?? min ?? 0;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateConfig(propertyPath, Number(event.target.value));
  };

  return (
    <Box sx={{ mb: 2 }}>
      {description && (
        <Typography variant="body2" gutterBottom>
          {label}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 0.5 }}
          >
            {description}
          </Typography>
        </Typography>
      )}
      <TextField
        label={!description ? label : undefined}
        type="number"
        value={value}
        onChange={handleChange}
        inputProps={{ min, max, step }}
        InputProps={{
          endAdornment: unit ? (
            <InputAdornment position="end">
              <Typography variant="caption" color="text.secondary">
                {unit}
              </Typography>
            </InputAdornment>
          ) : undefined,
        }}
        fullWidth
        size="small"
      />
    </Box>
  );
}
