// ============================================================
// Sonexa — Media Session (lock screen + notification controls)
// ============================================================
// Two-layer strategy:
//   1. Web Media Session API (works in Chromium WebView)
//   2. Native Capacitor plugin → Java MusicService (reliable foreground notification)

// Store callback references so they can be updated without re-binding
const handlers = {
  onPlay: null, onPause: null, onNext: null,
  onPrev: null, onSeek: null, onStop: null,
};

let bound = false;
let nativeListenerBound = false;

export function bindMediaSession({ onPlay, onPause, onNext, onPrev, onSeek, onStop }) {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

  // Always update the handler refs so we never have stale closures
  handlers.onPlay = onPlay;
  handlers.onPause = onPause;
  handlers.onNext = onNext;
  handlers.onPrev = onPrev;
  handlers.onSeek = onSeek;
  handlers.onStop = onStop;

  // Only bind to mediaSession once — the handlers use the mutable `handlers` object
  if (!bound) {
    bound = true;
    const ms = navigator.mediaSession;
    try { ms.setActionHandler('play',          () => { try { handlers.onPlay?.();  } catch {} }); } catch {}
    try { ms.setActionHandler('pause',         () => { try { handlers.onPause?.(); } catch {} }); } catch {}
    try { ms.setActionHandler('previoustrack', () => { try { handlers.onPrev?.();  } catch {} }); } catch {}
    try { ms.setActionHandler('nexttrack',     () => { try { handlers.onNext?.();  } catch {} }); } catch {}
    try { ms.setActionHandler('stop',          () => { try { handlers.onStop?.();  } catch {} }); } catch {}
    try {
      ms.setActionHandler('seekto', (e) => { try { handlers.onSeek?.(e.seekTime || 0); } catch {} });
    } catch {}
  }

  // Bind native plugin listener (notification button presses → JS)
  if (!nativeListenerBound) {
    retryNativeBinding();
    // Retry after a delay — Capacitor plugin may initialize after bridge setup
    if (!nativeListenerBound) {
      setTimeout(retryNativeBinding, 1500);
      setTimeout(retryNativeBinding, 4000);
    }
  }
}

let _pluginCache = null;
let _pluginChecked = false;

function hasNativePlugin() {
  if (_pluginCache) return true;
  if (typeof window === 'undefined') return false;
  if (window.Capacitor?.isNativePlatform?.() !== true) return false;
  const p = window.Capacitor?.Plugins?.MediaNotification;
  if (p) { _pluginCache = p; _pluginChecked = true; return true; }
  return false;
}

function getNativePlugin() {
  if (_pluginCache) return _pluginCache;
  const p = window.Capacitor?.Plugins?.MediaNotification || null;
  if (p) _pluginCache = p;
  return p;
}

// Retry binding native listener — Capacitor plugin may not be available on first check
function retryNativeBinding() {
  if (nativeListenerBound || !handlers.onPlay) return;
  if (hasNativePlugin()) {
    nativeListenerBound = true;
    try {
      const plugin = getNativePlugin();
      if (!plugin) return;
      plugin.addListener('mediaCommand', (data) => {
        const cmd = data?.command;
        if (!cmd) return;
        try {
          if (cmd === 'play') handlers.onPlay?.();
          else if (cmd === 'pause') handlers.onPause?.();
          else if (cmd === 'next') handlers.onNext?.();
          else if (cmd === 'prev') handlers.onPrev?.();
          else if (cmd.startsWith('seek:')) {
            const ms = parseInt(cmd.split(':')[1], 10);
            if (isFinite(ms)) handlers.onSeek?.(ms / 1000);
          }
        } catch {}
      });
    } catch {}
  }
}

export function setNowPlayingMetadata(track) {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
  if (!track) { navigator.mediaSession.metadata = null; return; }
  try {
    const art = track.artwork ? [
      { src: track.artwork, sizes: '512x512', type: 'image/jpeg' },
      { src: track.artwork, sizes: '256x256', type: 'image/jpeg' },
      { src: track.artwork, sizes: '96x96',   type: 'image/jpeg' },
    ] : [];
    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: track.title || 'Unknown',
      artist: track.artist || '',
      album: track.album || '',
      artwork: art,
    });
  } catch { /* noop */ }

  // Also update native notification
  _updateNativeNotification(track, null, null, null);
}

export function setPlaybackState(state) {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
  try { navigator.mediaSession.playbackState = state; } catch { /* noop */ }
}

export function setPositionState(position, duration) {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
  if (!duration || !isFinite(duration) || duration <= 0) return;
  try {
    navigator.mediaSession.setPositionState({
      duration: Math.max(0, duration),
      position: Math.max(0, Math.min(position || 0, duration)),
      playbackRate: 1,
    });
  } catch { /* noop */ }
}

// Track state for native notification updates
let _lastNativeTrack = null;
let _lastNativePlaying = null;

/**
 * Update native foreground notification with current playback state.
 * Called from setNowPlayingMetadata and setPlaybackState.
 */
export function updateNativeNowPlaying(track, playing, position, duration) {
  _lastNativeTrack = track || _lastNativeTrack;
  _lastNativePlaying = playing != null ? playing : _lastNativePlaying;
  _updateNativeNotification(_lastNativeTrack, _lastNativePlaying, position, duration);
}

function _updateNativeNotification(track, playing, position, duration) {
  if (!track) return;
  const plugin = getNativePlugin();
  if (!plugin) return;
  try {
    plugin.updateNowPlaying({
      title: track.title || 'Sonexa',
      artist: track.artist || '',
      artwork: track.artwork || '',
      playing: playing != null ? !!playing : true,
      duration: duration || track.duration || 0,
      position: position || 0,
    }).catch(() => {});
  } catch {}
}
