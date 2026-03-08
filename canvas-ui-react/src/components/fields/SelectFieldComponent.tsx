import type { SelectChangeEvent } from '@mui/material';
import { Box, FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import { useWidgetStore } from '../../store/widgetStore';

interface SelectFieldComponentProps {
  label: string;
  propertyPath: string;
  options: Array<{ value: string | number; label: string }>;
  description?: string;
}

export function SelectFieldComponent({
  label,
  propertyPath,
  options,
  description,
}: SelectFieldComponentProps) {
  const { selectedWidget, updateConfig } = useWidgetStore();

  if (!selectedWidget) {
    return null;
  }

  const value = selectedWidget.config[propertyPath] ?? options[0]?.value ?? '';

  const handleChange = (event: SelectChangeEvent) => {
    updateConfig(propertyPath, event.target.value);
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
      <FormControl fullWidth size="small">
        {!description && <InputLabel>{label}</InputLabel>}
        <Select
          value={String(value)}
          label={!description ? label : undefined}
          onChange={handleChange}
        >
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
