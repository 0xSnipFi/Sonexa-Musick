import React from 'react';
import { AuraMark, APP_NAME } from '../ui/Logo.jsx';
import { Icon } from '../ui/data.jsx';

const SLIDES = [
  {
    icon: 'play',
    title: 'Unlimited Music',
    desc: 'Stream millions of songs from JioSaavn, YouTube, Jamendo and more — completely free.',
    color: '#6e56ff',
  },
  {
    icon: 'dolby',
    title: 'Hi-Fi Sound',
    desc: 'Lossless audio when sources support it, 10-band EQ, bass boost and spatial effects.',
    color: '#c15cff',
  },
  {
    icon: 'lyrics',
    title: 'Live Lyrics',
    desc: 'Synced lyrics that scroll in real-time. Tap any line to jump to that moment.',
    color: '#2e8bff',
  },
  {
    icon: 'download',
    title: 'Offline Ready',
    desc: 'Download songs to play anytime, anywhere — no internet needed.',
    color: '#13c08a',
  },
];

export function Onboarding({ onDone }) {
  const [page, setPage] = React.useState(0);
  const [permAsked, setPermAsked] = React.useState(false);

  const isLastSlide = page >= SLIDES.length;

  const requestPerms = async () => {
    setPermAsked(true);
    if ('Notification' in window && Notification.permission === 'default') {
      try { await Notification.requestPermission(); } catch {}
    }
    setTimeout(onDone, 600);
  };

  const next = () => {
    if (page < SLIDES.length) {
      setPage(page + 1);
    } else {
      requestPerms();
    }
  };

  const skip = () => {
    setPage(SLIDES.length);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'linear-gradient(160deg, #0a0a12 0%, #141428 50%, #0d0d1a 100%)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      fontFamily: 'var(--font-body, system-ui)',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)',
        width: '140%', height: '60%', borderRadius: '50%',
        background: `radial-gradient(ellipse, ${SLIDES[Math.min(page, SLIDES.length - 1)]?.color || '#6e56ff'}33 0%, transparent 70%)`,
        transition: 'background 0.6s ease', pointerEvents: 'none',
      }} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 32px' }}>
        {!isLastSlide ? (
          <div key={page} style={{ textAlign: 'center', animation: 'fadeIn .4s ease' }}>
            {/* Icon */}
            <div style={{
              width: 100, height: 100, borderRadius: 28, margin: '0 auto 32px',
              background: `linear-gradient(135deg, ${SLIDES[page].color}, ${SLIDES[page].color}99)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 16px 40px -8px ${SLIDES[page].color}66`,
            }}>
              <span style={{ color: '#fff', display: 'flex' }}><Icon name={SLIDES[page].icon} size={46} /></span>
            </div>
            <h1 style={{
              color: '#fff', fontSize: 32, fontWeight: 800,
              fontFamily: 'var(--font-display, system-ui)', margin: '0 0 16px',
              letterSpacing: '-0.02em',
            }}>{SLIDES[page].title}</h1>
            <p style={{
              color: 'rgba(255,255,255,0.55)', fontSize: 16, lineHeight: 1.6,
              margin: 0, maxWidth: 320, marginLeft: 'auto', marginRight: 'auto',
            }}>{SLIDES[page].desc}</p>
          </div>
        ) : (
          <div style={{ textAlign: 'center', animation: 'fadeIn .4s ease' }}>
            <AuraMark size={90} radius={26} />
            <h1 style={{
              color: '#fff', fontSize: 34, fontWeight: 800,
              fontFamily: 'var(--font-display, system-ui)', margin: '28px 0 12px',
              letterSpacing: '-0.02em',
            }}>Ready to go</h1>
            <p style={{
              color: 'rgba(255,255,255,0.55)', fontSize: 15, lineHeight: 1.6,
              margin: 0, maxWidth: 300, marginLeft: 'auto', marginRight: 'auto',
            }}>
              {permAsked
                ? 'Setting up your experience…'
                : 'Allow notifications to control music from your lock screen and notification panel.'}
            </p>
          </div>
        )}
      </div>

      {/* Bottom section */}
      <div style={{ padding: '0 32px 48px' }}>
        {/* Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
          {[...SLIDES, { id: 'ready' }].map((_, i) => (
            <div key={i} style={{
              width: page === i ? 24 : 8, height: 8, borderRadius: 4,
              background: page === i
                ? `linear-gradient(90deg, ${SLIDES[Math.min(i, SLIDES.length - 1)]?.color || '#6e56ff'}, ${SLIDES[Math.min(i, SLIDES.length - 1)]?.color || '#c15cff'}cc)`
                : 'rgba(255,255,255,0.15)',
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 12 }}>
          {!isLastSlide && (
            <button onClick={skip} style={{
              flex: 1, padding: '16px', borderRadius: 16, fontSize: 16, fontWeight: 700,
              background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)',
              border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer',
              fontFamily: 'var(--font-body, system-ui)',
            }}>Skip</button>
          )}
          <button onClick={next} disabled={permAsked} style={{
            flex: isLastSlide ? 1 : 2, padding: '16px', borderRadius: 16, fontSize: 16, fontWeight: 700,
            background: `linear-gradient(135deg, ${SLIDES[Math.min(page, SLIDES.length - 1)]?.color || '#6e56ff'}, #c15cff)`,
            color: '#fff', border: 'none', cursor: permAsked ? 'default' : 'pointer',
            opacity: permAsked ? 0.6 : 1,
            boxShadow: `0 8px 24px -4px ${SLIDES[Math.min(page, SLIDES.length - 1)]?.color || '#6e56ff'}55`,
            fontFamily: 'var(--font-body, system-ui)',
            transition: 'all 0.3s ease',
          }}>
            {isLastSlide ? (permAsked ? 'Starting…' : 'Allow & Start') : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
