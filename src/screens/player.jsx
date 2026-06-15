// ============================================================
// LUMORA — Now Playing, Lyrics, Equalizer
// ============================================================
import React from 'react';
import { Icon, ProcCover } from '../ui/data.jsx';
import { AlbumArt } from '../ui/AlbumArt.jsx';
import { PlayFab, Toggle } from '../ui/primitives.jsx';
import { usePersist } from '../ui/usePersist.js';
import { getLyrics, activeLine } from '../audio/lyrics.js';
import { applyEQGains, setEQEnabled, setBassBoost } from '../audio/eq.js';

function fmt(sec) { sec=Math.max(0,Math.round(sec)); const m=Math.floor(sec/60); const s=sec%60; return `${m}:${s<10?'0':''}${s}`; }

// ---------- NOW PLAYING ----------
export function NowPlaying({ ctx }) {
  const tr = ctx.current;
  const [hp, setHp] = React.useState(false);
  if (!tr) { ctx.closeSheet(); return null; }
  const likeNP = () => { if (!ctx.liked.has(tr.id)) { setHp(true); setTimeout(()=>setHp(false), 450); } ctx.toggleLike(tr.id); };
  const total = ctx.duration || 218;
  const cur = ctx.position || 0;
  const seek = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    ctx.seekFraction(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)));
  };
  const shape = ctx.t.artShape; // rounded | square | circle
  const rad = shape==='circle' ? '50%' : shape==='square' ? '6px' : '28px';
  return (
    <div className="sheet">
      {/* ambient color wash from cover */}
      <div style={{ position:'absolute', inset:0, zIndex:-1, opacity:0.5 }}>
        <AlbumArt track={tr} size="100%" radius="0" className="np-ambient" style={{ filter:'blur(40px) saturate(130%)', transform:'scale(1.3)' }} />
      </div>
      <div className="app-col"><div className="safe-top" />
        <div className="scroll pad" style={{ paddingBottom:30 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
            <div className="iconbtn" onClick={ctx.closeSheet}><Icon name="chevD" size={22}/></div>
            <div style={{ textAlign:'center', lineHeight:1.3 }}>
              <div className="faint" style={{ fontSize:10.5, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' }}>Playing from</div>
              <div style={{ fontSize:13.5, fontWeight:700 }}>{ctx.source || 'Liquid Focus'}</div>
            </div>
            <div className="modepick">
              <div className={ctx.npMode==='cover'?'on':''} onClick={()=>ctx.setNpMode('cover')}><Icon name="grid" size={17}/></div>
              <div className={ctx.npMode==='vinyl'?'on':''} onClick={()=>ctx.setNpMode('vinyl')}><Icon name="disc" size={18}/></div>
            </div>
          </div>

          {ctx.npMode==='vinyl' ? (
            <div className="vinyl-wrap art-in" style={{ display:'flex', justifyContent:'center', margin:'6px 0 26px' }}>
              <div className={'vinyl'+(ctx.playing?'':' paused')} style={{ position:'relative', width:'80%', aspectRatio:'1', borderRadius:'50%',
                background:'repeating-radial-gradient(circle at 50% 50%, #17171b 0px, #17171b 1px, #0a0a0d 1px, #0a0a0d 4px)',
                boxShadow:'0 30px 70px -20px rgba(0,0,0,0.85), inset 0 0 60px rgba(0,0,0,0.6)' }}>
                <div style={{ position:'absolute', inset:0, borderRadius:'50%',
                  background:'conic-gradient(from 210deg, transparent 0deg, rgba(255,255,255,0.16) 30deg, transparent 70deg, transparent 200deg, rgba(255,255,255,0.10) 240deg, transparent 280deg)' }} />
                <div style={{ position:'absolute', top:'50%', left:'50%', width:'50%', height:'50%', transform:'translate(-50%,-50%)', borderRadius:'50%', overflow:'hidden', boxShadow:'0 0 0 2px rgba(255,255,255,0.08)' }}>
                  <AlbumArt track={tr} size="100%" radius="50%" />
                </div>
                <div className="vinyl-hole" />
              </div>
            </div>
          ) : (
            <div className="np-art art-in" style={{ borderRadius:rad, margin:'8px 0 24px' }}>
              <AlbumArt track={tr} size="100%" radius={rad} glow />
            </div>
          )}

          {/* live visualizer strip */}
          <div className="viz-wide" style={{ marginBottom:22 }} >
            {Array.from({length:22},(_,i)=>(<span key={i} className={ctx.playing?'':'paused'} style={{ animationPlayState: ctx.playing?'running':'paused', animationDelay:`${-(i%7)*0.15}s` }} />))}
          </div>

          <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div className="np-title" style={{ fontWeight:800, fontSize:28, letterSpacing:'-0.02em', lineHeight:1.05 }}>{tr.title}</div>
              <div className="dim" style={{ fontSize:16, fontWeight:600, marginTop:5 }}>{tr.artist}</div>
            </div>
            <div className={'iconbtn'+(hp?' heart-pop':'')} onClick={likeNP}
              style={{ color: ctx.liked.has(tr.id) ? 'var(--acc-2)':'var(--ink)' }}>
              <Icon name="heart" size={22} fill={ctx.liked.has(tr.id)} />
            </div>
          </div>

          <div style={{ display:'flex', gap:7, marginTop:14, flexWrap:'wrap' }}>
            {ctx.lofi
              ? <span className="badge lofi"><Icon name="disc" size={12}/>Lo-fi remix</span>
              : tr.lossless
                ? <span className="badge gold"><Icon name="bolt" size={11} fill/>
                    {tr.sampleRate ? <span className="mono">{tr.bitDepth ? `${tr.bitDepth}/` : ''}{(tr.sampleRate/1000).toFixed(1)}kHz</span> : null}Lossless</span>
                : <span className="badge"><span className="mono">{tr.codec ? tr.codec.toUpperCase() : 'Lossy'}{tr.bitrate ? ` ${tr.bitrate}k` : ''}</span></span>}
            {tr.atmos && !ctx.lofi && <span className="badge atmos"><Icon name="dolby" size={12}/>Dolby Atmos</span>}
            {ctx.sleepMin && <span className="badge"><Icon name="timer" size={11}/><span className="mono">{ctx.sleepMin}m</span></span>}
          </div>

          {/* progress */}
          <div style={{ marginTop:24 }}>
            <div className="track-line" onClick={seek}>
              <i style={{ width:`${ctx.progress*100}%` }} />
              <b style={{ left:`${ctx.progress*100}%` }} />
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:9 }}>
              <span className="faint mono" style={{ fontSize:12 }}>{fmt(cur)}</span>
              <span className="faint mono" style={{ fontSize:12 }}>-{fmt(total-cur)}</span>
            </div>
          </div>

          {/* controls */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:16 }}>
            <div className={ctx.shuffle ? '' : 'dim'} style={{ display:'flex', cursor:'pointer', color: ctx.shuffle ? 'var(--acc-1)' : undefined }} onClick={() => ctx.setShuffle(!ctx.shuffle)}><Icon name="shuffle" size={22}/></div>
            <div style={{ cursor:'pointer', display:'flex' }} onClick={ctx.prev}><Icon name="prev" size={34}/></div>
            <div className={'fab-wrap'+(ctx.playing?' playing':'')}>
              <PlayFab playing={ctx.playing} onClick={ctx.toggle} size={74} />
            </div>
            <div style={{ cursor:'pointer', display:'flex' }} onClick={ctx.next}><Icon name="next" size={34}/></div>
            <div className={ctx.repeat !== 'off' ? '' : 'dim'} style={{ display:'flex', cursor:'pointer', color: ctx.repeat !== 'off' ? 'var(--acc-1)' : undefined }} onClick={() => ctx.setRepeat(ctx.repeat === 'off' ? 'all' : ctx.repeat === 'all' ? 'one' : 'off')}>
              <Icon name="repeat" size={22}/>
              {ctx.repeat === 'one' && <span style={{ position:'absolute', fontSize:9, fontWeight:800, marginTop:7, marginLeft:7 }}>1</span>}
            </div>
          </div>

          {/* footer actions */}
          <div className="glass" style={{ marginTop:26, display:'flex', justifyContent:'space-around', padding:'14px 4px' }}>
            <FootAct ico="lyrics" label="Lyrics" onClick={()=>ctx.openSheet('lyrics')} />
            <FootAct ico="eq" label="EQ" onClick={()=>ctx.openSheet('eq')} />
            <FootAct ico="timer" label="Sleep" on={!!ctx.sleepMin} onClick={()=>ctx.openSheet('sleep')} />
            <DownloadAct ctx={ctx} track={tr} />
            <FootAct ico="queue" label="Queue" onClick={()=>ctx.openSheet('queue')} />
          </div>
        </div>
      </div>
    </div>
  );
}
function FootAct({ ico, label, onClick, on }) {
  return (
    <div onClick={onClick} className="tap" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, cursor:'pointer', color: on?'var(--acc-1)':'var(--ink-2)', flex:1 }}>
      <span style={{display:'flex'}}><Icon name={ico} size={21}/></span>
      <span style={{ fontSize:11, fontWeight:600 }}>{label}</span>
    </div>
  );
}

function DownloadAct({ ctx, track }) {
  const [state, setState] = React.useState('idle'); // idle|saving|done|fail
  const real = !!track?.source;
  const run = async () => {
    if (!real || state === 'saving') return;
    setState('saving');
    try {
      const r = await ctx.download(track);
      setState(r.ok ? 'done' : 'fail');
    } catch { setState('fail'); }
    setTimeout(() => setState('idle'), 2600);
  };
  const label = { idle: 'Download', saving: 'Saving…', done: 'Saved', fail: 'Failed' }[state];
  return (
    <FootAct ico={state === 'done' ? 'check' : 'download'} label={label}
      on={state === 'done'} onClick={run} />
  );
}

// ---------- LYRICS (real, synced — LRCLIB) ----------
export function Lyrics({ ctx }) {
  const tr = ctx.current;
  const [data, setData] = React.useState({ synced: [], plain: [], source: 'loading' });
  if (!tr) { ctx.closeSheet(); return null; }
  const lineRefs = React.useRef([]);
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    let alive = true;
    setData({ synced: [], plain: [], source: 'loading' });
    getLyrics(tr).then(r => { if (alive) setData(r); });
    return () => { alive = false; };
  }, [tr.id]);

  const synced = data.synced;
  const active = synced.length ? activeLine(synced, ctx.position || 0) : -1;

  // Auto-scroll the active synced line into the middle.
  React.useEffect(() => {
    if (active < 0) return;
    const el = lineRefs.current[active];
    if (el?.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [active]);

  const seekToLine = (i) => { if (synced[i]) ctx.seekSeconds(synced[i].time + 0.05); };

  return (
    <div className="sheet">
      <div style={{ position:'absolute', inset:0, zIndex:-1, opacity:0.55 }}>
        <AlbumArt track={tr} size="100%" radius="0" style={{ filter:'blur(80px) saturate(150%)', transform:'scale(1.5)' }} />
      </div>
      <div className="app-col"><div className="safe-top" />
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 22px 14px' }}>
          <div className="iconbtn" onClick={ctx.closeSheet}><Icon name="chevD" size={22}/></div>
          <div style={{ textAlign:'center', maxWidth:'70%' }}>
            <div style={{ fontWeight:700, fontSize:15, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{tr.title}</div>
            <div className="dim" style={{ fontSize:12.5 }}>{tr.artist}{data.source==='synced' ? ' · synced' : ''}</div>
          </div>
          <div className="iconbtn"><Icon name="more" size={22}/></div>
        </div>
        <div className="scroll pad" style={{ paddingBottom:140 }} ref={scrollRef}>
          {data.source === 'loading' && (
            <div className="dim" style={{ padding:'40px 4px', fontSize:16 }}>Finding lyrics…</div>
          )}
          {data.source === 'none' && (
            <div style={{ padding:'60px 6px', textAlign:'center' }}>
              <div style={{ display:'flex', justifyContent:'center', marginBottom:14, color:'var(--ink-3)' }}><Icon name="lyrics" size={40}/></div>
              <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:18, color:'var(--ink-2)' }}>No lyrics found</div>
              <div className="a" style={{ marginTop:6 }}>No lyrics available for this track.</div>
            </div>
          )}
          {data.source === 'synced' && synced.map((l,i)=>(
            <div key={i} ref={el => (lineRefs.current[i] = el)}
              style={{ fontFamily:'var(--font-display)', fontWeight:700,
              fontSize: i===active ? 27 : 24, lineHeight:1.32,
              margin:'14px 0', letterSpacing:'-0.02em', cursor:'pointer',
              color: i===active ? 'transparent' : i<active ? 'var(--ink-4)' : 'rgba(255,255,255,0.2)',
              textShadow: i===active ? `0 0 30px color-mix(in srgb, var(--acc-1) 60%, transparent)` : 'none',
              transition:'color .3s, font-size .3s ease, text-shadow .4s ease',
              transform: i===active ? 'scale(1.02)' : 'scale(1)',
              transformOrigin: 'left center' }}
              onClick={()=>seekToLine(i)}>
              <span className={i===active?'grad-text':''}>{l.text || '♪'}</span>
            </div>
          ))}
          {data.source === 'plain' && data.plain.map((l,i)=>(
            <div key={i} style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:23, lineHeight:1.34,
              margin:'14px 0', letterSpacing:'-0.02em', color:'var(--ink-2)' }}>{l || ' '}</div>
          ))}
        </div>
        {/* mini transport */}
        <div style={{ position:'absolute', left:14, right:14, bottom:20 }}>
          <div className="glass" style={{ padding:'12px 16px', display:'flex', alignItems:'center', gap:14 }}>
            <div className="track-line" style={{ flex:1 }} onClick={(e)=>{const r=e.currentTarget.getBoundingClientRect(); ctx.seekFraction((e.clientX-r.left)/r.width);}}>
              <i style={{ width:`${ctx.progress*100}%` }}/><b style={{ left:`${ctx.progress*100}%` }}/>
            </div>
            <PlayFab playing={ctx.playing} onClick={ctx.toggle} size={46} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- EQUALIZER ----------
const EQ_BANDS = ['32','64','125','250','500','1k','2k','4k','8k','16k'];
const EQ_PRESETS = {
  'Flat':      [0,0,0,0,0,0,0,0,0,0],
  'Bass Boost':[9,7,5,3,1,0,0,1,2,2],
  'Vocal':     [-2,-1,0,2,4,5,4,2,1,0],
  'Treble':    [0,0,0,1,2,3,5,7,8,8],
  'Live':      [3,2,1,2,3,3,2,3,4,3],
  'Lo-fi':     [5,4,2,0,-2,-3,-4,-5,-6,-7],
};
export function Equalizer({ ctx }) {
  const [eq, setEq] = usePersist('auralis.eq', { preset: 'Bass Boost', vals: EQ_PRESETS['Bass Boost'], bass: true, spatial: false, normalize: false });
  const { preset, vals, bass, spatial, normalize } = eq;

  // Apply EQ to audio whenever values or enabled state changes.
  // IMPORTANT: Only connect the Web Audio EQ graph when the user explicitly
  // toggles EQ on from this screen. Auto-connecting via createMediaElementSource
  // silences audio in Capacitor WebView.
  React.useEffect(() => {
    if (ctx.eqOn) {
      import('../audio/player.js').then(m => { try { m.enableEQRouting(); } catch {} }).catch(() => {});
    }
    setEQEnabled(ctx.eqOn);
    applyEQGains(ctx.eqOn ? vals : new Array(10).fill(0));
  }, [ctx.eqOn, vals]);
  React.useEffect(() => { setBassBoost(ctx.eqOn && bass); }, [ctx.eqOn, bass]);

  const setBass = (b) => setEq(e => ({ ...e, bass: b }));
  const setSpatial = (s) => setEq(e => ({ ...e, spatial: s }));
  const setNormalize = (n) => setEq(e => ({ ...e, normalize: n }));
  const setBand = (i, v) => setEq(e => { const n = [...e.vals]; n[i] = v; return { ...e, vals: n, preset: 'Custom' }; });
  const choosePreset = (p) => setEq(e => ({ ...e, preset: p, vals: EQ_PRESETS[p] || e.vals }));
  const savePreset = () => { try { const saved = JSON.parse(localStorage.getItem('sonexa.mypresets') || '[]'); saved.push({ name: 'My Preset ' + (saved.length + 1), vals }); localStorage.setItem('sonexa.mypresets', JSON.stringify(saved)); } catch {} };
  return (
    <div className="sheet">
      <div className="lumora-root2" style={{ position:'absolute', inset:0, background:'radial-gradient(120% 90% at 50% -10%, var(--bg-1), var(--bg-0))', zIndex:-1 }} />
      <div className="app-col"><div className="safe-top" />
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 22px 8px' }}>
          <div className="iconbtn" onClick={ctx.closeSheet}><Icon name="chevD" size={22}/></div>
          <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:18 }}>Equalizer</div>
          <Toggle on={ctx.eqOn} onChange={ctx.setEqOn} />
        </div>
        <div className="scroll pad below-nav" style={{ opacity: ctx.eqOn?1:0.4, pointerEvents: ctx.eqOn?'auto':'none', transition:'.3s' }}>
          <div className="chips" style={{ margin:'14px 0 8px' }}>
            {Object.keys(EQ_PRESETS).map(p=>(
              <div key={p} className={'chip'+(preset===p?' on':'')} onClick={()=>choosePreset(p)}>{p}</div>
            ))}
            {preset==='Custom' && <div className="chip on">Custom</div>}
          </div>

          <div className="glass" style={{ padding:'24px 16px 18px', marginTop:14 }}>
            <div style={{ display:'flex', justifyContent:'space-between', gap:6, alignItems:'flex-end' }}>
              {EQ_BANDS.map((b,i)=>(
                <EqBand key={b} label={b} val={vals[i]} onChange={(v)=>setBand(i,v)} />
              ))}
            </div>
          </div>

          <div className="glass" style={{ marginTop:16, padding:'4px 18px' }}>
            <div className="list-row"><span className="ico-acc" style={{display:'flex'}}><Icon name="waves" size={20}/></span>
              <div className="lr-t">Bass booster</div><Toggle on={bass} onChange={setBass} /></div>
            <div className="list-row"><span className="ico-acc" style={{display:'flex'}}><Icon name="headphone" size={20}/></span>
              <div className="lr-t">Spatial audio <span className="faint" style={{fontSize:11}}>(soon)</span></div><Toggle on={!!spatial} onChange={setSpatial} /></div>
            <div className="list-row" style={{borderBottom:'none'}}><span className="ico-acc" style={{display:'flex'}}><Icon name="bolt" size={20}/></span>
              <div className="lr-t">Volume normalize <span className="faint" style={{fontSize:11}}>(soon)</span></div><Toggle on={!!normalize} onChange={setNormalize} /></div>
          </div>

          <div style={{ display:'flex', gap:12, marginTop:18 }}>
            <button className="glass" onClick={()=>choosePreset('Flat')} style={{ flex:1, padding:'15px', borderRadius:16, color:'var(--ink)', fontFamily:'var(--font-body)', fontWeight:700, fontSize:14.5, cursor:'pointer' }}>Reset</button>
            <button className="grad" onClick={savePreset} style={{ flex:1, padding:'15px', borderRadius:16, color:'#fff', border:'none', fontFamily:'var(--font-body)', fontWeight:700, fontSize:14.5, cursor:'pointer' }}>Save preset</button>
          </div>
        </div>
      </div>
    </div>
  );
}
function EqBand({ label, val, onChange }) {
  const ref = React.useRef(null);
  const pct = (val + 12) / 24; // -12..+12
  const drag = (e) => {
    const r = ref.current.getBoundingClientRect();
    const y = (e.touches ? e.touches[0].clientY : e.clientY);
    const p = 1 - Math.min(1, Math.max(0, (y - r.top) / r.height));
    onChange(Math.round((p*24 - 12)));
  };
  const start = (e) => { drag(e); const mv=(ev)=>drag(ev); const up=()=>{document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);}; document.addEventListener('mousemove',mv); document.addEventListener('mouseup',up); };
  return (
    <div className="eq-band">
      <span className="faint" style={{ fontSize:10, fontWeight:700, fontVariantNumeric:'tabular-nums' }}>{val>0?'+':''}{val}</span>
      <div className="eq-slot" ref={ref} onMouseDown={start} onTouchMove={drag} onTouchStart={drag}>
        <div className="eq-fill" style={{ height:`${pct*100}%` }} />
        <div className="eq-knob" style={{ bottom:`${pct*100}%`, transform:'translate(-50%,50%)' }} />
      </div>
      <span className="faint" style={{ fontSize:9.5, fontWeight:600 }}>{label}</span>
    </div>
  );
}
