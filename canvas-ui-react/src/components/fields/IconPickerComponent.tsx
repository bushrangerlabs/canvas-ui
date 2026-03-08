import { Box, Typography } from '@mui/material';
import React from 'react';
import { IconifyPicker } from '../../edit/components/IconifyPicker';
import { useWidgetStore } from '../../store/widgetStore';

interface IconPickerComponentProps {
  label: string;
  propertyPath: string;
  description?: string;
}

export const IconPickerComponent: React.FC<IconPickerComponentProps> = ({
  label,
  propertyPath,
  description,
}) => {
  const { selectedWidget, updateConfig } = useWidgetStore();

  if (!selectedWidget) {
    return null;
  }

  const currentIcon = selectedWidget.config[propertyPath] || '';

  const handleChange = (newIcon: string) => {
    updateConfig(propertyPath, newIcon);
  };

  return (
    <Box sx={{ my: 1.5 }}>
      <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
        {label}
      </Typography>
      {description && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          {description}
        </Typography>
      )}
      <IconifyPicker value={currentIcon} onChange={handleChange} label={label} />
    </Box>
  );
};
