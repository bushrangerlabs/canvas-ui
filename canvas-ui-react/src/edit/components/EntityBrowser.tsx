import {
  AcUnit as AcUnitIcon,
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
  Place as PlaceIcon,
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
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { useWebSocket } from '../../shared/providers/WebSocketProvider';

interface EntityBrowserProps {
  value: string;
  onChange: (entityId: string) => void;
  label?: string;
  filter?: (entityId: string) => boolean;
}

interface EntityOption {
  id: string;
  domain: string;
  name: string;
  state: string;
  area: string | null;
}

// Domain icons matching EntitySelectorDialog
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

const DOMAIN_COLORS: Record<string, string> = {
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

/**
 * Entity browser component with domain + area filters
 * Connects to Home Assistant entity states and registries
 */
export const EntityBrowser: React.FC<EntityBrowserProps> = ({
  value,
  onChange,
  label = 'Entity',
  filter,
}) => {
  const { entities, hass } = useWebSocket();
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<string>(value);
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  // entity_id → area name
  const [entityAreaMap, setEntityAreaMap] = useState<Map<string, string>>(new Map());
  // sorted area list for dropdown
  const [areaList, setAreaList] = useState<Array<{ id: string; name: string }>>([]);

  // Load area registry + entity registry when dialog opens
  useEffect(() => {
    if (!open) return;
    const sendMsg = hass?.sendMessage;
    if (!sendMsg) return;

    const loadAreas = async () => {
      try {
        const [areasResp, entityRegResp] = await Promise.all([
          sendMsg({ type: 'config/area_registry/list' }),
          sendMsg({ type: 'config/entity_registry/list' }),
        ]);

        const areas: Array<{ area_id: string; name: string }> = areasResp?.result || [];
        const entityReg: Array<{ entity_id: string; area_id?: string | null }> = entityRegResp?.result || [];

        const areaNameMap = new Map<string, string>(areas.map((a) => [a.area_id, a.name]));

        const newEntityAreaMap = new Map<string, string>();
        entityReg.forEach((entry) => {
          if (entry.area_id && areaNameMap.has(entry.area_id)) {
            newEntityAreaMap.set(entry.entity_id, areaNameMap.get(entry.area_id)!);
          }
        });

        setAreaList(
          areas.map((a) => ({ id: a.area_id, name: a.name })).sort((a, b) => a.name.localeCompare(b.name))
        );
        setEntityAreaMap(newEntityAreaMap);
      } catch (err) {
        // Area registry unavailable — area filter won't appear
        console.warn('[EntityBrowser] Could not load area registry:', err);
      }
    };

    loadAreas();
  }, [open, hass]);

  // Build entity option list from WebSocket entities map
  const options: EntityOption[] = useMemo(() => {
    const list = Object.entries(entities).map(([id, entityState]) => ({
      id,
      domain: id.split('.')[0],
      name: entityState.attributes?.friendly_name || id,
      state: entityState.state,
      area: entityAreaMap.get(id) ?? null,
    }));

    return filter ? list.filter((e) => filter(e.id)) : list;
  }, [entities, filter, entityAreaMap]);

  // Unique domains sorted
  const domains = useMemo(() => {
    const set = new Set<string>();
    options.forEach((e) => set.add(e.domain));
    return Array.from(set).sort();
  }, [options]);

  // Filtered + sorted list
  const filteredOptions = useMemo(() => {
    let result = options;

    if (selectedDomain !== 'all') {
      result = result.filter((e) => e.domain === selectedDomain);
    }

    if (selectedArea !== 'all') {
      result = result.filter((e) => e.area === selectedArea);
    }

    if (searchValue) {
      const lower = searchValue.toLowerCase();
      result = result.filter(
        (e) =>
          e.id.toLowerCase().includes(lower) ||
          e.name.toLowerCase().includes(lower) ||
          e.domain.toLowerCase().includes(lower)
      );
    }

    return result.sort((a, b) => {
      if (a.domain !== b.domain) return a.domain.localeCompare(b.domain);
      return a.name.localeCompare(b.name);
    });
  }, [options, selectedDomain, selectedArea, searchValue]);

  const handleOpen = () => {
    setSelectedEntity(value);
    setSearchValue('');
    setSelectedDomain('all');
    setSelectedArea('all');
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleSave = () => {
    onChange(selectedEntity);
    setOpen(false);
  };

  const handleClear = () => setSelectedEntity('');

  const currentEntity = options.find((o) => o.id === value);
  const displayValue = currentEntity
    ? `${currentEntity.name} (${currentEntity.id})`
    : value || 'No entity selected';

  const getDomainColor = (domain: string) => DOMAIN_COLORS[domain] || '#9E9E9E';

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
        <DialogTitle>
          Select Entity
          <IconButton onClick={handleClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {/* Filters row */}
          <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
            {/* Domain filter */}
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Domain</InputLabel>
              <Select
                value={selectedDomain}
                label="Domain"
                onChange={(e) => setSelectedDomain(e.target.value)}
              >
                <MenuItem value="all">All Domains</MenuItem>
                {domains.map((domain) => {
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

            {/* Area filter — only shown if areas were loaded */}
            {areaList.length > 0 && (
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Area</InputLabel>
                <Select
                  value={selectedArea}
                  label="Area"
                  onChange={(e) => setSelectedArea(e.target.value)}
                >
                  <MenuItem value="all">All Areas</MenuItem>
                  {areaList.map((area) => (
                    <MenuItem key={area.id} value={area.name}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PlaceIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                        <span>{area.name}</span>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* Search */}
            <TextField
              placeholder="Search by name, ID, or domain…"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              size="small"
              sx={{ flex: 1, minWidth: 200 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Result count */}
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            {filteredOptions.length} {filteredOptions.length === 1 ? 'entity' : 'entities'}
          </Typography>

          {/* Entity list */}
          <Box sx={{ maxHeight: '420px', overflow: 'auto' }}>
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
                    mb: 0.75,
                    '&:hover': { backgroundColor: 'action.hover' },
                  }}
                >
                  <Chip
                    label={option.domain}
                    size="small"
                    sx={{
                      backgroundColor: getDomainColor(option.domain),
                      color: 'white',
                      fontSize: '0.72rem',
                      height: '22px',
                      minWidth: '76px',
                    }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={500} noWrap>
                      {option.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {option.id}
                    </Typography>
                  </Box>
                  {option.area && (
                    <Chip
                      icon={<PlaceIcon />}
                      label={option.area}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.72rem', height: '22px' }}
                    />
                  )}
                  <Chip
                    label={option.state}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.72rem', height: '22px', minWidth: '52px' }}
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
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={!selectedEntity}>
            Select
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

