// ============================================================
// LUMORA — Settings & Customization
// ============================================================
import React from 'react';
import { Icon, ProcCover } from '../ui/data.jsx';
import { Viz, Toggle, SettingSlider, AppSlider } from '../ui/primitives.jsx';
import { AuraMark } from '../ui/Logo.jsx';
import { SheetHeader } from './extra.jsx';
import { getDownloads } from '../audio/download.js';

export const ACCENTS = [
  ['#6e56ff','#c15cff'], ['#2e8bff','#6e56ff'], ['#11b5c4','#3b82f6'],
  ['#ff5e8a','#ffa64c'], ['#13c08a','#5be0a0'], ['#8a93ad','#c3ccdf'],
];

function SettingRow({ icon, title, detail, right, onClick, last }) {
  return (
    <div className="list-row tap" style={ last?{borderBottom:'none'}:null} onClick={onClick}>
      <div className="set-ico"><Icon name={icon} size={18}/></div>
      <div className="lr-t">{title}</div>
      {detail && <span className="lr-d">{detail}</span>}
      {right !== undefined ? right : <span className="faint" style={{display:'flex'}}><Icon name="chevR" size={18}/></span>}
    </div>
  );
}

export function SettingsScreen({ ctx }) {
  const t = ctx.t, setTweak = ctx.setTweak;
  return (
    <div className="screen-fade">
      <div className="scr-head"><div><div className="scr-title">Settings</div></div></div>
      <div className="pad below-nav">
        {/* profile — no login; editable display name */}
        <div className="glass" style={{ padding:'18px', display:'flex', alignItems:'center', gap:15, marginBottom:18 }}>
          <AuraMark size={58} />
          <div style={{ flex:1, minWidth:0 }}>
            <input
              value={ctx.userName}
              onChange={(e)=>ctx.setUserName(e.target.value)}
              placeholder="Your name"
              maxLength={24}
              style={{ width:'100%', boxSizing:'border-box', background:'transparent', border:'none', outline:'none',
                color:'var(--ink)', fontFamily:'var(--font-display)', fontWeight:700, fontSize:18, padding:0 }} />
            <div className="dim" style={{ fontSize:13, marginTop:2 }}>Tap to edit your name</div>
          </div>
          <span className="badge gold"><Icon name="star" size={11} fill/>Hi-Fi</span>
        </div>

        {/* CUSTOMIZATION */}
        <div className="faint" style={{ fontSize:11.5, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', margin:'4px 4px 10px' }}>Appearance</div>
        <div className="glass" style={{ padding:'16px 18px', marginBottom:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
            <div className="set-ico"><Icon name="moon" size={18}/></div>
            <div className="lr-t">Theme</div>
          </div>
          <div className="seg" style={{ marginBottom:18 }}>
            {[['dark','Dark'],['light','Light'],['amoled','AMOLED']].map(([v,l])=>(
              <button key={v} className={t.theme===v?'on':''} onClick={()=>setTweak('theme', v)}>{l}</button>
            ))}
          </div>
          <div style={{ paddingTop:0 }}>
            <div style={{ fontSize:13.5, fontWeight:600, marginBottom:12 }}>Accent color</div>
            <div style={{ display:'flex', gap:12 }}>
              {ACCENTS.map((a,i)=>(
                <div key={i} onClick={()=>setTweak('accent', a)}
                  style={{ flex:1, height:38, borderRadius:11, cursor:'pointer',
                    background:`linear-gradient(135deg, ${a[0]}, ${a[1]})`,
                    boxShadow: t.accent[0]===a[0] ? '0 0 0 2px var(--ink), 0 0 0 4px '+a[0] : 'inset 0 1px 0 rgba(255,255,255,0.4)',
                    display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {t.accent[0]===a[0] && <span style={{color:'#fff',display:'flex'}}><Icon name="check" size={18}/></span>}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="glass" style={{ padding:'4px 18px', marginBottom:18 }}>
          <SettingRow icon="sliders" title="Customize appearance" detail="Glass · blur · shape" onClick={()=>ctx.openSheet('appearance')} />
          <SettingRow icon="grid" title="Background transparency" right={<span className="lr-d mono">{Math.round((t.bgOpacity!=null?t.bgOpacity:1)*100)}%</span>} onClick={()=>ctx.openSheet('appearance')} last />
        </div>

        {/* PLAYBACK */}
        <div className="faint" style={{ fontSize:11.5, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', margin:'4px 4px 10px' }}>Playback</div>
        <div className="glass" style={{ padding:'4px 18px', marginBottom:18 }}>
          <SettingRow icon="sliders" title="Music sources" detail="Manage" onClick={()=>ctx.openSheet('sources')} />
          <SettingRow icon="dolby" title="Audio quality" detail="HiRes Lossless" onClick={()=>ctx.openSheet('audio')} />
          <SettingRow icon="eq" title="Equalizer" detail="Bass Boost" onClick={()=>ctx.openSheet('eq')} />
          <div className="list-row tap">
            <div className="set-ico"><Icon name="disc" size={18}/></div>
            <div style={{ flex:1 }}><div className="lr-t">Lo-fi mode</div><div className="a">Play downloads as a lo-fi remix</div></div>
            <Toggle on={ctx.lofi} onChange={ctx.setLofi} />
          </div>
          <SettingRow icon="waves" title="Crossfade" right={<span className="lr-d mono">{ctx.crossfade}s</span>} onClick={()=>ctx.openSheet('audio')} />
          <SettingRow icon="play" title="Autoplay similar" right={<Toggle on={ctx.autoplay !== false} onChange={(v)=>ctx.setAutoplay(v)} />} last />
        </div>

        {/* LIBRARY */}
        <div className="faint" style={{ fontSize:11.5, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', margin:'4px 4px 10px' }}>Library & data</div>
        <div className="glass" style={{ padding:'4px 18px', marginBottom:18 }}>
          <SettingRow icon="download" title="Downloads" detail={`${getDownloads().length} songs`} onClick={()=>ctx.goTab('library')} />
          <SettingRow icon="trend" title="Listening stats" onClick={()=>ctx.openSheet('analytics')} />
          <SettingRow icon="clock" title="Play history" onClick={()=>ctx.openSheet('history')} />
          <SettingRow icon="cast" title="Connected devices" detail="Local only" last />
        </div>

        {/* ACCOUNT */}
        <div className="faint" style={{ fontSize:11.5, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', margin:'4px 4px 10px' }}>Account</div>
        <div className="glass" style={{ padding:'4px 18px' }}>
          <SettingRow icon="user" title="Privacy" />
          <SettingRow icon="settings" title="About Sonexa" detail="v2.0" last />
        </div>
      </div>
    </div>
  );
}

// ---------- APPEARANCE (in-app customize panel) ----------
function SegPick({ value, options, onChange }) {
  return (
    <div className="seg">
      {options.map(o=>(
        <button key={o} className={value===o?'on':''} onClick={()=>onChange(o)}
          style={{ textTransform:'capitalize' }}>{o}</button>
      ))}
    </div>
  );
}

export function AppearanceScreen({ ctx }) {
  const t = ctx.t, setTweak = ctx.setTweak;
  const bg = t.bgOpacity != null ? t.bgOpacity : 1;
  return (
    <div className="sheet">
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(120% 90% at 50% -10%, var(--bg-1), var(--bg-0))', zIndex:-1 }} />
      <div className="app-col"><div className="safe-top" />
        <SheetHeader title="Customize" onBack={ctx.closeSheet} down />
        <div className="scroll pad below-nav">
          {/* live preview */}
          <div className="glass" style={{ padding:18, marginBottom:18, display:'flex', gap:14, alignItems:'center' }}>
            <ProcCover seed="preview lumora" size={64} radius="var(--radius-card)" />
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:16 }}>Live preview</div>
              <div className="dim" style={{ fontSize:12.5, marginTop:3 }}>Changes apply instantly</div>
            </div>
            <Viz playing={true} n={6} />
          </div>

          <div className="faint" style={{ fontSize:11.5, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', margin:'4px 4px 10px' }}>Color & theme</div>
          <div className="glass" style={{ padding:'16px 18px', marginBottom:16 }}>
            <div style={{ fontSize:13.5, fontWeight:600, marginBottom:12 }}>Accent</div>
            <div style={{ display:'flex', gap:10, marginBottom:18 }}>
              {ACCENTS.map((a,i)=>(
                <div key={i} onClick={()=>setTweak('accent', a)} className="tap"
                  style={{ flex:1, height:36, borderRadius:11, cursor:'pointer',
                    background:`linear-gradient(135deg, ${a[0]}, ${a[1]})`,
                    boxShadow: t.accent[0]===a[0] ? '0 0 0 2px var(--ink), 0 0 0 4px '+a[0] : 'inset 0 1px 0 rgba(255,255,255,0.4)',
                    display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {t.accent[0]===a[0] && <span style={{color:'#fff',display:'flex'}}><Icon name="check" size={17}/></span>}
                </div>
              ))}
            </div>
            <div style={{ fontSize:13.5, fontWeight:600, marginBottom:10 }}>Theme</div>
            <SegPick value={t.theme} options={['dark','light','amoled']} onChange={(v)=>setTweak('theme', v)} />
          </div>

          <div className="faint" style={{ fontSize:11.5, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', margin:'4px 4px 10px' }}>Glass & background</div>
          <div className="glass" style={{ padding:'4px 18px', marginBottom:16 }}>
            <SettingSlider label="Glass blur" value={t.blur} min={0} max={60} step={1} display={`${t.blur}px`} onChange={(v)=>setTweak('blur', v)} />
            <SettingSlider label="Glass tint" value={t.glassAlpha} min={0.02} max={0.22} step={0.01} display={`${Math.round(t.glassAlpha*100)}%`} onChange={(v)=>setTweak('glassAlpha', v)} />
            <div style={{ padding:'15px 0' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:13 }}>
                <span style={{ fontWeight:600, fontSize:14.5 }}>Background transparency</span>
                <span className="dim mono" style={{ fontSize:13 }}>{Math.round((1-bg)*100)}%</span>
              </div>
              <AppSlider value={bg} min={0.3} max={1} step={0.05} onChange={(v)=>setTweak('bgOpacity', v)} />
            </div>
          </div>

          <div className="faint" style={{ fontSize:11.5, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', margin:'4px 4px 10px' }}>Shape & motion</div>
          <div className="glass" style={{ padding:'4px 18px' }}>
            <SettingSlider label="Roundness" value={t.radius} min={6} max={40} step={1} display={`${t.radius}px`} onChange={(v)=>setTweak('radius', v)} />
            <div style={{ padding:'15px 0', borderBottom:'1px solid var(--hair)' }}>
              <div style={{ fontSize:14.5, fontWeight:600, marginBottom:11 }}>Album art</div>
              <SegPick value={t.artShape} options={['rounded','square','circle']} onChange={(v)=>setTweak('artShape', v)} />
            </div>
            <div className="list-row" style={{ borderBottom:'none' }}>
              <div className="lr-t">Background orbs</div>
              <Toggle on={t.orbs} onChange={(v)=>setTweak('orbs', v)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
