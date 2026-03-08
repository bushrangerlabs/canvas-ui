import { Box, TextField, Typography } from '@mui/material';
import React from 'react';
import { useWidgetStore } from '../../store/widgetStore';

interface TextFieldComponentProps {
  label: string;
  propertyPath: string;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  type?: 'text' | 'email' | 'password' | 'url';
  description?: string;
}

export function TextFieldComponent({
  label,
  propertyPath,
  placeholder,
  multiline = false,
  rows = 3,
  type = 'text',
  description,
}: TextFieldComponentProps) {
  const { selectedWidget, updateConfig } = useWidgetStore();

  if (!selectedWidget) {
    return null;
  }

  const value = selectedWidget.config[propertyPath] || '';

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
      <TextField
        label={!description ? label : undefined}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        multiline={multiline}
        rows={multiline ? rows : undefined}
        type={type}
        fullWidth
        size="small"
      />
    </Box>
  );
}
