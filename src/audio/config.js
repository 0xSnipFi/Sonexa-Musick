// ============================================================
// SONEXA — source configuration (persisted to localStorage)
// ============================================================
// Per-source enable flags + credentials in one auditable place.
//
// Playable-in-browser truth: Internet Archive (direct files, no key) and a
// Subsonic/Navidrome server actually stream in a browser/PWA. YouTube (Piped)
// extraction is unreliable from browsers, so it ships OFF by default — enable
// it only when running the native Android build. This keeps every tap working.

const KEY = 'sonexa.sources';
const VERSION = 6;

const DEFAULTS = {
  _v: VERSION,
  // JioSaavn source: unlimited search, streaming, high-quality downloads. Enabled by default!
  saavn:    { enabled: true, instance: 'https://meloapi.vercel.app/api/' },
  // Internet Archive: free, no key, plays in-browser.
  archive:  { enabled: true },
  // Your own server: true lossless.
  subsonic: { enabled: false, url: '', user: '', password: '' },
  // Creative-Commons catalog (needs a free client id).
  jamendo:  { enabled: false, clientId: '' },
  // YouTube via Piped: search works, but audio playback needs the native build.
  piped:    { enabled: false, instance: 'https://api.piped.private.coffee' },
  local:    { enabled: true, folders: [] },
};

export function loadConfig() {
  const clone = (obj) => JSON.parse(JSON.stringify(obj));
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return clone(DEFAULTS);
    const parsed = JSON.parse(raw);
    // Reset on version bump so stale flags (e.g. old piped=true) don't linger.
    if (parsed._v !== VERSION) {
      const fresh = clone(DEFAULTS);
      saveConfig(fresh);
      return fresh;
    }
    const out = clone(DEFAULTS);
    for (const k of Object.keys(out)) {
      if (k === '_v') continue;
      out[k] = { ...out[k], ...(parsed[k] || {}) };
    }
    return out;
  } catch {
    return clone(DEFAULTS);
  }
}

export function saveConfig(cfg) {
  try { localStorage.setItem(KEY, JSON.stringify({ ...cfg, _v: VERSION })); } catch { /* quota */ }
  return cfg;
}

export function updateSource(key, patch) {
  const cfg = loadConfig();
  cfg[key] = { ...cfg[key], ...patch };
  return saveConfig(cfg);
}
