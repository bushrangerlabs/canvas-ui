import ColorLensIcon from '@mui/icons-material/ColorLens';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, Tab, Tabs, TextField } from '@mui/material';
import React, { useState } from 'react';
import { RgbaColorPicker } from 'react-colorful';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

interface RgbaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

/**
 * Color picker component with dialog popup
 * Supports hex, rgb, rgba, and named colors
 */
export const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange, label }) => {
  const [open, setOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [tempColor, setTempColor] = useState(value);

  const handleOpen = () => {
    setTempColor(value);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSave = () => {
    onChange(tempColor);
    setOpen(false);
  };

  // Parse color string to rgba object
  const parseColor = (colorString: string): RgbaColor => {
    // Handle rgba/rgb format
    const rgbaMatch = colorString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (rgbaMatch) {
      return {
        r: parseInt(rgbaMatch[1]),
        g: parseInt(rgbaMatch[2]),
        b: parseInt(rgbaMatch[3]),
        a: rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1,
      };
    }

    // Handle hex format
    const hexMatch = colorString.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (hexMatch) {
      return {
        r: parseInt(hexMatch[1], 16),
        g: parseInt(hexMatch[2], 16),
        b: parseInt(hexMatch[3], 16),
        a: 1,
      };
    }

    // Handle named colors by creating a temporary canvas element
    const ctx = document.createElement('canvas').getContext('2d');
    if (ctx) {
      ctx.fillStyle = colorString;
      const computedColor = ctx.fillStyle;
      if (computedColor !== colorString) {
        // Color was valid and converted to hex
        return parseColor(computedColor);
      }
    }

    // Default to white
    return { r: 255, g: 255, b: 255, a: 1 };
  };

  // Convert rgba object to string
  const rgbaToString = (rgba: RgbaColor): string => {
    if (rgba.a === 1) {
      return `rgb(${rgba.r}, ${rgba.g}, ${rgba.b})`;
    }
    return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;
  };

  // Convert rgba to hex
  const rgbaToHex = (rgba: RgbaColor): string => {
    const r = rgba.r.toString(16).padStart(2, '0');
    const g = rgba.g.toString(16).padStart(2, '0');
    const b = rgba.b.toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  };

  const currentColor = parseColor(tempColor);

  const handleColorChange = (newColor: RgbaColor) => {
    setTempColor(rgbaToString(newColor));
  };

  const handleHexChange = (hex: string) => {
    setTempColor(hex);
  };

  const handleRgbChange = (field: 'r' | 'g' | 'b' | 'a', val: string) => {
    const color = parseColor(tempColor);
    const numVal = field === 'a' ? parseFloat(val) : parseInt(val);
    if (!isNaN(numVal)) {
      color[field] = numVal;
      setTempColor(rgbaToString(color));
    }
  };

  // Common color presets
  const colorPresets = [
    { name: 'Red', value: '#f44336' },
    { name: 'Pink', value: '#e91e63' },
    { name: 'Purple', value: '#9c27b0' },
    { name: 'Blue', value: '#2196f3' },
    { name: 'Cyan', value: '#00bcd4' },
    { name: 'Teal', value: '#009688' },
    { name: 'Green', value: '#4caf50' },
    { name: 'Lime', value: '#cddc39' },
    { name: 'Yellow', value: '#ffeb3b' },
    { name: 'Orange', value: '#ff9800' },
    { name: 'Brown', value: '#795548' },
    { name: 'Gray', value: '#9e9e9e' },
    { name: 'Black', value: '#000000' },
    { name: 'White', value: '#ffffff' },
  ];

  return (
    <>
      <TextField
        label={label}
        value={value}
        onClick={handleOpen}
        size="small"
        fullWidth
        InputProps={{
          readOnly: true,
          startAdornment: (
            <InputAdornment position="start">
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  backgroundColor: value,
                  border: '1px solid #ccc',
                  borderRadius: 1,
                }}
              />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton size="small" onClick={handleOpen}>
                <ColorLensIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{ cursor: 'pointer', mb: 2 }}
      />

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Color Picker</DialogTitle>
        <DialogContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
              <Tab label="Picker" />
              <Tab label="RGB" />
              <Tab label="Presets" />
            </Tabs>
          </Box>

          {/* Visual Color Picker Tab */}
          {tabValue === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <RgbaColorPicker color={currentColor} onChange={handleColorChange} />
              <TextField
                fullWidth
                label="Hex Color"
                value={rgbaToHex(currentColor)}
                onChange={(e) => handleHexChange(e.target.value)}
                size="small"
                placeholder="#000000"
              />
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    backgroundColor: tempColor,
                    border: '1px solid #ccc',
                    borderRadius: 1,
                  }}
                />
                <Box sx={{ flex: 1 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>Current Color</div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>{tempColor}</div>
                </Box>
              </Box>
            </Box>
          )}

          {/* RGB/RGBA Input Tab */}
          {tabValue === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  label="Red"
                  type="number"
                  value={currentColor.r}
                  onChange={(e) => handleRgbChange('r', e.target.value)}
                  inputProps={{ min: 0, max: 255 }}
                  size="small"
                  fullWidth
                />
                <TextField
                  label="Green"
                  type="number"
                  value={currentColor.g}
                  onChange={(e) => handleRgbChange('g', e.target.value)}
                  inputProps={{ min: 0, max: 255 }}
                  size="small"
                  fullWidth
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  label="Blue"
                  type="number"
                  value={currentColor.b}
                  onChange={(e) => handleRgbChange('b', e.target.value)}
                  inputProps={{ min: 0, max: 255 }}
                  size="small"
                  fullWidth
                />
                <TextField
                  label="Alpha"
                  type="number"
                  value={currentColor.a}
                  onChange={(e) => handleRgbChange('a', e.target.value)}
                  inputProps={{ min: 0, max: 1, step: 0.1 }}
                  size="small"
                  fullWidth
                />
              </Box>
              <TextField
                fullWidth
                label="Hex Color"
                value={rgbaToHex(currentColor)}
                onChange={(e) => handleHexChange(e.target.value)}
                size="small"
                placeholder="#000000"
              />
              <TextField
                fullWidth
                label="Or Enter Color Name"
                placeholder="e.g. red, blue, coral, etc."
                onChange={(e) => setTempColor(e.target.value)}
                size="small"
              />
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    backgroundColor: tempColor,
                    border: '1px solid #ccc',
                    borderRadius: 1,
                  }}
                />
                <Box sx={{ flex: 1 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>Current Color</div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>{tempColor}</div>
                </Box>
              </Box>
            </Box>
          )}

          {/* Color Presets Tab */}
          {tabValue === 2 && (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
              {colorPresets.map((preset) => (
                <Button
                  key={preset.value}
                  onClick={() => setTempColor(preset.value)}
                  variant={tempColor === preset.value ? 'contained' : 'outlined'}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.5,
                    p: 1,
                    minHeight: 60,
                  }}
                >
                  <Box
                    sx={{
                      width: 30,
                      height: 30,
                      backgroundColor: preset.value,
                      border: '1px solid #ccc',
                      borderRadius: 1,
                    }}
                  />
                  <span style={{ fontSize: '0.7rem' }}>{preset.name}</span>
                </Button>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Select
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
