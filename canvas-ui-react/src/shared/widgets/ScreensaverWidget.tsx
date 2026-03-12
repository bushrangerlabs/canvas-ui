/**
 * Screensaver Widget
 * Behaviour-only widget: mounts idle timer and screensaver overlay in kiosk mode.
 * Edit mode: shows a visible placeholder. Preview mode: no-op.
 *
 * Modes:
 *   dim      - Full-screen opacity overlay (click/key to dismiss)
 *   navigate - Navigate to a designated screensaver view, return on dismiss
 *
 * Triggers: idle timeout | activate-screensaver flow node | entity via flow
 * Dismissal: touch/click | keyboard | dismiss-screensaver flow node
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { WidgetProps } from '../types';
import type { WidgetMetadata } from '../types/metadata';
import { useConfigStore } from '../stores/useConfigStore';

// ─── Event names (shared with executor.ts) ───────────────────────────────────

export const SCREENSAVER_ACTIVATE_EVENT = 'canvas-screensaver-activate';
export const SCREENSAVER_DISMISS_EVENT  = 'canvas-screensaver-dismiss';

// ─── Component ───────────────────────────────────────────────────────────────

const ScreensaverWidget: React.FC<WidgetProps> = ({ config, isEditMode }) => {
  const {
    mode             = 'dim',
    dimOpacity       = 85,
    navigateToView   = '',
    idleTimeout      = 120,
    dismissOnTouch   = true,
    dismissOnKeyboard = true,
  } = config.config;

  const widgetId = config.id;

  // Only activate screensaver mechanics when running inside kiosk.html
  const isKiosk = !isEditMode && window.location.pathname.includes('kiosk');

  const [active, setActive] = useState(false);
  const activeRef     = useRef(false);   // Mirror of state for stable callbacks
  const idleTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const originViewRef = useRef<string | null>(null);

  // ── activate / dismiss ──────────────────────────────────────────────────

  const activate = useCallback(() => {
    if (activeRef.current) return;
    activeRef.current = true;
    setActive(true);

    if (mode === 'navigate' && navigateToView) {
      originViewRef.current = useConfigStore.getState().currentViewId || null;
      window.dispatchEvent(
        new CustomEvent('canvas-navigate-view', { detail: { viewId: navigateToView } })
      );
    }
  }, [mode, navigateToView]);

  const dismiss = useCallback(() => {
    if (!activeRef.current) return;
    activeRef.current = false;
    setActive(false);

    if (mode === 'navigate' && originViewRef.current) {
      window.dispatchEvent(
        new CustomEvent('canvas-navigate-view', { detail: { viewId: originViewRef.current } })
      );
      originViewRef.current = null;
    }
  }, [mode]);

  // Keep stable refs so idle-timer callbacks never go stale
  const activateRef = useRef(activate);
  const dismissRef  = useRef(dismiss);
  useEffect(() => { activateRef.current = activate; }, [activate]);
  useEffect(() => { dismissRef.current  = dismiss;  }, [dismiss]);

  // ── idle timer ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isKiosk || idleTimeout <= 0) return;

    const scheduleTimer = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => activateRef.current(), idleTimeout * 1000);
    };

    const handleActivity = () => {
      if (activeRef.current) dismissRef.current();
      scheduleTimer();
    };

    const events = ['mousemove', 'mousedown', 'touchstart', 'keydown'] as const;
    events.forEach(e => document.addEventListener(e, handleActivity, { passive: true }));

    scheduleTimer(); // Start initial countdown

    return () => {
      events.forEach(e => document.removeEventListener(e, handleActivity));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isKiosk, idleTimeout]); // Restart only when these change

  // ── flow event listeners ────────────────────────────────────────────────

  useEffect(() => {
    if (!isKiosk) return;

    const handleActivate = (e: Event) => {
      const detail = (e as CustomEvent<{ widgetId?: string }>).detail;
      if (!detail?.widgetId || detail.widgetId === widgetId) activateRef.current();
    };
    const handleDismiss = (e: Event) => {
      const detail = (e as CustomEvent<{ widgetId?: string }>).detail;
      if (!detail?.widgetId || detail.widgetId === widgetId) dismissRef.current();
    };

    window.addEventListener(SCREENSAVER_ACTIVATE_EVENT, handleActivate);
    window.addEventListener(SCREENSAVER_DISMISS_EVENT,  handleDismiss);
    return () => {
      window.removeEventListener(SCREENSAVER_ACTIVATE_EVENT, handleActivate);
      window.removeEventListener(SCREENSAVER_DISMISS_EVENT,  handleDismiss);
    };
  }, [isKiosk, widgetId]);

  // ── keyboard dismiss ────────────────────────────────────────────────────

  useEffect(() => {
    if (!active || !dismissOnKeyboard) return;
    const handle = () => dismissRef.current();
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [active, dismissOnKeyboard]);

  // ─── RENDER ──────────────────────────────────────────────────────────────

  // Edit mode: visible placeholder (selectable / configurable in Inspector)
  if (isEditMode) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(30, 30, 60, 0.85)',
          border: '1.5px dashed #7986cb',
          borderRadius: 6,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9fa8da',
          fontSize: 12,
          gap: 4,
          userSelect: 'none',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        <span style={{ fontSize: 20 }}>🌙</span>
        <span style={{ fontWeight: 600 }}>Screensaver</span>
        <span style={{ fontSize: 10, opacity: 0.7, textAlign: 'center', padding: '0 4px' }}>
          {mode === 'dim'
            ? `Dim ${dimOpacity}%`
            : `→ ${navigateToView || '(no view)'}`}
          {idleTimeout > 0 ? ` · ${idleTimeout}s` : ' · manual only'}
        </span>
      </div>
    );
  }

  // Preview or non-kiosk: invisible, no mechanics
  if (!isKiosk) return null;

  // Kiosk + active + dim mode: full-screen overlay portal
  if (active && mode === 'dim') {
    return createPortal(
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          backgroundColor: `rgba(0,0,0,${dimOpacity / 100})`,
          cursor: 'pointer',
        }}
        onClick={() => { if (dismissOnTouch) dismissRef.current(); }}
      />,
      document.body
    );
  }

  // Kiosk + navigate mode or inactive: no visual, mechanics handled by effects above
  return null;
};

// ─── Metadata ────────────────────────────────────────────────────────────────

export const screensaverWidgetMetadata: WidgetMetadata = {
  name: 'Screensaver',
  description: 'Dims screen or navigates away after idle timeout. Kiosk mode only.',
  icon: 'DarkMode',
  category: 'display',
  defaultSize: { w: 80, h: 80 },
  fields: [
    { name: 'width',             type: 'number',   label: 'Width',               default: 80,       category: 'layout' },
    { name: 'height',            type: 'number',   label: 'Height',              default: 80,       category: 'layout' },
    { name: 'mode',              type: 'select',   label: 'Mode',                default: 'dim',    category: 'behavior',
      options: [{ value: 'dim', label: 'Dim overlay' }, { value: 'navigate', label: 'Navigate to view' }] },
    { name: 'dimOpacity',        type: 'slider',   label: 'Dim Opacity %',       default: 85,       category: 'style',
      min: 0, max: 100, step: 1,
      visibleWhen: { field: 'mode', value: 'dim' } },
    { name: 'navigateToView',    type: 'text',     label: 'Screensaver View ID', default: '',       category: 'behavior',
      visibleWhen: { field: 'mode', value: 'navigate' } },
    { name: 'idleTimeout',       type: 'number',   label: 'Idle Timeout (s)',    default: 120,      category: 'behavior' },
    { name: 'dismissOnTouch',    type: 'checkbox', label: 'Dismiss on Touch',    default: true,     category: 'behavior' },
    { name: 'dismissOnKeyboard', type: 'checkbox', label: 'Dismiss on Keyboard', default: true,    category: 'behavior' },
  ],
};

export default ScreensaverWidget;
