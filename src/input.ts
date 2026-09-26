// Teclado y controles táctiles. La simulación solo lee humanInput().
import { initAudio } from './audio';
import type { Input } from './types';
import { hyp } from './util';

type Action = 'kick' | 'punch' | 'sup';

const keys = new Set<string>();
const pressed = new Set<Action>();
let touchVec = { x: 0, y: 0 };

export function humanInput(): Input {
  const k = (a: string, b: string) => (keys.has(a) || keys.has(b) ? 1 : 0);
  return {
    x: k('arrowright', 'd') - k('arrowleft', 'a') + touchVec.x,
    y: k('arrowdown', 's') - k('arrowup', 'w') + touchVec.y,
    kick: pressed.has('kick'),
    punch: pressed.has('punch'),
    sup: pressed.has('sup'),
    aim: null,
  };
}

export const clearPressed = () => pressed.clear();

interface Handlers {
  onPause: () => void;
  onMute: () => void;
  onNumber: (n: number) => void;
  onEnter: () => void;
}

export function setupInput(h: Handlers) {
  addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    keys.add(k);
    if (e.repeat) return;
    if (k === 'j' || k === ' ') pressed.add('kick');
    if (k === 'k') pressed.add('punch');
    if (k === 'l') pressed.add('sup');
    if (k === 'p' || k === 'escape') h.onPause();
    if (k === 'm') h.onMute();
    if (k === '1' || k === '2' || k === '3') h.onNumber(+k);
    if (k === 'enter') h.onEnter();
  });
  addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
  addEventListener('blur', () => keys.clear());

  // Joystick virtual
  const joy = document.getElementById('joy')!;
  const knob = document.getElementById('knob')!;
  let joyId: number | null = null;
  const move = (e: PointerEvent) => {
    const r = joy.getBoundingClientRect();
    let x = e.clientX - (r.left + r.width / 2);
    let y = e.clientY - (r.top + r.height / 2);
    const m = hyp(x, y), max = r.width / 2 - 12;
    if (m > max) { x *= max / m; y *= max / m; }
    knob.style.transform = `translate(${x}px,${y}px)`;
    touchVec = { x: x / max, y: y / max };
  };
  joy.addEventListener('pointerdown', (e) => {
    joyId = e.pointerId;
    try { joy.setPointerCapture(e.pointerId); } catch { /* ignorar */ }
    move(e);
  });
  joy.addEventListener('pointermove', (e) => { if (e.pointerId === joyId) move(e); });
  const end = (e: PointerEvent) => {
    if (e.pointerId !== joyId) return;
    joyId = null;
    touchVec = { x: 0, y: 0 };
    knob.style.transform = '';
  };
  joy.addEventListener('pointerup', end);
  joy.addEventListener('pointercancel', end);

  document.querySelectorAll<HTMLElement>('[data-act]').forEach((b) =>
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      initAudio();
      pressed.add(b.dataset.act as Action);
    }),
  );

  if (matchMedia('(pointer: coarse)').matches) document.body.classList.add('is-touch');
  addEventListener('touchstart', () => document.body.classList.add('is-touch'), { once: true, passive: true });
}
