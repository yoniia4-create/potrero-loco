import type { Vec } from './types';

export const R = Math.random;
export const hyp = Math.hypot;
export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

export function norm(x: number, y: number): Vec {
  const m = hyp(x, y) || 1;
  return [x / m, y / m];
}

export function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(R() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const pick = <T>(a: readonly T[]): T => a[Math.floor(R() * a.length)];

/** PRNG con semilla, para que el fondo salga siempre igual. */
export function mulberry(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
