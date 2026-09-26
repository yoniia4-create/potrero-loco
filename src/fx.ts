// Efectos visuales que dispara la simulación (partículas, carteles, sacudida).
import { G } from './state';
import { R } from './util';

export const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function flashText(text: string, color: string, t = 90) {
  G.flash = { text, color, t, max: t };
}

export function addShake(n: number) {
  if (!reduceMotion) G.shake = Math.max(G.shake, n);
}

export function puff(x: number, y: number, c: string, n: number) {
  for (let i = 0; i < n; i++) {
    G.parts.push({ x, y, vx: (R() - 0.5) * 3, vy: (R() - 0.5) * 2 - 0.5, life: 20 + R() * 20, max: 40, c, s: 2 + R() * 3 });
  }
}

export function burst(x: number, y: number, colors: string[], n: number, speed = 8) {
  for (let i = 0; i < n; i++) {
    G.parts.push({
      x, y, vx: (R() - 0.5) * speed, vy: (R() - 0.5) * speed,
      life: 40 + R() * 30, max: 70, c: colors[i % colors.length], s: 3 + R() * 3,
    });
  }
}

export function ring(x: number, y: number, color: string, n = 30) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    G.parts.push({ x, y, vx: Math.cos(a) * 4, vy: Math.sin(a) * 2, life: 30, max: 30, c: color, s: 4 });
  }
}

export function updateFx() {
  for (const q of G.parts) {
    q.x += q.vx; q.y += q.vy;
    q.vx *= 0.95; q.vy *= 0.95;
    q.life--;
  }
  G.parts = G.parts.filter((q) => q.life > 0);
  if (G.flash && --G.flash.t <= 0) G.flash = null;
  G.shake = reduceMotion ? 0 : G.shake * 0.86;
  if (G.shake < 0.3) G.shake = 0;
}
