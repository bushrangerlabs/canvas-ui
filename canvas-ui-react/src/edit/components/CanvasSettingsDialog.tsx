/**
 * CanvasSettingsDialog
 * Toolbar-accessible settings for Canvas UI (API keys, etc.)
 * Settings are persisted server-side via the get_settings / save_settings services.
 */

import {
  Close as CloseIcon,
  ImageSearch as ImageSearchIcon,
  OpenInNew as OpenInNewIcon,
  Settings as SettingsIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../../shared/providers/WebSocketProvider';

interface CanvasSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export const CanvasSettingsDialog: React.FC<CanvasSettingsDialogProps> = ({ open, onClose }) => {
  const { hass } = useWebSocket();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [pixabayKey, setPixabayKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  // Load settings when dialog opens
  useEffect(() => {
    if (!open || !hass) return;
    setLoading(true);
    setError('');
    setSaveSuccess(false);

    (hass as any)
      .callService('canvas_ui', 'get_settings', { return_response: true })
      .then((result: any) => {
        const data = result?.result?.response ?? result?.response ?? result;
        if (data?.settings) {
          setPixabayKey(data.settings.pixabay_api_key ?? '');
        }
      })
      .catch((err: any) => {
        setError(err?.message ?? 'Failed to load settings');
      })
      .finally(() => setLoading(false));
  }, [open, hass]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaveSuccess(false);
    try {
      const result = await (hass as any).callService('canvas_ui', 'save_settings', {
        pixabay_api_key: pixabayKey,
        return_response: true,
      });
      const data = result?.result?.response ?? result?.response ?? result;
      if (data?.success === false) {
        setError(data.error ?? 'Save failed');
      } else {
        setSaveSuccess(true);
        setTimeout(onClose, 800);
      }
    } catch (err: any) {
      setError(err?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SettingsIcon fontSize="small" />
        Canvas UI Settings
        <IconButton onClick={onClose} sx={{ ml: 'auto' }} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={28} />
          </Box>
        )}

        {!loading && (
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {saveSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Settings saved!
              </Alert>
            )}

            {/* Pixabay section */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <ImageSearchIcon fontSize="small" color="action" />
              <Typography variant="subtitle2">Pixabay</Typography>
              <Tooltip title="Get a free API key at pixabay.com/api">
                <IconButton
                  size="small"
                  component="a"
                  href="https://pixabay.com/api/docs/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <OpenInNewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
              Free image search. Register at pixabay.com for a free API key.
            </Typography>
            <TextField
              fullWidth
              label="Pixabay API Key"
              value={pixabayKey}
              onChange={(e) => setPixabayKey(e.target.value)}
              type={showKey ? 'text' : 'password'}
              size="small"
              placeholder="Enter your Pixabay API key…"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowKey((v) => !v)}>
                      {showKey ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Divider sx={{ my: 2 }} />

            <Typography variant="caption" color="text.secondary">
              Settings are stored on the HA server — not in the browser.
            </Typography>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={loading || saving}
          startIcon={saving ? <CircularProgress size={14} color="inherit" /> : undefined}
        >
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CanvasSettingsDialog;
