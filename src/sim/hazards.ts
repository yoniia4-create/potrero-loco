// Peligros de las cartas: bananas, Colectivo 60 y Perro Callejero.
import { F, HAZARD, W } from '../config';
import { sfx } from '../audio';
import { addShake, flashText, puff } from '../fx';
import { G, holding } from '../state';
import type { Banana, Bus, Dog } from '../types';
import { clamp, hyp, norm, R } from '../util';
import { releaseFromDog } from './ball';
import { hit } from './player';

/* ---------- bananas ---------- */

export function spawnBanana(): Banana {
  return { x: F.l + 90 + R() * (F.r - F.l - 180), y: F.t + 40 + R() * (F.b - F.t - 80), cd: 0, rot: R() * 6 };
}

export function updateBananas() {
  for (const bn of G.bananas) {
    if (bn.cd > 0) {
      if (--bn.cd === 0) Object.assign(bn, spawnBanana());
      continue;
    }
    for (const p of G.players) {
      if (p.stun > 0 || hyp(bn.x - p.x, bn.y - p.y) >= 16) continue;
      bn.cd = HAZARD.bananaRespawn;
      p.stun = 50;
      const s = Math.max(3.5, hyp(p.vx, p.vy) * 2.2);
      p.vx = p.fx * s; p.vy = p.fy * s;
      const b = holding(p);
      if (b) { b.owner = null; b.vz = 4; }
      sfx('slip');
      puff(p.x, p.y, 'rgba(242,210,59,.8)', 6);
      break;
    }
  }
}

/* ---------- Colectivo 60 ---------- */

export function createBus(): Bus {
  return { timer: 300, warn: 0, driving: false, x: -200, y: 0, dir: 1 };
}

export function resetBus(bus: Bus) {
  bus.driving = false;
  bus.warn = 0;
  bus.timer = 300;
}

export function updateBus(bus: Bus) {
  if (bus.driving) {
    bus.x += bus.dir * HAZARD.busSpeed;
    busCollisions(bus);
    if ((bus.dir === 1 && bus.x > W + 90) || (bus.dir === -1 && bus.x < -90)) {
      bus.driving = false;
      bus.timer = HAZARD.busInterval;
    }
  } else if (bus.warn > 0) {
    if (--bus.warn === 0) {
      bus.driving = true;
      bus.x = bus.dir === 1 ? -90 : W + 90;
    }
  } else if (--bus.timer <= 0) {
    bus.warn = HAZARD.busWarn;
    bus.dir = R() < 0.5 ? 1 : -1;
    bus.y = F.t + 60 + R() * (F.b - F.t - 120);
    sfx('horn');
  }
}

function inBus(bus: Bus, x: number, y: number, pad: number) {
  return Math.abs(x - bus.x) < HAZARD.busLength / 2 + pad && Math.abs(y - bus.y) < HAZARD.busHalfWidth + pad;
}

function busCollisions(bus: Bus) {
  for (const p of G.players) {
    if (p.stun > 0 || !inBus(bus, p.x, p.y, 6)) continue;
    const side = p.y >= bus.y ? 1 : -1;
    hit(p, bus.dir * 0.8, side * 0.7, 70);
    p.y = bus.y + side * (HAZARD.busHalfWidth + 10);
    addShake(7);
    sfx('punch');
  }
  for (const b of G.balls) {
    if (b.z > 40 || !inBus(bus, b.x, b.y, 4)) continue;
    releaseFromDog(b);
    b.owner = null;
    b.super = null;
    const side = b.y >= bus.y ? 1 : -1;
    b.y = bus.y + side * (HAZARD.busHalfWidth + 6);
    b.vx = bus.dir * 9; b.vy = side * 6; b.vz = 5;
  }
  const d = G.dog;
  if (d && d.yelp === 0 && inBus(bus, d.x, d.y, 4)) dogHit(d, bus.dir, d.y >= bus.y ? 0.6 : -0.6);
}

/* ---------- Perro Callejero ---------- */

export function createDog(): Dog {
  const left = R() < 0.5;
  const x = left ? F.l + 20 : F.r - 20;
  return { x, y: F.b - 20, vx: 0, vy: 0, tx: x, ty: F.b - 20, face: left ? 1 : -1, ball: null, carryT: 0, rest: 40, yelp: 0, anim: 0 };
}

function newTarget(d: Dog) {
  d.tx = F.l + 40 + R() * (F.r - F.l - 80);
  d.ty = F.t + 30 + R() * (F.b - F.t - 60);
}

/** El perro recibe un golpe: suelta la pelota y se aleja un rato. */
export function dogHit(d: Dog, dx: number, dy: number) {
  const b = d.ball;
  if (b) {
    releaseFromDog(b);
    b.vx = dx * 4 + (R() - 0.5) * 2; b.vy = dy * 4 + (R() - 0.5) * 2; b.vz = 3;
  }
  d.vx = dx * 6; d.vy = dy * 6;
  d.yelp = 40;
  d.rest = 200;
  newTarget(d);
  sfx('yelp');
  puff(d.x, d.y - 10, 'rgba(255,240,200,.8)', 6);
}

export function updateDog(d: Dog) {
  if (d.yelp > 0) d.yelp--;
  let speed = 1.4;
  if (d.yelp > 0) {
    d.vx *= 0.9; d.vy *= 0.9;
  } else {
    if (d.ball) {
      speed = HAZARD.dogCarrySpeed;
      if (G.tick % 50 === 0 || hyp(d.tx - d.x, d.ty - d.y) < 20) newTarget(d);
      if (--d.carryT <= 0) {
        const b = d.ball;
        releaseFromDog(b);
        const [nx, ny] = norm(d.vx || d.face, d.vy);
        b.vx = nx * 5; b.vy = ny * 5; b.vz = 3;
        d.rest = HAZARD.dogRestFrames;
      }
    } else if (d.rest > 0) {
      d.rest--;
      if (hyp(d.tx - d.x, d.ty - d.y) < 20) newTarget(d);
    } else {
      // Persigue la pelota libre más cercana (también se la roba a quien la tenga).
      let best = null, bd = 1e9;
      for (const b of G.balls) {
        if (b.super || b.z > 20) continue;
        const dd = hyp(b.x - d.x, b.y - d.y);
        if (dd < bd) { bd = dd; best = b; }
      }
      if (best) {
        speed = HAZARD.dogSpeed;
        d.tx = best.x; d.ty = best.y;
        if (bd < 15) {
          if (best.owner) { best.owner.noPick = 30; best.owner = null; }
          best.dogged = true;
          d.ball = best;
          d.carryT = HAZARD.dogCarryFrames;
          newTarget(d);
          sfx('bark');
          flashText('¡GUAU!', '#f6e7c8', 45);
          addShake(3);
        }
      }
    }
    const dx = d.tx - d.x, dy = d.ty - d.y, dist = hyp(dx, dy);
    const tx = dist > 4 ? (dx / dist) * speed : 0;
    const ty = dist > 4 ? (dy / dist) * speed : 0;
    d.vx += (tx - d.vx) * 0.2;
    d.vy += (ty - d.vy) * 0.2;
  }
  d.x = clamp(d.x + d.vx, F.l + 12, F.r - 12);
  d.y = clamp(d.y + d.vy, F.t + 10, F.b - 6);
  if (Math.abs(d.vx) > 0.2) d.face = d.vx > 0 ? 1 : -1;
  d.anim += hyp(d.vx, d.vy) * 0.45;
}
