// ============================================================
// SONEXA — home feed: recently played + discover
// ============================================================
// Real content for the Home screen: a persisted recently-played list and a
// discover feed pulled from JioSaavn. Caches results so Library and Home
// load instantly on subsequent visits.

import { loadConfig } from './config.js';
import { pipedSource } from './sources/piped.js';
import { archiveSource } from './sources/archive.js';
import { saavnSource } from './sources/saavn.js';

const RECENT_KEY = 'sonexa.recent';
const DISCOVER_CACHE_KEY = 'sonexa.discover.cache';
const DISCOVER_CACHE_TTL = 15 * 60 * 1000; // 15 minutes
const RECENT_CAP = 24;

export function recordPlay(track) {
  if (!track?.source) return; // skip demo tracks
  try {
    const list = getRecent().filter(t => t.id !== track.id);
    list.unshift(slim(track));
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, RECENT_CAP)));
  } catch { /* quota */ }
}

export function getRecent() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

// Keep only the fields the UI needs so the store stays small + serializable.
function slim(t) {
  return {
    id: t.id, source: t.source, title: t.title, artist: t.artist,
    album: t.album, duration: t.duration, artwork: t.artwork, seed: t.seed,
    lossless: t.lossless, codec: t.codec, sampleRate: t.sampleRate,
    bitDepth: t.bitDepth, bitrate: t.bitrate, raw: t.raw,
  };
}

// ---- Discover cache ----
function getCachedDiscover() {
  try {
    const raw = localStorage.getItem(DISCOVER_CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    // Return cached data even if stale (for instant load), let caller refresh
    return { data, fresh: Date.now() - ts < DISCOVER_CACHE_TTL };
  } catch { return null; }
}

function setCachedDiscover(data) {
  try {
    localStorage.setItem(DISCOVER_CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch { /* quota */ }
}

/**
 * Get cached discover data instantly (returns [] if no cache).
 * Used by Library and Home for instant initial render.
 */
export function getDiscoverCached() {
  const cached = getCachedDiscover();
  return cached?.data || [];
}

const DISCOVER_SEEDS = [
  'trending songs 2025', 'new hindi songs', 'latest bollywood', 'top hits',
  'arijit singh', 'ap dhillon', 'diljit dosanjh', 'badshah new song',
  'pop hits 2025', 'hip hop trending', 'lofi chill', 'rock anthems',
  'tamil hits', 'punjabi songs 2025', 'bengali songs', 'telugu hits',
  'k-pop hits', 'latin pop', 'edm party', 'jazz classics',
  'anime music', 'workout music', 'romantic songs', 'sad songs hindi',
  'party songs bollywood', 'indie music india', 'rap songs 2025',
  'classical fusion', 'sufi music', 'bhojpuri hits',
];

function pickSeeds(n) {
  const pool = [...DISCOVER_SEEDS];
  const out = [];
  for (let i = 0; i < n && pool.length; i++) {
    out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return out;
}

function dedupe(tracks) {
  const seen = new Set();
  return tracks.filter(t => (t && !seen.has(t.id)) && seen.add(t.id));
}

/**
 * Music-only discover feed. Always tries JioSaavn first.
 * Returns cached data instantly if available, fetches fresh in background.
 */
export async function getDiscover(_region = 'IN', limit = 24) {
  const cfg = loadConfig();
  const seeds = pickSeeds(4);

  // JioSaavn = primary source. Always try first — free, no key, real artwork.
  try {
    const groups = await Promise.all(
      seeds.map(s => saavnSource.search(s, 8).catch(() => []))
    );
    const merged = dedupe(groups.flat());
    if (merged.length) {
      const result = merged.slice(0, limit);
      setCachedDiscover(result); // cache for instant next load
      return result;
    }
  } catch { /* fall through */ }

  // Archive = secondary source
  if (cfg.archive?.enabled) {
    try {
      const groups = await Promise.all(
        seeds.map(s => archiveSource.search(s, 8).catch(() => []))
      );
      const merged = dedupe(groups.flat());
      if (merged.length) {
        const result = merged.slice(0, limit);
        setCachedDiscover(result);
        return result;
      }
    } catch { /* fall through */ }
  }

  // Piped only as a fallback
  if (cfg.piped?.enabled) {
    try {
      const groups = await Promise.all(
        seeds.slice(0, 3).map(s => pipedSource.search(s, 10).catch(() => []))
      );
      const merged = dedupe(groups.flat());
      if (merged.length) {
        const result = merged.slice(0, limit);
        setCachedDiscover(result);
        return result;
      }
    } catch { /* fall through */ }
  }

  return [];
}
