// ============================================================
// SONEXA — Web Audio EQ Engine
// ============================================================
// Connects the HTML5 Audio element through an AudioContext with
// 10 BiquadFilter nodes (one per EQ band). Gain updates are
// applied instantly — no latency.

const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

let ctx = null;
let sourceNode = null;
let filters = [];
let bassBoostFilter = null;
let enabled = true;

function getCtx() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch { return null; }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

/**
 * Connect an HTMLAudioElement to the EQ chain.
 * Safe to call multiple times — reconnects if needed.
 */
export function connectAudioElement(audioEl) {
  const ac = getCtx();
  if (!ac || !audioEl) return;

  // Already connected to this element?
  if (sourceNode && sourceNode.mediaElement === audioEl) return;

  try {
    // Disconnect old source
    if (sourceNode) { try { sourceNode.disconnect(); } catch {} }

    sourceNode = ac.createMediaElementSource(audioEl);

    // Build filter chain: [source] → [f0…f9] → [destination]
    filters = EQ_FREQUENCIES.map((freq, i) => {
      const f = ac.createBiquadFilter();
      f.type = i === 0 ? 'lowshelf' : i === EQ_FREQUENCIES.length - 1 ? 'highshelf' : 'peaking';
      f.frequency.value = freq;
      f.gain.value = 0;
      f.Q.value = 1.4;
      return f;
    });

    // Bass boost extra filter (sub-bass shelf below the main chain)
    bassBoostFilter = ac.createBiquadFilter();
    bassBoostFilter.type = 'lowshelf';
    bassBoostFilter.frequency.value = 80;
    bassBoostFilter.gain.value = 0;

    // Chain: source → bassBoost → f0 → f1 → … → f9 → output
    let prev = sourceNode;
    prev.connect(bassBoostFilter);
    prev = bassBoostFilter;
    for (const f of filters) { prev.connect(f); prev = f; }
    prev.connect(ac.destination);
  } catch (e) {
    console.warn('[EQ] connect failed:', e);
  }
}

/**
 * Apply EQ band gains (array of 10 dB values, -12 to +12).
 */
export function applyEQGains(vals) {
  if (!filters.length) return;
  const active = enabled && Array.isArray(vals) && vals.length === filters.length;
  for (let i = 0; i < filters.length; i++) {
    try {
      filters[i].gain.value = active ? (vals[i] || 0) : 0;
    } catch {}
  }
}

/**
 * Enable/disable EQ without losing the current band values.
 */
export function setEQEnabled(on) {
  enabled = !!on;
}

/**
 * Apply bass booster (+6 dB low-shelf at 80 Hz).
 */
export function setBassBoost(on) {
  if (!bassBoostFilter) return;
  try { bassBoostFilter.gain.value = on ? 6 : 0; } catch {}
}
