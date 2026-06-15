// ============================================================
// LUMORA — Piped source (REAL, free, all music — NOT lossless)
// ============================================================
// Piped is an open-source YouTube frontend with a public REST API: no API
// key, covers essentially all old + new music. Honest quality ceiling:
// YouTube audio tops out at ~256 kbps AAC / ~160 kbps Opus — transparent on
// IEMs for most listeners, but never lossless. We label it truthfully.
//
// ToS note: scraping YouTube is against YouTube ToS. This is acceptable only
// for a private, sideloaded app the user builds for themselves.

import { loadConfig } from '../config.js';
import { SOURCE_LOSSLESS } from '../types.js';

function cfg() { return loadConfig().piped; }

// Public Piped instances are flaky — keep fallbacks and try in order so search
// keeps working when one instance is down. The user's configured instance wins.
const FALLBACK_INSTANCES = [
  'https://api.piped.private.coffee',
  'https://pipedapi.reallyaweso.me',
  'https://pipedapi.adminforge.de',
  'https://pipedapi.kavin.rocks',
];

function instances() {
  const configured = (cfg().instance || '').replace(/\/+$/, '');
  const list = [configured, ...FALLBACK_INSTANCES].filter(Boolean);
  return [...new Set(list)];
}

async function api(path) {
  let lastErr;
  for (const base of instances()) {
    try {
      const res = await fetch(base + path);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) { lastErr = e; }
  }
  throw new Error(`Piped unreachable (${lastErr?.message || 'all instances failed'})`);
}

function videoIdOf(item) {
  // search items expose url like "/watch?v=ID"
  const m = (item.url || '').match(/v=([\w-]+)/);
  return m ? m[1] : item.videoId || null;
}

function mapItem(item) {
  const id = videoIdOf(item);
  return {
    id: 'piped:' + id,
    source: 'piped',
    title: item.title || 'Unknown',
    artist: item.uploaderName || 'YouTube',
    duration: item.duration > 0 ? item.duration : undefined,
    artwork: item.thumbnail,
    seed: `${item.title}-${item.uploaderName}`,
    lossless: false,
    codec: 'opus/aac',
    raw: item,
  };
}

export const pipedSource = {
  key: 'piped',
  label: 'YouTube (Piped)',
  canLossless: SOURCE_LOSSLESS.piped,

  isEnabled() {
    const c = cfg();
    return !!(c.enabled && c.instance);
  },

  async healthCheck() {
    try { await api('/healthcheck'); return true; }
    catch {
      // Not all instances expose /healthcheck — fall back to a cheap search.
      try { await api('/search?q=test&filter=music_songs'); return true; }
      catch { return false; }
    }
  },

  async search(q, limit = 30) {
    const data = await api(`/search?q=${encodeURIComponent(q)}&filter=music_songs`);
    const items = (data.items || []).filter(i => videoIdOf(i)).slice(0, limit);
    return items.map(mapItem);
  },

  // Trending feed for the Home screen (real songs + real thumbnails).
  async trending(region = 'IN', limit = 20) {
    const data = await api(`/trending?region=${region}`);
    const items = (data || []).filter(i => videoIdOf(i)).slice(0, limit);
    return items.map(mapItem);
  },

  // Resolve a playable stream. Prefer a direct (proxied) audio-only stream at
  // the highest bitrate; if the instance can't extract audio streams (common as
  // YouTube changes its player), fall back to the HLS manifest. Reliable
  // YouTube playback ultimately needs the native extractor (Android build).
  async resolveStream(track) {
    const id = track.id.replace(/^piped:/, '');
    const streams = await api(`/streams/${id}`);
    const audio = (streams.audioStreams || [])
      .slice()
      .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
    if (audio.length) {
      const opus = audio.find(s => /opus/i.test(s.codec || s.format || ''));
      const best = opus || audio[0];
      return { url: best.url, mime: best.mimeType, lossless: false, seekable: true };
    }
    if (streams.hls) {
      return { url: streams.hls, mime: 'application/vnd.apple.mpegurl', lossless: false, seekable: true };
    }
    throw new Error('YouTube stream unavailable — use the Android build for reliable playback');
  },
};
