/**
 * Iconify Icon Picker - Modern icon picker with progressive caching
 * 
 * Features:
 * - 40k+ icons from iconify.design (online API)
 * - Auto-caching to server when icons selected
 * - Search across all icon sets
 * - Favorites & recent icons
 * - Category filtering
 * - Works offline after icons cached
 */

import { Icon } from '@iconify/react';
import { Close as CloseIcon, Search, Star, StarOutline } from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    InputAdornment,
    Tab,
    Tabs,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { ICON_CATEGORIES, ICON_COLLECTIONS } from '../../../scripts/core-icons';
import { cacheIconViaService } from '../../shared/api/iconCacheService';
import {
    IconPreferences,
    listCollectionIcons,
    searchIcons,
} from '../../shared/utils/iconCache';

interface IconifyPickerProps {
  value: string;
  onChange: (icon: string) => void;
  label?: string;
}

interface IconItem {
  name: string;
  value: string;
}

export const IconifyPicker: React.FC<IconifyPickerProps> = ({
  value,
  onChange,
  label = 'Icon',
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(value);
  const [iconList, setIconList] = useState<IconItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [activeCollection, setActiveCollection] = useState<string>('mdi');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);

  // Load favorites and recent on mount
  useEffect(() => {
    setFavorites(IconPreferences.getFavorites());
    setRecent(IconPreferences.getRecent());
  }, [open]);

  // Load icons based on active tab and search
  useEffect(() => {
    if (!open) return;
    loadIcons();
  }, [open, activeTab, activeCollection, search]);

  const loadIcons = async () => {
    setLoading(true);
    try {
      let icons: IconItem[] = [];

      if (activeTab === 'favorites') {
        // Show favorites
        icons = favorites.map(iconName => ({
          name: iconName,
          value: iconName,
        }));
      } else if (activeTab === 'recent') {
        // Show recent
        icons = recent.map(iconName => ({
          name: iconName,
          value: iconName,
        }));
      } else if (search) {
        // Search across selected collection
        const collection = activeTab === 'all' ? activeCollection : activeTab;
        const results = await searchIcons(search, collection, 100);
        icons = results.map(iconName => ({
          name: iconName.split(':')[1] || iconName,
          value: iconName,
        }));
      } else {
        // List icons from collection
        const collection = activeTab === 'all' ? activeCollection : activeTab;
        const results = await listCollectionIcons(collection, 0, 200);
        icons = results.map(iconName => ({
          name: iconName.split(':')[1] || iconName,
          value: iconName,
        }));
      }

      setIconList(icons);
    } catch (error) {
      console.error('[IconifyPicker] Failed to load icons:', error);
      setIconList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleIconSelect = async (iconName: string) => {
    setSelectedIcon(iconName);

    // Add to recent
    IconPreferences.addRecent(iconName);
    setRecent(IconPreferences.getRecent());

    // Cache icon to server (non-blocking)
    if (!iconName.startsWith('emoji:')) {
      try {
        const response = await fetch(`https://api.iconify.design/${iconName}.json`);
        if (response.ok) {
          const iconData = await response.json();
          cacheIconViaService(iconName, iconData);
        }
      } catch (error) {
        console.warn('[IconifyPicker] Failed to cache icon:', error);
      }
    }
  };

  const toggleFavorite = (iconName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (IconPreferences.isFavorite(iconName)) {
      IconPreferences.removeFavorite(iconName);
    } else {
      IconPreferences.addFavorite(iconName);
    }
    setFavorites(IconPreferences.getFavorites());
  };

  const handleConfirm = () => {
    onChange(selectedIcon);
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="outlined"
        onClick={() => setOpen(true)}
        startIcon={
          value ? (
            <Icon icon={value} width={20} height={20} />
          ) : null
        }
        sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
      >
        {value || `Select ${label}`}
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { height: '80vh' },
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Select Icon</Typography>
            <IconButton onClick={() => setOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {/* Search Bar */}
          <TextField
            fullWidth
            placeholder="Search icons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
            >
              {ICON_CATEGORIES.map((cat) => (
                <Tab
                  key={cat.id}
                  label={cat.label}
                  value={cat.id}
                  icon={<Icon icon={cat.icon} width={16} />}
                  iconPosition="start"
                />
              ))}
            </Tabs>
          </Box>

          {/* Collection Selector (for 'all' tab) */}
          {activeTab === 'all' && (
            <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {ICON_COLLECTIONS.map((collection) => (
                <Chip
                  key={collection}
                  label={collection.toUpperCase()}
                  onClick={() => setActiveCollection(collection)}
                  color={activeCollection === collection ? 'primary' : 'default'}
                  size="small"
                />
              ))}
            </Box>
          )}

          {/* Selected Icon Preview */}
          {selectedIcon && (
            <Box sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Box display="flex" alignItems="center" gap={2}>
                <Icon icon={selectedIcon} width={32} height={32} />
                <Typography variant="body2">{selectedIcon}</Typography>
              </Box>
            </Box>
          )}

          {/* Icon Grid */}
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : iconList.length === 0 ? (
            <Alert severity="info">
              {search
                ? 'No icons found. Try a different search term.'
                : activeTab === 'favorites'
                ? 'No favorite icons yet. Click the star on any icon to add it to favorites.'
                : activeTab === 'recent'
                ? 'No recent icons yet.'
                : 'No icons available.'}
            </Alert>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {iconList.map((icon) => (
                <Tooltip key={icon.value} title={icon.name}>
                  <Box
                    onClick={() => handleIconSelect(icon.value)}
                    sx={{
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      p: 1,
                      cursor: 'pointer',
                      borderRadius: 1,
                      border: 1,
                      borderColor: selectedIcon === icon.value ? 'primary.main' : 'divider',
                      bgcolor: selectedIcon === icon.value ? 'action.selected' : 'transparent',
                      width: 80,
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                      <Icon icon={icon.value} width={32} height={32} />
                      <Typography
                        variant="caption"
                        sx={{
                          mt: 0.5,
                          fontSize: '0.65rem',
                          textAlign: 'center',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          width: '100%',
                        }}
                      >
                        {icon.name}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={(e) => toggleFavorite(icon.value, e)}
                        sx={{
                          position: 'absolute',
                          top: 2,
                          right: 2,
                          p: 0.25,
                        }}
                      >
                        {IconPreferences.isFavorite(icon.value) ? (
                          <Star fontSize="small" sx={{ color: 'warning.main', fontSize: 14 }} />
                        ) : (
                          <StarOutline fontSize="small" sx={{ fontSize: 14 }} />
                        )}
                      </IconButton>
                    </Box>
                  </Tooltip>
              ))}
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirm} variant="contained">
            Select Icon
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
