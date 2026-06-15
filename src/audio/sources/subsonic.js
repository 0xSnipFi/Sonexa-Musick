// ============================================================
// LUMORA — Subsonic / Navidrome source (REAL, true lossless)
// ============================================================
// Streams FLAC/ALAC straight from the user's own server. This is the
// legal, free, genuinely-lossless path: the user hosts their library.
//
// Auth: Subsonic supports hex-encoded password (`p=enc:<hex>`) which avoids
// pulling in an md5 implementation. Token auth (t/s) is more secure — a
// follow-up can add it once a small salted-md5 helper is in place.

import { loadConfig } from '../config.js';
import { SOURCE_LOSSLESS } from '../types.js';

const API = '1.16.1';
const CLIENT = 'lumora';

function cfg() { return loadConfig().subsonic; }

function hexEncode(str) {
  let out = '';
  for (let i = 0; i < str.length; i++) out += str.charCodeAt(i).toString(16).padStart(2, '0');
  return out;
}

function baseParams(c) {
  const p = new URLSearchParams({
    u: c.user, p: 'enc:' + hexEncode(c.password),
    v: API, c: CLIENT, f: 'json',
  });
  return p;
}

function endpoint(c, method, extra = {}) {
  const p = baseParams(c);
  for (const [k, v] of Object.entries(extra)) p.set(k, v);
  const url = c.url.replace(/\/+$/, '');
  return `${url}/rest/${method}?${p.toString()}`;
}

async function call(method, extra) {
  const c = cfg();
  if (!c.url || !c.user) throw new Error('Subsonic not configured');
  const res = await fetch(endpoint(c, method, extra));
  if (!res.ok) throw new Error(`Subsonic HTTP ${res.status}`);
  const json = await res.json();
  const r = json['subsonic-response'];
  if (!r || r.status !== 'ok') throw new Error(r?.error?.message || 'Subsonic error');
  return r;
}

function mapSong(s) {
  const codec = (s.suffix || '').toLowerCase();
  const lossless = ['flac', 'alac', 'wav', 'ape', 'wv'].includes(codec);
  const c = cfg();
  return {
    id: 'subsonic:' + s.id,
    source: 'subsonic',
    title: s.title || 'Unknown',
    artist: s.artist || 'Unknown',
    album: s.album,
    duration: s.duration,
    artwork: s.coverArt ? endpoint(c, 'getCoverArt', { id: s.coverArt, size: 512 }) : undefined,
    seed: `${s.title}-${s.artist}`,
    lossless,
    codec,
    bitrate: s.bitRate,
    sampleRate: s.samplingRate,
    bitDepth: s.bitDepth,
    raw: s,
  };
}

export const subsonicSource = {
  key: 'subsonic',
  label: 'Self-hosted (Navidrome)',
  canLossless: SOURCE_LOSSLESS.subsonic,

  isEnabled() {
    const c = cfg();
    return !!(c.enabled && c.url && c.user);
  },

  async healthCheck() {
    try { await call('ping'); return true; } catch { return false; }
  },

  async search(q, limit = 30) {
    const r = await call('search3', { query: q, songCount: limit, artistCount: 0, albumCount: 0 });
    const songs = r.searchResult3?.song || [];
    return songs.map(mapSong);
  },

  // Lossless = raw stream (no transcode). format=raw keeps the original codec.
  async resolveStream(track) {
    const c = cfg();
    const id = track.id.replace(/^subsonic:/, '');
    return {
      url: endpoint(c, 'stream', { id, format: 'raw' }),
      lossless: !!track.lossless,
      seekable: true,
    };
  },
};
