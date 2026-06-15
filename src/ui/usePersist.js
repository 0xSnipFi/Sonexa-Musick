// ============================================================
// AURALIS — useState that persists to localStorage
// ============================================================
import React from 'react';

export function usePersist(key, initial) {
  const [val, setVal] = React.useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw != null ? JSON.parse(raw) : initial;
    } catch { return initial; }
  });
  const set = React.useCallback((next) => {
    setVal((prev) => {
      const v = typeof next === 'function' ? next(prev) : next;
      try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* quota */ }
      return v;
    });
  }, [key]);
  return [val, set];
}
