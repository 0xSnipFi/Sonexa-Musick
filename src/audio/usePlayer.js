// ============================================================
// LUMORA — playback state hook
// ============================================================
// Bridges the Player engine + source registry into React transport state.
// Real source tracks (subsonic/piped/jamendo/archive/local) stream for real;
// demo tracks (no `source`, used by Home/Library placeholder data) fall back
// to a simulated clock so the showcase UI still animates.

import React from 'react';
import { Player, onPlayerEvent } from './player.js';
import { recordPlay } from './feed.js';
import { bindMediaSession, setNowPlayingMetadata, setPlaybackState, setPositionState, updateNativeNowPlaying } from './mediaSession.js';

const REAL_SOURCES = new Set(['local', 'subsonic', 'piped', 'jamendo', 'archive', 'saavn']);
const isReal = (t) => !!t && REAL_SOURCES.has(t.source);

function lenToSeconds(len) {
  if (typeof len !== 'string') return 0;
  const [m, s] = len.split(':').map(Number);
  return (m || 0) * 60 + (s || 0);
}

export function usePlayer(initialTrack) {
  const [current, setCurrent] = React.useState(initialTrack || null);
  const [playing, setPlaying] = React.useState(false);
  const [position, setPosition] = React.useState(0);   // seconds
  const [duration, setDuration] = React.useState(initialTrack ? lenToSeconds(initialTrack.len) || 218 : 218);
  const [queue, setQueue] = React.useState([]);
  const [source, setSource] = React.useState('Liquid Focus');
  const [loading, setLoading] = React.useState(false);
  // error carries a fresh timestamp so identical consecutive failures still
  // re-trigger the UI toast.
  const [error, setErrorState] = React.useState(null);
  const setError = React.useCallback((msg) => setErrorState(msg ? { message: msg, at: Date.now() } : null), []);

  const simRef = React.useRef(null);
  const curRef = React.useRef(current);
  curRef.current = current;

  const stopSim = () => { if (simRef.current) { clearInterval(simRef.current); simRef.current = null; } };
  // Forward ref for next() — used by play() error recovery without TDZ
  const nextRef = React.useRef(null);

  // Simulated clock for demo tracks only.
  const startSim = React.useCallback((dur) => {
    stopSim();
    simRef.current = setInterval(() => {
      setPosition((p) => {
        const n = p + 1;
        if (n >= dur) { setPlaying(false); stopSim(); return 0; }
        return n;
      });
    }, 1000);
  }, []);

  // Subscribe to real engine events once.
  React.useEffect(() => {
    const off = onPlayerEvent((evt) => {
      switch (evt.type) {
        case 'progress':
          if (isReal(curRef.current)) {
            setPosition(evt.position || 0);
            if (evt.duration && isFinite(evt.duration)) setDuration(evt.duration);
            setPositionState(evt.position || 0, evt.duration || 0);
          }
          break;
        case 'playing': if (isReal(curRef.current)) { setPlaying(true); setPlaybackState('playing'); updateNativeNowPlaying(curRef.current, true); } break;
        case 'paused':  if (isReal(curRef.current)) { setPlaying(false); setPlaybackState('paused'); updateNativeNowPlaying(curRef.current, false); } break;
        case 'ended':   if (isReal(curRef.current)) { setPlaying(false); setPlaybackState('none'); if (nextRef.current) nextRef.current(); } break;
        case 'error':   setError(evt.error || 'Playback failed'); setLoading(false); setPlaying(false); break;
        default: break;
      }
    });
    return () => { off(); stopSim(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const play = React.useCallback(async (track, list, sourceName) => {
    setError(null);
    setCurrent(track);
    curRef.current = track;
    setPosition(0);
    if (Array.isArray(list)) { setQueue(list); origQueueRef.current = [track, ...list]; }
    if (sourceName) setSource(sourceName);

    if (isReal(track)) {
      stopSim();
      recordPlay(track);
      setNowPlayingMetadata(track);
      setLoading(true);
      setPlaying(true);
      try {
        const stream = await Player.play(track);
        setDuration(track.duration || 0);
        return stream;
      } catch (err) {
        const msg = String(err?.message || err);
        // Ignore benign interruptions from rapid track switches.
        if (err?.name !== 'AbortError' && !/interrupted|aborted/i.test(msg)) {
          setError(msg);
          setPlaying(false);
          // Auto-advance to next track after 2s if queue has items
          setTimeout(() => {
            if (queueRef.current.length > 0 && nextRef.current) nextRef.current();
          }, 2000);
        }
      } finally {
        setLoading(false);
      }
    } else {
      // demo track — simulate
      Player.stop().catch(() => {});
      const dur = lenToSeconds(track.len) || 218;
      setDuration(dur);
      setPlaying(true);
      startSim(dur);
    }
  }, [startSim]);

  const playFrom = React.useCallback((list, name) => {
    if (!list?.length) return;
    play(list[0], list.slice(1), name);
  }, [play]);

  const toggle = React.useCallback(() => {
    const t = curRef.current;
    if (!t) return;
    if (isReal(t)) {
      setPlaying((p) => {
        const next = !p;
        if (p) Player.pause(); else Player.resume();
        setPlaybackState(next ? 'playing' : 'paused');
        updateNativeNowPlaying(t, next);
        return next;
      });
    } else {
      setPlaying((p) => {
        if (p) stopSim(); else startSim(duration || 218);
        return !p;
      });
    }
  }, [duration, startSim]);

  // Shuffle & repeat
  const [shuffle, setShuffle] = React.useState(false);
  const [repeat, setRepeat] = React.useState('off'); // 'off' | 'all' | 'one'
  const shuffleRef = React.useRef(shuffle);
  shuffleRef.current = shuffle;
  const repeatRef = React.useRef(repeat);
  repeatRef.current = repeat;
  // Keep the original list so repeat-all can re-queue
  const origQueueRef = React.useRef([]);

  const queueRef = React.useRef(queue);
  queueRef.current = queue;
  const sourceRef = React.useRef(source);
  sourceRef.current = source;

  // Seek must be defined before next/prev (they reference it)
  const seekSeconds = React.useCallback((sec) => {
    setPosition(sec);
    if (isReal(curRef.current)) Player.seek(sec).catch(() => {});
  }, []);

  const seekFraction = React.useCallback((frac) => {
    seekSeconds(Math.max(0, Math.min(1, frac)) * (duration || 0));
  }, [duration, seekSeconds]);

  const next = React.useCallback(() => {
    // Repeat one → restart current track
    if (repeatRef.current === 'one') {
      seekSeconds(0);
      if (isReal(curRef.current)) Player.resume();
      setPlaying(true);
      return;
    }

    const q = queueRef.current;
    if (q.length > 0) {
      let nextTrack, rest;
      if (shuffleRef.current) {
        const idx = Math.floor(Math.random() * q.length);
        nextTrack = q[idx];
        rest = [...q.slice(0, idx), ...q.slice(idx + 1)];
      } else {
        nextTrack = q[0];
        rest = q.slice(1);
      }
      setQueue(rest);
      play(nextTrack, rest, sourceRef.current);
    } else if (repeatRef.current === 'all' && origQueueRef.current.length > 0) {
      // Re-queue original list
      const orig = origQueueRef.current;
      const first = orig[0];
      const rest = orig.slice(1);
      setQueue(rest);
      play(first, rest, sourceRef.current);
    } else {
      // Queue empty — try autoplay if enabled
      let autoplayOn = true;
      try { const v = localStorage.getItem('sonexa.autoplay'); if (v !== null) autoplayOn = JSON.parse(v); } catch {}
      const cur = curRef.current;
      if (autoplayOn && cur && isReal(cur)) {
        if (cur.source === 'saavn') {
          import('../audio/sources/saavn.js').then(({ saavnSource }) => {
            saavnSource.getSuggestions(cur, 10).then(suggestions => {
              const filtered = suggestions.filter(t => t.id !== cur.id);
              if (filtered.length > 0) {
                play(filtered[0], filtered.slice(1), 'Autoplay');
              }
            }).catch(() => {});
          });
        } else {
          import('../audio/registry.js').then(({ searchAll }) => {
            const seed = cur.artist?.split(/[,;&]/)?.[0]?.trim() || cur.title;
            searchAll(seed, 10).then(groups => {
              const all = groups.flatMap(g => g.tracks).filter(t => t.id !== cur.id);
              if (all.length > 0) {
                const pick = all[Math.floor(Math.random() * Math.min(5, all.length))];
                play(pick, all.filter(t => t.id !== pick.id).slice(0, 8), 'Autoplay');
              }
            }).catch(() => {});
          });
        }
      }
    }
  }, [play, seekSeconds]);
  nextRef.current = next;

  const prev = React.useCallback(() => {
    if (position > 5) { seekSeconds(0); return; }
    seekSeconds(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position, seekSeconds]);

  const progress = duration > 0 ? Math.min(1, position / duration) : 0;

  // Wire OS media controls (lock screen / notification) once handlers exist.
  React.useEffect(() => {
    bindMediaSession({
      onPlay: () => { if (curRef.current && isReal(curRef.current)) Player.resume(); },
      onPause: () => { if (curRef.current && isReal(curRef.current)) Player.pause(); },
      onNext: () => next(),
      onPrev: () => prev(),
      onSeek: (sec) => seekSeconds(sec),
      onStop: () => Player.stop().catch(() => {}),
    });
  }, [next, prev, seekSeconds]);

  return {
    current, playing, position, duration, progress, queue, source, loading, error,
    play, playFrom, toggle, next, prev, seekSeconds, seekFraction,
    setQueue, setSource,
    shuffle, setShuffle, repeat, setRepeat,
  };
}
