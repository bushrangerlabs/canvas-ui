/**
 * Dynamic Icon Loader
 * Loads icons on-demand to reduce bundle size
 */


// Icon type definitions
export type IconType = 'emoji' | 'mdi' | 'fa' | 'md' | 'io' | 'bi';

// MDI icon cache
let mdiIconsCache: any = null;
let mdiReactCache: any = null;

// React Icons cache
const reactIconsCache: Record<string, any> = {};

/**
 * Load MDI icons dynamically
 */
export async function loadMDIIcons() {
  if (!mdiIconsCache) {
    const [icons, Icon] = await Promise.all([
      import('@mdi/js'),
      import('@mdi/react'),
    ]);
    mdiIconsCache = icons;
    mdiReactCache = Icon.default;
  }
  return { icons: mdiIconsCache, Icon: mdiReactCache };
}

/**
 * Load React Icons family dynamically
 */
export async function loadReactIcons(family: 'fa' | 'md' | 'io' | 'bi') {
  if (!reactIconsCache[family]) {
    switch (family) {
      case 'fa':
        reactIconsCache.fa = await import('react-icons/fa');
        break;
      case 'md':
        reactIconsCache.md = await import('react-icons/md');
        break;
      case 'io':
        reactIconsCache.io = await import('react-icons/io5');
        break;
      case 'bi':
        reactIconsCache.bi = await import('react-icons/bi');
        break;
    }
  }
  return reactIconsCache[family];
}

/**
 * Get all available MDI icon names
 */
export async function getMDIIconNames(): Promise<string[]> {
  const { icons } = await loadMDIIcons();
  return Object.keys(icons).filter(key => key.startsWith('mdi'));
}

/**
 * Get all available React Icons names for a family
 */
export async function getReactIconNames(family: 'fa' | 'md' | 'io' | 'bi'): Promise<string[]> {
  const icons = await loadReactIcons(family);
  return Object.keys(icons).filter(key => 
    key.startsWith(family.charAt(0).toUpperCase() + family.slice(1)) ||
    key.startsWith(family.toUpperCase())
  );
}

/**
 * Parse icon string to get type and name
 */
export function parseIconString(iconString: string): { type: IconType; name: string } {
  // Ensure iconString is a string
  const str = String(iconString || '');
  
  if (str.startsWith('emoji:')) {
    return { type: 'emoji', name: str.replace('emoji:', '') };
  }
  
  // Check if string contains a colon
  if (!str.includes(':')) {
    // No prefix, treat as emoji
    return { type: 'emoji', name: str };
  }
  
  const parts = str.split(':');
  const prefix = parts[0];
  const name = parts.slice(1).join(':'); // Handle cases like "fa:solid:home"
  
  switch (prefix) {
    case 'mdi':
      return { type: 'mdi', name: name || '' };
    case 'fa':
      return { type: 'fa', name: name || '' };
    case 'md':
      return { type: 'md', name: name || '' };
    case 'io':
      return { type: 'io', name: name || '' };
    case 'bi':
      return { type: 'bi', name: name || '' };
    default:
      return { type: 'emoji', name: str };
  }
}

/**
 * Get categorized icon list for a type
 */
export function getIconCategories() {
  return [
    { value: 'all', label: 'All' },
    { value: 'home', label: 'Home' },
    { value: 'lighting', label: 'Lighting' },
    { value: 'climate', label: 'Climate' },
    { value: 'security', label: 'Security' },
    { value: 'media', label: 'Media' },
    { value: 'weather', label: 'Weather' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'controls', label: 'Controls' },
    { value: 'other', label: 'Other' },
  ];
}

/**
 * Categorize MDI icon names
 */
export function categorizeMDIIcon(name: string): string {
  const lower = name.toLowerCase();
  
  if (lower.includes('home') || lower.includes('door') || lower.includes('window') || 
      lower.includes('garage') || lower.includes('room') || lower.includes('house')) {
    return 'home';
  }
  if (lower.includes('light') || lower.includes('lamp') || lower.includes('bulb') || 
      lower.includes('ceiling')) {
    return 'lighting';
  }
  if (lower.includes('temperature') || lower.includes('thermometer') || lower.includes('heat') || 
      lower.includes('cool') || lower.includes('fan') || lower.includes('air') || 
      lower.includes('thermostat')) {
    return 'climate';
  }
  if (lower.includes('lock') || lower.includes('security') || lower.includes('camera') || 
      lower.includes('alarm') || lower.includes('shield') || lower.includes('cctv')) {
    return 'security';
  }
  if (lower.includes('music') || lower.includes('speaker') || lower.includes('volume') || 
      lower.includes('play') || lower.includes('pause') || lower.includes('media') || 
      lower.includes('tv') || lower.includes('radio')) {
    return 'media';
  }
  if (lower.includes('weather') || lower.includes('sun') || lower.includes('cloud') || 
      lower.includes('rain') || lower.includes('snow') || lower.includes('wind')) {
    return 'weather';
  }
  if (lower.includes('water') || lower.includes('power') || lower.includes('battery') || 
      lower.includes('plug') || lower.includes('electric')) {
    return 'utilities';
  }
  if (lower.includes('power') || lower.includes('switch') || lower.includes('toggle') || 
      lower.includes('button')) {
    return 'controls';
  }
  
  return 'other';
}

/**
 * Categorize React Icon names
 */
export function categorizeReactIcon(name: string): string {
  const lower = name.toLowerCase();
  
  if (lower.includes('home') || lower.includes('door') || lower.includes('bed') || 
      lower.includes('house') || lower.includes('building')) {
    return 'home';
  }
  if (lower.includes('light') || lower.includes('bulb')) {
    return 'lighting';
  }
  if (lower.includes('thermometer') || lower.includes('temperature') || lower.includes('fan')) {
    return 'climate';
  }
  if (lower.includes('lock') || lower.includes('shield') || lower.includes('key') || 
      lower.includes('camera') || lower.includes('security')) {
    return 'security';
  }
  if (lower.includes('music') || lower.includes('volume') || lower.includes('speaker') || 
      lower.includes('play') || lower.includes('pause') || lower.includes('tv')) {
    return 'media';
  }
  if (lower.includes('sun') || lower.includes('cloud') || lower.includes('rain') || 
      lower.includes('snow') || lower.includes('weather')) {
    return 'weather';
  }
  if (lower.includes('battery') || lower.includes('plug') || lower.includes('water') || 
      lower.includes('power')) {
    return 'utilities';
  }
  if (lower.includes('power') || lower.includes('switch')) {
    return 'controls';
  }
  
  return 'other';
}
