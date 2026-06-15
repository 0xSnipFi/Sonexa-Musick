// ============================================================
// LUMORA — Internet Archive source (REAL, free + legal)
// ============================================================
// archive.org hosts huge public-domain / live / netlabel audio collections,
// often including lossless FLAC. Uses the public advancedsearch + metadata
// APIs — no key required.

import { SOURCE_LOSSLESS } from '../types.js';

const SEARCH = 'https://archive.org/advancedsearch.php';
const META = 'https://archive.org/metadata';
const DL = 'https://archive.org/download';

const LOSSLESS_EXT = ['flac', 'wav', 'ape'];

export const archiveSource = {
  key: 'archive',
  label: 'Internet Archive',
  canLossless: SOURCE_LOSSLESS.archive,

  isEnabled() { return true; }, // no credentials needed; toggled in config

  async healthCheck() {
    try {
      const res = await fetch(`${SEARCH}?q=test&rows=1&output=json`);
      return res.ok;
    } catch { return false; }
  },

  // Returns items (collections/recordings); tracks are resolved on play.
  async search(q, limit = 25) {
    const p = new URLSearchParams({
      // Bias toward real music collections, away from talk/spoken content.
      q: `(${q}) AND mediatype:(audio) AND -collection:(podcasts OR radio OR librivox OR oldtimeradio)`,
      'fl[]': 'identifier', rows: String(limit + 12), output: 'json',
    });
    p.append('fl[]', 'title');
    p.append('fl[]', 'creator');
    p.append('sort[]', 'downloads desc'); // popular first = better quality
    const res = await fetch(`${SEARCH}?${p.toString()}`);
    if (!res.ok) throw new Error(`Archive HTTP ${res.status}`);
    const json = await res.json();
    const NOISE = /(podcast|radio show|interview|audiobook|lecture|sermon|news|talk show|episode)/i;
    const docs = (json.response?.docs || [])
      .filter(d => !NOISE.test(d.title || ''))
      .slice(0, limit);
    return docs.map(d => ({
      id: 'archive:' + d.identifier,
      source: 'archive',
      title: d.title || d.identifier,
      artist: Array.isArray(d.creator) ? d.creator[0] : (d.creator || 'Internet Archive'),
      // archive.org auto-generates a cover thumbnail per item.
      artwork: `https://archive.org/services/img/${d.identifier}`,
      seed: `${d.title}-${d.identifier}`,
      lossless: undefined, // unknown until metadata is fetched
      raw: d,
    }));
  },

  // Fetch the item's file list, pick the best single audio file.
  async resolveStream(track) {
    const identifier = track.id.replace(/^archive:/, '');
    const res = await fetch(`${META}/${identifier}`);
    if (!res.ok) throw new Error(`Archive metadata HTTP ${res.status}`);
    const meta = await res.json();
    const files = (meta.files || []).filter(f => /\.(flac|wav|ape|ogg|opus|mp3|m4a)$/i.test(f.name));
    if (!files.length) throw new Error('No audio files in item');
    const ext = (f) => f.name.split('.').pop().toLowerCase();
    // Prefer lossless, then widely-decodable web codecs, mp3/m4a last.
    const RANK = { flac: 0, wav: 1, ape: 2, ogg: 3, opus: 4, mp3: 5, m4a: 6 };
    files.sort((a, b) => (RANK[ext(a)] ?? 9) - (RANK[ext(b)] ?? 9));
    const file = files[0];
    const lossless = LOSSLESS_EXT.includes(ext(file));
    return {
      url: `${DL}/${identifier}/${encodeURIComponent(file.name)}`,
      lossless,
      seekable: true,
    };
  },
};
