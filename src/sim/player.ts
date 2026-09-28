// Movimiento y acciones de los jugadores: patear, pasar, barrida y correr.
import { CY, F, PHYS, PLAY } from '../config';
import { sfx } from '../audio';
import { addShake, puff } from '../fx';
import { G, headOf, holding, mateOf } from '../state';
import type { Input, Player } from '../types';
import { clamp, hyp, norm, R } from '../util';
import { dogHit } from './hazards';

/** Voltea a un jugador: lo empuja en (dx,dy) y le hace soltar la pelota. */
export function hit(o: Player, dx: number, dy: number, frames: number) {
  o.stun = frames;
  o.slideT = 0;
  o.vx = dx * PHYS.knockback;
  o.vy = dy * PHYS.knockback;
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
  return G.balls.find((q) => !q.owner && !q.dogged && q.z < 34 && hyp(q.x - p.x, q.y - p.y) < reach);
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
  sfx('kick');
  puff(b.x, b.y, 'rgba(150,100,55,.6)', 5);
}

/** Pase a un compañero (por defecto, el compañero de campo más cercano). */
export function doPass(p: Player, target: Player = mateOf(p)) {
  const b = holding(p);
  if (!b || !target) return;
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

/**
 * Barrida: si tenés la pelota, en realidad es un pase (no te podés barrer a vos mismo).
 * Si no la tenés, te tirás al piso buscando sacársela solo a quien la tiene. Si no conecta
 * con nadie, quedás un toque tirado: no es gratis, así que no conviene spamearla.
 */
export function doSlide(p: Player) {
  if (p.slideCd > 0) return;
  if (holding(p)) {
    doPass(p);
    p.slideCd = 12;
    return;
  }
  p.slideT = PLAY.slideDuration;
  p.slideCd = p.human ? PLAY.slideCooldownHuman : PLAY.aiSlideCooldown;
  p.vx = p.fx * PLAY.slideLunge;
  p.vy = p.fy * PLAY.slideLunge;
  puff(p.x - p.fx * 8, p.y, 'rgba(180,140,90,.5)', 5);
  sfx('whoosh');
}

/** Devuelve true si la barrida conectó con algo (para no aplicar la penalidad por errar). */
function checkSlide(p: Player): boolean {
  const reach = PLAY.slideRange + 10 * headOf(p);
  const inFront = (x: number, y: number) => {
    const dx = x - p.x, dy = y - p.y;
    return hyp(dx, dy) < reach && dx * p.fx + dy * p.fy > 0;
  };
  for (const o of G.players) {
    if (o.team === p.team || o.stun > 0 || !inFront(o.x, o.y)) continue;
    // La barrida solo tiene sentido contra quien tiene la pelota (y no se puede barrer al arquero con ella).
    if (!holding(o) || o.role === 'gk') continue;
    if (o.shield > 0) {
      // Recién la recibió: la barrida no se la saca, solo lo empuja un poco.
      o.vx += p.fx * 2; o.vy += p.fy * 2;
      puff(o.x, o.y - 14, 'rgba(255,255,255,.6)', 3);
      return true;
    }
    hit(o, p.fx, p.fy, PHYS.slideStun);
    addShake(5);
    sfx('punch');
    return true;
  }
  const d = G.dog;
  if (d && d.yelp === 0 && inFront(d.x, d.y)) {
    dogHit(d, p.fx, p.fy);
    return true;
  }
  return false;
}

export function updatePlayer(p: Player, inp: Input) {
  const tm = G.teamM[p.team];
  const m = hyp(inp.x, inp.y);
  if (p.stun > 0) {
    if (--p.stun === 0) p.shield = Math.max(p.shield, PLAY.getUpShield);
    p.vx *= 0.9; p.vy *= 0.9;
  } else if (p.slideT > 0) {
    p.slideT--;
    p.vx *= 0.94; p.vy *= 0.94;
    const connected = checkSlide(p);
    if (connected) p.slideT = 0;
    else if (p.slideT === 0) p.stun = PLAY.slideMissStun; // erró: queda un toque en el piso
  } else {
    const sprinting = inp.sprint && !p.staminaLocked && p.stamina > 0;
    const base = p.role === 'gk' ? PLAY.gkSpeed : PHYS.playerSpeed * (p.human ? 1 : PHYS.aiSpeedFactor);
    const sp = base * tm.speed * (holding(p) && !p.human ? PHYS.carrySpeedFactor : 1) * (sprinting ? PLAY.sprintMult : 1);
    let tx = 0, ty = 0;
    if (m > 0.15) {
      const k = Math.min(p.role === 'gk' ? 1.5 : 1, m) / m; // el arquero puede estirarse más rápido
      tx = inp.x * k * sp; ty = inp.y * k * sp;
      p.fx = inp.x / m; p.fy = inp.y / m;
    }
    p.vx += (tx - p.vx) * 0.28;
    p.vy += (ty - p.vy) * 0.28;
    if (inp.aim) { p.fx = inp.aim[0]; p.fy = inp.aim[1]; }
    if (inp.kick) doKick(p);
    if (inp.slide) doSlide(p);
    if (G.phase === 'play') {
      if (sprinting && m > 0.15) {
        p.stamina = Math.max(0, p.stamina - PLAY.staminaDrain);
        if (p.stamina <= 0) p.staminaLocked = true;
      } else {
        p.stamina = Math.min(100, p.stamina + PLAY.staminaRegen * tm.staminaRegen);
        if (p.staminaLocked && p.stamina >= PLAY.staminaRecoverThreshold) p.staminaLocked = false;
      }
    }
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
  if (p.slideCd > 0) p.slideCd--;
  if (p.noPick > 0) p.noPick--;
  if (p.kickAnim > 0) p.kickAnim--;
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
