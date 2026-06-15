// ============================================================
// SONEXA — album art: real artwork URL with procedural fallback
// ============================================================
// Shows real cover art when available (JioSaavn CDN, etc.),
// smoothly crossfades on track change, and falls back to
// procedural art if the image fails or is missing.

import React from 'react';
import { ProcCover } from './data.jsx';

export function AlbumArt({ track, seed, size = '100%', radius, style = {}, glow = false }) {
  const [failed, setFailed] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const art = track?.artwork;
  const trackId = track?.id || track?.seed || '';
  const useSeed = seed || track?.seed || `${track?.title}-${track?.artist}`;

  // Reset failed/loaded state when the track (or its artwork) changes
  React.useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [trackId, art]);

  if (!art || failed) {
    return <ProcCover seed={useSeed} size={size} radius={radius} style={style} />;
  }

  return (
    <div className="cover" style={{
      width: size, height: size, borderRadius: radius, overflow: 'hidden',
      position: 'relative', flexShrink: 0, ...style
    }}>
      {/* Glow effect behind artwork for premium look */}
      {glow && loaded && (
        <div style={{
          position: 'absolute', inset: '-20%', zIndex: -1,
          background: `url(${art}) center/cover no-repeat`,
          filter: 'blur(40px) saturate(200%) brightness(0.6)',
          opacity: 0.5, transition: 'opacity .5s ease',
        }} />
      )}
      <img
        key={art}
        src={art}
        alt=""
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        style={{
          width: '100%', height: '100%', objectFit: 'cover', display: 'block',
          opacity: loaded ? 1 : 0,
          transition: 'opacity .35s ease-in',
        }}
      />
      {/* Show procedural art underneath while real art loads */}
      {!loaded && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <ProcCover seed={useSeed} size="100%" radius="0" />
        </div>
      )}
    </div>
  );
}
