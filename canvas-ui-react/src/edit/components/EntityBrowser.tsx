import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, TextField } from '@mui/material';
import React, { useMemo, useState } from 'react';
import { useWebSocket } from '../../shared/providers/WebSocketProvider';

interface EntityBrowserProps {
  value: string;
  onChange: (entityId: string) => void;
  label?: string;
  filter?: (entityId: string) => boolean; // Optional filter function
}

interface EntityOption {
  id: string;
  domain: string;
  name: string;
  state: string;
}

/**
 * Entity browser component with popup dialog
 * Connects to Home Assistant entity states
 */
export const EntityBrowser: React.FC<EntityBrowserProps> = ({ 
  value, 
  onChange, 
  label = 'Entity', 
  filter 
}) => {
  const { entities } = useWebSocket();
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<string>(value);

  // Convert entities to options with domain grouping
  const options: EntityOption[] = useMemo(() => {
    const entityList = Object.entries(entities).map(([id, entityState]) => {
      const domain = id.split('.')[0];
      const friendlyName = entityState.attributes?.friendly_name || id;
      
      return {
        id,
        domain,
        name: friendlyName,
        state: entityState.state,
      };
    });

    // Apply filter if provided
    if (filter) {
      return entityList.filter(entity => filter(entity.id));
    }

    return entityList;
  }, [entities, filter]);

  // Sort options by domain, then by name
  const sortedOptions = useMemo(() => {
    return [...options].sort((a, b) => {
      if (a.domain !== b.domain) {
        return a.domain.localeCompare(b.domain);
      }
      return a.name.localeCompare(b.name);
    });
  }, [options]);

  const getDomainColor = (domain: string): string => {
    const colors: Record<string, string> = {
      light: '#FFC107',
      switch: '#4CAF50',
      sensor: '#2196F3',
      binary_sensor: '#9C27B0',
      cover: '#795548',
      climate: '#FF5722',
      fan: '#00BCD4',
      media_player: '#E91E63',
      camera: '#607D8B',
      lock: '#FF9800',
      alarm_control_panel: '#F44336',
      automation: '#3F51B5',
      script: '#009688',
      scene: '#673AB7',
      input_boolean: '#8BC34A',
      input_number: '#CDDC39',
      input_select: '#FFEB3B',
      input_text: '#FDD835',
      person: '#536DFE',
      device_tracker: '#03A9F4',
      sun: '#FFD54F',
      weather: '#81C784',
    };
    return colors[domain] || '#9E9E9E';
  };

  const handleOpen = () => {
    setSelectedEntity(value);
    setSearchValue('');
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSave = () => {
    onChange(selectedEntity);
    setOpen(false);
  };

  const handleClear = () => {
    setSelectedEntity('');
  };

  // Get friendly name for current value
  const currentEntity = options.find(opt => opt.id === value);
  const displayValue = currentEntity ? `${currentEntity.name} (${currentEntity.id})` : value || 'No entity selected';

  // Filter entities based on search
  const filteredOptions = useMemo(() => {
    if (!searchValue) return sortedOptions;
    const lowercaseSearch = searchValue.toLowerCase();
    return sortedOptions.filter(
      option =>
        option.id.toLowerCase().includes(lowercaseSearch) ||
        option.name.toLowerCase().includes(lowercaseSearch) ||
        option.domain.toLowerCase().includes(lowercaseSearch)
    );
  }, [sortedOptions, searchValue]);

  return (
    <>
      <TextField
        fullWidth
        label={label}
        value={displayValue}
        size="small"
        onClick={handleOpen}
        InputProps={{
          readOnly: true,
          endAdornment: (
            <InputAdornment position="end">
              <IconButton size="small" onClick={handleOpen}>
                <SearchIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{ cursor: 'pointer', mb: 2 }}
      />

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Select Entity</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            placeholder="Search by name, ID, or domain..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            size="small"
            sx={{ mb: 2, mt: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          
          <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
            {filteredOptions.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                No entities found
              </Box>
            ) : (
              filteredOptions.map((option) => (
                <Box
                  key={option.id}
                  onClick={() => setSelectedEntity(option.id)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1.5,
                    cursor: 'pointer',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: selectedEntity === option.id ? 'primary.main' : 'divider',
                    backgroundColor: selectedEntity === option.id ? 'action.selected' : 'transparent',
                    mb: 1,
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <Chip
                    label={option.domain}
                    size="small"
                    sx={{
                      backgroundColor: getDomainColor(option.domain),
                      color: 'white',
                      fontSize: '0.75rem',
                      height: '24px',
                      minWidth: '80px',
                    }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 500 }}>{option.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#999' }}>{option.id}</div>
                  </Box>
                  <Chip
                    label={option.state}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.75rem', height: '24px', minWidth: '60px' }}
                  />
                </Box>
              ))
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClear} color="secondary">
            Clear
          </Button>
          <Button onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained">
            Select
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
