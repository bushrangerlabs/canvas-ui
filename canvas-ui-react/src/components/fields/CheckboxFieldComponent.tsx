import { Box, Checkbox, FormControlLabel, Typography } from '@mui/material';
import React from 'react';
import { useWidgetStore } from '../../store/widgetStore';

interface CheckboxFieldComponentProps {
  label: string;
  propertyPath: string;
  description?: string;
}

/**
 * The checkbox that actually works!
 * No event bubbling bugs, no stopPropagation issues.
 */
export function CheckboxFieldComponent({
  label,
  propertyPath,
  description,
}: CheckboxFieldComponentProps) {
  const { selectedWidget, updateConfig } = useWidgetStore();

  if (!selectedWidget) {
    return null;
  }

  const checked = selectedWidget.config[propertyPath] ?? false;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    console.log(`[CheckboxField] ${label} changed to:`, newValue);
    updateConfig(propertyPath, newValue);
  };

  return (
    <Box sx={{ mb: 2 }}>
      {description && (
        <Typography variant="body2" gutterBottom>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 0.5 }}
          >
            {description}
          </Typography>
        </Typography>
      )}
      <FormControlLabel
        control={
          <Checkbox
            checked={checked}
            onChange={handleChange}
          />
        }
        label={label}
      />
    </Box>
  );
}
