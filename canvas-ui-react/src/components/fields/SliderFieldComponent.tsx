import { Box, Slider, Stack, TextField, Typography } from '@mui/material';
import React from 'react';
import { useWidgetStore } from '../../store/widgetStore';

interface SliderFieldComponentProps {
  label: string;
  propertyPath: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  description?: string;
  marks?: boolean;
  showInput?: boolean;
}

export const SliderFieldComponent: React.FC<SliderFieldComponentProps> = ({
  label,
  propertyPath,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  description,
  marks = false,
  showInput = true,
}) => {
  const { selectedWidget, updateConfig } = useWidgetStore();

  if (!selectedWidget) {
    return null;
  }

  const value = selectedWidget.config[propertyPath] ?? min;

  const handleSliderChange = (_event: Event, newValue: number | number[]) => {
    const finalValue = Array.isArray(newValue) ? newValue[0] : newValue;
    updateConfig(propertyPath, finalValue);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value === '' ? min : Number(event.target.value);
    updateConfig(propertyPath, newValue);
  };

  const handleInputBlur = () => {
    if (value < min) {
      updateConfig(propertyPath, min);
    } else if (value > max) {
      updateConfig(propertyPath, max);
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box sx={{ flexGrow: 1 }}>
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
          <Slider
            value={typeof value === 'number' ? value : min}
            onChange={handleSliderChange}
            min={min}
            max={max}
            step={step}
            marks={marks}
            valueLabelDisplay="auto"
            valueLabelFormat={(val) => `${val}${unit}`}
            sx={{ mt: 1 }}
          />
        </Box>
        {showInput && (
          <TextField
            value={value}
            size="small"
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            inputProps={{
              step,
              min,
              max,
              type: 'number',
              'aria-labelledby': `${propertyPath}-slider`,
              style: { textAlign: 'right' },
            }}
            sx={{ width: 80 }}
            InputProps={{
              endAdornment: unit ? (
                <Typography variant="caption" color="text.secondary">
                  {unit}
                </Typography>
              ) : undefined,
            }}
          />
        )}
      </Stack>
    </Box>
  );
};
