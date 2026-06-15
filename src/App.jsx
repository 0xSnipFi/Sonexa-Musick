// ============================================================
// LUMORA — app shell, state, navigation
// ============================================================
import React from 'react';
import { useTweaks } from './ui/useTweaks.js';
import { usePersist } from './ui/usePersist.js';
import { useBackButton } from './ui/useBackButton.js';
import { downloadTrack } from './audio/download.js';
import { Icon } from './ui/data.jsx';
import { AlbumArt } from './ui/AlbumArt.jsx';
import { usePlayer } from './audio/usePlayer.js';
import { HomeScreen, LibraryScreen } from './screens/main.jsx';
import { SearchScreen } from './screens/search.jsx';
import { NowPlaying, Lyrics, Equalizer } from './screens/player.jsx';
import { AudioScreen, Analytics, PlaylistDetail, CreatePlaylist, History, Queue, SleepTimer } from './screens/extra.jsx';
import { SettingsScreen, AppearanceScreen } from './screens/settings.jsx';
import { SourcesScreen } from './screens/sources.jsx';
import { Onboarding } from './screens/onboarding.jsx';

const { useState, useEffect } = React;

const TWEAK_DEFAULTS = {
  accent: ['#6e56ff', '#c15cff'],
  theme: 'dark',
  blur: 30,
  glassAlpha: 0.07,
  radius: 30,
  bgOpacity: 1,
  orbs: true,
  artShape: 'rounded',
};

export default function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const player = usePlayer(null);

  const [onboarded, setOnboarded] = useState(() => {
    try { return localStorage.getItem('sonexa.onboarded') === '1'; } catch { return false; }
  });
  const finishOnboarding = () => {
    try { localStorage.setItem('sonexa.onboarded', '1'); } catch {}
    setOnboarded(true);
  };

  const [tab, setTab] = useState('home');
  const [sheet, setSheet] = useState(null);     // {name, param}
  const [searchQuery, setSearchQuery] = useState('');
  const [liked, setLiked] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('sonexa.liked') || '[]');
      return new Set(saved);
    } catch { return new Set(); }
  });
  const [sleepMin, setSleepMin] = useState(null);
  // persisted settings
  const [eqOn, setEqOn] = usePersist('auralis.eqOn', true);
  const [npMode, setNpMode] = usePersist('auralis.npMode', 'cover');
  const [lofi, setLofi] = usePersist('auralis.lofi', false);
  const [crossfade, setCrossfade] = usePersist('auralis.crossfade', 6);
  const [mono, setMono] = usePersist('auralis.mono', false);
  const [autoplay, setAutoplay] = usePersist('sonexa.autoplay', true);
  const [userName, setUserNameState] = useState(() => {
    try { return localStorage.getItem('auralis.name') || 'Listener'; } catch { return 'Listener'; }
  });
  const setUserName = (n) => { const v = n || 'Listener'; setUserNameState(v); try { localStorage.setItem('auralis.name', v); } catch { /* quota */ } };

  // surface playback errors as a brief toast
  const [toast, setToast] = useState(null);
  useEffect(() => {
    if (!player.error) return;
    setToast(player.error.message || 'Playback failed');
    const id = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(id);
  }, [player.error]);

  const toggleLike = (id) => setLiked(s => {
    const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id);
    try { localStorage.setItem('sonexa.liked', JSON.stringify([...n])); } catch {}
    return n;
  });
  const openSheet = (name, param) => setSheet({ name, param });
  const closeSheet = () => setSheet(null);
  const goTab = (tb) => { setSheet(null); setTab(tb); };
  const goSearch = (q) => { setSheet(null); setSearchQuery(q || ''); setTab('search'); };

  // Android hardware back button: sheet → close, tab → home, home → exit (double-press)
  useBackButton({
    sheet, tab,
    onCloseSheet: closeSheet,
    onGoHome: () => setTab('home'),
    onExitHint: () => setToast('Press back again to exit'),
  });

  // Pause heavy animations when app is backgrounded (saves battery + GPU)
  useEffect(() => {
    const handler = () => {
      document.documentElement.classList.toggle('backgrounded', document.hidden);
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  // Sleep timer — actually pause playback after N minutes
  useEffect(() => {
    if (!sleepMin || typeof sleepMin !== 'number') return;
    const id = setTimeout(() => {
      player.toggle(); // pause
      setSleepMin(null);
      setToast('Sleep timer ended — music paused');
    }, sleepMin * 60 * 1000);
    return () => clearTimeout(id);
  }, [sleepMin, player.toggle]);

  // Status bar setup
  useEffect(() => {
    if (typeof window !== 'undefined' && window?.Capacitor?.isNativePlatform?.()) {
      const StatusBar = window.Capacitor.Plugins.StatusBar;
      if (StatusBar) {
        StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
        StatusBar.setStyle({ style: 'DARK' }).catch(() => {});
      }
    }
  }, []);

  const ctx = {
    t, setTweak,
    // transport (real engine)
    current: player.current, playing: player.playing,
    progress: player.progress, position: player.position, duration: player.duration,
    loading: player.loading, error: player.error,
    queue: player.queue, source: player.source,
    play: player.play, playFrom: player.playFrom, toggle: player.toggle,
    next: player.next, prev: player.prev,
    seekFraction: player.seekFraction, seekSeconds: player.seekSeconds,
    // app state
    liked, toggleLike, eqOn, setEqOn, sleepMin, setSleepMin,
    npMode, setNpMode, lofi, setLofi, crossfade, setCrossfade, mono, setMono,
    userName, setUserName,
    shuffle: player.shuffle, setShuffle: player.setShuffle,
    repeat: player.repeat, setRepeat: player.setRepeat,
    autoplay, setAutoplay,
    download: downloadTrack,
    openSheet, closeSheet, goTab, goSearch,
    searchQuery, setSearchQuery,
    param: sheet && sheet.param,
  };

  // apply tweaks to CSS vars
  const rootStyle = {
    '--acc-1': t.accent[0], '--acc-2': t.accent[1],
    '--blur': t.blur + 'px',
    '--glass-alpha': t.glassAlpha,
    '--radius': t.radius + 'px',
    '--radius-sm': Math.max(8, t.radius - 12) + 'px',
    '--radius-card': Math.max(16, Math.min(36, t.radius + 4)) + 'px',
    '--bg-opacity': t.bgOpacity != null ? t.bgOpacity : 1,
  };

  const TABS = [['home', 'Home'], ['search', 'Search'], ['library', 'Library'], ['settings', 'Settings']];

  const current = player.current;
  const showMini = current && !(sheet && (sheet.name === 'nowplaying' || sheet.name === 'lyrics'));
  const showTabs = !sheet;

  if (!onboarded) return <Onboarding onDone={finishOnboarding} />;

  return (
    <div className={'lumora-root' + (t.theme === 'light' ? ' light' : t.theme === 'amoled' ? ' amoled' : '')} style={rootStyle}>
      <div className={'orbs off'}><span className="orb o1" /><span className="orb o2" /><span className="orb o3" /></div>
      <div className="grain" />

      <div className="app-col">
        <div className="safe-top" />
        <div className="scroll">
          {tab === 'home' && <HomeScreen ctx={ctx} />}
          {tab === 'search' && <SearchScreen ctx={ctx} />}
          {tab === 'library' && <LibraryScreen ctx={ctx} />}
          {tab === 'settings' && <SettingsScreen ctx={ctx} />}
        </div>
      </div>

      {(showMini || showTabs) && <div className="dock-scrim" />}

      {/* mini player */}
      {showMini && (
        <div className="mini" onClick={() => openSheet('nowplaying')}>
          <AlbumArt track={current} size={38} radius="11px" />
          <div className="meta" style={{ flex: 1, minWidth: 0 }}>
            <div className="t" style={{ fontSize: 13.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{current.title}</div>
            <div className="a" style={{ fontSize: 11.5, marginTop: 1 }}>{player.loading ? 'Loading…' : current.artist}</div>
          </div>
          <div onClick={(e) => { e.stopPropagation(); player.prev(); }} style={{ display: 'flex', padding: 4, cursor: 'pointer', color: 'var(--ink-2)' }}>
            <Icon name="prev" size={19} />
          </div>
          <div onClick={(e) => { e.stopPropagation(); player.toggle(); }} style={{ display: 'flex', padding: 4, cursor: 'pointer' }}>
            <Icon name={player.playing ? 'pause' : 'play'} size={25} />
          </div>
          <div onClick={(e) => { e.stopPropagation(); player.next(); }} style={{ display: 'flex', padding: 4, cursor: 'pointer', color: 'var(--ink-2)' }}>
            <Icon name="next" size={19} />
          </div>
          <div className="bar"><i style={{ width: `${player.progress * 100}%` }} /></div>
        </div>
      )}

      {/* tab bar */}
      {showTabs && (
        <div className="tabbar">
          <div className="tab-pill" style={{ left: `${TABS.findIndex(([k]) => k === tab) * 25}%` }} />
          {TABS.map(([k, label]) => (
            <div key={k} className={'tab' + (tab === k ? ' on' : '')} onClick={() => goTab(k)} style={{ flex: 1 }}>
              <span className="tab-ico" style={{ display: 'flex' }}><Icon name={k} size={23} fill={tab === k} /></span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* sheets */}
      {sheet && sheet.name === 'nowplaying' && <NowPlaying ctx={ctx} />}
      {sheet && sheet.name === 'lyrics' && <Lyrics ctx={ctx} />}
      {sheet && sheet.name === 'eq' && <Equalizer ctx={ctx} />}
      {sheet && sheet.name === 'audio' && <AudioScreen ctx={ctx} />}
      {sheet && sheet.name === 'sources' && <SourcesScreen ctx={ctx} />}
      {/* Recognition removed — needs paid API (ACRCloud/AudD) */}
      {sheet && sheet.name === 'analytics' && <Analytics ctx={ctx} />}
      {sheet && sheet.name === 'playlist' && <PlaylistDetail ctx={ctx} />}
      {sheet && sheet.name === 'createPlaylist' && <CreatePlaylist ctx={ctx} />}
      {sheet && sheet.name === 'history' && <History ctx={ctx} />}
      {sheet && sheet.name === 'queue' && <Queue ctx={ctx} />}
      {sheet && sheet.name === 'sleep' && <SleepTimer ctx={ctx} />}
      {sheet && sheet.name === 'appearance' && <AppearanceScreen ctx={ctx} />}

      {/* playback error toast */}
      {toast && (
        <div className="glass" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)',
          bottom: 168, zIndex: 60, maxWidth: 'calc(100% - 40px)', padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 10, borderRadius: 16, animation: 'fadeIn .25s ease' }}
          onClick={() => setToast(null)}>
          <span style={{ color: '#ff7a90', display: 'flex' }}><Icon name="x" size={18} /></span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{toast}</span>
        </div>
      )}
    </div>
  );
}
