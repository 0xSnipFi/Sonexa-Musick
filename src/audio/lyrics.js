// ============================================================
// AURALIS — real lyrics (LRCLIB, free, no key, CORS-enabled)
// ============================================================
// Fetches time-synced (LRC) lyrics for the playing track in its own language,
// falling back to plain lyrics, then to none. Results cached per track id.

const API = 'https://lrclib.net/api';
const cache = new Map();

/** Parse an LRC string into [{ time:seconds, text }] sorted by time. */
export function parseLRC(lrc) {
  if (!lrc) return [];
  const out = [];
  const re = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g;
  for (const line of lrc.split('\n')) {
    let m, last = 0, hadTag = false;
    const tags = [];
    re.lastIndex = 0;
    while ((m = re.exec(line)) !== null) {
      hadTag = true; last = re.lastIndex;
      const min = +m[1], sec = +m[2], frac = m[3] ? +(`0.${m[3]}`) : 0;
      tags.push(min * 60 + sec + frac);
    }
    if (!hadTag) continue;
    const text = line.slice(last).trim();
    for (const t of tags) out.push({ time: t, text });
  }
  return out.sort((a, b) => a.time - b.time);
}

function clean(s) { return (s || '').replace(/\s*[\(\[].*?[\)\]]\s*/g, ' ').replace(/\s+/g, ' ').trim(); }

/**
 * Resolve lyrics for a track.
 * @returns {Promise<{synced:{time,text}[], plain:string[], source:'synced'|'plain'|'none'}>}
 */
export async function getLyrics(track) {
  if (!track) return { synced: [], plain: [], source: 'none' };
  if (cache.has(track.id)) return cache.get(track.id);

  const artist = clean(track.artist);
  const title = clean(track.title);
  
  // Extract the first primary artist for broader search (e.g. "Arijit Singh, Mithoon" -> "Arijit Singh")
  const firstArtist = clean(track.artist.split(/[,;&]|\bfeat\b/i)[0]);

  let result = { synced: [], plain: [], source: 'none' };

  try {
    // 1. Precise lookup first.
    const params = new URLSearchParams({ track_name: title, artist_name: artist });
    if (track.album) params.set('album_name', clean(track.album));
    if (track.duration) params.set('duration', String(Math.round(track.duration)));
    let data = await fetchJson(`${API}/get?${params}`);

    // 2. Fall back to exact search with the first artist name
    if (!data && firstArtist !== artist) {
      const p2 = new URLSearchParams({ track_name: title, artist_name: firstArtist });
      if (track.duration) p2.set('duration', String(Math.round(track.duration)));
      data = await fetchJson(`${API}/get?${p2}`);
    }

    // 3. Fall back to fuzzy search using track_name + artist_name
    if (!data) {
      const arr = await fetchJson(`${API}/search?${new URLSearchParams({ track_name: title, artist_name: artist })}`);
      data = Array.isArray(arr) ? arr.find(x => x.syncedLyrics) || arr[0] : null;
    }

    // 4. Fall back to fuzzy search with first artist only
    if (!data && firstArtist !== artist) {
      const arr = await fetchJson(`${API}/search?${new URLSearchParams({ track_name: title, artist_name: firstArtist })}`);
      data = Array.isArray(arr) ? arr.find(x => x.syncedLyrics) || arr[0] : null;
    }

    // 5. Fall back to general query search: track title + first artist name
    if (!data) {
      const arr = await fetchJson(`${API}/search?q=${encodeURIComponent(title + ' ' + firstArtist)}`);
      data = Array.isArray(arr) ? arr.find(x => x.syncedLyrics) || arr[0] : null;
    }

    // 6. Last resort: general query search with track title only
    if (!data) {
      const arr = await fetchJson(`${API}/search?q=${encodeURIComponent(title)}`);
      data = Array.isArray(arr) ? arr.find(x => x.syncedLyrics) || arr[0] : null;
    }

    if (data?.syncedLyrics) {
      result = { synced: parseLRC(data.syncedLyrics), plain: (data.plainLyrics || '').split('\n'), source: 'synced' };
    } else if (data?.plainLyrics) {
      result = { synced: [], plain: data.plainLyrics.split('\n').filter(Boolean), source: 'plain' };
    }

    // 7. KuGou fallback (from Metrolist reference — good for Asian/Hindi songs LRCLIB misses)
    if (result.source === 'none') {
      try {
        const kgSearch = await fetchJson(`https://mobileservice.kugou.com/api/v3/search/song?keyword=${encodeURIComponent(title + ' ' + firstArtist)}&page=1&pagesize=5`);
        const kgSong = kgSearch?.data?.info?.[0];
        if (kgSong?.hash) {
          const kgLyrics = await fetchJson(`https://lyrics.kugou.com/search?ver=1&man=yes&client=pc&keyword=${encodeURIComponent(title + ' ' + firstArtist)}&hash=${kgSong.hash}`);
          const candidate = kgLyrics?.candidates?.[0];
          if (candidate?.id && candidate?.accesskey) {
            const kgDl = await fetchJson(`https://lyrics.kugou.com/download?ver=1&client=pc&id=${candidate.id}&accesskey=${candidate.accesskey}&fmt=lrc&charset=utf8`);
            if (kgDl?.content) {
              const lrcText = atob(kgDl.content);
              const synced = parseLRC(lrcText);
              if (synced.length > 0) {
                result = { synced, plain: synced.map(l => l.text), source: 'synced' };
              }
            }
          }
        }
      } catch { /* KuGou unavailable — not critical */ }
    }
  } catch (err) {
    // Lyrics fetch error — non-critical, just show no lyrics
  }

  cache.set(track.id, result);
  return result;
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) return null;
  return res.json();
}

/** Index of the active synced line for a given playback position (seconds). */
export function activeLine(synced, position) {
  if (!synced.length) return -1;
  let lo = 0, hi = synced.length - 1, ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (synced[mid].time <= position) { ans = mid; lo = mid + 1; } else hi = mid - 1;
  }
  return ans;
}
