/**
 * EntitySelectorDialog - Side-by-side entity selection UI
 * Phase 4.0: User-curated entity selection for AI context
 */

import {
    AcUnit as AcUnitIcon,
    Add as AddIcon,
    Air as AirIcon,
    Alarm as AlarmIcon,
    Bluetooth as BluetoothIcon,
    Build as BuildIcon,
    CalendarMonth as CalendarMonthIcon,
    Camera as CameraIcon,
    Campaign as CampaignIcon,
    ChatBubbleOutline as ChatBubbleOutlineIcon,
    CheckBox as CheckBoxIcon,
    Close as CloseIcon,
    CropSquare as CropSquareIcon,
    Description as DescriptionIcon,
    DoorFront as DoorFrontIcon,
    ElectricBolt as ElectricBoltIcon,
    FileUpload as FileUploadIcon,
    FormatListNumbered as FormatListNumberedIcon,
    Image as ImageIcon,
    Input as InputIcon,
    Lightbulb as LightbulbIcon,
    LocationOn as LocationOnIcon,
    Lock as LockIcon,
    Mic as MicIcon,
    Mouse as MouseIcon,
    Movie as MovieIcon,
    Notifications as NotificationsIcon,
    Numbers as NumbersIcon,
    Person as PersonIcon,
    Power as PowerIcon,
    RecordVoiceOver as RecordVoiceOverIcon,
    Search as SearchIcon,
    Sensors as SensorsIcon,
    Settings as SettingsIcon,
    SmartButton as SmartButtonIcon,
    SmartToy as SmartToyIcon,
    TextFields as TextFieldsIcon,
    Thunderstorm as ThunderstormIcon,
    Timer as TimerIcon,
    Tv as TvIcon,
    Update as UpdateIcon,
    ViewList as ViewListIcon,
    WbSunny as WbSunnyIcon,
    WindPower as WindPowerIcon,
} from '@mui/icons-material';
import type { SvgIconProps } from '@mui/material';
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    IconButton,
    InputAdornment,
    InputLabel,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    MenuItem,
    Paper,
    Select,
    TextField,
    Typography
} from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import type { EntityState, HassConnection } from '../../shared/types';

interface EntitySelectorDialogProps {
  open: boolean;
  onClose: () => void;
  selectedEntities: string[];
  onSelectionChange: (entityIds: string[]) => void;
  hass: HassConnection | null;
}

// Domain icons (MUI icons)
const DOMAIN_ICONS: Record<string, React.ComponentType<SvgIconProps>> = {
  light: LightbulbIcon,
  switch: PowerIcon,
  climate: AcUnitIcon,
  cover: DoorFrontIcon,
  media_player: TvIcon,
  sensor: SensorsIcon,
  binary_sensor: FileUploadIcon,
  camera: CameraIcon,
  lock: LockIcon,
  fan: WindPowerIcon,
  vacuum: SmartToyIcon,
  alarm_control_panel: AlarmIcon,
  person: PersonIcon,
  device_tracker: LocationOnIcon,
  automation: SettingsIcon,
  scene: MovieIcon,
  script: DescriptionIcon,
  input_boolean: CheckBoxIcon,
  input_number: NumbersIcon,
  input_select: ViewListIcon,
  input_text: TextFieldsIcon,
  input_button: MouseIcon,
  timer: TimerIcon,
  weather: ThunderstormIcon,
  button: SmartButtonIcon,
  remote: ElectricBoltIcon,
  bluetooth: BluetoothIcon,
  ai_task: SmartToyIcon,
  assist_satellite: ChatBubbleOutlineIcon,
  notify: NotificationsIcon,
  number: NumbersIcon,
  select: ViewListIcon,
  siren: CampaignIcon,
  stt: MicIcon,
  tts: RecordVoiceOverIcon,
  sun: WbSunnyIcon,
  todo: FormatListNumberedIcon,
  update: UpdateIcon,
  zone: CropSquareIcon,
  calendar: CalendarMonthIcon,
  conversation: ChatBubbleOutlineIcon,
  event: BuildIcon,
  humidifier: AirIcon,
  image: ImageIcon,
};

export const EntitySelectorDialog: React.FC<EntitySelectorDialogProps> = ({
  open,
  onClose,
  selectedEntities,
  onSelectionChange,
  hass,
}) => {
  const [allEntities, setAllEntities] = useState<EntityState[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [localSelection, setLocalSelection] = useState<string[]>(selectedEntities);

  // Fetch all entities when dialog opens
  useEffect(() => {
    if (open && hass) {
      hass.getStates().then((states) => {
        setAllEntities(states);
      }).catch((err) => {
        console.error('Failed to fetch entities:', err);
      });
    }
  }, [open, hass]);

  // Sync local selection with props ONLY when dialog opens
  useEffect(() => {
    if (open) {
      setLocalSelection(selectedEntities);
    }
  }, [open]); // Only depend on 'open', not 'selectedEntities'

  // Extract unique domains from entities
  const domains = useMemo(() => {
    const domainSet = new Set<string>();
    allEntities.forEach(entity => {
      const domain = entity.entity_id.split('.')[0];
      domainSet.add(domain);
    });
    return Array.from(domainSet).sort();
  }, [allEntities]);

  // Extract unique areas from entities
  const areas = useMemo(() => {
    const areaSet = new Set<string>();
    allEntities.forEach(entity => {
      const area = entity.attributes.area_id || entity.attributes.friendly_name?.split(' ')[0];
      if (area) {
        areaSet.add(area);
      }
    });
    return Array.from(areaSet).sort();
  }, [allEntities]);

  // Filter entities based on search, domain, and area
  const filteredEntities = useMemo(() => {
    let filtered = allEntities;

    // Filter by domain
    if (selectedDomain !== 'all') {
      filtered = filtered.filter(entity => entity.entity_id.startsWith(`${selectedDomain}.`));
    }

    // Filter by area
    if (selectedArea !== 'all') {
      filtered = filtered.filter(entity => {
        const area = entity.attributes.area_id || entity.attributes.friendly_name?.split(' ')[0];
        return area === selectedArea;
      });
    }

    // Filter by search text
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(entity => 
        entity.entity_id.toLowerCase().includes(searchLower) ||
        (entity.attributes.friendly_name || '').toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [allEntities, selectedDomain, selectedArea, searchText]);

  // Add entity to selection
  const handleAddEntity = (entityId: string) => {
    if (!localSelection.includes(entityId)) {
      setLocalSelection([...localSelection, entityId]);
    }
  };

  // Remove entity from selection
  const handleRemoveEntity = (entityId: string) => {
    setLocalSelection(localSelection.filter(id => id !== entityId));
  };

  // Clear all selected entities
  const handleClearAll = () => {
    setLocalSelection([]);
  };

  // Save and close
  const handleSave = () => {
    onSelectionChange(localSelection);
    onClose();
  };

  // Cancel and close
  const handleCancel = () => {
    setLocalSelection(selectedEntities); // Reset to original
    onClose();
  };

  // Get entity display name
  const getEntityDisplayName = (entityId: string): string => {
    const entity = allEntities.find(e => e.entity_id === entityId);
    return entity?.attributes.friendly_name || entityId;
  };

  // Get domain icon component
  const getDomainIcon = (entityId: string) => {
    const domain = entityId.split('.')[0];
    const IconComponent = DOMAIN_ICONS[domain] || InputIcon;
    return <IconComponent fontSize="small" sx={{ color: 'text.secondary' }} />;
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="lg" fullWidth>
      <DialogTitle>
        Select Entities for AI Context
        <IconButton
          onClick={handleCancel}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ height: '600px', p: 0 }}>
        <Box sx={{ display: 'flex', height: '100%' }}>
          {/* Left Panel - Search */}
          <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: 0, boxShadow: 'none', borderRight: 1, borderColor: 'divider' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Search Entities
              </Typography>

              {/* Domain Filter */}
              <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                <InputLabel>Domain</InputLabel>
                <Select
                  value={selectedDomain}
                  label="Domain"
                  onChange={(e) => setSelectedDomain(e.target.value)}
                >
                  <MenuItem value="all">All Domains</MenuItem>
                  {domains.map(domain => {
                    const IconComponent = DOMAIN_ICONS[domain] || InputIcon;
                    return (
                      <MenuItem key={domain} value={domain}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconComponent fontSize="small" sx={{ color: 'text.secondary' }} />
                          <span>{domain}</span>
                        </Box>
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>

              {/* Area Filter */}
              <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                <InputLabel>Area</InputLabel>
                <Select
                  value={selectedArea}
                  label="Area"
                  onChange={(e) => setSelectedArea(e.target.value)}
                >
                  <MenuItem value="all">All Areas</MenuItem>
                  {areas.map(area => (
                    <MenuItem key={area} value={area}>
                      {area}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Text Search */}
              <TextField
                fullWidth
                size="small"
                placeholder="Search by entity ID or name..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />

              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {filteredEntities.length} entities found
              </Typography>
            </Box>

            {/* Entity List */}
            <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
              {filteredEntities.map(entity => {
                const isSelected = localSelection.includes(entity.entity_id);
                return (
                  <ListItem key={entity.entity_id} disablePadding>
                    <ListItemButton
                      onClick={() => handleAddEntity(entity.entity_id)}
                      disabled={isSelected}
                      sx={{
                        '&.Mui-disabled': {
                          opacity: 0.5,
                          backgroundColor: 'action.selected',
                        },
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getDomainIcon(entity.entity_id)}
                            <span>{entity.attributes.friendly_name || entity.entity_id}</span>
                          </Box>
                        }
                        secondary={entity.entity_id}
                      />
                      {!isSelected && <AddIcon fontSize="small" color="action" />}
                    </ListItemButton>
                  </ListItem>
                );
              })}
              {filteredEntities.length === 0 && (
                <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                  <Typography variant="body2">
                    No entities found
                  </Typography>
                </Box>
              )}
            </List>
          </Paper>

          {/* Right Panel - Selected */}
          <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: 0, boxShadow: 'none' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Selected ({localSelection.length})
              </Typography>
              {localSelection.length > 0 && (
                <Button
                  size="small"
                  onClick={handleClearAll}
                  color="error"
                  variant="text"
                >
                  Clear All
                </Button>
              )}
            </Box>

            {/* Selected Entity Chips */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              {localSelection.length === 0 ? (
                <Box sx={{ textAlign: 'center', color: 'text.secondary', py: 3 }}>
                  <Typography variant="body2">
                    No entities selected
                  </Typography>
                  <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                    Click entities in the left panel to add them here
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {localSelection.map(entityId => (
                    <Chip
                      key={entityId}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {getDomainIcon(entityId)}
                          <span>{getEntityDisplayName(entityId)}</span>
                        </Box>
                      }
                      onDelete={() => handleRemoveEntity(entityId)}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              )}
            </Box>

            {/* Info Box */}
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'action.hover' }}>
              <Typography variant="caption" color="text.secondary">
                Selected entities are used in every AI prompt until chat is cleared.
                Start with empty selection for layout-only dashboards.
              </Typography>
            </Box>
          </Paper>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleCancel} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save Selection
        </Button>
      </DialogActions>
    </Dialog>
  );
};
