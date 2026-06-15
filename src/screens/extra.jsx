// ============================================================
// SONEXA — Audio, Analytics, Playlist, Create Playlist,
//          History, Queue, Sleep Timer
// ============================================================
// All features here use REAL data from localStorage / player state.
// No hardcoded demo data — if there's nothing, we say so honestly.

import React from 'react';
import { Icon, ProcCover } from '../ui/data.jsx';
import { SectionHead, TrackRow, PlayFab, Toggle, SettingSlider, Viz } from '../ui/primitives.jsx';
import { AlbumArt } from '../ui/AlbumArt.jsx';
import { getRecent } from '../audio/feed.js';

export function SheetHeader({ title, onBack, right, down }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 22px 12px' }}>
      <div className="iconbtn" onClick={onBack}><Icon name={down?'chevD':'chevL'} size={22}/></div>
      <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:18 }}>{title}</div>
      <div style={{ width:44, display:'flex', justifyContent:'flex-end' }}>{right}</div>
    </div>
  );
}

// ---------- AUDIO: Quality settings ----------
function QualityPick({ label, value, options, onChange }) {
  return (
    <div style={{ padding:'14px 0', borderBottom:'1px solid var(--hair)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:11 }}>
        <span style={{ fontWeight:600, fontSize:15 }}>{label}</span>
      </div>
      <div style={{ display:'flex', gap:8 }}>
        {options.map(o=>(
          <div key={o} onClick={()=>onChange(o)} className={value===o?'grad':''}
            style={{ flex:1, textAlign:'center', padding:'10px 4px', borderRadius:12, cursor:'pointer',
              fontSize:12, fontWeight:700, color: value===o?'#fff':'var(--ink-2)',
              border: value===o?'none':'1px solid var(--glass-border)',
              background: value===o?undefined:'var(--glass-bg)' }}>{o}</div>
        ))}
      </div>
    </div>
  );
}
export function AudioScreen({ ctx }) {
  const [mobile, setMobile] = React.useState('Lossless');
  const [wifi, setWifi] = React.useState('HiRes');
  const [dl, setDl] = React.useState('HiRes');
  const [atmos, setAtmos] = React.useState(true);
  return (
    <div className="sheet">
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(120% 90% at 50% -10%, var(--bg-1), var(--bg-0))', zIndex:-1 }} />
      <div className="app-col"><div className="safe-top" />
        <SheetHeader title="Audio Quality" onBack={ctx.closeSheet} down />
        <div className="scroll pad below-nav">
          <div className="glass grad" style={{ padding:'24px', color:'#fff', textAlign:'center', marginBottom:18 }}>
            <Icon name="dolby" size={38}/>
            <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:22, marginTop:10 }}>Hi-Fi Engine</div>
            <div style={{ opacity:0.8, marginTop:6, fontSize:13.5 }}>Lossless when sources support it</div>
          </div>
          <div className="glass" style={{ padding:'4px 20px' }}>
            <QualityPick label="Streaming (mobile)" value={mobile} options={['Normal','High','Lossless','HiRes']} onChange={setMobile} />
            <QualityPick label="Streaming (Wi-Fi)" value={wifi} options={['Normal','High','Lossless','HiRes']} onChange={setWifi} />
            <QualityPick label="Download quality" value={dl} options={['Normal','High','Lossless','HiRes']} onChange={setDl} />
          </div>
          <div className="glass" style={{ marginTop:16, padding:'4px 18px' }}>
            <div className="list-row"><span className="ico-acc" style={{display:'flex'}}><Icon name="dolby" size={20}/></span>
              <div style={{flex:1}}><div className="lr-t">Dolby Atmos</div><div className="a">Spatial audio when available</div></div>
              <Toggle on={atmos} onChange={setAtmos} /></div>
          </div>
          <div className="glass" style={{ marginTop:14, padding:'4px 18px' }}>
            <SettingSlider label="Crossfade" min={0} max={12} step={1} value={ctx.crossfade}
              display={ctx.crossfade===0 ? 'Off' : `${ctx.crossfade}s`} onChange={ctx.setCrossfade} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- ANALYTICS (REAL — computed from play history) ----------
export function Analytics({ ctx }) {
  const history = getRecent();

  // Compute real stats from history
  const totalPlays = history.length;
  const uniqueArtists = [...new Set(history.map(t => (t.artist || '').split(/,\s*/)[0].trim()).filter(Boolean))];
  const uniqueAlbums = [...new Set(history.map(t => t.album).filter(Boolean))];

  // Top artists by play count
  const artistCounts = {};
  for (const t of history) {
    const a = (t.artist || '').split(/,\s*/)[0].trim();
    if (a) artistCounts[a] = (artistCounts[a] || 0) + 1;
  }
  const topArtists = Object.entries(artistCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // Top sources by count
  const sourceCounts = {};
  for (const t of history) {
    const s = t.source || 'unknown';
    sourceCounts[s] = (sourceCounts[s] || 0) + 1;
  }
  const topSources = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxSourceCount = topSources.length ? topSources[0][1] : 1;

  return (
    <div className="sheet">
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(120% 90% at 50% -10%, var(--bg-1), var(--bg-0))', zIndex:-1 }} />
      <div className="app-col"><div className="safe-top" />
        <SheetHeader title="Listening Stats" onBack={ctx.closeSheet} down />
        <div className="scroll pad below-nav">
          {history.length === 0 ? (
            <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--ink-3)' }}>
              <div style={{ display:'flex', justifyContent:'center', marginBottom:14 }}><Icon name="trend" size={38}/></div>
              <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:17, color:'var(--ink-2)' }}>No listening data yet</div>
              <div className="a" style={{ marginTop:6 }}>Play some songs and your stats will appear here</div>
            </div>
          ) : (
            <>
              <div style={{ display:'flex', gap:13, marginBottom:16 }}>
                <div className="glass" style={{ flex:1, padding:'18px' }}>
                  <span className="ico-acc"><Icon name="play" size={22}/></span>
                  <div className="mono" style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:30, marginTop:10 }}>{totalPlays}</div>
                  <div className="a" style={{ marginTop:2 }}>Songs played</div>
                </div>
                <div className="glass" style={{ flex:1, padding:'18px' }}>
                  <span className="ico-acc"><Icon name="user" size={22}/></span>
                  <div className="mono" style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:30, marginTop:10 }}>{uniqueArtists.length}</div>
                  <div className="a" style={{ marginTop:2 }}>Artists</div>
                </div>
              </div>

              {topSources.length > 0 && (
                <>
                  <SectionHead title="Top sources" />
                  <div className="glass" style={{ padding:'18px' }}>
                    {topSources.map(([s, count]) => (
                      <div key={s} style={{ marginBottom:14 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', fontSize:13.5, fontWeight:600, marginBottom:7 }}>
                          <span style={{ textTransform:'capitalize' }}>{s}</span><span className="dim mono">{count} plays</span>
                        </div>
                        <div className="track-line" style={{ height:8 }}><i style={{ width:`${(count/maxSourceCount)*100}%` }}/></div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {topArtists.length > 0 && (
                <>
                  <SectionHead title="Top artists" />
                  <div style={{ display:'flex', gap:14, overflowX:'auto', scrollbarWidth:'none', margin:'0 -22px', padding:'0 22px' }}>
                    {topArtists.map(([name, count]) => {
                      const sample = history.find(t => (t.artist || '').includes(name));
                      return (
                        <div key={name} style={{ width:104, flexShrink:0, textAlign:'center' }}>
                          {sample?.artwork
                            ? <AlbumArt track={sample} size={104} radius="50%" />
                            : <ProcCover seed={'art'+name} size={104} radius="50%" />}
                          <div className="t" style={{ fontSize:13.5, marginTop:9, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{name}</div>
                          <div className="a" style={{ fontSize:11.5 }}>{count} plays</div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- PLAYLIST DETAIL ----------
// Playlists stored in localStorage
const PL_KEY = 'sonexa.playlists';
function loadPlaylists() {
  try { return JSON.parse(localStorage.getItem(PL_KEY) || '[]'); } catch { return []; }
}
function savePlaylists(pls) {
  try { localStorage.setItem(PL_KEY, JSON.stringify(pls)); } catch {}
}

export function PlaylistDetail({ ctx }) {
  const p = ctx.param;
  if (!p) { ctx.closeSheet(); return null; }
  const list = p.tracks || [];
  return (
    <div className="sheet">
      <div style={{ position:'absolute', inset:0, zIndex:-1, opacity:0.5 }}>
        {list[0]?.artwork
          ? <AlbumArt track={list[0]} size="100%" radius="0" style={{ filter:'blur(60px) saturate(140%)', transform:'scale(1.4)' }} />
          : <ProcCover seed={p.seed || p.name} size="100%" radius="0" style={{ filter:'blur(60px) saturate(140%)', transform:'scale(1.4)' }} />}
      </div>
      <div className="app-col"><div className="safe-top" />
        <SheetHeader title="" onBack={ctx.closeSheet} right={<div className="iconbtn"><Icon name="more" size={22}/></div>} />
        <div className="scroll pad below-nav">
          <div style={{ textAlign:'center' }}>
            {list[0]?.artwork
              ? <AlbumArt track={list[0]} size={196} radius="24px" style={{ margin:'0 auto 18px' }} />
              : <ProcCover seed={p.seed || p.name} size={196} radius="24px" style={{ margin:'0 auto 18px' }} />}
            <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:26 }}>{p.name}</div>
            <div className="dim" style={{ fontSize:14, marginTop:6 }}>{list.length} tracks</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:16, justifyContent:'center', margin:'22px 0 8px' }}>
            <div className="iconbtn" onClick={()=>ctx.toggleLike('pl-'+p.name)} style={{ color: ctx.liked.has('pl-'+p.name)?'var(--acc-2)':'var(--ink)' }}>
              <Icon name="heart" size={22} fill={ctx.liked.has('pl-'+p.name)} /></div>
            <PlayFab playing={ctx.playing && list.some(t=>ctx.current&&t.id===ctx.current.id)} onClick={()=>{ if(list.length) ctx.playFrom(list, p.name); }} size={64} />
            <div className="iconbtn"><Icon name="shuffle" size={22}/></div>
          </div>
          {list.length > 0 ? (
            <div className="glass" style={{ padding:'6px 16px', marginTop:14 }}>
              {list.map((tr,i)=>(<TrackRow key={tr.id || i} track={tr} ctx={ctx} idx={i+1} />))}
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:'40px 20px', color:'var(--ink-3)' }}>
              <div className="a">This playlist is empty</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- CREATE PLAYLIST (REAL — persists to localStorage) ----------
export function CreatePlaylist({ ctx }) {
  const [name, setName] = React.useState('');
  const [priv, setPriv] = React.useState(false);
  // Suggest songs from recent history
  const recent = getRecent();
  const [picked, setPicked] = React.useState(new Set());
  const toggle = (id) => { const n=new Set(picked); n.has(id)?n.delete(id):n.add(id); setPicked(n); };

  const save = () => {
    if (!name.trim()) return;
    const tracks = recent.filter(t => picked.has(t.id));
    const pl = { name: name.trim(), tracks, createdAt: Date.now(), private: priv };
    const existing = loadPlaylists();
    existing.unshift(pl);
    savePlaylists(existing);
    ctx.closeSheet();
  };

  return (
    <div className="sheet">
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(120% 90% at 50% -10%, var(--bg-1), var(--bg-0))', zIndex:-1 }} />
      <div className="app-col"><div className="safe-top" />
        <SheetHeader title="New Playlist" onBack={ctx.closeSheet} down
          right={<div className="grad-text" style={{ fontWeight:800, fontSize:15, cursor:'pointer', opacity: name.trim()?1:0.4 }} onClick={save}>Save</div>} />
        <div className="scroll pad below-nav">
          <div style={{ display:'flex', gap:16, alignItems:'center', marginBottom:22 }}>
            <div className="glass" style={{ width:96, height:96, borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <span className="dim"><Icon name="grid" size={30}/></span>
            </div>
            <div style={{ flex:1 }}>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="Playlist name"
                style={{ width:'100%', background:'transparent', border:'none', borderBottom:'1px solid var(--glass-border)',
                  outline:'none', color:'var(--ink)', fontFamily:'var(--font-display)', fontWeight:700, fontSize:21, padding:'4px 0 10px' }} />
              <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:14 }}>
                <span className="dim" style={{ fontSize:13.5, fontWeight:600, flex:1 }}>Private playlist</span>
                <Toggle on={priv} onChange={setPriv} />
              </div>
            </div>
          </div>
          {recent.length > 0 ? (
            <>
              <SectionHead title="Add from recent plays" action={`${picked.size} added`} />
              <div className="glass" style={{ padding:'6px 16px' }}>
                {recent.map(tr=>(
                  <div key={tr.id} className="trow" onClick={()=>toggle(tr.id)}>
                    {tr.artwork ? <AlbumArt track={tr} size={46} radius="12px" /> : <ProcCover seed={tr.seed || tr.id} size={46} radius="12px" />}
                    <div className="meta"><div className="t">{tr.title}</div><div className="a">{tr.artist}</div></div>
                    <div className={picked.has(tr.id)?'grad':''} style={{ width:30, height:30, borderRadius:'50%',
                      display:'flex', alignItems:'center', justifyContent:'center', color:picked.has(tr.id)?'#fff':'var(--ink-3)',
                      border: picked.has(tr.id)?'none':'1px solid var(--glass-border)' }}>
                      <Icon name={picked.has(tr.id)?'check':'plus'} size={17}/>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign:'center', padding:'30px 20px', color:'var(--ink-3)' }}>
              <div className="a">Play some songs first, then add them here</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- HISTORY (REAL — from localStorage play history) ----------
export function History({ ctx }) {
  const all = getRecent();
  // Split into today vs older (rough grouping)
  const now = Date.now();
  const dayMs = 86400000;
  // We don't store timestamps per play in the simple recent list,
  // so just show all recent plays in order
  return (
    <div className="sheet">
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(120% 90% at 50% -10%, var(--bg-1), var(--bg-0))', zIndex:-1 }} />
      <div className="app-col"><div className="safe-top" />
        <SheetHeader title="History" onBack={ctx.closeSheet} down
          right={<div className="dim" style={{fontSize:13,fontWeight:600,cursor:'pointer'}} onClick={()=>{
            try { localStorage.removeItem('sonexa.recent'); } catch {}
          }}>Clear</div>} />
        <div className="scroll pad below-nav">
          {all.length === 0 ? (
            <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--ink-3)' }}>
              <div style={{ display:'flex', justifyContent:'center', marginBottom:14 }}><Icon name="clock" size={38}/></div>
              <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:17, color:'var(--ink-2)' }}>No history yet</div>
              <div className="a" style={{ marginTop:6 }}>Songs you play will appear here</div>
            </div>
          ) : (
            <>
              <SectionHead title={`Recently played (${all.length})`} />
              <div className="glass" style={{ padding:'6px 16px' }}>
                {all.map((tr,i)=>(<TrackRow key={tr.id + '-' + i} track={tr} ctx={ctx} idx={i+1}/>))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- QUEUE (REAL — from player state) ----------
export function Queue({ ctx }) {
  const cur = ctx.current;
  const up = ctx.queue || [];
  return (
    <div className="sheet">
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(120% 90% at 50% -10%, var(--bg-1), var(--bg-0))', zIndex:-1 }} />
      <div className="app-col"><div className="safe-top" />
        <SheetHeader title="Queue" onBack={ctx.closeSheet} down
          right={ctx.shuffle
            ? <div style={{display:'flex', color:'var(--acc-1)'}} onClick={()=>ctx.setShuffle(!ctx.shuffle)}><Icon name="shuffle" size={20}/></div>
            : <div className="dim" style={{display:'flex'}} onClick={()=>ctx.setShuffle(!ctx.shuffle)}><Icon name="shuffle" size={20}/></div>} />
        <div className="scroll pad below-nav">
          {cur ? (
            <>
              <div className="faint" style={{ fontSize:11.5, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', margin:'6px 0 10px' }}>Now playing</div>
              <div className="glass" style={{ padding:'6px 16px' }}><TrackRow track={cur} ctx={ctx} /></div>
            </>
          ) : null}
          <div className="faint" style={{ fontSize:11.5, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', margin:'22px 0 10px' }}>Up next ({up.length})</div>
          {up.length > 0 ? (
            <div className="glass" style={{ padding:'6px 16px' }}>
              {up.map((tr, i) => (
                <div key={tr.id + '-' + i} className="trow" onClick={()=>ctx.play(tr, up.slice(i+1), ctx.source)}>
                  {tr.artwork ? <AlbumArt track={tr} size={42} radius="11px" /> : <ProcCover seed={tr.seed || tr.id} size={42} radius="11px" />}
                  <div className="meta"><div className="t">{tr.title}</div><div className="a">{tr.artist}</div></div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:'30px 20px', color:'var(--ink-3)' }}>
              <div className="a">Queue is empty. Play a song to start.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- SLEEP TIMER ----------
export function SleepTimer({ ctx }) {
  const opts = [5,10,15,30,45,60];
  const set = (m) => { ctx.setSleepMin(m); setTimeout(ctx.closeSheet, 240); };
  return (
    <div className="sheet">
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(120% 90% at 50% 18%, var(--bg-1), var(--bg-0))', zIndex:-1 }} />
      <div className="app-col"><div className="safe-top" />
        <SheetHeader title="Sleep Timer" onBack={ctx.closeSheet} down />
        <div className="scroll pad below-nav">
          <div style={{ textAlign:'center', margin:'14px 0 26px' }}>
            <div style={{ display:'inline-flex', width:96, height:96, borderRadius:'50%', alignItems:'center', justifyContent:'center', marginBottom:16 }} className="grad">
              <span style={{ color:'#fff', display:'flex' }}><Icon name="moon" size={42}/></span>
            </div>
            <div className="np-title" style={{ fontWeight:800, fontSize:24 }}>
              {ctx.sleepMin ? <span className="mono">{ctx.sleepMin}:00</span> : 'Fade to sleep'}
            </div>
            <div className="dim" style={{ fontSize:14, marginTop:8, maxWidth:260, marginLeft:'auto', marginRight:'auto' }}>
              {ctx.sleepMin ? 'Playback will stop when timer ends.' : 'Music stops automatically after the timer ends.'}
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            {opts.map(m=>(
              <div key={m} onClick={()=>set(m)} className={'tap '+(ctx.sleepMin===m?'grad':'glass')}
                style={{ padding:'22px 0', borderRadius:18, textAlign:'center', color: ctx.sleepMin===m?'#fff':'var(--ink)' }}>
                <div className="mono" style={{ fontSize:26, fontWeight:700, fontFamily:'var(--font-mono)' }}>{m}</div>
                <div style={{ fontSize:11.5, fontWeight:600, opacity:0.8, marginTop:2 }}>minutes</div>
              </div>
            ))}
          </div>
          {ctx.sleepMin && (
            <button className="glass" onClick={()=>{ctx.setSleepMin(null);}} style={{ width:'100%', marginTop:18, padding:'16px', borderRadius:18, color:'var(--ink)', fontFamily:'var(--font-body)', fontWeight:700, fontSize:15, cursor:'pointer' }}>Turn off timer</button>
          )}
        </div>
      </div>
    </div>
  );
}
