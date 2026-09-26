// IA simple por roles: el más cercano persigue, el otro se posiciona.
import { CX, CY, F } from '../config';
import { G, holding, mateOf } from '../state';
import type { Ball, Input, Player } from '../types';
import { clamp, hyp, norm, R } from '../util';

export function aiInput(p: Player): Input {
  const inp: Input = { x: 0, y: 0, kick: false, punch: false, sup: false, aim: null };
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
    else if (dG < 230 || (dG < 380 && R() < 0.012)) { inp.kick = true; inp.aim = aim; }
    else if (mate.stun === 0) {
      const ahead = (mate.x - p.x) * dirX;
      if ((mate.human && ahead > -30 && R() < 0.025) || (!mate.human && ahead > 60 && R() < 0.008)) inp.punch = true;
    }
    return inp;
  }

  // Sin pelota: elegir la pelota más cercana que no tenga el propio equipo.
  let b: Ball | null = null, bd = 1e9;
  for (const q of G.balls) {
    if (q.owner && q.owner.team === p.team) continue;
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
      if (d < 46 && p.punchCd === 0 && R() < 0.09) { inp.punch = true; inp.aim = norm(o.x - p.x, o.y - p.y); }
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
