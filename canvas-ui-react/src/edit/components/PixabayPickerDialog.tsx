/**
 * PixabayPickerDialog
 * Search Pixabay for images, download selected images to HA local storage,
 * and return the local path to the caller.
 */

import {
  Close as CloseIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { useWebSocket } from '../../shared/providers/WebSocketProvider';

interface PixabayHit {
  id: number;
  previewURL: string;
  webformatURL: string;
  largeImageURL: string;
  tags: string;
  user: string;
  imageWidth: number;
  imageHeight: number;
}

interface PixabayPickerDialogProps {
  open: boolean;
  onClose: () => void;
  /** Called with the HA-local image path (e.g. /local/canvas-ui/images/foo.jpg) */
  onSelect: (localPath: string) => void;
}

const IMAGE_TYPES = [
  { value: 'all', label: 'All' },
  { value: 'photo', label: 'Photo' },
  { value: 'illustration', label: 'Illustration' },
  { value: 'vector', label: 'Vector' },
];

const CATEGORIES = [
  { value: '', label: 'Any category' },
  { value: 'nature', label: 'Nature' },
  { value: 'animals', label: 'Animals' },
  { value: 'travel', label: 'Travel' },
  { value: 'places', label: 'Places' },
  { value: 'buildings', label: 'Buildings' },
  { value: 'food', label: 'Food' },
  { value: 'sports', label: 'Sports' },
  { value: 'people', label: 'People' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'technology', label: 'Technology' },
  { value: 'business', label: 'Business' },
  { value: 'music', label: 'Music' },
  { value: 'science', label: 'Science' },
  { value: 'education', label: 'Education' },
  { value: 'feelings', label: 'Feelings' },
  { value: 'health', label: 'Health' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'backgrounds', label: 'Backgrounds' },
  { value: 'textures', label: 'Textures & Patterns' },
  { value: 'religion', label: 'Religion' },
  { value: 'computer', label: 'Computer' },
  { value: 'industry', label: 'Industry' },
];

export const PixabayPickerDialog: React.FC<PixabayPickerDialogProps> = ({
  open,
  onClose,
  onSelect,
}) => {
  const { hass } = useWebSocket();

  const [query, setQuery] = useState('');
  const [imageType, setImageType] = useState('all');
  const [category, setCategory] = useState('');
  const [hits, setHits] = useState<PixabayHit[]>([]);
  const [totalHits, setTotalHits] = useState(0);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [downloadError, setDownloadError] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearchError('');
    setHits([]);
    setTotalHits(0);

    try {
      const result = await (hass as any).callService('canvas_ui', 'pixabay_search', {
        query: query.trim(),
        image_type: imageType,
        ...(category ? { category } : {}),
        per_page: 30,
        page: 1,
        return_response: true,
      });
      const data = result?.result?.response ?? result?.response ?? result;
      if (data?.success === false) {
        setSearchError(data.error || 'Search failed');
      } else {
        setHits(data?.hits ?? []);
        setTotalHits(data?.totalHits ?? 0);
      }
    } catch (err: any) {
      setSearchError(err?.message ?? String(err));
    } finally {
      setSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleDownload = async (hit: PixabayHit) => {
    setDownloadingId(hit.id);
    setDownloadError('');

    // Pick best URL — largeImageURL is best quality; fall back to webformatURL
    const url = hit.largeImageURL || hit.webformatURL;
    // Build a clean filename from the hit id + first tag
    const tag = hit.tags.split(',')[0].trim().replace(/\s+/g, '-').toLowerCase();
    const ext = url.split('.').pop()?.split('?')[0] ?? 'jpg';
    const filename = `pixabay-${hit.id}-${tag}.${ext}`;

    try {
      const result = await (hass as any).callService('canvas_ui', 'pixabay_download_image', {
        url,
        filename,
        return_response: true,
      });
      const data = result?.result?.response ?? result?.response ?? result;
      if (data?.success === false) {
        setDownloadError(data.error || 'Download failed');
      } else {
        onSelect(data.local_path);
        onClose();
      }
    } catch (err: any) {
      setDownloadError(err?.message ?? String(err));
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
        <Box component="img"
          src="https://pixabay.com/static/img/logo_square.png"
          alt="Pixabay"
          sx={{ width: 24, height: 24, borderRadius: 0.5 }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
        Pixabay Image Search
        <IconButton onClick={onClose} sx={{ ml: 'auto' }} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {/* Search bar */}
        <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
          <TextField
            label="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            size="small"
            sx={{ flex: '1 1 220px' }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleSearch} disabled={searching}>
                    <SearchIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Type</InputLabel>
            <Select value={imageType} label="Type" onChange={(e) => setImageType(e.target.value)}>
              {IMAGE_TYPES.map((t) => (
                <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 170 }}>
            <InputLabel>Category</InputLabel>
            <Select value={category} label="Category" onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={searching || !query.trim()}
            startIcon={searching ? <CircularProgress size={14} color="inherit" /> : <SearchIcon />}
          >
            Search
          </Button>
        </Box>

        {/* Errors */}
        {searchError && (
          <Typography color="error" variant="body2" sx={{ mb: 1 }}>
            {searchError}
          </Typography>
        )}
        {downloadError && (
          <Typography color="error" variant="body2" sx={{ mb: 1 }}>
            {downloadError}
          </Typography>
        )}

        {/* Results count */}
        {totalHits > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            {totalHits.toLocaleString()} results — showing {hits.length}
          </Typography>
        )}

        {/* Grid of thumbnails */}
        {hits.length > 0 && (
          <Grid container spacing={1} sx={{ maxHeight: '55vh', overflowY: 'auto', pr: 0.5 }}>
            {hits.map((hit) => (
              <Grid key={hit.id} size={{ xs: 6, sm: 4, md: 3, lg: 2 }}>
                <Box
                  sx={{
                    position: 'relative',
                    borderRadius: 1,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: '2px solid transparent',
                    '&:hover': { border: '2px solid', borderColor: 'primary.main' },
                    '&:hover .download-overlay': { opacity: 1 },
                    bgcolor: 'action.hover',
                  }}
                  onClick={() => handleDownload(hit)}
                >
                  <Box
                    component="img"
                    src={hit.previewURL}
                    alt={hit.tags}
                    sx={{
                      width: '100%',
                      aspectRatio: '4/3',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                  {/* Download overlay */}
                  <Box
                    className="download-overlay"
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      bgcolor: 'rgba(0,0,0,0.45)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0,
                      transition: 'opacity 0.15s',
                    }}
                  >
                    {downloadingId === hit.id ? (
                      <CircularProgress size={24} sx={{ color: '#fff' }} />
                    ) : (
                      <Tooltip title="Download & use">
                        <DownloadIcon sx={{ color: '#fff', fontSize: 28 }} />
                      </Tooltip>
                    )}
                  </Box>
                </Box>
                <Typography
                  variant="caption"
                  noWrap
                  sx={{ display: 'block', px: 0.5, color: 'text.secondary', mt: 0.25 }}
                >
                  {hit.user}
                </Typography>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Empty state */}
        {!searching && hits.length === 0 && !searchError && (
          <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
            <SearchIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
            <Typography variant="body2">
              Enter a search term to find free images from Pixabay
            </Typography>
            <Typography variant="caption">
              Requires a Pixabay API key — set it in Canvas UI integration options
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PixabayPickerDialog;
