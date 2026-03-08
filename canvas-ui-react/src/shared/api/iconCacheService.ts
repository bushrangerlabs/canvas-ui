/**
 * Icon Cache Service - Communicates with Home Assistant to cache icons
 */

import type { IconData } from '../utils/iconCache';

/**
 * Cache icon to server via Home Assistant service call
 */
export async function cacheIconViaService(
  iconName: string,
  iconData: IconData
): Promise<boolean> {
  try {
    const response = await fetch('/api/services/canvas_ui/cache_icon', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('hassToken') || ''}`,
      },
      body: JSON.stringify({
        icon_name: iconName,
        icon_data: iconData,
      }),
    });

    if (!response.ok) {
      console.error(`[IconCache] Failed to cache icon ${iconName}: ${response.statusText}`);
      return false;
    }

    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error(`[IconCache] Error caching icon ${iconName}:`, error);
    return false;
  }
}
