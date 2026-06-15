// ============================================================
// SONEXA — JioSaavn Source (REAL, unlimited, high-quality 320k)
// ============================================================
// Integrates JioSaavn via a public API wrapper. Provides instant access to
// virtually all Indian (Hindi, Bengali, Punjabi, Tamil, etc.) and international
// music with direct high-quality streaming & download links (up to 320 kbps AAC).

import { loadConfig } from '../config.js';

function cfg() { return loadConfig().saavn; }

const DEFAULT_APIS = [
  'https://meloapi.vercel.app/api/',
  'https://saavn.dev/api/',
  'https://saavn.me/',
];

function unescape(str) {
  if (!str) return '';
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&apos;/g, "'");
}

async function api(path) {
  const configured = (cfg()?.instance || '').replace(/\/+$/, '');
  const list = [configured, ...DEFAULT_APIS].filter(Boolean);
  const uniq = [...new Set(list)];
  
  let lastErr;
  for (const base of uniq) {
    try {
      const url = base.endsWith('/') ? `${base}${path}` : `${base}/${path}`;
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      lastErr = e;
    }
  }
  throw new Error(`Saavn API unreachable (${lastErr?.message || 'all endpoints failed'})`);
}

function mapSong(song) {
  // Extract highest resolution image
  const art = song.image?.[2]?.url || song.image?.[2]?.link ||
              song.image?.[1]?.url || song.image?.[1]?.link ||
              song.image?.[0]?.url || song.image?.[0]?.link || '';

  // Get primary artist names
  let artistsStr = '';
  if (song.artists?.primary && Array.isArray(song.artists.primary)) {
    artistsStr = song.artists.primary.map(a => a.name).join(', ');
  } else if (song.primaryArtists) {
    artistsStr = song.primaryArtists;
  } else {
    artistsStr = 'JioSaavn';
  }

  return {
    id: 'saavn:' + song.id,
    source: 'saavn',
    title: unescape(song.name || song.title || 'Unknown'),
    artist: unescape(artistsStr),
    album: unescape(song.album?.name || song.album || ''),
    duration: song.duration ? Number(song.duration) : undefined,
    artwork: art,
    seed: `${song.name || song.title}-${song.id}`,
    lossless: false,
    codec: 'aac',
    bitrate: 320,
    raw: song,
  };
}

export const saavnSource = {
  key: 'saavn',
  label: 'JioSaavn (Unlimited)',
  canLossless: false,

  isEnabled() {
    try {
      const c = cfg();
      // If the config key doesn't exist at all (old cached config), still enabled
      if (!c || c.enabled === undefined) return true;
      return !!c.enabled;
    } catch {
      return true; // enabled by default even on errors
    }
  },

  async healthCheck() {
    try {
      const data = await api('search/songs?query=test&limit=1');
      return !!data;
    } catch {
      return false;
    }
  },

  async search(q, limit = 25) {
    if (!q.trim()) return [];
    try {
      const json = await api(`search/songs?query=${encodeURIComponent(q)}&limit=${limit}`);
      const songs = json.data?.results || json.data || [];
      return songs.map(mapSong);
    } catch (e) {
      console.error('Saavn search failed:', e);
      throw e;
    }
  },

  // Get song recommendations (from SaavnMp3 reference — /songs/:id/suggestions)
  async getSuggestions(track, limit = 10) {
    const id = track.id.replace(/^saavn:/, '');
    try {
      const json = await api(`songs/${id}/suggestions?limit=${limit}`);
      const songs = json.data || [];
      return songs.map(mapSong);
    } catch {
      return [];
    }
  },

  async resolveStream(track) {
    const id = track.id.replace(/^saavn:/, '');

    // ALWAYS fetch fresh song details — cached downloadUrls expire after ~minutes.
    // This is the #1 cause of "song starts then stops" on mobile.
    let song = null;
    try {
      const json = await api(`songs/${id}`);
      const songs = json.data || [];
      song = songs[0] || null;
    } catch {
      // If fresh fetch fails, try cached data as last resort
      song = track.raw;
    }

    if (!song || !song.downloadUrl || song.downloadUrl.length === 0) {
      throw new Error('No streaming audio URL found for this track');
    }

    // Prefer 320kbps, then fallback to next highest quality
    const dlUrls = song.downloadUrl;
    const hq = dlUrls.find(u => (u.quality === '320kbps')) ||
               dlUrls.find(u => (u.quality === '160kbps')) ||
               dlUrls[dlUrls.length - 1]; // last one is highest

    const streamUrl = hq.url || hq.link;
    if (!streamUrl) throw new Error('Audio stream link is empty');

    return {
      url: streamUrl,
      mime: 'audio/mp4',
      lossless: false,
      seekable: true,
    };
  },
};
