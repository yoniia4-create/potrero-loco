// Física de la pelota, súper tiros, goles y posesión.
import { CY, F, PHYS } from '../config';
import { sfx } from '../audio';
import { addShake, burst, flashText, puff, ring } from '../fx';
import { G, headOf, holding } from '../state';
import type { Ball, Team } from '../types';
import { hyp, norm, R } from '../util';
import { hit } from './player';

export function newBall(x: number, y: number): Ball {
  return {
    x, y, z: 0, vx: 0, vy: 0, vz: 0, owner: null, super: null, superT: 0,
    dx: 1, dy: 0, last: null, fuse: PHYS.bombFuse, trail: [], spin: 0, dogged: false,
  };
}

export const ghostY = (side: Team) => CY + Math.sin(G.tick * 0.035 + side * 2) * G.teamM[side].goalHalf * 0.75;

function shock(b: Ball) {
  for (const o of G.players) {
    if (b.last && o.team === b.last.team) continue;
    if (hyp(o.x - b.x, o.y - b.y) < 95) {
      const [nx, ny] = norm(o.x - b.x, o.y - b.y);
      hit(o, nx, ny, 60);
    }
  }
  ring(b.x, b.y, '#c77dff');
  addShake(11);
  sfx('boom');
}

function explode(b: Ball) {
  for (const o of G.players) {
    if (hyp(o.x - b.x, o.y - b.y) < 115) {
      const [nx, ny] = norm(o.x - b.x, o.y - b.y);
      hit(o, nx, ny, 65);
    }
  }
  releaseFromDog(b);
  b.owner = null;
  b.super = null;
  b.vz = 8;
  const a = R() * Math.PI * 2;
  b.vx = Math.cos(a) * 5;
  b.vy = Math.sin(a) * 5;
  burst(b.x, b.y - 6, ['#ff8a3d', '#ffd23f'], 44, 10);
  addShake(14);
  flashText('¡BOOM!', '#ff8a3d', 50);
  sfx('boom');
}

export function releaseFromDog(b: Ball) {
  if (!b.dogged) return;
  b.dogged = false;
  if (G.dog && G.dog.ball === b) G.dog.ball = null;
}

function goal(team: Team, b: Ball) {
  G.score[team]++;
  G.lastScorer = team;
  G.phase = 'goal';
  G.goalT = 110;
  releaseFromDog(b);
  b.owner = null; b.super = null;
  b.vx = b.vy = b.vz = 0;
  flashText('¡GOL!', team ? '#e8433f' : '#6ec6ff', 110);
  addShake(10);
  sfx('goal');
  burst(b.x, b.y, ['#ffd23f', '#6ec6ff', '#e8433f', '#f3ebdd'], 50);
}

function endSuperOnWall(b: Ball) {
  if (b.super === 'cannon' || b.super === 'zigzag') {
    b.super = null;
    b.vx *= 0.5; b.vy *= 0.5;
  }
}

function walls(b: Ball) {
  if (b.y < F.t + 4) { b.y = F.t + 4; b.vy = Math.abs(b.vy) * 0.75; endSuperOnWall(b); }
  if (b.y > F.b - 2) { b.y = F.b - 2; b.vy = -Math.abs(b.vy) * 0.75; endSuperOnWall(b); }
  for (const side of [0, 1] as const) {
    const tm = G.teamM[side];
    const gx = side === 0 ? F.l : F.r;
    if (tm.ghost && !b.owner && !b.dogged) {
      const movingIn = side === 0 ? b.vx < 0 : b.vx > 0;
      if (Math.abs(b.x - gx) < 12 && Math.abs(b.y - ghostY(side)) < 26 && b.z < 50 && movingIn) {
        b.vx = -b.vx * 0.8;
        b.x = gx + (side === 0 ? 13 : -13);
        b.super = null;
        puff(b.x, b.y, 'rgba(255,255,255,.7)', 8);
        sfx('ghost');
        continue;
      }
    }
    const past = side === 0 ? b.x < F.l : b.x > F.r;
    if (!past) continue;
    if (Math.abs(b.y - CY) < tm.goalHalf && b.z < PHYS.goalHeight && G.phase === 'play') {
      goal((1 - side) as Team, b);
      return;
    }
    b.x = gx;
    b.vx = -b.vx * 0.7;
    endSuperOnWall(b);
  }
}

function superFlight(b: Ball) {
  b.superT--;
  if (b.super === 'cannon') {
    b.vx = b.dx * 16; b.vy = b.dy * 16;
  } else {
    const w = Math.cos(b.superT * 0.42) * 10;
    b.vx = b.dx * 12 - b.dy * w;
    b.vy = b.dy * 12 + b.dx * w;
  }
  b.z = 9; b.vz = 0;
  b.x += b.vx; b.y += b.vy;
  for (const o of G.players) {
    if (o.team !== b.last!.team && o.stun === 0 && hyp(o.x - b.x, o.y - b.y) < 22 * headOf(o)) {
      hit(o, b.dx, b.dy, 70);
      b.superT -= 10;
      addShake(5);
      sfx('punch');
    }
  }
  if (b.superT <= 0) {
    b.super = null;
    b.vx *= 0.6; b.vy *= 0.6;
  }
}

export function updateBall(b: Ball) {
  const dog = G.dog;
  if (b.dogged && dog) {
    const [nx, ny] = norm(dog.vx || dog.face, dog.vy);
    b.x = dog.x + nx * 14; b.y = dog.y + ny * 5; b.z = 5;
    b.vx = dog.vx; b.vy = dog.vy; b.vz = 0;
  } else if (b.owner) {
    const p = b.owner;
    if (p.stun > 0) b.owner = null;
    else {
      const h = headOf(p);
      b.x = p.x + p.fx * (14 + 2 * h);
      b.y = p.y + p.fy * (10 + 2 * h) + 2;
      b.z = 0; b.vx = p.vx; b.vy = p.vy; b.vz = 0;
    }
  }
  if (!b.owner && !b.dogged) {
    if (b.super === 'cannon' || b.super === 'zigzag') superFlight(b);
    else {
      const g = b.super === 'meteor' ? 0.32 : G.mods.grav;
      if (!b.super) { b.vx += G.mods.wind[0]; b.vy += G.mods.wind[1]; }
      b.x += b.vx; b.y += b.vy; b.z += b.vz; b.vz -= g;
      if (b.z <= 0) {
        b.z = 0;
        if (b.super === 'meteor') {
          b.super = null;
          shock(b);
          b.vz = 4; b.vx *= 0.5; b.vy *= 0.5;
        } else if (b.vz < -1.4) b.vz = -b.vz * 0.55;
        else b.vz = 0;
      }
      const fr = b.z > 0 ? PHYS.airFriction : G.mods.fric;
      b.vx *= fr; b.vy *= fr;
    }
  }
  b.spin += hyp(b.vx, b.vy) * 0.08;
  if (b.super) {
    b.trail.push([b.x, b.y - b.z]);
    if (b.trail.length > 14) b.trail.shift();
  } else if (b.trail.length) b.trail.shift();
  if (G.mods.bomba && G.phase === 'play' && --b.fuse <= 0) {
    explode(b);
    b.fuse = PHYS.bombFuse;
  }
  walls(b);
}

/** Asigna pelotas sueltas al jugador más cercano que pueda agarrarlas. */
export function pickups() {
  for (const b of G.balls) {
    if (b.owner || b.super || b.dogged || b.z > 14) continue;
    let best = null, bd = 1e9;
    for (const p of G.players) {
      if (p.stun || p.noPick || p.punchT || holding(p)) continue;
      const d = hyp(b.x - p.x, b.y - p.y);
      if (d < 12 + 8 * headOf(p) && d < bd) { bd = d; best = p; }
    }
    if (best) {
      b.owner = best;
      if (!best.human) best.aimOff = (R() * 2 - 1) * G.teamM[1 - best.team].goalHalf * 0.7;
    }
  }
}
