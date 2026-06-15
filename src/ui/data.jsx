// ============================================================
// LUMORA — icons, procedural cover art, and demo data
// ============================================================
import React from 'react';

// ---- Icon set (stroke-based, inherits currentColor) ----
export function Icon({ name, size = 22, fill = false, sw = 2 }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    home: fill
      ? <path d="M11.3 3.4a1 1 0 0 1 1.4 0l8 7.3a1 1 0 0 1 .3.74V20a1 1 0 0 1-1 1h-4.2v-5.3a1 1 0 0 0-1-1h-2.6a1 1 0 0 0-1 1V21H4a1 1 0 0 1-1-1v-8.56a1 1 0 0 1 .3-.73z" fill="currentColor" stroke="none"/>
      : <><path d="M4 11.3 12 4l8 7.3"/><path d="M6 10.2V19a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-8.8"/><path d="M10 20v-5.2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V20"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></>,
    library: fill
      ? <><rect x="3" y="4" width="7" height="7" rx="2" fill="currentColor" stroke="none"/><rect x="14" y="4" width="7" height="7" rx="2" fill="currentColor" stroke="none"/><rect x="3" y="15" width="7" height="5" rx="2" fill="currentColor" stroke="none"/><rect x="14" y="13" width="7" height="7" rx="2" fill="currentColor" stroke="none"/></>
      : <><rect x="3.5" y="4.5" width="6.5" height="6.5" rx="2"/><rect x="14" y="4.5" width="6.5" height="6.5" rx="2"/><rect x="3.5" y="15" width="6.5" height="4.5" rx="2"/><rect x="14" y="13" width="6.5" height="6.5" rx="2"/></>,
    settings: fill
      ? <><path d="M13.3 2.2a1.6 1.6 0 0 0-2.6 0l-.5.8a1.6 1.6 0 0 1-1.9.6l-.9-.3a1.6 1.6 0 0 0-2 1.6l.05 1a1.6 1.6 0 0 1-1.1 1.5l-.9.3a1.6 1.6 0 0 0-.7 2.5l.6.8a1.6 1.6 0 0 1 0 2l-.6.8a1.6 1.6 0 0 0 .7 2.5l.9.3a1.6 1.6 0 0 1 1.1 1.5l-.05 1a1.6 1.6 0 0 0 2 1.6l.9-.3a1.6 1.6 0 0 1 1.9.6l.5.8a1.6 1.6 0 0 0 2.6 0l.5-.8a1.6 1.6 0 0 1 1.9-.6l.9.3a1.6 1.6 0 0 0 2-1.6l-.05-1a1.6 1.6 0 0 1 1.1-1.5l.9-.3a1.6 1.6 0 0 0 .7-2.5l-.6-.8a1.6 1.6 0 0 1 0-2l.6-.8a1.6 1.6 0 0 0-.7-2.5l-.9-.3a1.6 1.6 0 0 1-1.1-1.5l.05-1a1.6 1.6 0 0 0-2-1.6l-.9.3a1.6 1.6 0 0 1-1.9-.6zM12 15.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4z" fill="currentColor" stroke="none"/></>
      : <><circle cx="12" cy="12" r="3.1"/><path d="M19.4 13.5a1.65 1.65 0 0 0 .33 1.82l.04.04a2 2 0 1 1-2.83 2.83l-.04-.04a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.06a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.04.04a2 2 0 1 1-2.83-2.83l.04-.04a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.06a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.04-.04a2 2 0 1 1 2.83-2.83l.04.04a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.06a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.04-.04a2 2 0 1 1 2.83 2.83l-.04.04a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.06a1.65 1.65 0 0 0-1.51 1z"/></>,
    play: <path d="M7 4.5v15l13-7.5z" fill="currentColor" stroke="none"/>,
    pause: <><rect x="6.5" y="5" width="3.6" height="14" rx="1.2" fill="currentColor" stroke="none"/><rect x="13.9" y="5" width="3.6" height="14" rx="1.2" fill="currentColor" stroke="none"/></>,
    next: <><path d="M5 5l11 7-11 7z" fill="currentColor" stroke="none"/><rect x="17.5" y="5" width="2.6" height="14" rx="1" fill="currentColor" stroke="none"/></>,
    prev: <><path d="M19 5L8 12l11 7z" fill="currentColor" stroke="none"/><rect x="3.9" y="5" width="2.6" height="14" rx="1" fill="currentColor" stroke="none"/></>,
    shuffle: <><path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="m15 15 6 6"/><path d="M4 4l5 5"/></>,
    repeat: <><path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></>,
    heart: <path d="M12 21s-7.5-4.6-10-9.3C.4 8 2 4.5 5.4 4.5c2 0 3.4 1.1 4.6 2.6C11.2 5.6 12.6 4.5 14.6 4.5 18 4.5 19.6 8 18 11.7 15.5 16.4 12 21 12 21z" fill={fill ? 'currentColor' : 'none'}/>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    more: <><circle cx="5" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="19" cy="12" r="1.4" fill="currentColor"/></>,
    chevR: <path d="m9 5 7 7-7 7"/>,
    chevD: <path d="m5 9 7 7 7-7"/>,
    chevL: <path d="m15 5-7 7 7 7"/>,
    mic: <><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/></>,
    chart: <><path d="M4 20V10M9 20V4M14 20v-7M19 20V8"/></>,
    eq: <><path d="M6 4v6M6 14v6M12 4v3M12 11v9M18 4v9M18 17v3"/><circle cx="6" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="12" cy="9" r="2" fill="currentColor" stroke="none"/><circle cx="18" cy="15" r="2" fill="currentColor" stroke="none"/></>,
    download: <><path d="M12 3v12"/><path d="m7 11 5 5 5-5"/><path d="M5 20h14"/></>,
    queue: <><path d="M4 6h12M4 11h12M4 16h7"/><path d="M17 11v8l4-2.2z" fill="currentColor" stroke="none"/></>,
    lyrics: <><path d="M5 4h14v12l-4 4H5z"/><path d="M9 9h6M9 13h4"/></>,
    waves: <><path d="M3 12h2M7 7v10M11 4v16M15 8v8M19 11v2"/></>,
    dolby: <><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M8 8a4 4 0 0 1 0 8z" fill="currentColor" stroke="none"/><path d="M16 8a4 4 0 0 0 0 8z" fill="currentColor" stroke="none"/></>,
    star: <path d="M12 3l2.5 5.5L20 9.3l-4 4 1 5.7L12 16.3 7 19l1-5.7-4-4 5.5-.8z" fill={fill ? 'currentColor' : 'none'}/>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    sliders: <><path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h7M15 18h5"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="13" cy="18" r="2"/></>,
    check: <path d="m4 12 5 5L20 6"/>,
    x: <path d="M6 6l12 12M18 6 6 18"/>,
    bolt: <path d="M13 2 4 14h6l-1 8 9-12h-6z" fill={fill ? 'currentColor' : 'none'}/>,
    moon: <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.6 6.6 0 0 0 21 12.8z"/>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    flame: <path d="M12 3c1 4-3 5-3 9a3 3 0 0 0 6 0c0-1.5-1-2.5-1-4 2 1 3 3 3 5a6 6 0 1 1-12 0c0-5 5-6 7-10z"/>,
    cast: <><path d="M3 16a5 5 0 0 1 5 5M3 12a9 9 0 0 1 9 9M3 8a13 13 0 0 1 13 13"/><rect x="3" y="3" width="18" height="14" rx="2" opacity="0.4"/></>,
    add_circle: <><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></>,
    grid: <><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/></>,
    trend: <><path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/></>,
    headphone: <><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="2.5" y="13" width="4" height="7" rx="2"/><rect x="17.5" y="13" width="4" height="7" rx="2"/></>,
    disc: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.4" fill="currentColor"/><path d="M12 3a9 9 0 0 1 0 18" opacity="0.4"/></>,
    timer: <><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2"/><path d="M9 2h6"/></>,
  };
  return <svg {...p}>{paths[name] || null}</svg>;
}

// ---- Procedural glossy cover art ----
// Deterministic gradient + soft shapes from a seed string.
export function hashStr(s) { let h = 0; for (let i=0;i<s.length;i++) h = (h*31 + s.charCodeAt(i))|0; return Math.abs(h); }
export function ProcCover({ seed, size = '100%', radius, style = {} }) {
  const h = hashStr(seed);
  const palettes = [
    ['#ff7a59','#ff2e93','#7b2ff7'], ['#00d4ff','#5b6cff','#b026ff'],
    ['#ffd24a','#ff5e3a','#c2185b'], ['#22e3a0','#0ea5e9','#6d28d9'],
    ['#fb7185','#a855f7','#3b82f6'], ['#f9c846','#ef476f','#7209b7'],
    ['#2af598','#08aeea','#2d3561'], ['#ff9a9e','#fa709a','#784ba0'],
    ['#a1ffce','#12fff7','#5433ff'], ['#ffe53b','#ff2525','#21d4fd'],
  ];
  const pal = palettes[h % palettes.length];
  const ang = (h % 8) * 45;
  const cx = 18 + (h % 50), cy = 12 + ((h>>3) % 60);
  return (
    <div className="cover" style={{ width: size, height: size, borderRadius: radius, ...style }}>
      <div style={{ position:'absolute', inset:0,
        background:`linear-gradient(${ang}deg, ${pal[0]}, ${pal[2]})` }} />
      <div style={{ position:'absolute', inset:0,
        background:`radial-gradient(60% 60% at ${cx}% ${cy}%, ${pal[1]}cc, transparent 70%)` }} />
      <div style={{ position:'absolute', width:'70%', height:'70%', borderRadius:'50%',
        right:'-18%', bottom:'-22%', mixBlendMode:'soft-light',
        background:`radial-gradient(circle, #fff8, transparent 65%)` }} />
    </div>
  );
}

// ---- Demo data (placeholder until real sources are wired in) ----
const ARTISTS = ['Nova Sky','Aether','LUMA','Kairos','Halcyon','Mirae','Solstice','Vela Moon','Cobalt','Echo Drift','Seraph','Indra'];
const TRACK_TITLES = ['Aurora','Neon Tide','Velvet Sky','Gravity','Lucid','Afterglow','Paper Moon','Crystalline','Slow Burn','Midnight Run','Echoes','Saudade','Halo','Drifting','Ember','Cascade','Polaris','Mirage','Wavelength','Eclipse','Submarine','Goldenhour','Pulse','Nocturne'];
function dur() { const m = 2 + Math.floor(Math.random()*4); const s = Math.floor(Math.random()*60); return `${m}:${s<10?'0':''}${s}`; }
export function makeTracks(n, off=0) {
  return Array.from({length:n}, (_,i) => {
    const t = TRACK_TITLES[(i+off) % TRACK_TITLES.length];
    const a = ARTISTS[(i*3+off) % ARTISTS.length];
    return { id:`t${off}-${i}`, title:t, artist:a, album:`${t} EP`, len:dur(),
      lossless: (i+off)%3!==0, atmos:(i+off)%4===0, seed:`${t}-${a}` };
  });
}
const TRACKS = makeTracks(24);
const RECENT = makeTracks(6, 5);
const NEW_REL = makeTracks(8, 11);

const GENRES = ['Pop','Hip-Hop','Lo-fi','R&B','Jazz','Indie','Electronic','Classical','Ambient','Rock','K-Pop','Soul'];
const PLAYLISTS = [
  { name:'Liquid Focus', n:42, seed:'Liquid Focus mix' },
  { name:'Midnight Drive', n:28, seed:'Midnight Drive set' },
  { name:'Golden Hour', n:35, seed:'Golden Hour glow' },
  { name:'Deep Lossless', n:51, seed:'Deep Lossless hifi' },
  { name:'Rainy Lo-fi', n:64, seed:'Rainy lofi chill' },
  { name:'Atmos Showcase', n:19, seed:'Atmos spatial demo' },
];

export { ARTISTS, TRACKS, RECENT, NEW_REL, GENRES, PLAYLISTS };
