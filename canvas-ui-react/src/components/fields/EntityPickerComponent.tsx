import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import SensorsIcon from '@mui/icons-material/Sensors';
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    InputAdornment,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    TextField,
    Typography
} from '@mui/material';
import { useState } from 'react';
import { useWidgetStore } from '../../store/widgetStore';

interface EntityPickerComponentProps {
  label: string;
  propertyPath: string;
  entityType?: string; // 'light', 'switch', 'sensor', etc.
  description?: string;
}

/**
 * Entity Picker for Home Assistant entities
 * 
 * TODO: Connect to actual Home Assistant WebSocket API
 * For now, using mock entities for development
 */
export function EntityPickerComponent({
  label,
  propertyPath,
  entityType,
  description,
}: EntityPickerComponentProps) {
  const { selectedWidget, updateConfig } = useWidgetStore();
  const [open, setOpen] = useState(false);

  if (!selectedWidget) {
    return null;
  }

  const value = selectedWidget.config[propertyPath] || '';
  const [search, setSearch] = useState('');

  // Mock entities - will be replaced with real Home Assistant API
  const mockEntities = [
    'light.living_room',
    'light.bedroom',
    'light.kitchen',
    'switch.coffee_maker',
    'switch.fan',
    'sensor.temperature',
    'sensor.humidity',
    'binary_sensor.motion',
    'climate.thermostat',
    'cover.garage_door',
  ];

  const filteredEntities = mockEntities.filter((entity) => {
    const matchesSearch = entity.toLowerCase().includes(search.toLowerCase());
    const matchesType = !entityType || entity.startsWith(entityType + '.');
    return matchesSearch && matchesType;
  });

  const handleSelect = (entity: string) => {
    updateConfig(propertyPath, entity);
    setOpen(false);
    setSearch('');
  };

  const handleClear = () => {
    updateConfig(propertyPath, '');
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
        fullWidth
        size="small"
        InputProps={{
          readOnly: true,
          endAdornment: (
            <InputAdornment position="end">
              {value && (
                <IconButton size="small" onClick={handleClear} edge="end">
                  <ClearIcon fontSize="small" />
                </IconButton>
              )}
              <IconButton size="small" onClick={() => setOpen(true)} edge="end">
                <SensorsIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        }}
        onClick={() => setOpen(true)}
        sx={{ cursor: 'pointer' }}
      />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Select Entity
          {entityType && (
            <Chip label={entityType} size="small" sx={{ ml: 1 }} />
          )}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            placeholder="Search entities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {filteredEntities.length === 0 ? (
              <ListItem>
                <ListItemText
                  primary="No entities found"
                  secondary={entityType ? `Type: ${entityType}` : 'Try different search terms'}
                />
              </ListItem>
            ) : (
              filteredEntities.map((entity) => (
                <ListItem key={entity} disablePadding>
                  <ListItemButton
                    selected={entity === value}
                    onClick={() => handleSelect(entity)}
                  >
                    <ListItemText
                      primary={entity}
                      primaryTypographyProps={{
                        variant: 'body2',
                        fontFamily: 'monospace',
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
