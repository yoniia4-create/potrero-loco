import './style.css';
import { H, STEP_MS } from './config';
import { initAudio, toggleMute } from './audio';
import { recompute } from './cards';
import { choose, kickoff, newMatch, step, togglePause } from './flow';
import { setupInput } from './input';
import { draw, getViewWidth, initRenderer, setViewWidth } from './render/draw';
import { G } from './state';
import { newBall } from './sim/ball';
import { renderChips, setMuteLabel, updateHud } from './ui/hud';
import { hideEnd, hideTitle, showPause } from './ui/overlays';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const stage = document.getElementById('stage')!;
initRenderer(canvas);

// Ajustar el ancho visible al formato de la pantalla y escalar sin deformar.
// En pantallas angostas se muestra una porción de la cancha y la cámara sigue la jugada.
function fit() {
  const r = stage.getBoundingClientRect();
  if (!r.width || !r.height) return;
  setViewWidth((H * r.width) / r.height);
  const vw = getViewWidth();
  const s = Math.min(r.width / vw, r.height / H);
  canvas.style.width = `${Math.floor(vw * s)}px`;
  canvas.style.height = `${Math.floor(H * s)}px`;
  // Ancho libre a cada lado de la cancha (lo usa el diseño horizontal para las cartas).
  const side = Math.max(90, Math.floor((r.width - vw * s) / 2) - 16);
  document.documentElement.style.setProperty('--side', `${side}px`);
}
addEventListener('resize', fit);
new ResizeObserver(fit).observe(stage);
fit();

const mute = () => setMuteLabel(toggleMute());

setupInput({
  onPause: togglePause,
  onMute: mute,
  onNumber: (n) => {
    if (G.phase === 'pick' && G.pickTeam === 0 && G.pickChoices[n - 1]) choose(G.pickChoices[n - 1]);
  },
  onEnter: () => { if (G.phase === 'title') start(); },
});

function start() {
  initAudio();
  hideTitle();
  newMatch();
}

document.getElementById('startBtn')!.addEventListener('click', start);
document.getElementById('againBtn')!.addEventListener('click', () => { hideEnd(); newMatch(); });
document.getElementById('pauseBtn')!.addEventListener('click', togglePause);
document.getElementById('resumeBtn')!.addEventListener('click', () => { if (G.paused) togglePause(); });
document.getElementById('quitBtn')!.addEventListener('click', () => { G.paused = false; showPause(false); newMatch(); });
document.getElementById('muteBtn')!.addEventListener('click', mute);

// Pantalla completa (Android y navegadores de escritorio; iOS Safari no lo permite).
const fsBtn = document.getElementById('fsBtn')!;
if (document.fullscreenEnabled) {
  fsBtn.hidden = false;
  fsBtn.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else {
        await document.documentElement.requestFullscreen();
        // Intentar fijar horizontal en celulares (si el navegador lo permite).
        const o = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
        await o.lock?.('landscape').catch(() => {});
      }
    } catch { /* el navegador no lo permitió */ }
  });
  document.addEventListener('fullscreenchange', () => {
    fsBtn.textContent = document.fullscreenElement ? 'Salir de pantalla completa' : 'Pantalla completa';
    setTimeout(fit, 100);
  });
}
// Pausa automática si el jugador cambia de pestaña.
document.addEventListener('visibilitychange', () => { if (document.hidden && !G.paused) togglePause(); });

// En desarrollo, exponer el estado para probar desde la consola: __potrero.G, __potrero.choose(...)
if (import.meta.env.DEV) {
  void import('./cards').then(({ CARDS, addCard }) => {
    (window as unknown as Record<string, unknown>).__potrero = { G, CARDS, addCard, choose };
  });
}

// Estado inicial: cancha armada detrás de la pantalla de título.
G.balls = [newBall(0, 0)];
recompute();
kickoff();
renderChips();

let acc = 0;
let last = performance.now();
function frame(t: number) {
  acc += Math.min(100, t - last);
  last = t;
  while (acc >= STEP_MS) {
    step();
    acc -= STEP_MS;
  }
  draw();
  updateHud();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
