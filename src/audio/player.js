// ============================================================
// SONEXA — playback engine abstraction
// ============================================================
// One Player API the UI talks to. Two backends behind it:
//
//   • web    — HTMLAudioElement. Works everywhere (browser, PWA, Capacitor
//              webview). Handles direct MP3/AAC/FLAC URLs and HLS streams.
//   • native — a Capacitor plugin wrapping Media3/ExoPlayer. Only used
//              when the plugin is actually registered. If absent, we
//              silently fall back to the web backend — no error toasts.
//
// The UI never imports a backend directly — only this module.

import { resolveStream } from './registry.js';
import { connectAudioElement } from './eq.js';

// Check if the native plugin is ACTUALLY available (not just Capacitor).
function hasNativePlugin() {
  return typeof window !== 'undefined'
    && window.Capacitor?.isNativePlatform?.() === true
    && !!window.Capacitor?.Plugins?.LumoraAudio;
}

// ---- listeners ----
const listeners = new Set();
function emit(evt) { for (const fn of listeners) { try { fn(evt); } catch { /* noop */ } } }
export function onPlayerEvent(fn) { listeners.add(fn); return () => listeners.delete(fn); }

// ---- web backend ----
let audioEl = null;
function webAudio() {
  if (audioEl) return audioEl;
  audioEl = new Audio();
  audioEl.preload = 'auto';
  // DO NOT set crossOrigin here — it breaks JioSaavn CDN streams that lack CORS headers.
  // crossOrigin is only set when EQ routing is explicitly enabled.
  audioEl.addEventListener('timeupdate', () =>
    emit({ type: 'progress', position: audioEl.currentTime, duration: audioEl.duration || 0 }));
  audioEl.addEventListener('ended', () => emit({ type: 'ended' }));
  audioEl.addEventListener('play', () => emit({ type: 'playing' }));
  audioEl.addEventListener('pause', () => emit({ type: 'paused' }));
  audioEl.addEventListener('error', () => {
    // Ignore spurious errors fired while clearing/replacing the source.
    if (!audioEl.src || audioEl.src === location.href) return;
    emit({ type: 'error', error: 'This track couldn\'t be played' });
  });
  audioEl.addEventListener('waiting', () => emit({ type: 'buffering', buffering: true }));
  audioEl.addEventListener('canplay', () => emit({ type: 'buffering', buffering: false }));
  // NOTE: EQ chain (createMediaElementSource) is opt-in only — auto-connecting
  // it silences audio on Capacitor WebView. Call enableEQRouting() to wire it.
  return audioEl;
}

// Public: wire the element through the EQ graph. Call only when user
// explicitly opens the EQ screen — once routed, the element stays routed.
export function enableEQRouting() {
  try { connectAudioElement(webAudio()); } catch {}
  return webAudio();
}

// ---- HLS (for YouTube/Piped streams that only expose an .m3u8) ----
let hls = null;
async function loadHls(url, token) {
  const a = webAudio();
  if (a.canPlayType('application/vnd.apple.mpegurl')) { a.src = url; return; } // Safari native HLS
  const { default: Hls } = await import('hls.js');
  // Bail if a newer play() superseded this one during the dynamic import
  if (token !== undefined && token !== Player._token) return;
  if (!Hls.isSupported()) { a.src = url; return; }
  if (hls) { hls.destroy(); hls = null; }
  hls = new Hls({
    enableWorker: true,
    fragLoadingTimeOut: 10000,
    manifestLoadingTimeOut: 8000,
    fragLoadingMaxRetry: 2,
  });
  hls.on(Hls.Events.ERROR, (_e, data) => {
    if (data?.fatal) {
      if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
        hls.startLoad(); // retry once
      } else {
        emit({ type: 'error', error: 'Stream failed' });
      }
    }
  });
  hls.loadSource(url);
  hls.attachMedia(a);
}
function isHls(url, mime) { return /\.m3u8(\?|$)/i.test(url || '') || /mpegurl/i.test(mime || ''); }

// ---- native backend (lazy; plugin registered by Capacitor) ----
function nativePlugin() {
  return window.Capacitor?.Plugins?.LumoraAudio;
}

export const Player = {
  current: null,
  _token: 0,

  async play(track, quality) {
    // Each play() gets a token; a later play() supersedes earlier ones so a
    // slow resolve can't hijack the audio element after the user moved on.
    const tok = ++this._token;
    const stream = await resolveStream(track, quality);
    if (tok !== this._token) return stream; // superseded — bail quietly
    this.current = track;

    if (hasNativePlugin()) {
      // Native path — only when the plugin is truly available
      try {
        await nativePlugin().load({
          url: stream.url,
          title: track.title,
          artist: track.artist,
          artwork: track.artwork || '',
          lossless: !!stream.lossless,
        });
        await nativePlugin().play();
      } catch (e) {
        // If native fails, fall through to web backend
        console.warn('Native playback failed, falling back to web:', e);
        await this._playWeb(stream, tok);
      }
    } else {
      // Web path — always works
      await this._playWeb(stream, tok);
    }
    emit({ type: 'track', track, lossless: !!stream.lossless });
    return stream;
  },

  async _playWeb(stream, tok) {
    const a = webAudio();
    if (hls) { hls.destroy(); hls = null; }
    a.pause();
    if (isHls(stream.url, stream.mime)) {
      await loadHls(stream.url, tok);
    } else {
      a.src = stream.url;
      a.load();
    }
    try {
      await a.play();
    } catch (err) {
      // AbortError = a newer load interrupted this one; harmless, ignore.
      if (err?.name === 'AbortError' || tok !== this._token) return;
      throw err;
    }
  },

  async pause() {
    if (hasNativePlugin()) return nativePlugin().pause();
    webAudio().pause();
  },

  async resume() {
    if (hasNativePlugin()) return nativePlugin().play();
    try {
      await webAudio().play();
    } catch (err) {
      // On mobile, play() can fail if the user hasn't interacted yet.
      // This is expected — the next tap will work.
      if (err?.name !== 'NotAllowedError') throw err;
    }
  },

  async seek(seconds) {
    if (hasNativePlugin()) return nativePlugin().seek({ position: seconds });
    const a = webAudio();
    if (a.readyState >= 1) a.currentTime = seconds;
  },

  async stop() {
    if (hasNativePlugin()) return nativePlugin().stop();
    const a = webAudio();
    a.pause();
    a.removeAttribute('src');
    a.load();
  },
};
