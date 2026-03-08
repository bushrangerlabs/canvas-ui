/**
 * Resolution Presets for View Sizing
 * Based on ioBroker.vis-2 device presets
 * 
 * Usage:
 * - 'none': Infinite canvas (no boundary)
 * - 'user': User-defined custom dimensions
 * - Device presets: Auto-populate width x height
 */

export interface ResolutionPreset {
  value: string;
  label: string;
}

export const RESOLUTION_PRESETS: ResolutionPreset[] = [
  // Special options
  { value: 'none', label: 'Not defined (infinite canvas)' },
  { value: 'user', label: 'User defined' },
  
  // iPhone devices
  { value: '375x667', label: 'iPhone SE - Portrait (375×667)' },
  { value: '667x375', label: 'iPhone SE - Landscape (667×375)' },
  { value: '414x896', label: 'iPhone XR - Portrait (414×896)' },
  { value: '896x414', label: 'iPhone XR - Landscape (896×414)' },
  { value: '390x844', label: 'iPhone 12 Pro - Portrait (390×844)' },
  { value: '844x390', label: 'iPhone 12 Pro - Landscape (844×390)' },
  
  // Android devices
  { value: '393x851', label: 'Pixel 5 - Portrait (393×851)' },
  { value: '851x393', label: 'Pixel 5 - Landscape (851×393)' },
  { value: '360x740', label: 'Samsung Galaxy S8+ - Portrait (360×740)' },
  { value: '740x360', label: 'Samsung Galaxy S8+ - Landscape (740×360)' },
  { value: '412x915', label: 'Samsung Galaxy S20 Ultra - Portrait (412×915)' },
  { value: '915x412', label: 'Samsung Galaxy S20 Ultra - Landscape (915×412)' },
  { value: '412x914', label: 'Samsung Galaxy A51/71 - Portrait (412×914)' },
  { value: '914x412', label: 'Samsung Galaxy A51/71 - Landscape (914×412)' },
  { value: '280x653', label: 'Galaxy Fold - Portrait (280×653)' },
  { value: '653x280', label: 'Galaxy Fold - Landscape (653×280)' },
  
  // iPad devices
  { value: '820x1180', label: 'iPad Air - Portrait (820×1180)' },
  { value: '1180x820', label: 'iPad Air - Landscape (1180×820)' },
  { value: '768x1024', label: 'iPad Mini - Portrait (768×1024)' },
  { value: '1024x768', label: 'iPad Mini - Landscape (1024×768)' },
  { value: '1024x1366', label: 'iPad Pro - Portrait (1024×1366)' },
  { value: '1366x1024', label: 'iPad Pro - Landscape (1366×1024)' },
  
  // Microsoft Surface
  { value: '912x1368', label: 'Surface Pro 7 - Portrait (912×1368)' },
  { value: '1368x912', label: 'Surface Pro 7 - Landscape (1368×912)' },
  { value: '540x720', label: 'Surface Duo - Portrait (540×720)' },
  { value: '720x540', label: 'Surface Duo - Landscape (720×540)' },
  
  // Google Nest Hub
  { value: '600x1024', label: 'Nest Hub - Portrait (600×1024)' },
  { value: '1024x600', label: 'Nest Hub - Landscape (1024×600)' },
  { value: '800x1280', label: 'Nest Hub Max - Portrait (800×1280)' },
  { value: '1280x800', label: 'Nest Hub Max - Landscape (1280×800)' },
  
  // Standard resolutions
  { value: '720x1280', label: 'HD - Portrait (720×1280)' },
  { value: '1280x720', label: 'HD - Landscape (1280×720)' },
  { value: '1080x1920', label: 'Full HD - Portrait (1080×1920)' },
  { value: '1920x1080', label: 'Full HD - Landscape (1920×1080)' },
];

/**
 * Parse resolution string to width and height
 * @param resolution - Resolution value like '1920x1080'
 * @returns Object with width and height, or null if invalid
 */
export function parseResolution(resolution: string): { width: number; height: number } | null {
  if (!resolution || resolution === 'none' || resolution === 'user') {
    return null;
  }
  
  const match = resolution.match(/^(\d+)x(\d+)$/);
  if (!match) {
    return null;
  }
  
  return {
    width: parseInt(match[1], 10),
    height: parseInt(match[2], 10),
  };
}

/**
 * Find preset by resolution value
 * @param value - Resolution value like '1920x1080'
 * @returns Preset object or undefined
 */
export function findPreset(value: string): ResolutionPreset | undefined {
  return RESOLUTION_PRESETS.find(preset => preset.value === value);
}
