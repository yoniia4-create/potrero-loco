// IA simple por roles: el más cercano persigue, el otro se posiciona.
import { CX, CY, F, PLAY } from '../config';
import { G, headOf, holding, mateOf } from '../state';
import type { Ball, Input, Player } from '../types';
import { clamp, hyp, norm, pick, R } from '../util';
import { doPass } from './player';

const noInput = (): Input => ({ x: 0, y: 0, kick: false, punch: false, sup: false, aim: null });

/** Arquero: se para entre la pelota y el arco, sale a buscar pelotas cercanas y la saca rápido. */
function keeperInput(p: Player): Input {
  const inp = noInput();
  const own = p.team === 0 ? F.l : F.r;
  const dir = p.team === 0 ? 1 : -1;
  const half = G.teamM[p.team].goalHalf;

  if (holding(p)) {
    p.holdT++;
    if (p.holdT >= PLAY.gkHoldFrames) {
      // Saque: a un compañero de campo libre, preferentemente al humano.
      const mates = G.players.filter((q) => q.team === p.team && q.role !== 'gk' && q.stun === 0);
      const target = mates.find((q) => q.human && R() < 0.6) ?? (mates.length ? pick(mates) : null);
      if (target) doPass(p, target);
      else { inp.kick = true; inp.aim = [dir, (R() - 0.5) * 0.6]; }
    }
    return inp;
  }

  // Pelota más peligrosa: la más cercana al arco propio.
  let b = G.balls[0];
  for (const q of G.balls) if (Math.abs(q.x - own) < Math.abs(b.x - own)) b = q;
  const distToGoal = hyp(b.x - own, b.y - CY);
  const loose = !b.owner && !b.super && !b.dogged;

  if (loose && distToGoal < 150 && b.z < 30) {
    // Salir a buscarla.
    const d = hyp(b.x - p.x, b.y - p.y);
    if (d > 4) { inp.x = (b.x - p.x) / d; inp.y = (b.y - p.y) / d; }
  } else {
    // Cubrir el arco. Si viene un tiro, ir al punto donde la pelota cruza su línea.
    const tx = own + dir * (distToGoal < 260 ? 34 : 22);
    const incoming = !b.owner && (p.team === 0 ? b.vx < -2 : b.vx > 2);
    let ty: number;
    if (incoming) {
      const t = (p.x - b.x) / b.vx;
      ty = b.y + b.vy * Math.max(0, t);
    } else {
      // Sin tiro: pararse en la bisectriz entre la pelota y el centro del arco.
      ty = CY + (b.y - CY) * 0.6;
    }
    ty = clamp(ty, CY - half - 6, CY + half + 6);
    const dx = tx - p.x, dy = ty - p.y, d = hyp(dx, dy);
    const boost = incoming ? PLAY.gkDiveSpeed / PLAY.gkSpeed : 1;
    if (d > 2) { const k = (Math.min(1, d / 20) / d) * boost; inp.x = dx * k; inp.y = dy * k; }
  }
  p.fx = dir; p.fy = 0;
  return inp;
}

export function aiInput(p: Player): Input {
  if (p.role === 'gk') return keeperInput(p);
  const inp = noInput();
  const dirX = p.team === 0 ? 1 : -1;
  const oppGoal = p.team === 0 ? F.r : F.l;
  const ownGoal = p.team === 0 ? F.l : F.r;
  const mate = mateOf(p);
  const opps = G.players.filter((q) => q.team !== p.team);
  const go = (tx: number, ty: number) => {
    const dx = tx - p.x, dy = ty - p.y, d = hyp(dx, dy);
    if (d > 6) {
      const k = Math.min(1, d / 40) / d;
      inp.x = dx * k; inp.y = dy * k;
    }
  };

  // Con pelota: ir al arco, esquivar, patear, pasar o tirar el súper.
  if (holding(p)) {
    const gy = CY + p.aimOff;
    const dx = oppGoal - p.x, dy = gy - p.y, dG = hyp(dx, dy);
    const aim: [number, number] = [dx / dG, dy / dG];
    inp.x = aim[0]; inp.y = aim[1];
    for (const o of opps) {
      if (o.stun) continue;
      const ox = o.x - p.x, oy = o.y - p.y;
      if (hyp(ox, oy) < 75 && ox * dirX > 0) inp.y += (oy > 0 ? -1 : 1) * 0.9;
    }
    if (p.meter >= 100 && dG < 440 && R() < 0.05) { inp.sup = true; inp.aim = aim; }
    else if (dG < PLAY.aiSureShot || (dG < PLAY.aiShootRange && R() < PLAY.aiShootChance)) {
      // Apunta con algo de error: no todos los tiros van al ángulo.
      inp.kick = true;
      inp.aim = norm(aim[0], aim[1] + (R() - 0.5) * 0.25);
    }
    else if (mate.stun === 0) {
      const ahead = (mate.x - p.x) * dirX;
      if ((mate.human && ahead > -30 && R() < 0.025) || (!mate.human && ahead > 60 && R() < 0.008)) inp.punch = true;
    }
    return inp;
  }

  // Sin pelota: elegir la pelota más cercana que no tenga el propio equipo.
  let b: Ball | null = null, bd = 1e9;
  for (const q of G.balls) {
    // No perseguir pelotas del propio equipo ni la que tiene el arquero rival en la mano.
    if (q.owner && (q.owner.team === p.team || q.owner.role === 'gk')) continue;
    const d = hyp(q.x - p.x, q.y - p.y);
    if (d < bd) { bd = d; b = q; }
  }
  const carrierBall = G.balls.find((q) => q.owner && q.owner.team === p.team);

  let chase = false;
  if (b) {
    const md = hyp(b.x - mate.x, b.y - mate.y);
    if (p.team === 1) {
      chase = bd <= md || mate.stun > 0 || hyp(b.x - ownGoal, b.y - CY) < 280 || (p.role === 'att' && bd < md * 1.3);
    } else {
      chase = !holding(mate) && (mate.stun > 0 || bd < md * 0.8 || (b.x < CX && bd < md * 1.2));
    }
  }

  if (b && chase) {
    go(b.x + b.vx * 8, b.y + b.vy * 8);
    const dog = G.dog;
    if (b.dogged && dog && hyp(dog.x - p.x, dog.y - p.y) < 40 && p.punchCd === 0 && R() < 0.12) {
      inp.punch = true; inp.aim = norm(dog.x - p.x, dog.y - p.y);
    } else if (b.owner) {
      const o = b.owner, d = hyp(o.x - p.x, o.y - p.y);
      if (d < 42 + 6 * headOf(p) && p.punchCd === 0 && o.shield === 0 && R() < PLAY.aiPunchChance) { inp.punch = true; inp.aim = norm(o.x - p.x, o.y - p.y); }
    } else if (!b.super && bd < 30 && b.z > 4 && b.z < 32 && R() < 0.25) {
      inp.kick = true; inp.aim = norm(oppGoal - p.x, CY - p.y);
    }
  } else if (carrierBall) {
    const c = carrierBall.owner!;
    go(clamp(c.x + dirX * 170, F.l + 60, F.r - 60), c.y > CY ? CY - 120 : CY + 120);
  } else {
    const by = b ? b.y : CY;
    go(ownGoal + dirX * (p.team === 1 ? 160 : 190), CY + (by - CY) * 0.55);
  }
  return inp;
}
