// ============================================================
// LUMORA — Jamendo source (REAL, free + 100% legal)
// ============================================================
// Jamendo offers a large catalog of Creative-Commons / royalty-free music
// with a documented API. Needs a free client_id from developer.jamendo.com.
// Audio is MP3/Ogg (not lossless) but fully legal to stream and download.

import { loadConfig } from '../config.js';
import { SOURCE_LOSSLESS } from '../types.js';

const API = 'https://api.jamendo.com/v3.0';

function cfg() { return loadConfig().jamendo; }

async function api(path, params) {
  const c = cfg();
  const p = new URLSearchParams({ client_id: c.clientId, format: 'json', ...params });
  const res = await fetch(`${API}${path}?${p.toString()}`);
  if (!res.ok) throw new Error(`Jamendo HTTP ${res.status}`);
  const json = await res.json();
  if (json.headers?.status !== 'success') throw new Error(json.headers?.error_message || 'Jamendo error');
  return json.results || [];
}

function mapTrack(t) {
  return {
    id: 'jamendo:' + t.id,
    source: 'jamendo',
    title: t.name,
    artist: t.artist_name,
    album: t.album_name,
    duration: t.duration,
    artwork: t.album_image || t.image,
    seed: `${t.name}-${t.artist_name}`,
    lossless: false,
    codec: 'mp3',
    // audio / audiodownload are direct, ready-to-play URLs.
    raw: t,
  };
}

export const jamendoSource = {
  key: 'jamendo',
  label: 'Jamendo (free / CC)',
  canLossless: SOURCE_LOSSLESS.jamendo,

  isEnabled() {
    const c = cfg();
    return !!(c.enabled && c.clientId);
  },

  async healthCheck() {
    try { await api('/tracks', { limit: 1 }); return true; } catch { return false; }
  },

  async search(q, limit = 30) {
    const rows = await api('/tracks', { search: q, limit, audioformat: 'mp32' });
    return rows.map(mapTrack);
  },

  async resolveStream(track) {
    const url = track.raw?.audio || track.raw?.audiodownload;
    if (!url) throw new Error('No Jamendo audio url');
    return { url, mime: 'audio/mpeg', lossless: false, seekable: true };
  },
};
