/**
 * Widget Display Utilities
 * 
 * Centralized functions for formatting widget IDs with custom names for display
 * and parsing them back to IDs for internal use.
 */

/**
 * Format widget ID for display with custom name appended
 * @param widgetId - The widget ID (e.g., "widget-1770557314477")
 * @param widgets - Array or record of widgets to lookup custom name
 * @returns Formatted string: "widget-1770557314477 (Test_slider)" or just ID if no custom name
 */
export function formatWidgetDisplay(
  widgetId: string, 
  widgets: any[] | Record<string, any>
): string {
  if (!widgetId) return '';
  
  // Handle both array and record of widgets
  const widgetList = Array.isArray(widgets) 
    ? widgets 
    : Object.values(widgets);
  
  // Find widget by ID
  const widget = widgetList.find((w: any) => w.id === widgetId);
  if (!widget) return widgetId; // Widget not found, return ID only
  
  // Get custom name from widget.name (not config.customName)
  const customName = widget.name;
  if (!customName) return widgetId; // No custom name, return ID only
  
  // Return formatted string
  return `${widgetId} (${customName})`;
}

/**
 * Parse widget display string back to widget ID
 * Strips custom name and whitespace to extract the ID
 * @param displayString - Formatted string like "widget-1770557314477 (Test_slider)"
 * @returns Widget ID: "widget-1770557314477"
 */
export function parseWidgetId(displayString: string): string {
  if (!displayString) return '';
  
  // Remove everything after first opening parenthesis and trim
  const idPart = displayString.split('(')[0].trim();
  return idPart;
}

/**
 * Get widget custom name from ID
 * @param widgetId - The widget ID
 * @param widgets - Array or record of widgets to lookup custom name
 * @returns Custom name or empty string if not found
 */
export function getWidgetCustomName(
  widgetId: string,
  widgets: any[] | Record<string, any>
): string {
  if (!widgetId) return '';
  
  const widgetList = Array.isArray(widgets) 
    ? widgets 
    : Object.values(widgets);
  
  const widget = widgetList.find((w: any) => w.id === widgetId);
  return widget?.name || '';
}
