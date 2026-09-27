// Movimiento y acciones de los jugadores: patear, pasar, piña y súper tiro.
import { CY, F, PHYS, PLAY } from '../config';
import { sfx } from '../audio';
import { addShake, flashText, puff } from '../fx';
import { G, headOf, holding, mateOf } from '../state';
import type { Input, Player, SuperType } from '../types';
import { clamp, hyp, norm, pick, R } from '../util';
import { dogHit } from './hazards';

export const SUPERS: Record<SuperType, { name: string; color: string }> = {
  cannon: { name: '¡CAÑONAZO!', color: '#ff8a3d' },
  zigzag: { name: '¡TIRO SERPIENTE!', color: '#5ef2b0' },
  meteor: { name: '¡METEORITO!', color: '#c77dff' },
};

const addMeter = (p: Player, n: number) => {
  p.meter = Math.min(100, p.meter + n * G.teamM[p.team].meter);
};

/** Voltea a un jugador: lo empuja en (dx,dy) y le hace soltar la pelota. */
export function hit(o: Player, dx: number, dy: number, frames: number) {
  o.stun = frames;
  o.punchT = 0;
  o.vx = dx * 6;
  o.vy = dy * 6;
  const b = holding(o);
  if (b) {
    b.owner = null;
    b.vx = dx * 3 + (R() - 0.5) * 3;
    b.vy = dy * 3 + (R() - 0.5) * 3;
    b.vz = 4.5;
  }
  puff(o.x, o.y - 14, 'rgba(255,240,200,.8)', 7);
}

function looseBallNear(p: Player, reach: number) {
  return G.balls.find((q) => !q.owner && !q.super && !q.dogged && q.z < 34 && hyp(q.x - p.x, q.y - p.y) < reach);
}

export function doKick(p: Player) {
  if (p.kickCd > 0) return;
  p.kickCd = 16;
  p.kickAnim = 10;
  const b = holding(p) ?? looseBallNear(p, 24 + 8 * headOf(p));
  if (!b) return;
  b.owner = null;
  b.vx = p.fx * PHYS.kickSpeed;
  b.vy = p.fy * PHYS.kickSpeed;
  b.vz = 2.4 * G.mods.lift;
  b.last = p;
  b.rolled = false;
  p.noPick = 16;
  addMeter(p, PHYS.meterKick);
  sfx('kick');
  puff(b.x, b.y, 'rgba(150,100,55,.6)', 5);
}

/** Pase a un compañero (por defecto, el compañero de campo). */
export function doPass(p: Player, target: Player = mateOf(p)) {
  const b = holding(p);
  if (!b) return;
  const m = target;
  const tx = m.x + m.vx * 12;
  const ty = m.y + m.vy * 12;
  const [nx, ny] = norm(tx - p.x, ty - p.y);
  const s = clamp(hyp(tx - p.x, ty - p.y) * 0.045 + 4, 6, 11);
  p.fx = nx; p.fy = ny;
  b.owner = null;
  b.vx = nx * s; b.vy = ny * s; b.vz = 1.6 * G.mods.lift;
  b.last = p;
  b.rolled = false;
  p.noPick = 18;
  p.kickAnim = 8;
  sfx('kick');
}

export function doPunch(p: Player) {
  if (p.punchCd > 0) return;
  if (holding(p)) {
    doPass(p);
    p.punchCd = 12;
    return;
  }
  p.punchT = 14;
  p.punchCd = p.human ? 42 : PLAY.aiPunchCooldown;
  p.vx = p.fx * 7;
  p.vy = p.fy * 7;
  sfx('whoosh');
}

function checkPunch(p: Player) {
  const reach = 24 + 12 * headOf(p);
  const inFront = (x: number, y: number) => {
    const dx = x - p.x, dy = y - p.y;
    return hyp(dx, dy) < reach && dx * p.fx + dy * p.fy > 0;
  };
  for (const o of G.players) {
    if (o.team === p.team || o.stun > 0 || !inFront(o.x, o.y)) continue;
    if (o.role === 'gk' && holding(o)) continue; // al arquero con la pelota en la mano no se le pega
    if (o.shield > 0) {
      // Recién recibió: la piña no le saca la pelota, solo lo empuja un poco.
      o.vx += p.fx * 2; o.vy += p.fy * 2;
      p.punchT = 0;
      puff(o.x, o.y - 14, 'rgba(255,255,255,.6)', 3);
      return;
    }
    hit(o, p.fx, p.fy, PHYS.punchStun);
    addMeter(p, PHYS.meterPunch);
    p.punchT = 0;
    addShake(5);
    sfx('punch');
    return;
  }
  const d = G.dog;
  if (d && d.yelp === 0 && inFront(d.x, d.y)) {
    dogHit(d, p.fx, p.fy);
    addMeter(p, 8);
    p.punchT = 0;
  }
}

export function doSuper(p: Player) {
  if (p.meter < 100) return;
  const b = holding(p) ?? looseBallNear(p, 30);
  if (!b) return;
  const t = pick(['cannon', 'zigzag', 'meteor'] as const);
  p.meter = 0;
  b.owner = null;
  b.super = t;
  b.last = p;
  b.dx = p.fx; b.dy = p.fy;
  b.rolled = false;
  p.noPick = 25;
  p.kickAnim = 12;
  if (t === 'meteor') {
    b.superT = 90;
    b.vx = p.fx * 10; b.vy = p.fy * 10; b.vz = 10;
  } else {
    b.superT = t === 'cannon' ? 55 : 60;
    b.z = 9;
  }
  flashText(SUPERS[t].name, SUPERS[t].color, 70);
  addShake(8);
  sfx('super');
}

export function updatePlayer(p: Player, inp: Input) {
  const tm = G.teamM[p.team];
  if (p.stun > 0) {
    if (--p.stun === 0) p.shield = Math.max(p.shield, PLAY.getUpShield);
    p.vx *= 0.9; p.vy *= 0.9;
  } else if (p.punchT > 0) {
    p.punchT--;
    p.vx *= 0.9; p.vy *= 0.9;
    checkPunch(p);
  } else {
    const base = p.role === 'gk' ? PLAY.gkSpeed : PHYS.playerSpeed * (p.human ? 1 : PHYS.aiSpeedFactor);
    const sp = base * tm.speed * (holding(p) && !p.human ? PHYS.carrySpeedFactor : 1);
    const m = hyp(inp.x, inp.y);
    let tx = 0, ty = 0;
    if (m > 0.15) {
      const k = Math.min(p.role === 'gk' ? 1.5 : 1, m) / m; // el arquero puede estirarse más rápido
      tx = inp.x * k * sp; ty = inp.y * k * sp;
      p.fx = inp.x / m; p.fy = inp.y / m;
    }
    p.vx += (tx - p.vx) * 0.28;
    p.vy += (ty - p.vy) * 0.28;
    if (inp.aim) { p.fx = inp.aim[0]; p.fy = inp.aim[1]; }
    if (inp.sup) doSuper(p);
    if (inp.kick) doKick(p);
    if (inp.punch) doPunch(p);
  }
  p.x = clamp(p.x + p.vx, F.l + 10, F.r - 10);
  p.y = clamp(p.y + p.vy, F.t + 8, F.b - 6);
  if (p.role === 'gk') {
    // El arquero no sale de su área.
    p.x = p.team === 0 ? clamp(p.x, F.l + 10, F.l + 110) : clamp(p.x, F.r - 110, F.r - 10);
    p.y = clamp(p.y, CY - 158, CY + 158);
  }
  if (p.shield > 0) p.shield--;
  if (p.kickCd > 0) p.kickCd--;
  if (p.punchCd > 0) p.punchCd--;
  if (p.noPick > 0) p.noPick--;
  if (p.kickAnim > 0) p.kickAnim--;
  if (G.phase === 'play') p.meter = Math.min(100, p.meter + PHYS.meterPassive * tm.meter);
  p.anim += hyp(p.vx, p.vy) * 0.35;
}

/** Empuja a los jugadores que se superponen. */
export function separatePlayers() {
  const ps = G.players;
  for (let i = 0; i < ps.length; i++) {
    for (let j = i + 1; j < ps.length; j++) {
      const a = ps[i], c = ps[j];
      const dx = c.x - a.x, dy = c.y - a.y, d = hyp(dx, dy);
      if (d < 22 && d > 0) {
        const o = (22 - d) / 2, nx = dx / d, ny = dy / d;
        a.x -= nx * o; a.y -= ny * o;
        c.x += nx * o; c.y += ny * o;
      }
    }
  }
}
