import { Box, Button, IconButton, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { BindingEvaluator } from '../../shared/utils/BindingEvaluator';
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

  // Stored value (may be hex string or binding expression like "{input_text.my_color}")
  const storedValue: string = selectedWidget?.config[propertyPath] ?? '#000000';

  const isBinding = BindingEvaluator.hasBinding(storedValue);

  // Check if the stored value looks like a valid CSS color for the swatch
  const isValidColor = (color: string): boolean => {
    if (!color) return false;
    return /^#([0-9a-f]{3,8})$/i.test(color) ||
      /^(rgb|hsl)a?\(/.test(color) ||
      /^[a-z]+$/i.test(color);
  };

  const swatchColor = !isBinding && isValidColor(storedValue) ? storedValue : null;

  if (!selectedWidget) return null;

  const handleTextChange = (newValue: string) => {
    updateConfig(propertyPath, newValue);
  };

  const handlePickerChange = (hex: string) => {
    updateConfig(propertyPath, hex);
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
        <Stack direction="row" spacing={0.5} alignItems="center">
          {/* Text input — accepts hex values or {binding} expressions */}
          <TextField
            label={!description ? label : undefined}
            value={storedValue}
            onChange={(e) => handleTextChange(e.target.value)}
            fullWidth
            size="small"
            placeholder="#rrggbb or {entity.id}"
            inputProps={{ style: { fontFamily: 'monospace', fontSize: 13 } }}
          />

          {/* Color picker button — disabled when a binding is stored */}
          <Tooltip title={isBinding ? 'Binding active — clear binding to use picker' : 'Open color picker'}>
            <span>
              <IconButton
                size="small"
                onClick={() => setShowPicker(prev => !prev)}
                disabled={isBinding}
                sx={{
                  width: 32,
                  height: 32,
                  border: '1px solid',
                  borderColor: showPicker ? 'primary.main' : 'divider',
                  borderRadius: 1,
                  p: 0,
                  flexShrink: 0,
                  overflow: 'hidden',
                  bgcolor: swatchColor ?? 'transparent',
                  // Striped pattern when color is invalid/unknown
                  ...(!swatchColor && {
                    backgroundImage: 'repeating-linear-gradient(45deg, #555 0px, #555 4px, #333 4px, #333 8px)',
                  }),
                  '&:hover': {
                    opacity: 0.85,
                  },
                  '&.Mui-disabled': {
                    opacity: 0.5,
                    cursor: 'not-allowed',
                  },
                }}
              />
            </span>
          </Tooltip>

          {/* Binding active indicator — shown instead of picker button when a binding is stored */}
          {isBinding && (
            <Tooltip title="Binding expression stored — widget will resolve this at runtime">
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  flexShrink: 0,
                  border: '2px solid',
                  borderColor: 'primary.main',
                  borderRadius: 1,
                  backgroundImage: 'repeating-linear-gradient(45deg, #555 0px, #555 4px, #333 4px, #333 8px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  userSelect: 'none',
                }}
              >
                🔗
              </Box>
            </Tooltip>
          )}
        </Stack>

        {/* Color picker popup — only when picker button is active (no binding) */}
        {showPicker && !isBinding && (
          <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, boxShadow: 3 }}>
            <HexColorPicker
              color={swatchColor?.startsWith('#') ? swatchColor : '#000000'}
              onChange={handlePickerChange}
            />
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
