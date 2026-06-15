// ============================================================
// LUMORA — Local files source (native; web has no FS access)
// ============================================================
// True lossless: the user's own FLAC/WAV/ALAC/MP3 on the device. Real
// implementation requires the native layer (Capacitor Filesystem +
// MediaStore scan + tag parsing), wired in the Capacitor phase. On the web
// dev build this returns nothing but keeps the source contract intact so the
// registry and UI behave identically in both environments.

import { SOURCE_LOSSLESS } from '../types.js';

const LOSSLESS_EXT = ['flac', 'wav', 'alac', 'ape', 'wv'];

// In-memory index populated by the native scanner (see android plan).
let INDEX = [];

export function setLocalIndex(tracks) { INDEX = tracks || []; }

function isNative() {
  return typeof window !== 'undefined'
    && window.Capacitor?.isNativePlatform?.() === true;
}

export const localSource = {
  key: 'local',
  label: 'On this device',
  canLossless: SOURCE_LOSSLESS.local,

  isEnabled() { return true; },

  async healthCheck() { return isNative(); },

  async search(q) {
    const query = q.toLowerCase();
    return INDEX.filter(t =>
      t.title?.toLowerCase().includes(query) ||
      t.artist?.toLowerCase().includes(query) ||
      t.album?.toLowerCase().includes(query));
  },

  async resolveStream(track) {
    // Native files expose a local file:// or content:// URI in raw.uri.
    const url = track.raw?.uri || track.raw?.path;
    if (!url) throw new Error('Local file uri missing (native scan required)');
    const ext = (track.codec || url.split('.').pop() || '').toLowerCase();
    return { url, lossless: LOSSLESS_EXT.includes(ext), seekable: true };
  },
};
