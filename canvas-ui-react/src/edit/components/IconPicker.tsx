/**
 * IconPicker Component - Dynamic loading of full icon libraries
 * Loads icons on-demand to reduce bundle size
 */

import { Close as CloseIcon } from '@mui/icons-material';
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Tab,
    Tabs,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { UniversalIcon } from '../../shared/components/UniversalIcon';

import {
    categorizeMDIIcon,
    getIconCategories,
    getMDIIconNames
} from '../../shared/utils/iconLoader';

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  label?: string;
}

interface IconItem {
  name: string;
  value: string;
  category: string;
}

// Popular emoji icons (lightweight, always loaded)
const EMOJI_ICONS: IconItem[] = [
  { name: 'Lightbulb', value: 'emoji:💡', category: 'lighting' },
  { name: 'Home', value: 'emoji:🏠', category: 'home' },
  { name: 'Door', value: 'emoji:🚪', category: 'home' },
  { name: 'Lock', value: 'emoji:🔒', category: 'security' },
  { name: 'Unlock', value: 'emoji:🔓', category: 'security' },
  { name: 'Key', value: 'emoji:🔑', category: 'security' },
  { name: 'Camera', value: 'emoji:📷', category: 'security' },
  { name: 'Thermometer', value: 'emoji:🌡️', category: 'climate' },
  { name: 'Fire', value: 'emoji:🔥', category: 'climate' },
  { name: 'Snowflake', value: 'emoji:❄️', category: 'climate' },
  { name: 'Fan', value: 'emoji:🌀', category: 'climate' },
  { name: 'Music', value: 'emoji:🎵', category: 'media' },
  { name: 'Speaker', value: 'emoji:🔊', category: 'media' },
  { name: 'TV', value: 'emoji:📺', category: 'media' },
  { name: 'Sun', value: 'emoji:☀️', category: 'weather' },
  { name: 'Cloud', value: 'emoji:☁️', category: 'weather' },
  { name: 'Rain', value: 'emoji:🌧️', category: 'weather' },
  { name: 'Power', value: 'emoji:⚡', category: 'controls' },
  { name: 'Battery', value: 'emoji:🔋', category: 'utilities' },
  { name: 'Water', value: 'emoji:💧', category: 'utilities' },
];

// Sample FontAwesome 6 Solid icons
const FA_SAMPLE_ICONS: IconItem[] = [
  { name: 'House', value: 'fa6-solid:house', category: 'general' },
  { name: 'User', value: 'fa6-solid:user', category: 'general' },
  { name: 'Heart', value: 'fa6-solid:heart', category: 'general' },
  { name: 'Star', value: 'fa6-solid:star', category: 'general' },
  { name: 'Gear', value: 'fa6-solid:gear', category: 'general' },
  { name: 'Bell', value: 'fa6-solid:bell', category: 'general' },
  { name: 'Lightbulb', value: 'fa6-solid:lightbulb', category: 'lighting' },
  { name: 'Lock', value: 'fa6-solid:lock', category: 'security' },
  { name: 'Unlock', value: 'fa6-solid:unlock', category: 'security' },
  { name: 'Key', value: 'fa6-solid:key', category: 'security' },
  { name: 'Camera', value: 'fa6-solid:camera', category: 'security' },
  { name: 'Temperature High', value: 'fa6-solid:temperature-high', category: 'climate' },
  { name: 'Fan', value: 'fa6-solid:fan', category: 'climate' },
  { name: 'Music', value: 'fa6-solid:music', category: 'media' },
  { name: 'Volume High', value: 'fa6-solid:volume-high', category: 'media' },
  { name: 'TV', value: 'fa6-solid:tv', category: 'media' },
  { name: 'Sun', value: 'fa6-solid:sun', category: 'weather' },
  { name: 'Cloud', value: 'fa6-solid:cloud', category: 'weather' },
  { name: 'Bolt', value: 'fa6-solid:bolt', category: 'controls' },
  { name: 'Battery Full', value: 'fa6-solid:battery-full', category: 'utilities' },
];

// Sample Material Symbols icons
const MATERIAL_SAMPLE_ICONS: IconItem[] = [
  { name: 'Home', value: 'material-symbols:home', category: 'general' },
  { name: 'Person', value: 'material-symbols:person', category: 'general' },
  { name: 'Favorite', value: 'material-symbols:favorite', category: 'general' },
  { name: 'Star', value: 'material-symbols:star', category: 'general' },
  { name: 'Settings', value: 'material-symbols:settings', category: 'general' },
  { name: 'Notifications', value: 'material-symbols:notifications', category: 'general' },
  { name: 'Lightbulb', value: 'material-symbols:lightbulb', category: 'lighting' },
  { name: 'Lock', value: 'material-symbols:lock', category: 'security' },
  { name: 'Lock Open', value: 'material-symbols:lock-open', category: 'security' },
  { name: 'Key', value: 'material-symbols:key', category: 'security' },
  { name: 'Camera', value: 'material-symbols:photo-camera', category: 'security' },
  { name: 'Thermostat', value: 'material-symbols:thermostat', category: 'climate' },
  { name: 'Air', value: 'material-symbols:air', category: 'climate' },
  { name: 'Music Note', value: 'material-symbols:music-note', category: 'media' },
  { name: 'Volume Up', value: 'material-symbols:volume-up', category: 'media' },
  { name: 'TV', value: 'material-symbols:tv', category: 'media' },
  { name: 'Light Mode', value: 'material-symbols:light-mode', category: 'weather' },
  { name: 'Cloud', value: 'material-symbols:cloud', category: 'weather' },
  { name: 'Bolt', value: 'material-symbols:bolt', category: 'controls' },
  { name: 'Battery Full', value: 'material-symbols:battery-full', category: 'utilities' },
];

// Sample Bootstrap Icons
const BOOTSTRAP_SAMPLE_ICONS: IconItem[] = [
  { name: 'House', value: 'bi:house', category: 'general' },
  { name: 'Person', value: 'bi:person', category: 'general' },
  { name: 'Heart', value: 'bi:heart', category: 'general' },
  { name: 'Star', value: 'bi:star', category: 'general' },
  { name: 'Gear', value: 'bi:gear', category: 'general' },
  { name: 'Bell', value: 'bi:bell', category: 'general' },
  { name: 'Lightbulb', value: 'bi:lightbulb', category: 'lighting' },
  { name: 'Lock', value: 'bi:lock', category: 'security' },
  { name: 'Unlock', value: 'bi:unlock', category: 'security' },
  { name: 'Key', value: 'bi:key', category: 'security' },
  { name: 'Camera', value: 'bi:camera', category: 'security' },
  { name: 'Thermometer', value: 'bi:thermometer', category: 'climate' },
  { name: 'Fan', value: 'bi:fan', category: 'climate' },
  { name: 'Music Note', value: 'bi:music-note', category: 'media' },
  { name: 'Volume Up', value: 'bi:volume-up', category: 'media' },
  { name: 'TV', value: 'bi:tv', category: 'media' },
  { name: 'Sun', value: 'bi:sun', category: 'weather' },
  { name: 'Cloud', value: 'bi:cloud', category: 'weather' },
  { name: 'Lightning', value: 'bi:lightning', category: 'controls' },
  { name: 'Battery Full', value: 'bi:battery-full', category: 'utilities' },
];

// Sample Ionicons
const IONICONS_SAMPLE_ICONS: IconItem[] = [
  { name: 'Home', value: 'ion:home', category: 'general' },
  { name: 'Person', value: 'ion:person', category: 'general' },
  { name: 'Heart', value: 'ion:heart', category: 'general' },
  { name: 'Star', value: 'ion:star', category: 'general' },
  { name: 'Settings', value: 'ion:settings', category: 'general' },
  { name: 'Notifications', value: 'ion:notifications', category: 'general' },
  { name: 'Bulb', value: 'ion:bulb', category: 'lighting' },
  { name: 'Lock Closed', value: 'ion:lock-closed', category: 'security' },
  { name: 'Lock Open', value: 'ion:lock-open', category: 'security' },
  { name: 'Key', value: 'ion:key', category: 'security' },
  { name: 'Camera', value: 'ion:camera', category: 'security' },
  { name: 'Thermometer', value: 'ion:thermometer', category: 'climate' },
  { name: 'Musical Notes', value: 'ion:musical-notes', category: 'media' },
  { name: 'Volume High', value: 'ion:volume-high', category: 'media' },
  { name: 'TV', value: 'ion:tv', category: 'media' },
  { name: 'Sunny', value: 'ion:sunny', category: 'weather' },
  { name: 'Cloud', value: 'ion:cloud', category: 'weather' },
  { name: 'Flash', value: 'ion:flash', category: 'controls' },
  { name: 'Battery Full', value: 'ion:battery-full', category: 'utilities' },
];

// Helper function to categorize generic icons
const categorizeIcon = (name: string): string => {
  const lower = name.toLowerCase();
  if (lower.includes('home') || lower.includes('house') || lower.includes('door')) return 'home';
  if (lower.includes('light') || lower.includes('bulb') || lower.includes('lamp')) return 'lighting';
  if (lower.includes('lock') || lower.includes('key') || lower.includes('security') || lower.includes('camera')) return 'security';
  if (lower.includes('temp') || lower.includes('thermo') || lower.includes('heat') || lower.includes('cool') || lower.includes('fan') || lower.includes('air')) return 'climate';
  if (lower.includes('music') || lower.includes('sound') || lower.includes('volume') || lower.includes('speaker') || lower.includes('tv') || lower.includes('media')) return 'media';
  if (lower.includes('sun') || lower.includes('cloud') || lower.includes('rain') || lower.includes('weather') || lower.includes('snow')) return 'weather';
  if (lower.includes('power') || lower.includes('switch') || lower.includes('toggle') || lower.includes('button')) return 'controls';
  if (lower.includes('battery') || lower.includes('plug') || lower.includes('water')) return 'utilities';
  return 'general';
};

// Load FontAwesome icons from Iconify API
const loadFontAwesomeIcons = async (): Promise<IconItem[]> => {
  try {
    const response = await fetch('https://api.iconify.design/collection?prefix=fa6-solid');
    const data = await response.json();
    if (data.uncategorized) {
      return data.uncategorized.map((iconName: string) => ({
        name: iconName.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        value: `fa6-solid:${iconName}`,
        category: categorizeIcon(iconName),
      }));
    }
    return FA_SAMPLE_ICONS;
  } catch (error) {
    console.error('Error loading FontAwesome icons:', error);
    return FA_SAMPLE_ICONS;
  }
};

// Load Material Symbols icons from Iconify API
const loadMaterialIcons = async (): Promise<IconItem[]> => {
  try {
    const response = await fetch('https://api.iconify.design/collection?prefix=material-symbols');
    const data = await response.json();
    if (data.uncategorized) {
      return data.uncategorized.map((iconName: string) => ({
        name: iconName.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        value: `material-symbols:${iconName}`,
        category: categorizeIcon(iconName),
      }));
    }
    return MATERIAL_SAMPLE_ICONS;
  } catch (error) {
    console.error('Error loading Material icons:', error);
    return MATERIAL_SAMPLE_ICONS;
  }
};

// Load Bootstrap icons from Iconify API
const loadBootstrapIcons = async (): Promise<IconItem[]> => {
  try {
    const response = await fetch('https://api.iconify.design/collection?prefix=bi');
    const data = await response.json();
    if (data.uncategorized) {
      return data.uncategorized.map((iconName: string) => ({
        name: iconName.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        value: `bi:${iconName}`,
        category: categorizeIcon(iconName),
      }));
    }
    return BOOTSTRAP_SAMPLE_ICONS;
  } catch (error) {
    console.error('Error loading Bootstrap icons:', error);
    return BOOTSTRAP_SAMPLE_ICONS;
  }
};

// Load Ionicons from Iconify API
const loadIonicons = async (): Promise<IconItem[]> => {
  try {
    const response = await fetch('https://api.iconify.design/collection?prefix=ion');
    const data = await response.json();
    if (data.uncategorized) {
      return data.uncategorized.map((iconName: string) => ({
        name: iconName.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        value: `ion:${iconName}`,
        category: categorizeIcon(iconName),
      }));
    }
    return IONICONS_SAMPLE_ICONS;
  } catch (error) {
    console.error('Error loading Ionicons:', error);
    return IONICONS_SAMPLE_ICONS;
  }
};

export const IconPicker: React.FC<IconPickerProps> = ({ value, onChange, label = 'Icon' }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [iconType, setIconType] = useState<'emoji' | 'mdi' | 'fa' | 'material' | 'bootstrap' | 'ionicons'>('emoji');
  const [selectedIcon, setSelectedIcon] = useState(value);
  const [iconList, setIconList] = useState<IconItem[]>(EMOJI_ICONS);
  const [loading, setLoading] = useState(false);

  // Find Solid Variant feature states
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [foundVariants, setFoundVariants] = useState<string[]>([]);
  const [selectedVariant, setSelectedVariant] = useState('');
  const [searching, setSearching] = useState(false);
  const [variantError, setVariantError] = useState('');

  const categories = getIconCategories();

  // Load icons when type changes
  useEffect(() => {
    if (!open) return;

    const loadIcons = async () => {
      setLoading(true);
      
      try {
        if (iconType === 'emoji') {
          setIconList(EMOJI_ICONS);
        } else if (iconType === 'mdi') {
          const names = await getMDIIconNames();
          const icons: IconItem[] = names.map(name => {
            // Convert mdiAccountArrowRight to account-arrow-right for iconify
            const iconName = name
              .replace(/^mdi/, '') // Remove 'mdi' prefix
              .replace(/([A-Z])/g, '-$1') // Add dash before capitals
              .toLowerCase() // Convert to lowercase
              .replace(/^-/, ''); // Remove leading dash
            
            return {
              name: name.replace('mdi', '').replace(/([A-Z])/g, ' $1').trim(),
              value: `mdi:${iconName}`,
              category: categorizeMDIIcon(name),
            };
          });
          setIconList(icons);
        } else if (iconType === 'fa') {
          const icons = await loadFontAwesomeIcons();
          setIconList(icons);
        } else if (iconType === 'material') {
          const icons = await loadMaterialIcons();
          setIconList(icons);
        } else if (iconType === 'bootstrap') {
          const icons = await loadBootstrapIcons();
          setIconList(icons);
        } else if (iconType === 'ionicons') {
          const icons = await loadIonicons();
          setIconList(icons);
        }
      } catch (error) {
        console.error('Error loading icons:', error);
      } finally {
        setLoading(false);
      }
    };

    loadIcons();
  }, [iconType, open]);



  const handleOpen = () => setOpen(true);
  
  const handleClose = () => {
    setOpen(false);
    setSearch('');
  };

  const handleSelect = (iconValue: string) => {
    setSelectedIcon(iconValue);
  };

  const handleConfirm = () => {
    onChange(selectedIcon);
    handleClose();
  };

  // Find Solid Variant feature handlers
  const handleFindSolidVariant = async () => {
    if (!selectedIcon || selectedIcon.startsWith('emoji:')) {
      setVariantError('Cannot search variants for emoji icons');
      return;
    }

    setSearching(true);
    setVariantError('');
    setFoundVariants([]);

    try {
      const [prefix, name] = selectedIcon.split(':');
      const candidates: string[] = [];

      // Generate possible solid variant names based on icon prefix
      switch (prefix) {
        case 'fa6-regular':
          // Font Awesome: try fa6-solid
          candidates.push(`fa6-solid:${name}`);
          break;
        
        case 'mdi':
          // Material Design Icons: try removing -outline suffix
          if (name.endsWith('-outline')) {
            candidates.push(`mdi:${name.replace('-outline', '')}`);
          }
          // Also try adding -fill
          candidates.push(`mdi:${name}-fill`);
          break;
        
        case 'ion':
          // Ionicons: remove -outline or -sharp suffix
          if (name.endsWith('-outline')) {
            candidates.push(`ion:${name.replace('-outline', '')}`);
          }
          if (name.endsWith('-sharp')) {
            candidates.push(`ion:${name.replace('-sharp', '')}`);
          }
          break;
        
        case 'ph':
          // Phosphor: add -fill suffix
          candidates.push(`ph:${name}-fill`);
          break;
        
        case 'bi':
          // Bootstrap Icons: add -fill suffix
          candidates.push(`bi:${name}-fill`);
          break;
        
        case 'heroicons':
          // Heroicons: try heroicons-solid
          candidates.push(`heroicons-solid:${name}`);
          break;
        
        case 'carbon':
          // Carbon: add -filled suffix
          candidates.push(`carbon:${name}-filled`);
          break;
        
        case 'material-symbols':
          // Material Symbols: remove -outlined, add -filled
          if (name.endsWith('-outlined')) {
            const baseName = name.replace('-outlined', '');
            candidates.push(`material-symbols:${baseName}-filled`);
            candidates.push(`material-symbols:${baseName}`);
          } else {
            candidates.push(`material-symbols:${name}-filled`);
          }
          break;
        
        default:
          // Generic attempts for any icon set
          if (name.endsWith('-outline')) {
            candidates.push(`${prefix}:${name.replace('-outline', '')}`);
          }
          candidates.push(`${prefix}:${name}-fill`);
          candidates.push(`${prefix}:${name}-filled`);
          candidates.push(`${prefix}:${name}-solid`);
          break;
      }

      // Test each candidate to see if it exists
      const validVariants: string[] = [];
      
      for (const candidate of candidates) {
        const [candidatePrefix, candidateName] = candidate.split(':');
        try {
          const response = await fetch(
            `https://api.iconify.design/${candidatePrefix}/${candidateName}.svg`,
            { method: 'HEAD' }
          );
          if (response.ok) {
            validVariants.push(candidate);
          }
        } catch {
          // Silently skip failed candidates
        }
      }

      if (validVariants.length === 0) {
        setVariantError(`No solid variant found. Try searching for "${prefix}:${name.replace('-outline', '')}" or "${name}-fill" manually.`);
      } else {
        setFoundVariants(validVariants);
        setSelectedVariant(validVariants[0]);
        setVariantDialogOpen(true);
      }

      setSearching(false);

    } catch (error: unknown) {
      console.error('Variant search error:', error);
      setVariantError(error instanceof Error ? error.message : 'Failed to search for solid variants.');
      setSearching(false);
    }
  };

  const handleCloseVariantDialog = () => {
    setVariantDialogOpen(false);
    setFoundVariants([]);
    setSelectedVariant('');
    setVariantError('');
  };

  const handleSelectVariant = () => {
    if (selectedVariant) {
      handleSelect(selectedVariant);
      handleCloseVariantDialog();
    }
  };



  const filteredIcons = iconList.filter(icon => {
    const matchesCategory = category === 'all' || icon.category === category;
    const matchesSearch = search === '' || 
      icon.name.toLowerCase().includes(search.toLowerCase()) ||
      icon.value.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Limit display for performance
  const displayIcons = filteredIcons.slice(0, 200);

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label={label}
          value={value}
          onClick={handleOpen}
          InputProps={{
            readOnly: true,
            startAdornment: (
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                <UniversalIcon icon={value} size={24} />
              </Box>
            ),
          }}
          size="small"
          sx={{ cursor: 'pointer' }}
        />
      </Box>

      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Select Icon
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <ToggleButtonGroup
              value={iconType}
              exclusive
              onChange={(_, newType) => newType && setIconType(newType)}
              fullWidth
              size="small"
            >
              <ToggleButton value="emoji">EMOJI</ToggleButton>
              <ToggleButton value="mdi">MDI</ToggleButton>
              <ToggleButton value="fa">FA</ToggleButton>
              <ToggleButton value="material">Material</ToggleButton>
              <ToggleButton value="bootstrap">Bootstrap</ToggleButton>
              <ToggleButton value="ionicons">Ionicons</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <TextField
            fullWidth
            placeholder="Search icons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ mb: 2 }}
          />

          <Tabs
            value={category}
            onChange={(_, newValue) => setCategory(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
          >
            {categories.map(cat => (
              <Tab key={cat.value} label={cat.label} value={cat.value} />
            ))}
          </Tabs>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Box sx={{ 
                maxHeight: 400, 
                overflowY: 'auto',
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                p: 1,
              }}>
                <Box sx={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                  gap: 1,
                }}>
                  {displayIcons.map(icon => (
                    <Box
                      key={icon.value}
                      onClick={() => handleSelect(icon.value)}
                      sx={{
                        aspectRatio: '1',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        border: 2,
                        borderColor: selectedIcon === icon.value ? 'primary.main' : 'transparent',
                        borderRadius: 1,
                        p: 1,
                        position: 'relative',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: 'action.hover',
                          borderColor: 'primary.light',
                        },
                      }}
                    >
                      <Box sx={{ fontSize: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <UniversalIcon icon={icon.value} size={32} />
                      </Box>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          mt: 0.5, 
                          fontSize: 9,
                          textAlign: 'center',
                          wordBreak: 'break-word',
                          lineHeight: 1.1,
                        }}
                      >
                        {icon.name}
                      </Typography>
                    </Box>
                  ))}
                </Box>
                
                {displayIcons.length === 0 && (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">
                      No icons found
                    </Typography>
                  </Box>
                )}

                {filteredIcons.length > 200 && (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Showing first 200 of {filteredIcons.length} icons. Use search to narrow results.
                    </Typography>
                  </Box>
                )}
              </Box>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'space-between' }}>
          <Button 
            onClick={handleFindSolidVariant} 
            disabled={!selectedIcon || selectedIcon.startsWith('emoji:') || searching}
            startIcon={searching ? <CircularProgress size={16} /> : undefined}
          >
            {searching ? 'Searching...' : 'Find Solid Variant'}
          </Button>
          {variantError && (
            <Typography variant="caption" color="error" sx={{ flex: 1, mx: 2 }}>
              {variantError}
            </Typography>
          )}
          <Box>
            <Button onClick={handleClose} sx={{ mr: 1 }}>Cancel</Button>
            <Button onClick={handleConfirm} variant="contained">
              Select
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Solid Variant Finder Dialog */}
      <Dialog open={variantDialogOpen} onClose={handleCloseVariantDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Solid Variant Found
          <IconButton
            onClick={handleCloseVariantDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {foundVariants.length > 0 ? (
            <>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Found {foundVariants.length} solid variant{foundVariants.length > 1 ? 's' : ''} for this icon:
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {foundVariants.map(variant => (
                  <Box
                    key={variant}
                    onClick={() => setSelectedVariant(variant)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 1.5,
                      border: 2,
                      borderColor: selectedVariant === variant ? 'primary.main' : 'divider',
                      borderRadius: 1,
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <Box sx={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <UniversalIcon icon={variant} size={40} color="#fff" />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1">{variant}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {variant.split(':')[0]} collection
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </>
          ) : (
            <Typography>No solid variants found.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseVariantDialog}>Cancel</Button>
          <Button 
            onClick={handleSelectVariant} 
            variant="contained"
            disabled={!selectedVariant}
          >
            Use This Variant
          </Button>
        </DialogActions>
      </Dialog>

    </>
  );
};
