import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { useWidgetStore } from '../../store/widgetStore';

interface ColorFieldComponentProps {
  label: string;
  propertyPath: string;
  description?: string;
}

export function ColorFieldComponent({
  label,
  propertyPath,
  description,
}: ColorFieldComponentProps) {
  const { selectedWidget, updateConfig } = useWidgetStore();
  const [showPicker, setShowPicker] = useState(false);

  if (!selectedWidget) {
    return null;
  }

  const value = selectedWidget.config[propertyPath] || '#000000';

  const handleChange = (newValue: string) => {
    updateConfig(propertyPath, newValue);
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
      <Stack spacing={1}>
        <TextField
          label={!description ? label : undefined}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          fullWidth
          size="small"
          InputProps={{
            endAdornment: (
              <Box
                onClick={() => setShowPicker(!showPicker)}
                sx={{
                  width: 32,
                  height: 32,
                  backgroundColor: value,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  cursor: 'pointer',
                }}
              />
            ),
          }}
        />
        {showPicker && (
          <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, boxShadow: 2 }}>
            <HexColorPicker color={value} onChange={handleChange} />
            <Button
              fullWidth
              size="small"
              onClick={() => setShowPicker(false)}
              sx={{ mt: 1 }}
            >
              Close
            </Button>
          </Box>
        )}
      </Stack>
    </Box>
  );
}
