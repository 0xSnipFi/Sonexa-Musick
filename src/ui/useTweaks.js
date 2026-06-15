// ============================================================
// LUMORA — appearance tweaks, persisted to localStorage
// (real-app replacement for the dev-only host-postMessage version)
// ============================================================
import React from 'react';

const STORE_KEY = 'lumora.tweaks';

function load(defaults) {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return defaults;
  }
}

export function useTweaks(defaults) {
  const [values, setValues] = React.useState(() => load(defaults));

  const setTweak = React.useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null
      ? keyOrEdits : { [keyOrEdits]: val };
    setValues((prev) => {
      const next = { ...prev, ...edits };
      try { localStorage.setItem(STORE_KEY, JSON.stringify(next)); } catch { /* ignore quota */ }
      return next;
    });
  }, []);

  return [values, setTweak];
}
