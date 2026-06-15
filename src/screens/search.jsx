// ============================================================
// LUMORA — Search (real multi-source) with demo browse fallback
// ============================================================
import React from 'react';
import { Icon, GENRES } from '../ui/data.jsx';
import { ScreenHeader, SectionHead, HeartBtn } from '../ui/primitives.jsx';
import { AlbumArt } from '../ui/AlbumArt.jsx';
import { searchAll, enabledSources } from '../audio/registry.js';

function fmtDur(sec) {
  if (!sec || !isFinite(sec)) return '';
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function ResultRow({ track, group, ctx }) {
  const active = ctx.current && ctx.current.id === track.id;
  return (
    <div className="trow" onClick={() => ctx.play(track, group.tracks, group.label)}>
      <AlbumArt track={track} size={44} radius="11px" />
      <div className="meta">
        <div className="t"><span className={active ? 'grad-text' : ''} style={{ display: 'inline-block' }}>{track.title}</span></div>
        <div className="a" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {track.artist}
          {track.lossless && <span style={{ color: '#ffd479', fontWeight: 700 }}> · HiRes</span>}
        </div>
      </div>
      {track.duration ? <div className="faint mono" style={{ fontSize: 12, marginRight: 4 }}>{fmtDur(track.duration)}</div> : null}
      <HeartBtn liked={ctx.liked.has(track.id)} onToggle={() => ctx.toggleLike(track.id)} />
    </div>
  );
}

function GroupBadge({ canLossless }) {
  return canLossless
    ? <span className="badge gold" style={{ padding: '3px 7px' }}>Lossless capable</span>
    : <span className="badge" style={{ padding: '3px 7px' }}>Lossy</span>;
}

export function SearchScreen({ ctx }) {
  const [q, setQ] = React.useState(ctx.searchQuery || '');
  const [groups, setGroups] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [losslessOnly, setLosslessOnly] = React.useState(false);
  const reqId = React.useRef(0);
  const sources = enabledSources();

  // Pick up incoming query from chips / external nav
  React.useEffect(() => {
    if (ctx.searchQuery && ctx.searchQuery !== q) {
      setQ(ctx.searchQuery);
      ctx.setSearchQuery('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.searchQuery]);

  // Debounced live search with AbortController for race-condition safety.
  React.useEffect(() => {
    const query = q.trim();
    if (!query) { setGroups([]); setLoading(false); return; }
    const id = ++reqId.current;
    const controller = new AbortController();
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const res = await searchAll(query, 25);
        if (id === reqId.current && !controller.signal.aborted) setGroups(res);
      } catch (err) {
        if (err?.name === 'AbortError') return;
        if (id === reqId.current) setGroups([]);
      } finally {
        if (id === reqId.current && !controller.signal.aborted) setLoading(false);
      }
    }, 450);
    return () => { clearTimeout(handle); controller.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const shownGroups = losslessOnly ? groups.filter(g => g.canLossless) : groups;
  const totalResults = shownGroups.reduce((n, g) => n + g.tracks.length, 0);

  return (
    <div className="screen-fade">
      <ScreenHeader title="Search" right={
        <div className="iconbtn" onClick={() => ctx.openSheet('sources')}><Icon name="sliders" size={20} /></div>
      } />
      <div className="pad">
        <div className="glass glass-sm" style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '13px 16px' }}>
          <span className="dim" style={{ display: 'flex' }}><Icon name="search" size={20} /></span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Songs, artists, albums…"
            autoCapitalize="none" autoCorrect="off"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--ink)',
              fontFamily: 'var(--font-body)', fontSize: 15.5, fontWeight: 500 }} />
          {q
            ? <div onClick={() => setQ('')} className="dim" style={{ display: 'flex', cursor: 'pointer' }}><Icon name="x" size={19} /></div>
            : <div className="dim" style={{ display: 'flex' }}><Icon name="search" size={19} /></div>}
        </div>
        {/* quality filter */}
        <div className="chips" style={{ marginTop: 12 }}>
          <div className={'chip' + (!losslessOnly ? ' on' : '')} onClick={() => setLosslessOnly(false)}>All sources</div>
          <div className={'chip' + (losslessOnly ? ' on' : '')} onClick={() => setLosslessOnly(true)}>
            <Icon name="bolt" size={12} fill /> Lossless only
          </div>
        </div>
      </div>

      {/* No sources configured yet — only visible when all sources explicitly disabled */}
      {sources.length === 0 && !q && groups.length === 0 && (
        <div className="pad below-nav">
          <div className="glass tap" onClick={() => ctx.openSheet('sources')}
            style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
            <span className="grad" style={{ width: 46, height: 46, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}><Icon name="plus" size={24} /></span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>Add a music source</div>
              <div className="dim" style={{ fontSize: 13, marginTop: 3 }}>Navidrome, YouTube, Jamendo or Internet Archive</div>
            </div>
            <span className="faint"><Icon name="chevR" size={20} /></span>
          </div>

          <SectionHead title="Browse genres" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13 }}>
            {GENRES.map((g) => (
              <div key={g} className="cover tap" style={{ height: 92, borderRadius: 'var(--radius-card)', padding: 14, display: 'flex', alignItems: 'flex-start' }} onClick={() => setQ(g)}>
                <div style={{ position: 'absolute', inset: 0 }}><AlbumArt seed={'genre' + g} size="100%" radius="var(--radius-card)" /></div>
                <div style={{ position: 'relative', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: '#fff', textShadow: '0 1px 8px rgba(0,0,0,0.4)' }}>{g}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Query with sources */}
      {q && (
        <div className="pad below-nav screen-fade">
          <div className="dim mono" style={{ fontSize: 12, fontWeight: 700, margin: '18px 4px 12px' }}>
            {loading ? 'SEARCHING…' : `${totalResults} ${totalResults === 1 ? 'RESULT' : 'RESULTS'}`}
            {losslessOnly ? ' · LOSSLESS' : ''}
          </div>
          {losslessOnly && !loading && (
            <div className="glass" style={{ padding: '12px 14px', marginBottom: 14 }}>
              <div className="a" style={{ fontSize: 12.5, lineHeight: 1.5 }}>
                True lossless comes from your own files, a Navidrome server, or lossless
                Internet Archive items. Mainstream songs are rarely free in lossless.
              </div>
            </div>
          )}
          {shownGroups.map((g) => (
            (g.tracks.length > 0 || g.error) && (
              <div key={g.source} style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, margin: '0 4px 10px' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>{g.label}</span>
                  <GroupBadge canLossless={g.canLossless} />
                </div>
                {g.error ? (
                  <div className="glass" style={{ padding: '14px 16px' }}>
                    <div className="a" style={{ color: '#ff7a90' }}>Couldn't reach this source — {g.error}</div>
                  </div>
                ) : (
                  <div className="glass" style={{ padding: '6px 16px' }}>
                    {g.tracks.map((tr) => <ResultRow key={tr.id} track={tr} group={g} ctx={ctx} />)}
                  </div>
                )}
              </div>
            )
          ))}
          {!loading && totalResults === 0 && groups.length > 0 && groups.every((g) => g.error) && (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--ink-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}><Icon name="x" size={38} /></div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: '#ff7a90' }}>{"Couldn't reach music sources"}</div>
              <div className="a" style={{ marginTop: 6 }}>Check your connection and try again</div>
            </div>
          )}
          {!loading && totalResults === 0 && groups.every((g) => !g.error) && (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--ink-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}><Icon name="search" size={38} /></div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'var(--ink-2)' }}>No matches for "{q}"</div>
            </div>
          )}
        </div>
      )}

      {/* Sources exist but no query yet */}
      {!q && (
        <div className="pad below-nav">
          <SectionHead title="Browse genres" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13 }}>
            {GENRES.map((g) => (
              <div key={g} className="cover tap" style={{ height: 92, borderRadius: 'var(--radius-card)', padding: 14, display: 'flex', alignItems: 'flex-start' }} onClick={() => setQ(g)}>
                <div style={{ position: 'absolute', inset: 0 }}><AlbumArt seed={'genre' + g} size="100%" radius="var(--radius-card)" /></div>
                <div style={{ position: 'relative', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: '#fff', textShadow: '0 1px 8px rgba(0,0,0,0.4)' }}>{g}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
