// Sonidos sintetizados con Web Audio: sin archivos.

type Sfx = 'kick' | 'punch' | 'whoosh' | 'super' | 'boom' | 'goal' | 'card' | 'slip' | 'ghost' | 'horn' | 'bark' | 'yelp';

let ac: AudioContext | null = null;
let muted = false;

export function initAudio() {
  if (ac) return;
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ac = new Ctx();
  } catch {
    ac = null;
  }
}

export const isMuted = () => muted;
export function toggleMute() {
  muted = !muted;
  return muted;
}

function tone(type: OscillatorType, f0: number, f1: number, dur: number, vol: number, delay = 0) {
  if (!ac) return;
  const t = ac.currentTime + delay;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.connect(g);
  g.connect(ac.destination);
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export function sfx(k: Sfx) {
  if (!ac || muted) return;
  try {
    switch (k) {
      case 'kick': tone('square', 260, 120, 0.08, 0.06); break;
      case 'punch': tone('sawtooth', 180, 60, 0.12, 0.09); break;
      case 'whoosh': tone('triangle', 520, 200, 0.1, 0.04); break;
      case 'super': tone('sawtooth', 200, 1200, 0.45, 0.08); break;
      case 'boom': tone('sawtooth', 90, 25, 0.6, 0.16); break;
      case 'goal': tone('square', 440, 660, 0.15, 0.07); tone('square', 660, 990, 0.3, 0.07, 0.15); break;
      case 'card': tone('triangle', 600, 1200, 0.18, 0.06); break;
      case 'slip': tone('sine', 700, 150, 0.3, 0.07); break;
      case 'ghost': tone('sine', 300, 520, 0.25, 0.06); break;
      case 'horn': tone('square', 330, 320, 0.28, 0.06); tone('square', 330, 320, 0.4, 0.06, 0.35); break;
      case 'bark': tone('square', 520, 280, 0.09, 0.06); tone('square', 520, 280, 0.09, 0.06, 0.14); break;
      case 'yelp': tone('triangle', 900, 1500, 0.16, 0.06); break;
    }
  } catch {
    /* sin sonido, no pasa nada */
  }
}
