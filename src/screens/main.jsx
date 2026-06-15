// ============================================================
// LUMORA — Home, Search, Library
// ============================================================
import React from 'react';
import { Icon, ProcCover } from '../ui/data.jsx';

// Load user-created playlists from localStorage
function getUserPlaylists() {
  try { return JSON.parse(localStorage.getItem('sonexa.playlists') || '[]'); } catch { return []; }
}
import { ScreenHeader, SectionHead, TrackRow, Toggle, Viz } from '../ui/primitives.jsx';
import { AlbumArt } from '../ui/AlbumArt.jsx';
import { AuraWordmark } from '../ui/Logo.jsx';
import { getRecent, getDiscover, getDiscoverCached } from '../audio/feed.js';
import { getDownloads } from '../audio/download.js';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

// ---------- HOME ----------
export function HomeScreen({ ctx }) {
  const [recent, setRecent] = React.useState(() => getRecent());
  const [discover, setDiscover] = React.useState([]);
  const [loadingDiscover, setLoadingDiscover] = React.useState(true);

  React.useEffect(() => {
    setRecent(getRecent());
    let alive = true;
    setLoadingDiscover(true);
    getDiscover('IN', 36)
      .then(list => { if (alive) setDiscover(list); })
      .finally(() => { if (alive) setLoadingDiscover(false); });
    return () => { alive = false; };
  }, []);

  const jumpBack = recent.length ? recent : discover.slice(0, 8);
  const trending = discover.slice(0, 12);
  const moreForYou = discover.slice(12, 24);
  const listRows = discover.slice(24, 30);

  return (
    <div className="screen-fade">
      <div className="scr-head" style={{ alignItems:'center' }}>
        <div>
          <AuraWordmark size={24} markSize={34} />
          <div className="dim" style={{ fontSize:13.5, fontWeight:600, marginTop:7 }}>{greeting()}, {ctx.userName}</div>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <div className="iconbtn" onClick={()=>ctx.goTab('search')}><Icon name="search" size={20}/></div>
          <div className="iconbtn" onClick={()=>ctx.goTab('settings')}><Icon name="user" size={20}/></div>
        </div>
      </div>

      <div className="pad below-nav stagger">
        {/* lossless status — glass, not a filled banner */}
        <div className="glass tap" onClick={()=>ctx.openSheet('audio')}
          style={{ padding:'16px 18px', display:'flex', alignItems:'center', gap:15, marginBottom:6, overflow:'hidden' }}>
          <div style={{ position:'absolute', width:130, height:130, right:-30, top:-40, borderRadius:'50%',
            background:'radial-gradient(circle, var(--acc-2), transparent 70%)', opacity:0.35, filter:'blur(8px)' }} />
          <div className="grad" style={{ width:46, height:46, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', flexShrink:0 }}>
            <Icon name="dolby" size={25}/>
          </div>
          <div style={{ flex:1, position:'relative' }}>
            <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:16 }}>Hi-Fi engine</div>
            <div className="dim mono" style={{ fontSize:11.5, marginTop:3 }}>Lossless when the source allows · bit-perfect</div>
          </div>
          <Viz playing={true} n={5} />
        </div>

        {/* genre / mood chips — each searches that mood */}
        <div className="chips" style={{ margin:'18px 0 4px' }}>
          {['For You','Chill','Focus','Workout','Sleep','Party'].map((c)=>(
            <div key={c} className={'chip'+(c==='For You'?' on':'')}
              onClick={()=> c==='For You' ? null : ctx.goSearch(c.toLowerCase() + ' music')}>{c}</div>
          ))}
        </div>

        {jumpBack.length > 0 ? (
          <>
            <SectionHead title="Jump back in" action="History" onAction={()=>ctx.openSheet('history')} />
            <div style={{ display:'flex', gap:12, overflowX:'auto', scrollbarWidth:'none', margin:'0 -22px', padding:'0 22px' }}>
              {jumpBack.map((tr, i)=>(
                <div key={tr.id || i} style={{ width:128, flexShrink:0, cursor:'pointer' }} onClick={()=>ctx.play(tr, jumpBack, 'Jump back in')}>
                  <AlbumArt track={tr} size={128} radius="var(--radius-card)" />
                  <div className="t" style={{ fontSize:13.5, fontWeight:600, marginTop:8, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{tr.title}</div>
                  <div className="a" style={{ fontSize:11.5, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{tr.artist}</div>
                </div>
              ))}
            </div>
          </>
        ) : loadingDiscover ? (
          <div className="a" style={{ padding:'20px 4px', textAlign:'center' }}>Discovering music…</div>
        ) : (
          <div style={{ textAlign:'center', padding:'30px 20px', color:'var(--ink-3)' }}>
            <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:17, color:'var(--ink-2)' }}>Welcome to Sonexa</div>
            <div className="a" style={{ marginTop:6 }}>Search for a song to get started</div>
          </div>
        )}

        {/* Real trending feed (Piped) when available */}
        {discover.length > 0 && (
          <>
            <SectionHead title="Trending now" action="Search" onAction={()=>ctx.goTab('search')} />
            <div style={{ display:'flex', gap:12, overflowX:'auto', scrollbarWidth:'none', margin:'0 -22px', padding:'0 22px' }}>
              {discover.slice(0, 12).map((tr, i)=>(
                <div key={tr.id || i} style={{ width:142, flexShrink:0, cursor:'pointer' }} onClick={()=>ctx.play(tr, discover, 'Trending')}>
                  <div style={{ position:'relative' }}>
                    <AlbumArt track={tr} size={142} radius="var(--radius-card)" />
                    {tr.duration ? <div className="glass" style={{ position:'absolute', left:7, bottom:7, padding:'4px 9px', borderRadius:999, fontSize:10, fontWeight:700 }}>{Math.floor(tr.duration/60)}:{String(Math.floor(tr.duration%60)).padStart(2,'0')}</div> : null}
                  </div>
                  <div className="t" style={{ fontSize:13.5, fontWeight:600, marginTop:8, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{tr.title}</div>
                  <div className="a" style={{ fontSize:11.5, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{tr.artist}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {moreForYou.length > 0 && (
          <>
            <SectionHead title="Made for you" action="See all" onAction={()=>ctx.goTab('search')} />
            <div style={{ display:'flex', gap:12, overflowX:'auto', scrollbarWidth:'none', margin:'0 -22px', padding:'0 22px' }}>
              {moreForYou.map((tr, i)=>(
                <div key={tr.id || i} style={{ width:142, flexShrink:0, cursor:'pointer' }} onClick={()=>ctx.play(tr, moreForYou, 'Made for you')}>
                  <AlbumArt track={tr} size={142} radius="var(--radius-card)" />
                  <div className="t" style={{ fontSize:13.5, fontWeight:600, marginTop:8, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{tr.title}</div>
                  <div className="a" style={{ fontSize:11.5, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{tr.artist}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {(listRows.length > 0 || loadingDiscover) && (
          <>
            <SectionHead title="More to explore" action="See all" onAction={()=>ctx.goTab('search')} />
            <div className="glass" style={{ padding:'6px 16px' }}>
              {loadingDiscover && !listRows.length
                ? <div className="a" style={{ padding:'14px 4px' }}>Loading fresh music…</div>
                : listRows.map((tr,i)=>(<TrackRow key={tr.id || i} track={tr} ctx={ctx} idx={i+1} />))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------- LIBRARY ----------
export function LibraryScreen({ ctx }) {
  const [seg, setSeg] = React.useState('Playlists');
  const [feed, setFeed] = React.useState(() => getDiscoverCached());
  React.useEffect(() => {
    let alive = true;
    getDiscover('IN', 60)
      .then(list => { if (alive && list?.length) setFeed(list); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  // Build real artist list from the feed: dedupe by artist, attach a sample
  // track so we can use its real artwork and play on tap.
  const liveArtists = React.useMemo(() => {
    const map = new Map();
    for (const t of feed) {
      const name = (t.artist || '').split(/,\s*|;\s*|·\s*/)[0].trim();
      if (!name) continue;
      if (!map.has(name)) map.set(name, { name, sample: t, tracks: [] });
      map.get(name).tracks.push(t);
    }
    return Array.from(map.values()).slice(0, 30);
  }, [feed]);

  // Build real album list: dedupe by album+artist, attach real cover.
  const liveAlbums = React.useMemo(() => {
    const map = new Map();
    for (const t of feed) {
      const album = t.album || t.title;
      if (!album) continue;
      const key = album + '|' + (t.artist || '');
      if (!map.has(key)) map.set(key, t);
    }
    return Array.from(map.values()).slice(0, 30);
  }, [feed]);

  return (
    <div className="screen-fade">
      <ScreenHeader title="Library" right={
        <div className="iconbtn" onClick={()=>ctx.openSheet('createPlaylist')}><Icon name="plus" size={22}/></div>
      } />
      <div className="pad">
        <div className="seg">
          {['Playlists','Artists','Albums','Downloads'].map(s=>(
            <button key={s} className={seg===s?'on':''} onClick={()=>setSeg(s)}>{s}</button>
          ))}
        </div>
      </div>

      <div className="pad below-nav" style={{ marginTop:18 }}>
        {seg==='Playlists' && (
          <>
            <div className="glass" onClick={()=>ctx.openSheet('createPlaylist')}
              style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', cursor:'pointer', marginBottom:14 }}>
              <div className="grad" style={{ width:46, height:46, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}><Icon name="plus" size={24}/></div>
              <div style={{ fontWeight:700, fontFamily:'var(--font-display)', fontSize:15.5 }}>Create playlist</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              {getUserPlaylists().map(p=>(
                <div key={p.name+p.createdAt} style={{ cursor:'pointer' }} onClick={()=>ctx.openSheet('playlist', p)}>
                  {p.tracks?.[0]?.artwork
                    ? <AlbumArt track={p.tracks[0]} size="100%" radius="var(--radius-card)" style={{ aspectRatio:'1', height:'auto' }} />
                    : <ProcCover seed={p.name} size="100%" radius="var(--radius-card)" style={{ aspectRatio:'1', height:'auto' }} />}
                  <div className="t" style={{ fontSize:14, fontWeight:600, marginTop:8 }}>{p.name}</div>
                  <div className="a" style={{ fontSize:12 }}>{(p.tracks||[]).length} tracks</div>
                </div>
              ))}
              {getUserPlaylists().length === 0 && (
                <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'30px 20px', color:'var(--ink-3)' }}>
                  <div className="a">No playlists yet. Tap + to create one.</div>
                </div>
              )}
            </div>
          </>
        )}
        {seg==='Artists' && (
          liveArtists.length > 0 ? (
            <div className="glass" style={{ padding:'6px 16px' }}>
              {liveArtists.map((a) => (
                <div key={a.name} className="list-row" onClick={()=>ctx.play(a.sample, a.tracks, a.name)}>
                  <AlbumArt track={a.sample} size={48} radius="50%" />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div className="lr-t" style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{a.name}</div>
                    <div className="a">{a.tracks.length} {a.tracks.length===1?'song':'songs'}</div>
                  </div>
                  <span className="faint"><Icon name="chevR" size={18}/></span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:'40px 20px', color:'var(--ink-3)' }}>Loading artists…</div>
          )
        )}
        {seg==='Albums' && (
          liveAlbums.length > 0 ? (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              {liveAlbums.map(tr=>(
                <div key={tr.id} style={{ cursor:'pointer' }} onClick={()=>ctx.play(tr, liveAlbums, tr.album || 'Albums')}>
                  <AlbumArt track={tr} size="100%" radius="var(--radius-card)" style={{ aspectRatio:'1', height:'auto' }} />
                  <div className="t" style={{ fontSize:14, fontWeight:600, marginTop:8, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{tr.album || tr.title}</div>
                  <div className="a" style={{ fontSize:12, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{tr.artist}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:'40px 20px', color:'var(--ink-3)' }}>Loading albums…</div>
          )
        )}
        {seg==='Downloads' && (() => {
          const dls = getDownloads();
          return (
            <>
              <div className="glass" style={{ padding:'16px 18px', display:'flex', alignItems:'center', gap:14, marginBottom:12 }}>
                <span className="ico-acc"><Icon name="download" size={26}/></span>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontFamily:'var(--font-display)' }}>Offline downloads</div>
                  <div className="a">{dls.length} {dls.length===1?'song':'songs'} · saved on device</div>
                </div>
              </div>
              <div className="glass tap" onClick={()=>ctx.setLofi(!ctx.lofi)}
                style={{ padding:'14px 18px', display:'flex', alignItems:'center', gap:14, marginBottom:14 }}>
                <span className="badge lofi" style={{ padding:'7px 9px' }}><Icon name="disc" size={18}/></span>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontFamily:'var(--font-display)', fontSize:15 }}>Lo-fi mode</div>
                  <div className="a">Play downloads as a chilled lo-fi remix</div>
                </div>
                <Toggle on={ctx.lofi} onChange={ctx.setLofi} />
              </div>
              {dls.length > 0 ? (
                <div className="glass" style={{ padding:'6px 16px' }}>
                  {dls.map((tr,i)=>(<TrackRow key={tr.id} track={tr} ctx={ctx} idx={i+1} />))}
                </div>
              ) : (
                <div style={{ textAlign:'center', padding:'50px 20px', color:'var(--ink-3)' }}>
                  <div style={{ display:'flex', justifyContent:'center', marginBottom:14 }}><Icon name="download" size={38}/></div>
                  <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:17, color:'var(--ink-2)' }}>No downloads yet</div>
                  <div className="a" style={{ marginTop:6 }}>Tap Download on the player to save songs here.</div>
                </div>
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
}
