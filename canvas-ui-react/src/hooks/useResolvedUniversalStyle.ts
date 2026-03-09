import { useEntityBinding } from './useEntityBinding';
import type { UniversalStyle } from '../shared/types/universal-widget';

/**
 * Resolves entity binding expressions in UniversalStyle string properties.
 *
 * All string-typed fields in UniversalStyle (backgroundColor, backgroundImage,
 * borderColor, borderStyle, backgroundSize, backgroundPosition, backgroundRepeat)
 * are passed through `useEntityBinding` so that e.g.
 *   backgroundColor: "{input_text.my_color}"
 * resolves to the live entity state value.
 *
 * Non-string properties (borderRadius, borderWidth, boxShadow, rotation,
 * backgroundOpacity, zIndex) are passed through unchanged.
 *
 * If `style` is falsy it is returned unchanged.
 */
export function useResolvedUniversalStyle<T extends UniversalStyle | Record<string, any> | undefined>(
  style: T
): T {
  const raw = style as UniversalStyle | undefined;

  // Always call hooks unconditionally (React rules)
  const backgroundColor    = useEntityBinding(raw?.backgroundColor,    raw?.backgroundColor);
  const backgroundImage    = useEntityBinding(raw?.backgroundImage,    raw?.backgroundImage);
  const borderColor        = useEntityBinding(raw?.borderColor,        raw?.borderColor);
  const borderStyle        = useEntityBinding(raw?.borderStyle,        raw?.borderStyle) as UniversalStyle['borderStyle'];
  const backgroundSize     = useEntityBinding(raw?.backgroundSize,     raw?.backgroundSize);
  const backgroundPosition = useEntityBinding(raw?.backgroundPosition, raw?.backgroundPosition);
  const backgroundRepeat   = useEntityBinding(raw?.backgroundRepeat,   raw?.backgroundRepeat);

  if (!style) return style;

  return {
    ...style,
    // Only override fields that were present (avoid adding undefined keys)
    ...(backgroundColor    !== undefined && { backgroundColor }),
    ...(backgroundImage    !== undefined && { backgroundImage }),
    ...(borderColor        !== undefined && { borderColor }),
    ...(borderStyle        !== undefined && { borderStyle }),
    ...(backgroundSize     !== undefined && { backgroundSize }),
    ...(backgroundPosition !== undefined && { backgroundPosition }),
    ...(backgroundRepeat   !== undefined && { backgroundRepeat }),
  } as T;
}
