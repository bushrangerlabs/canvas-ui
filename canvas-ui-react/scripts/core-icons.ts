/**
 * Core icons that are pre-bundled with the application.
 * These icons are essential for the editor UI and are downloaded at build time.
 * Total: ~50 icons (~10-15KB)
 */

export const CORE_ICONS = [
  // ===== TOOLBAR ICONS =====
  'mdi:plus',                    // Add widget
  'mdi:delete',                  // Delete widget
  'mdi:content-copy',            // Copy widget
  'mdi:content-paste',           // Paste widget
  'mdi:arrow-up',                // Move up
  'mdi:arrow-down',              // Move down
  'mdi:arrow-left',              // Move left
  'mdi:arrow-right',             // Move right
  'mdi:eye',                     // Show
  'mdi:eye-off',                 // Hide
  'mdi:lock',                    // Lock
  'mdi:lock-open',               // Unlock
  'mdi:content-save',            // Save
  'mdi:undo',                    // Undo
  'mdi:redo',                    // Redo
  'mdi:magnify',                 // Search/zoom
  'mdi:grid',                    // Grid toggle
  'mdi:fullscreen',              // Fullscreen
  'mdi:fullscreen-exit',         // Exit fullscreen
  
  // ===== INSPECTOR ICONS =====
  'mdi:cog',                     // Behavior category
  'mdi:palette',                 // Style category
  'mdi:ruler',                   // Layout category
  'mdi:animation',               // Animation category
  'mdi:help-circle',             // Help
  
  // ===== WIDGET REGISTRY ICONS (All 21 widgets) =====
  'material-symbols:button',                      // ButtonWidget
  'material-symbols:text-fields',                 // TextWidget
  'material-symbols:speed',                       // GaugeWidget
  'material-symbols:tune',                        // SliderWidget
  'material-symbols:toggle-on',                   // SwitchWidget
  'material-symbols:image',                       // ImageWidget
  'material-symbols:category',                    // IconWidget
  'material-symbols:linear-scale',                // ProgressBarWidget
  'material-symbols:donut-large',                 // ProgressCircleWidget
  'material-symbols:input',                       // InputTextWidget
  'material-symbols:schedule',                    // FlipClockWidget
  'material-symbols:access-time',                 // DigitalClockWidget
  'material-symbols:radio-button-checked',        // KnobWidget
  'material-symbols:web',                         // IFrameWidget
  'material-symbols:border-all',                  // BorderWidget
  'material-symbols:numbers',                     // ValueWidget
  'material-symbols:radio-button-unchecked',      // RadioButtonWidget
  'material-symbols:palette',                     // ColorPickerWidget
  'material-symbols:cloud',                       // WeatherWidget
  'material-symbols:keyboard',                    // KeyboardWidget
  'material-symbols:code',                        // HtmlWidget (if exists)
  
  // ===== COMMON UI ICONS =====
  'mdi:close',                   // Close dialogs
  'mdi:check',                   // Confirm
  'mdi:alert-circle',            // Warning
  'mdi:information',             // Info
  'mdi:upload',                  // Upload
  'mdi:download',                // Download
  'mdi:refresh',                 // Refresh
  'mdi:dots-vertical',           // More options
  'mdi:menu',                    // Menu
  'mdi:home',                    // Home/default
  'mdi:star',                    // Favorite
  'mdi:star-outline',            // Not favorite
  'mdi:history',                 // Recent
  'mdi:folder',                  // Category/folder
  'mdi:chevron-down',            // Expand
  'mdi:chevron-right',           // Collapse
  'mdi:filter',                  // Filter
];

/**
 * Icon categories for the icon picker
 */
export const ICON_CATEGORIES = [
  { id: 'all', label: 'All Icons', icon: 'mdi:grid' },
  { id: 'favorites', label: 'Favorites', icon: 'mdi:star' },
  { id: 'recent', label: 'Recent', icon: 'mdi:history' },
  { id: 'mdi', label: 'Material Design', icon: 'mdi:material-design' },
  { id: 'material-symbols', label: 'Material Symbols', icon: 'mdi:google' },
  { id: 'fa', label: 'Font Awesome', icon: 'mdi:font-awesome' },
  { id: 'bi', label: 'Bootstrap Icons', icon: 'mdi:bootstrap' },
  { id: 'lucide', label: 'Lucide', icon: 'mdi:feather' },
];

/**
 * Popular icon collections available via iconify
 */
export const ICON_COLLECTIONS = [
  'mdi',              // Material Design Icons (most comprehensive)
  'material-symbols', // Google Material Symbols
  'fa',               // Font Awesome
  'bi',               // Bootstrap Icons
  'lucide',           // Lucide Icons
  'heroicons',        // Heroicons
  'tabler',           // Tabler Icons
  'carbon',           // IBM Carbon
  'ri',               // Remix Icons
  'ph',               // Phosphor Icons
];
