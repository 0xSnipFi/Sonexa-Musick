// ============================================================
// LUMORA — Sources settings (configure real music sources)
// ============================================================
import React from 'react';
import { Icon } from '../ui/data.jsx';
import { Toggle } from '../ui/primitives.jsx';
import { SheetHeader } from './extra.jsx';
import { loadConfig, updateSource } from '../audio/config.js';
import { getSource } from '../audio/registry.js';

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div className="dim" style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{label}</div>
      <input
        type={type} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        autoCapitalize="none" autoCorrect="off" spellCheck={false}
        style={{ width: '100%', boxSizing: 'border-box', background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)', borderRadius: 12, outline: 'none',
          color: 'var(--ink)', fontFamily: 'var(--font-body)', fontSize: 14.5, fontWeight: 500,
          padding: '12px 14px' }} />
    </div>
  );
}

function TestButton({ sourceKey }) {
  const [state, setState] = React.useState('idle'); // idle | testing | ok | fail
  const run = async () => {
    setState('testing');
    try {
      const ok = await getSource(sourceKey).healthCheck();
      setState(ok ? 'ok' : 'fail');
    } catch { setState('fail'); }
  };
  const label = { idle: 'Test connection', testing: 'Testing…', ok: 'Connected ✓', fail: 'Failed ✕' }[state];
  return (
    <button onClick={run} disabled={state === 'testing'}
      className={state === 'ok' ? 'grad' : 'glass'}
      style={{ width: '100%', padding: '12px', borderRadius: 12, cursor: 'pointer',
        color: state === 'ok' ? '#fff' : state === 'fail' ? '#ff7a90' : 'var(--ink)',
        fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, border: 'none', marginTop: 4 }}>
      {label}
    </button>
  );
}

function SourceCard({ icon, title, subtitle, badge, enabled, onToggle, children }) {
  return (
    <div className="glass" style={{ padding: '16px 18px', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: enabled ? 14 : 0 }}>
        <span className="ico-acc" style={{ display: 'flex' }}><Icon name={icon} size={22} /></span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: 15.5 }}>{title}</span>
            {badge}
          </div>
          <div className="a" style={{ fontSize: 12.5 }}>{subtitle}</div>
        </div>
        <Toggle on={enabled} onChange={onToggle} />
      </div>
      {enabled && <div>{children}</div>}
    </div>
  );
}

const GOLD = <span className="badge gold" style={{ padding: '3px 7px' }}>Lossless</span>;
const LOSSY = <span className="badge" style={{ padding: '3px 7px' }}>Lossy</span>;

export function SourcesScreen({ ctx }) {
  const [cfg, setCfg] = React.useState(() => loadConfig());

  const patch = (key, p) => {
    const next = updateSource(key, p);
    setCfg({ ...next });
  };

  return (
    <div className="sheet">
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 90% at 50% -10%, var(--bg-1), var(--bg-0))', zIndex: -1 }} />
      <div className="app-col"><div className="safe-top" />
        <SheetHeader title="Music Sources" onBack={ctx.closeSheet} down />
        <div className="scroll pad below-nav">
          <div className="dim" style={{ fontSize: 12.5, lineHeight: 1.5, margin: '2px 4px 16px' }}>
            Add the sources you want to search and stream. True lossless comes from
            your own files, a Navidrome/Subsonic server, or lossless Internet Archive items.
          </div>

          <SourceCard icon="star" title="JioSaavn" subtitle="Unlimited music & popular hits · free · high quality ~320k"
            badge={LOSSY} enabled={cfg.saavn.enabled} onToggle={(v) => patch('saavn', { enabled: v })}>
            <Field label="API Server URL" value={cfg.saavn.instance} placeholder="https://meloapi.vercel.app/api/"
              onChange={(v) => patch('saavn', { instance: v })} />
            <TestButton sourceKey="saavn" />
          </SourceCard>

          <SourceCard icon="headphone" title="Self-hosted" subtitle="Navidrome / Subsonic — your own FLAC library"
            badge={GOLD} enabled={cfg.subsonic.enabled} onToggle={(v) => patch('subsonic', { enabled: v })}>
            <Field label="Server URL" value={cfg.subsonic.url} placeholder="https://music.example.com"
              onChange={(v) => patch('subsonic', { url: v })} />
            <Field label="Username" value={cfg.subsonic.user} placeholder="username"
              onChange={(v) => patch('subsonic', { user: v })} />
            <Field label="Password" type="password" value={cfg.subsonic.password} placeholder="••••••••"
              onChange={(v) => patch('subsonic', { password: v })} />
            <TestButton sourceKey="subsonic" />
          </SourceCard>

          <SourceCard icon="search" title="YouTube (Piped)" subtitle="All old + new music · free · ~256k (not lossless)"
            badge={LOSSY} enabled={cfg.piped.enabled} onToggle={(v) => patch('piped', { enabled: v })}>
            <Field label="Piped instance" value={cfg.piped.instance} placeholder="https://pipedapi.kavin.rocks"
              onChange={(v) => patch('piped', { instance: v })} />
            <TestButton sourceKey="piped" />
          </SourceCard>

          <SourceCard icon="disc" title="Jamendo" subtitle="Creative-Commons catalog · free + legal"
            badge={LOSSY} enabled={cfg.jamendo.enabled} onToggle={(v) => patch('jamendo', { enabled: v })}>
            <Field label="Client ID" value={cfg.jamendo.clientId} placeholder="from developer.jamendo.com"
              onChange={(v) => patch('jamendo', { clientId: v })} />
            <TestButton sourceKey="jamendo" />
          </SourceCard>

          <SourceCard icon="library" title="Internet Archive" subtitle="Public-domain / live · often lossless FLAC"
            badge={GOLD} enabled={cfg.archive.enabled} onToggle={(v) => patch('archive', { enabled: v })}>
            <TestButton sourceKey="archive" />
          </SourceCard>

          <div className="glass" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 13 }}>
            <span className="ico-acc" style={{ display: 'flex' }}><Icon name="download" size={22} /></span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: 15.5 }}>On this device</span>
                {GOLD}
              </div>
              <div className="a" style={{ fontSize: 12.5 }}>Local FLAC/WAV/MP3 — scans on Android build</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
