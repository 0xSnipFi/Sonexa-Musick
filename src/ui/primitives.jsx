// ============================================================
// LUMORA — shared UI primitives
// ============================================================
import React from 'react';
import { Icon, ProcCover } from './data.jsx';
import { AlbumArt } from './AlbumArt.jsx';

export function ScreenHeader({ title, sub, right }) {
  return (
    <div className="scr-head">
      <div>
        <div className="scr-title">{title}</div>
        {sub && <div className="scr-sub">{sub}</div>}
      </div>
      {right}
    </div>
  );
}

export function QualityBadges({ t, lossless, atmos, small }) {
  return (
    <div style={{ display:'flex', gap:6 }}>
      {lossless && <span className="badge gold">{small ? 'HiRes' : 'HiRes Lossless'}</span>}
      {atmos && <span className="badge atmos"><Icon name="dolby" size={11}/>Atmos</span>}
    </div>
  );
}

// Like button with pop animation
export function HeartBtn({ liked, onToggle, size = 18, pad = 4 }) {
  const [pop, setPop] = React.useState(false);
  const click = (e) => {
    e.stopPropagation();
    if (!liked) { setPop(true); setTimeout(() => setPop(false), 450); }
    onToggle();
  };
  return (
    <div onClick={click} className={pop ? 'heart-pop' : ''}
      style={{ display:'flex', padding:pad, cursor:'pointer', color: liked ? 'var(--acc-2)' : 'var(--ink-3)', transition:'color .2s' }}>
      <Icon name="heart" size={size} fill={liked} />
    </div>
  );
}

// One track row. `idx` shows a number; `art` shows cover.
export function TrackRow({ track, ctx, idx, art = true, showBadge = true }) {
  const active = ctx.current && ctx.current.id === track.id;
  return (
    <div className="trow" onClick={() => ctx.play(track)}>
      {idx != null && (
        <div style={{ width:22, textAlign:'center', flexShrink:0, color: active?'var(--acc-1)':'var(--ink-3)',
          fontWeight:700, fontSize:14 }} className="mono">{active ? <Icon name="waves" size={16}/> : idx}</div>
      )}
      {art && <AlbumArt track={track} size={46} radius="12px" />}
      <div className="meta">
        <div className="t">
          <span className={active?'grad-text':''} style={{display:'inline-block'}}>{track.title}</span>
        </div>
        <div className="a">{track.artist}{showBadge && track.lossless ? ' · ' : ''}
          {showBadge && track.lossless && <span style={{color:'#ffd479',fontWeight:700}}>HiRes</span>}
        </div>
      </div>
      <div className="faint mono" style={{ fontSize:12, marginRight:4 }}>{track.len}</div>
      <HeartBtn liked={ctx.liked.has(track.id)} onToggle={()=>ctx.toggleLike(track.id)} />
    </div>
  );
}

export function SectionHead({ title, action, onAction }) {
  return (
    <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', margin:'26px 0 14px' }}>
      <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:19 }}>{title}</div>
      {action && <div className="dim" style={{ fontSize:13, fontWeight:600, cursor:'pointer' }} onClick={onAction}>{action}</div>}
    </div>
  );
}

export function Toggle({ on, onChange }) {
  return <div className={'sw'+(on?' on':'')} onClick={()=>onChange(!on)}><i/></div>;
}

// Big glossy play button
export function PlayFab({ playing, onClick, size = 66 }) {
  return (
    <div className="grad" onClick={onClick} style={{ width:size, height:size, borderRadius:'50%',
      display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff',
      boxShadow:'0 14px 34px -8px var(--acc-1)' }}>
      <span className="sheen" />
      <span style={{ position:'relative', zIndex:3, display:'flex' }}><Icon name={playing?'pause':'play'} size={size*0.42} /></span>
    </div>
  );
}

// Animated audio visualizer
export function Viz({ playing, n = 12, wide = false }) {
  const cls = (wide ? 'viz-wide' : 'viz') + (playing ? '' : ' paused');
  return <div className={cls}>{Array.from({length:n},(_,i)=><span key={i}/>)}</div>;
}

// In-app draggable slider (for the Appearance panel in Settings)
export function AppSlider({ value, min = 0, max = 100, step = 1, onChange }) {
  const ref = React.useRef(null);
  const pct = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const setFromX = (clientX) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    let p = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    let v = min + p * (max - min);
    if (step) v = Math.round(v / step) * step;
    onChange(+v.toFixed(4));
  };
  const getX = (ev) => ev.touches ? ev.touches[0].clientX : ev.clientX;
  const start = (e) => {
    setFromX(getX(e));
    const move = (ev) => { if (ev.cancelable) ev.preventDefault(); setFromX(getX(ev)); };
    const up = () => {
      document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up);
      document.removeEventListener('touchmove', move); document.removeEventListener('touchend', up);
    };
    document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
    document.addEventListener('touchmove', move, { passive: false }); document.addEventListener('touchend', up);
  };
  return (
    <div className="track-line" ref={ref} onMouseDown={start} onTouchStart={start} style={{ height: 6 }}>
      <i style={{ width: `${pct*100}%` }} />
      <b style={{ left: `${pct*100}%` }} />
    </div>
  );
}

export function SettingSlider({ label, value, display, ...props }) {
  return (
    <div style={{ padding: '15px 0', borderBottom: '1px solid var(--hair)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 13 }}>
        <span style={{ fontWeight: 600, fontSize: 14.5 }}>{label}</span>
        <span className="dim mono" style={{ fontSize: 13 }}>{display}</span>
      </div>
      <AppSlider value={value} {...props} />
    </div>
  );
}
