/**
 * Widget Library - Visual widget browser panel
 * Dynamically builds from widget registry
 */

import * as MuiIcons from '@mui/icons-material';
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';
import {
    Box,
    Card,
    CardActionArea,
    CardContent,
    Chip,
    Drawer,
    IconButton,
    Stack,
    Tab,
    Tabs,
    Typography,
} from '@mui/material';
import React, { useMemo, useState } from 'react';
import { DigitalClockIcon } from '../../shared/components/DigitalClockIcon';
import { FlipClockIcon } from '../../shared/components/FlipClockIcon';
import { getAllWidgets } from '../../shared/registry/widgetRegistry';

// Map icon names from metadata to MUI components
const getIconComponent = (iconName: string): React.ReactNode => {
  // Handle custom icons
  if (iconName === 'DigitalClock') {
    return <DigitalClockIcon sx={{ fontSize: 48 }} />;
  }
  if (iconName === 'FlipClock') {
    return <FlipClockIcon sx={{ fontSize: 48 }} />;
  }
  
  // @ts-ignore - Dynamic icon lookup
  const IconComponent = MuiIcons[iconName];
  if (IconComponent) {
    return <IconComponent sx={{ fontSize: 48 }} />;
  }
  // @ts-ignore - Fallback
  return <MuiIcons.WidgetsOutlined sx={{ fontSize: 48 }} />;
};

// Get unique categories from widget metadata
const getCategories = () => {
  const widgets = getAllWidgets();
  const categorySet = new Set(widgets.map(w => w.metadata.category));
  const categories = Array.from(categorySet).sort();
  
  return [
    { id: 'all', label: 'All Widgets' },
    ...categories.map(cat => ({
      id: cat,
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
    })),
  ];
};

interface WidgetLibraryProps {
  open: boolean;
  onClose: () => void;
  onAddWidget: (type: string) => void;
}

export const WidgetLibrary: React.FC<WidgetLibraryProps> = ({ 
  open, 
  onClose, 
  onAddWidget 
}) => {
  const [category, setCategory] = useState('all');
  
  // Build widget list from registry
  const allWidgets = useMemo(() => {
    const widgets = getAllWidgets();
    console.log('[WidgetLibrary] All widgets from registry:', widgets.map(w => ({ type: w.type, name: w.metadata.name, category: w.metadata.category })));
    return widgets.map(({ type, metadata }) => ({
      type,
      name: metadata.name,
      description: metadata.description,
      icon: getIconComponent(metadata.icon),
      category: metadata.category,
    }));
  }, []);
  
  // Build categories from registry
  const categories = useMemo(() => getCategories(), []);

  const filteredWidgets = category === 'all' 
    ? allWidgets 
    : allWidgets.filter(w => w.category === category);

  const handleAddWidget = (type: string) => {
    onAddWidget(type);
    onClose();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 360,
          mt: '90px', // Match toolbar height (90px)
          height: 'calc(100vh - 90px)', // Full viewport minus toolbar
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexShrink: 0 }}>
          <AddIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Widget Library
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Category Tabs */}
        <Tabs
          value={category}
          onChange={(_, value) => setCategory(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 2, borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}
        >
          {categories.map(cat => (
            <Tab 
              key={cat.id} 
              value={cat.id} 
              label={cat.label}
              sx={{ minWidth: 'auto', px: 2 }}
            />
          ))}
        </Tabs>

        {/* Widget Grid - Scrollable */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <Stack spacing={2}>
          {filteredWidgets.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                No widgets in this category yet
              </Typography>
            </Box>
          ) : (
            filteredWidgets.map(widget => (
              <Card 
                key={widget.type}
                sx={{ 
                  border: 1, 
                  borderColor: 'divider',
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: 2,
                  },
                }}
              >
                <CardActionArea onClick={() => handleAddWidget(widget.type)}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Box sx={{ 
                        color: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        {widget.icon}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {widget.name}
                          </Typography>
                          <Chip 
                            label={widget.category} 
                            size="small" 
                            sx={{ ml: 1, height: 20, fontSize: '0.65rem' }}
                            color="primary"
                            variant="outlined"
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {widget.description}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))
          )}
        </Stack>
        </Box>
      </Box>
    </Drawer>
  );
};
