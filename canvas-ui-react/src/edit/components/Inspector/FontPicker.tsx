/**
 * FontPicker Component
 * Visual font selector with system fonts and custom uploaded fonts
 * Shows font names in their own typeface for easy selection
 */

import * as MuiIcons from '@mui/icons-material';
import { Box, Button, Dialog, DialogContent, DialogTitle, List, ListItem, ListItemButton, ListItemText, TextField, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../../../shared/providers/WebSocketProvider';

interface FontPickerProps {
  value: string;
  onChange: (font: string) => void;
  label?: string;
}

// Common system fonts available on most platforms
const SYSTEM_FONTS = [
  { name: 'Arial', family: 'Arial, sans-serif' },
  { name: 'Helvetica', family: 'Helvetica, Arial, sans-serif' },
  { name: 'Times New Roman', family: '"Times New Roman", Times, serif' },
  { name: 'Georgia', family: 'Georgia, serif' },
  { name: 'Courier New', family: '"Courier New", Courier, monospace' },
  { name: 'Verdana', family: 'Verdana, Geneva, sans-serif' },
  { name: 'Trebuchet MS', family: '"Trebuchet MS", sans-serif' },
  { name: 'Comic Sans MS', family: '"Comic Sans MS", cursive' },
  { name: 'Impact', family: 'Impact, Charcoal, sans-serif' },
  { name: 'Lucida Console', family: '"Lucida Console", Monaco, monospace' },
  { name: 'Tahoma', family: 'Tahoma, Geneva, sans-serif' },
  { name: 'Palatino', family: '"Palatino Linotype", "Book Antiqua", Palatino, serif' },
  { name: 'Garamond', family: 'Garamond, serif' },
  { name: 'Bookman', family: '"Bookman Old Style", serif' },
  { name: 'Arial Black', family: '"Arial Black", Gadget, sans-serif' },
];

// Special fonts for specific use cases
const SPECIAL_FONTS = [
  { name: 'DSEG7 Classic', family: '"DSEG7 Classic", monospace', category: 'Digital Display' },
  { name: 'DSEG14 Classic', family: '"DSEG14 Classic", monospace', category: 'Digital Display' },
  { name: 'Orbitron', family: 'Orbitron, sans-serif', category: 'Modern' },
  { name: 'Roboto', family: 'Roboto, sans-serif', category: 'Modern' },
  { name: 'Open Sans', family: '"Open Sans", sans-serif', category: 'Modern' },
];

export const FontPicker: React.FC<FontPickerProps> = ({ value, onChange, label = 'Font Family' }) => {
  const { hass } = useWebSocket();
  const [open, setOpen] = useState(false);
  const [customFonts, setCustomFonts] = useState<Array<{ name: string; family: string; path: string }>>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (open && hass) {
      loadCustomFonts();
    }
  }, [open, hass]);

  const loadCustomFonts = async () => {
    if (!hass) return;

    try {
      const result = await hass.callService('canvas_ui', 'list_files_op', {
        path: '/config/www/fonts',
        recursive: false,
        return_response: true,
      });

      const serviceResult = result?.result?.response || result?.response || result;
      const files = serviceResult.files || [];

      // Filter for font files
      const fontFiles = files.filter((f: any) => 
        f.type === 'file' && 
        /\.(ttf|otf|woff|woff2)$/i.test(f.name)
      );

      // Load font faces first to get actual font family names
      const fontLoadPromises = fontFiles.map(async (f: any) => {
        try {
          const nameWithoutExt = f.name.replace(/\.(ttf|otf|woff|woff2)$/i, '');
          const fontPath = `/local/fonts/${f.name}`;
          
          // Determine format based on file extension
          const ext = f.name.match(/\.(ttf|otf|woff|woff2)$/i)?.[1]?.toLowerCase();
          const formatMap: Record<string, string> = {
            'ttf': 'truetype',
            'otf': 'opentype',
            'woff': 'woff',
            'woff2': 'woff2'
          };
          const format = formatMap[ext || 'ttf'];
          
          // Load font with format specified for better compatibility
          const fontFace = new FontFace(nameWithoutExt, `url('${fontPath}') format('${format}')`);
          const loadedFace = await fontFace.load();
          
          // Get the actual font family from the loaded font
          const actualFontFamily = loadedFace.family;
          
          document.fonts.add(loadedFace);
          console.log(`Loaded custom font: ${nameWithoutExt} (family: ${actualFontFamily})`);
          
          return {
            name: nameWithoutExt,
            family: actualFontFamily,
            path: fontPath,
          };
        } catch (error) {
          console.error(`Failed to load font ${f.name}:`, error);
          return null;
        }
      });

      // Wait for all fonts to load
      const loadedFonts = await Promise.all(fontLoadPromises);
      
      // Filter out any failed loads and set state
      const validFonts = loadedFonts.filter(f => f !== null);
      setCustomFonts(validFonts);
    } catch (error) {
      console.error('Failed to load custom fonts:', error);
    }
  };

  const allFonts = [
    ...SYSTEM_FONTS.map(f => ({ ...f, category: 'System' })),
    ...SPECIAL_FONTS,
    ...customFonts.map(f => ({ ...f, category: 'Custom' })),
  ];

  const filteredFonts = allFonts.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedFonts = filteredFonts.reduce((acc, font) => {
    const category = font.category || 'System';
    if (!acc[category]) acc[category] = [];
    acc[category].push(font);
    return acc;
  }, {} as Record<string, typeof allFonts>);

  const handleSelect = (fontFamily: string) => {
    onChange(fontFamily);
    setOpen(false);
  };

  // Get display name from font family value
  const getDisplayName = () => {
    const font = allFonts.find(f => f.family === value);
    return font?.name || value || 'Default';
  };

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
          {label}
        </Typography>
        <Button
          fullWidth
          variant="outlined"
          onClick={() => setOpen(true)}
          sx={{
            justifyContent: 'space-between',
            textTransform: 'none',
            fontFamily: value || 'inherit',
          }}
          endIcon={<MuiIcons.ArrowDropDown />}
        >
          {getDisplayName()}
        </Button>
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Select Font
          <TextField
            fullWidth
            size="small"
            placeholder="Search fonts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mt: 1 }}
            InputProps={{
              startAdornment: <MuiIcons.Search sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <List>
            {Object.entries(groupedFonts).map(([category, fonts]) => (
              <React.Fragment key={category}>
                <ListItem sx={{ bgcolor: 'action.hover', py: 0.5 }}>
                  <Typography variant="caption" fontWeight="bold" color="text.secondary">
                    {category}
                  </Typography>
                </ListItem>
                {fonts.map((font) => (
                  <ListItemButton
                    key={font.name}
                    selected={value === font.family}
                    onClick={() => handleSelect(font.family)}
                  >
                    <ListItemText
                      primary={font.name}
                      primaryTypographyProps={{
                        fontFamily: font.family,
                        fontSize: 16,
                      }}
                      secondary={font.family}
                      secondaryTypographyProps={{
                        fontSize: 11,
                        fontFamily: 'monospace',
                      }}
                    />
                  </ListItemButton>
                ))}
              </React.Fragment>
            ))}

            {filteredFonts.length === 0 && (
              <ListItem>
                <ListItemText
                  primary="No fonts found"
                  secondary="Try a different search term"
                  sx={{ textAlign: 'center', py: 4 }}
                />
              </ListItem>
            )}
          </List>
        </DialogContent>
      </Dialog>
    </>
  );
};
