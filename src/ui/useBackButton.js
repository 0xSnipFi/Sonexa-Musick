// ============================================================
// Sonexa — back button handler (Android native + Web/PWA)
// ============================================================
// Static-import Capacitor App plugin so prod builds bundle it
// reliably (dynamic imports have flaked in past builds).
//
// Priority: sheet open → close sheet, non-home tab → go home,
// home tab → first press warns via toast, second within 2 s exits.

import React from 'react';
import { App as CapApp } from '@capacitor/app';

const BACK_STATE_KEY = '__sonexa_back';

function pushBackState(reason) {
  try {
    // Don't push duplicate states
    if (history.state?.[BACK_STATE_KEY] === reason) return;
    history.pushState({ [BACK_STATE_KEY]: reason }, '');
  } catch {}
}

export function useBackButton({ sheet, tab, onCloseSheet, onGoHome, onExitHint }) {
  const lastPressRef = React.useRef(0);

  const refs = React.useRef({ sheet, tab, onCloseSheet, onGoHome, onExitHint });
  refs.current = { sheet, tab, onCloseSheet, onGoHome, onExitHint };

  const prevSheetRef = React.useRef(sheet);
  const prevTabRef = React.useRef(tab);

  React.useEffect(() => {
    if (sheet && !prevSheetRef.current) pushBackState('sheet');
    prevSheetRef.current = sheet;
  }, [sheet]);

  React.useEffect(() => {
    if (tab !== 'home' && prevTabRef.current === 'home') pushBackState('tab');
    prevTabRef.current = tab;
  }, [tab]);

  const handleBack = React.useCallback(() => {
    const r = refs.current;
    if (r.sheet) { r.onCloseSheet(); return; }
    if (r.tab !== 'home') { r.onGoHome(); return; }
    const now = Date.now();
    if (now - lastPressRef.current < 2000) {
      try { CapApp.exitApp(); } catch {}
    } else {
      lastPressRef.current = now;
      r.onExitHint();
    }
  }, []);

  // Capacitor native back button (static import — reliable in prod)
  React.useEffect(() => {
    let handle = null;
    let cancelled = false;
    (async () => {
      try {
        const h = await CapApp.addListener('backButton', () => handleBack());
        if (cancelled) { try { h?.remove?.(); } catch {} return; }
        handle = h;
      } catch { /* web platform */ }
    })();
    return () => { cancelled = true; try { handle?.remove?.(); } catch {} };
  }, [handleBack]);

  // Browser popstate (PWA / web fallback)
  React.useEffect(() => {
    const onPopState = () => handleBack();
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [handleBack]);
}
