// ============================================================
// LUMORA — normalized audio model + source contract
// ============================================================
//
// Every source (local files, Navidrome/Subsonic, Piped/YouTube,
// Jamendo, Internet Archive) maps its own data into this single
// Track shape so the UI never has to care where a song came from.

/**
 * @typedef {Object} Track
 * @property {string} id           Stable per-source id ("subsonic:abc123").
 * @property {string} source       Source key: 'local'|'subsonic'|'piped'|'jamendo'|'archive'.
 * @property {string} title
 * @property {string} artist
 * @property {string} [album]
 * @property {number} [duration]   Seconds.
 * @property {string} [artwork]    Cover art URL (or data URI).
 * @property {string} [seed]       Fallback seed for procedural art when no artwork.
 * @property {boolean} [lossless]  True only when the source delivers a lossless codec.
 * @property {string} [codec]      'flac'|'alac'|'wav'|'opus'|'aac'|'mp3'…
 * @property {number} [sampleRate] Hz, when known.
 * @property {number} [bitDepth]   bits, when known.
 * @property {number} [bitrate]    kbps, when known.
 * @property {Object} [raw]        Original source payload, for debugging.
 */

/**
 * A playable stream resolved on demand (so expensive lookups — e.g. Piped
 * extraction — only run right before playback, not during search).
 * @typedef {Object} StreamInfo
 * @property {string} url
 * @property {string} [mime]
 * @property {boolean} [lossless]
 * @property {boolean} [seekable]
 */

/**
 * The contract each source implements. Methods are async and may throw;
 * the registry catches per-source errors so one bad source never breaks search.
 * @typedef {Object} MusicSource
 * @property {string} key
 * @property {string} label
 * @property {() => boolean} isEnabled            Configured + turned on.
 * @property {() => Promise<boolean>} healthCheck Reachable + credentials valid.
 * @property {(q: string, limit?: number) => Promise<Track[]>} search
 * @property {(track: Track, quality?: string) => Promise<StreamInfo>} resolveStream
 * @property {boolean} canLossless                Source can deliver true lossless.
 */

export const QUALITY = Object.freeze({
  AUTO: 'auto',
  HIGH: 'high',
  LOSSLESS: 'lossless',
  HIRES: 'hires',
});

// Honest capability flags so the UI labels each result truthfully.
export const SOURCE_LOSSLESS = Object.freeze({
  local: true,      // depends on the file, surfaced per-track
  subsonic: true,   // FLAC straight from the user's own server
  piped: false,     // YouTube tops out ~256k AAC / 160k Opus — never lossless
  jamendo: false,   // MP3/Ogg catalog
  archive: true,    // many lossless/public-domain items, surfaced per-track
  saavn: false,     // AAC 320k — high quality but not lossless
});
