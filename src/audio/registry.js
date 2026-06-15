// ============================================================
// LUMORA — source registry + unified search
// ============================================================
// One place that knows every source. Search fans out to all *enabled*
// sources in parallel and merges results; a single source failing (network,
// bad creds) never breaks the whole search.

import { localSource } from './sources/local.js';
import { subsonicSource } from './sources/subsonic.js';
import { pipedSource } from './sources/piped.js';
import { jamendoSource } from './sources/jamendo.js';
import { archiveSource } from './sources/archive.js';
import { saavnSource } from './sources/saavn.js';

export const SOURCES = [
  localSource,
  saavnSource,
  subsonicSource,
  pipedSource,
  jamendoSource,
  archiveSource,
];

const BY_KEY = Object.fromEntries(SOURCES.map(s => [s.key, s]));

export function getSource(key) { return BY_KEY[key]; }

export function enabledSources() {
  return SOURCES.filter(s => {
    try { return s.isEnabled(); } catch { return false; }
  });
}

/**
 * Search across enabled sources. Lossless-capable sources are ordered first so
 * the highest-quality matches surface at the top.
 * @returns {Promise<{ source: string, label: string, tracks: import('./types.js').Track[], error?: string }[]>}
 */
export async function searchAll(query, limitPerSource = 25) {
  const sources = enabledSources();
  const groups = await Promise.all(sources.map(async (s) => {
    try {
      const tracks = await s.search(query, limitPerSource);
      return { source: s.key, label: s.label, canLossless: s.canLossless, tracks };
    } catch (err) {
      return { source: s.key, label: s.label, canLossless: s.canLossless, tracks: [], error: String(err?.message || err) };
    }
  }));
  return groups.sort((a, b) => Number(b.canLossless) - Number(a.canLossless));
}

/** Resolve a track to a playable stream via its owning source. */
export async function resolveStream(track, quality) {
  const s = getSource(track.source);
  if (!s) throw new Error(`Unknown source: ${track.source}`);
  return s.resolveStream(track, quality);
}
