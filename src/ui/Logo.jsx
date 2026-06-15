// ============================================================
// SONEXA — brand mark + wordmark
// ============================================================
// Unique mark: a sonar-style sound pulse — concentric arcs radiating from a
// core dot on an accent-gradient squircle. Futuristic, music-coded, distinct.
import React from 'react';

export const APP_NAME = 'Sonexa';

// Refined futuristic monogram: an elegant nested orbital soundwave with a
// central glowing core inside a premium gradient squircle.
export function AuraMark({ size = 40, radius }) {
  const r = radius != null ? radius : size * 0.3;
  return (
    <div className="grad" style={{ width: size, height: size, borderRadius: r,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden', flexShrink: 0,
      boxShadow: '0 8px 24px -6px var(--acc-1), inset 0 1px 0 rgba(255,255,255,0.4)',
      border: '1px solid rgba(255,255,255,0.15)',
      userSelect: 'none', WebkitTapHighlightColor: 'transparent' }}>
      <span className="sheen" />
      <svg width={size * 0.68} height={size * 0.68} viewBox="0 0 100 100" fill="none"
        style={{ position: 'relative', zIndex: 2, filter: 'drop-shadow(0 2px 8px rgba(255,255,255,0.3))',
          pointerEvents: 'none' }}>
        {/* Core glowing dot */}
        <circle cx="50" cy="50" r="10" fill="#fff" opacity="0.95" />
        
        {/* Futuristic outer sound orbits */}
        <circle cx="50" cy="50" r="22" stroke="#fff" strokeWidth="4.5" strokeDasharray="30 15 10 10" opacity="0.8" 
          style={{ transformOrigin: 'center', transform: 'rotate(45deg)' }} />
        <circle cx="50" cy="50" r="34" stroke="#fff" strokeWidth="3" strokeDasharray="60 20 15 20" opacity="0.6" 
          style={{ transformOrigin: 'center', transform: 'rotate(-30deg)' }} />
        <circle cx="50" cy="50" r="44" stroke="#fff" strokeWidth="2" strokeDasharray="10 10" opacity="0.35" />
      </svg>
    </div>
  );
}

export function AuraWordmark({ size = 22, mark = true, markSize }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10,
      userSelect: 'none', WebkitTapHighlightColor: 'transparent',
      cursor: 'default' }}>
      {mark && <AuraMark size={markSize || size * 1.5} />}
      <span style={{ fontFamily: 'var(--font-dot)', fontWeight: 900, fontSize: size,
        letterSpacing: '0.02em', lineHeight: 1, textTransform: 'lowercase',
        pointerEvents: 'none' }}>{APP_NAME}</span>
    </div>
  );
}
