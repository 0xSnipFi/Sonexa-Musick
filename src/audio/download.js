// ============================================================
// AURALIS — downloads (web: highest-quality blob save)
// ============================================================
// Resolves the best available stream for a track and saves it as a file. The
// resolved stream is already the top quality the source offers (raw FLAC for
// Subsonic, lossless Archive files, best audio itag for Piped), so the download
// is the highest quality available. CORS-blocked hosts fall back to opening the
// direct URL so the browser can still fetch it.
//
// Native (Android) phase replaces the blob save with a real MediaStore/storage
// download + offline library entry.

import { resolveStream } from './registry.js';

const KEY = 'auralis.downloads';

export function getDownloads() {
  try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) : []; } catch { return []; }
}
export function isDownloaded(id) { return getDownloads().some(t => t.id === id); }

function record(track, stream) {
  const list = getDownloads().filter(t => t.id !== track.id);
  list.unshift({
    id: track.id, source: track.source, title: track.title, artist: track.artist,
    album: track.album, duration: track.duration, artwork: track.artwork, seed: track.seed,
    lossless: !!stream.lossless, codec: track.codec, sampleRate: track.sampleRate,
    bitDepth: track.bitDepth, bitrate: track.bitrate, raw: track.raw,
    savedAt: Date.now(),
  });
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* quota */ }
}

function safeName(track, url) {
  const extMatch = url.split('?')[0].match(/\.(flac|wav|m4a|mp3|ogg|opus|aac|webm)$/i);
  const ext = extMatch ? extMatch[1].toLowerCase() : 'm4a';
  const base = `${track.artist} - ${track.title}`.replace(/[\\/:*?"<>|]+/g, '_').slice(0, 120);
  return `${base}.${ext}`;
}

function triggerAnchor(url, filename) {
  const a = document.createElement('a');
  a.href = url; a.download = filename || ''; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
}

function isNative() {
  return typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.() === true;
}

async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(r.error);
    r.onload = () => {
      const s = String(r.result || '');
      const i = s.indexOf(',');
      resolve(i >= 0 ? s.slice(i + 1) : s);
    };
    r.readAsDataURL(blob);
  });
}

// Save into the device's public Music/Sonexa folder using Capacitor Filesystem.
// Visible in the system file manager and any music app.
async function saveNative(blob, filename) {
  const { Filesystem, Directory } = await import('@capacitor/filesystem');
  const data = await blobToBase64(blob);
  const path = `Sonexa/${filename}`;
  await Filesystem.writeFile({
    path,
    data,
    directory: Directory.ExternalStorage, // /storage/emulated/0/<path> via MediaStore
    recursive: true,
  }).catch(async () => {
    // Fallback to app-private external dir if public write is denied
    await Filesystem.writeFile({
      path,
      data,
      directory: Directory.External,
      recursive: true,
    });
  });
  return `/storage/emulated/0/Sonexa/${filename}`;
}

/**
 * Download a track at highest available quality.
 * @returns {Promise<{ok:boolean, lossless:boolean, mode:'native'|'blob'|'link', path?:string}>}
 */
export async function downloadTrack(track, onProgress) {
  const stream = await resolveStream(track);
  const filename = safeName(track, stream.url);
  record(track, stream);
  try {
    const res = await fetch(stream.url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    if (isNative()) {
      const path = await saveNative(blob, filename);
      return { ok: true, lossless: !!stream.lossless, mode: 'native', path };
    }
    const obj = URL.createObjectURL(blob);
    triggerAnchor(obj, filename);
    setTimeout(() => URL.revokeObjectURL(obj), 60000);
    return { ok: true, lossless: !!stream.lossless, mode: 'blob' };
  } catch {
    // CORS-blocked (e.g. YouTube CDN) — let the browser fetch the URL directly.
    triggerAnchor(stream.url, filename);
    return { ok: true, lossless: !!stream.lossless, mode: 'link' };
  }
}
