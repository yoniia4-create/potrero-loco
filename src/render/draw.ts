// Dibujo de cada frame: arcos, entidades ordenadas por profundidad, efectos y carteles.
import { COLORS, CY, F, H, HAZARD, W } from '../config';
import { G, headOf } from '../state';
import { ghostY } from '../sim/ball';
import type { Ball, Banana, Bus, Dog, Player, Team } from '../types';
import { norm, R } from '../util';
import { makeBackground } from './background';

let ctx: CanvasRenderingContext2D;
let cv: HTMLCanvasElement;
let dpr = 1;
let bg: HTMLCanvasElement;
const windSeeds = Array.from({ length: 36 }, () => ({ x: R() * W, y: R() * (F.b - F.t), l: 10 + R() * 18 }));

/* ---------- cámara ----------
   En pantallas anchas se ve la cancha entera (viewW = W).
   En pantallas angostas (celu vertical) se ve una porción y la cámara sigue la jugada. */
export const MIN_VIEW_W = 420;
let viewW = W;
let camX = 0;

export function setViewWidth(w: number) {
  const nw = Math.round(Math.max(MIN_VIEW_W, Math.min(W, w)));
  if (nw === viewW && cv.width === nw * dpr) return;
  viewW = nw;
  cv.width = viewW * dpr;
  cv.height = H * dpr;
  camX = clampCam(camTarget());
}
export const getViewWidth = () => viewW;

const clampCam = (x: number) => Math.max(0, Math.min(W - viewW, x));
function camTarget() {
  const b = G.balls[0];
  const h = G.players[0];
  const fx = b ? b.x * 0.7 + h.x * 0.3 : h.x;
  return fx - viewW / 2;
}
function updateCamera() {
  if (viewW >= W) { camX = 0; return; }
  camX += (clampCam(camTarget()) - camX) * 0.12;
}

export function initRenderer(canvas: HTMLCanvasElement) {
  dpr = Math.min(2, window.devicePixelRatio || 1);
  cv = canvas;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx = canvas.getContext('2d')!;
  bg = makeBackground(dpr);
  // Rehacer el fondo cuando carga la tipografía del cartel.
  document.fonts?.load('20px Bungee').then(() => { bg = makeBackground(dpr); }).catch(() => {});
}

/* ---------- helpers ---------- */
// El contorno grueso es la firma del estilo "figurita": se dibuja después del relleno.
const OUTLINE = 1.6;
const outline = (w = OUTLINE) => { ctx.lineJoin = 'round'; ctx.strokeStyle = COLORS.ink; ctx.lineWidth = w; ctx.stroke(); };
const circle = (x: number, y: number, r: number, out = false) => {
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  if (out) outline();
};
const rr = (x: number, y: number, w: number, h: number, r: number, out = false) => {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
  ctx.fill();
  if (out) outline();
};
function star(x: number, y: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5 - Math.PI / 2, rad = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fill();
}

/* ---------- escenario ---------- */
function drawGoal(side: Team) {
  const h = G.teamM[side].goalHalf, x0 = side === 0 ? F.l : F.r, dir = side === 0 ? -1 : 1, dep = 32, xb = x0 + dir * dep;
  ctx.fillStyle = 'rgba(20,12,6,.5)';
  ctx.fillRect(Math.min(x0, xb), CY - h, dep, h * 2);
  ctx.strokeStyle = 'rgba(243,235,221,.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let y = CY - h; y <= CY + h; y += 8) { ctx.moveTo(x0, y); ctx.lineTo(xb, y); }
  for (let k = 0; k <= dep; k += 8) { ctx.moveTo(x0 + dir * k, CY - h); ctx.lineTo(x0 + dir * k, CY + h); }
  ctx.stroke();
  ctx.strokeStyle = COLORS.chalk;
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x0, CY - h); ctx.lineTo(xb, CY - h); ctx.lineTo(xb, CY + h); ctx.lineTo(x0, CY + h);
  ctx.stroke();
  ctx.fillStyle = COLORS.chalk;
  circle(x0, CY - h, 4.5); circle(x0, CY + h, 4.5);
  ctx.strokeStyle = side ? 'rgba(232,67,63,.8)' : 'rgba(110,198,255,.8)';
  ctx.beginPath(); ctx.moveTo(x0, CY - h + 6); ctx.lineTo(x0, CY + h - 6); ctx.stroke();
}

function drawGhost(side: Team) {
  const gx = side === 0 ? F.l + 6 : F.r - 6, gy = ghostY(side), bob = Math.sin(G.tick * 0.1) * 2;
  ctx.save();
  ctx.globalAlpha = 0.78;
  ctx.translate(gx, gy - 22 + bob);
  ctx.fillStyle = '#f4f7ff';
  ctx.beginPath();
  ctx.arc(0, 0, 13, Math.PI, 0);
  ctx.lineTo(13, 20);
  for (let i = 0; i < 4; i++) {
    const x = 13 - (i + 1) * 6.5;
    ctx.quadraticCurveTo(x + 3.25, i % 2 ? 16 : 24, x, 20);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = COLORS.ink;
  circle(-4.5, -1, 2.3); circle(4.5, -1, 2.3);
  ctx.restore();
}

function drawWind() {
  const [wx, wy] = G.mods.wind;
  if (!wx && !wy) return;
  const [nx, ny] = norm(wx, wy);
  const span = F.b - F.t;
  ctx.strokeStyle = 'rgba(255,250,235,.22)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (const s of windSeeds) {
    const x = (((s.x + G.tick * wx * 90) % W) + W) % W;
    const y = F.t + ((((s.y + G.tick * wy * 90) % span) + span) % span);
    ctx.moveTo(x, y);
    ctx.lineTo(x - nx * s.l, y - ny * s.l);
  }
  ctx.stroke();
}

function drawBusLane(bus: Bus) {
  if (bus.warn <= 0) return;
  const on = Math.floor(bus.warn / 8) % 2 === 0;
  ctx.fillStyle = on ? 'rgba(255,210,63,.3)' : 'rgba(255,210,63,.12)';
  ctx.fillRect(F.l, bus.y - HAZARD.busHalfWidth - 4, F.r - F.l, HAZARD.busHalfWidth * 2 + 8);
  ctx.strokeStyle = 'rgba(27,23,18,.55)';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  for (let x = F.l + 60; x < F.r; x += 90) {
    ctx.beginPath();
    ctx.moveTo(x - bus.dir * 8, bus.y - 10);
    ctx.lineTo(x + bus.dir * 6, bus.y);
    ctx.lineTo(x - bus.dir * 8, bus.y + 10);
    ctx.stroke();
  }
}

/* ---------- entidades ---------- */
// Números de camiseta por rol (estilo figurita): fijos, no identifican al jugador individualmente.
const SHIRT_NUM: Record<Player['role'], string> = { att: '9', sup: '8', def: '4', gk: '1' };

function figure(p: Player, x: number, y: number, h: number, col: string) {
  const sw = Math.sin(p.anim) * 2.5;
  ctx.fillStyle = '#24170d';
  if (p.kickAnim > 0) {
    rr(x - 4, y - 7, 3.5, 7, 1.5);
    ctx.save(); ctx.translate(x + 1, y - 5); ctx.rotate(Math.atan2(p.fy, p.fx)); rr(0, -2, 12, 4, 1.5); ctx.restore();
  } else {
    rr(x - 5, y - 7 + sw * 0.4, 3.5, 7 - sw * 0.4, 1.5);
    rr(x + 1.5, y - 7 - sw * 0.4, 3.5, 7 + sw * 0.4, 1.5);
  }
  ctx.fillStyle = p.team ? COLORS.ink : COLORS.chalk;
  rr(x - 7, y - 12, 14, 6, 3, true);
  ctx.fillStyle = col;
  rr(x - 8, y - 22, 16, 12, 5, true);
  const numCol = p.team ? COLORS.paper : COLORS.chalk;
  ctx.font = '7px Bungee, Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 2; ctx.strokeStyle = COLORS.ink; ctx.lineJoin = 'round';
  ctx.strokeText(SHIRT_NUM[p.role], x, y - 16);
  ctx.fillStyle = numCol;
  ctx.fillText(SHIRT_NUM[p.role], x, y - 16);
  if (p.role === 'gk') {
    // Guantes de arquero.
    ctx.fillStyle = COLORS.paper;
    circle(x - 10, y - 14, 3.2, true);
    circle(x + 10, y - 14, 3.2, true);
  } else if (p.team === 0) {
    ctx.fillStyle = COLORS.chalk;
    rr(x - 3.5, y - 22, 2.5, 11, 1.2);
    rr(x + 1, y - 22, 2.5, 11, 1.2);
  } else {
    ctx.fillStyle = COLORS.ink;
    rr(x - 8, y - 17, 16, 2, 1);
  }
  // Cabeza grande estilo "figurita": más chica que el cuerpo no, al revés.
  const r = 13 * h, hx = x + p.fx * 1.5, hy = y - 21 - r + 3;
  ctx.fillStyle = p.skin;
  circle(hx, hy, r, true);
  if (p.fy < -0.7) {
    ctx.fillStyle = p.hair;
    circle(hx, hy - 1, r * 0.85, true);
    return;
  }
  ctx.fillStyle = p.hair;
  ctx.beginPath();
  ctx.arc(hx, hy, r, Math.PI * 1.02, Math.PI * 1.98);
  ctx.quadraticCurveTo(hx - p.fx * r * 0.3, hy - r * 0.2, hx - r, hy - r * 0.05);
  ctx.closePath();
  ctx.fill();
  outline();
  // Brillo plano en la frente: la "chispa" típica del arte figurita/sticker.
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(hx + p.fx * r * 0.32, hy - r * 0.5, r * 0.26, r * 0.15, 0.4, 0, 7);
  ctx.fill();
  ctx.restore();
  const ex = hx + p.fx * r * 0.42, ey = hy + Math.max(-0.2, p.fy) * r * 0.3 + r * 0.12;
  const sp = r * 0.32 * (1 - Math.abs(p.fx) * 0.35);
  ctx.fillStyle = COLORS.ink;
  circle(ex - sp, ey, 1.9 * h); circle(ex + sp, ey, 1.9 * h);
  if (p.team === 1) {
    ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(ex - sp - 3 * h, ey - 4 * h); ctx.lineTo(ex - sp + 2 * h, ey - 2.5 * h);
    ctx.moveTo(ex + sp + 3 * h, ey - 4 * h); ctx.lineTo(ex + sp - 2 * h, ey - 2.5 * h);
    ctx.stroke();
  }
}

function drawPlayer(p: Player) {
  const h = headOf(p);
  const col = p.role === 'gk' ? (p.team ? '#b48cff' : '#7bd389') : p.team ? COLORS.roj : COLORS.cel;
  ctx.fillStyle = 'rgba(40,22,8,.35)';
  ctx.beginPath(); ctx.ellipse(p.x, p.y + 1, 11 + 2 * h, 4.5, 0, 0, 7); ctx.fill();
  if (p.stun > 0) {
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate((p.vx >= 0 ? 1 : -1) * 1.45); figure(p, 0, 0, h, col); ctx.restore();
    ctx.fillStyle = COLORS.sol;
    for (let k = 0; k < 3; k++) {
      const a = G.tick * 0.15 + k * 2.1;
      star(p.x + Math.cos(a) * 15, p.y - 16 + Math.sin(a) * 5, 3.5);
    }
  } else if (p.slideT > 0) {
    // Barrida: se tira al piso en la dirección que mira.
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.atan2(p.fy, p.fx) * 0.5); figure(p, 0, 0, h, col); ctx.restore();
  } else figure(p, p.x, p.y, h, col);
  if (p.human) {
    const ty = p.stun ? p.y - 32 : p.y - 20 - 22 * h - 10;
    ctx.fillStyle = COLORS.sol;
    ctx.beginPath(); ctx.moveTo(p.x - 6, ty - 8); ctx.lineTo(p.x + 6, ty - 8); ctx.lineTo(p.x, ty); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 1.5; ctx.stroke();
  }
}

function drawBallShadow(b: Ball) {
  const s = Math.max(0.3, 1 - b.z / 120);
  ctx.fillStyle = `rgba(40,22,8,${0.35 * s})`;
  ctx.beginPath(); ctx.ellipse(b.x, b.y + 1, 7 * s + 1, 3 * s + 1, 0, 0, 7); ctx.fill();
}

function drawBall(b: Ball) {
  const y = b.y - b.z;
  const bomb = G.mods.bomba;
  ctx.fillStyle = bomb ? '#2b1410' : '#fbf6ec';
  circle(b.x, y, 6.5);
  ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 2; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.arc(b.x, y, 6.5, 0, 7); ctx.stroke();
  // Parche de pelota tipo figurita: un pentágono girando con el spin, en vez de un simple punto.
  ctx.save();
  ctx.translate(b.x, y);
  ctx.rotate(b.spin);
  ctx.fillStyle = bomb ? COLORS.roj : COLORS.ink;
  ctx.beginPath();
  ctx.moveTo(0, -3.2); ctx.lineTo(2.6, -0.6); ctx.lineTo(1.6, 2.8); ctx.lineTo(-1.6, 2.8); ctx.lineTo(-2.6, -0.6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  if (bomb) {
    ctx.strokeStyle = '#d9c7a0'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(b.x + 3, y - 5); ctx.quadraticCurveTo(b.x + 7, y - 11, b.x + 10, y - 10); ctx.stroke();
    ctx.fillStyle = G.tick % 6 < 3 ? COLORS.sol : '#ff8a3d';
    circle(b.x + 10, y - 10, 2.2);
    const s = Math.ceil(b.fuse / 60);
    if (s <= 3 && G.phase === 'play') {
      ctx.font = '16px Bungee, Impact, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = G.tick % 20 < 10 ? COLORS.sol : COLORS.roj;
      ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 4;
      ctx.strokeText(String(s), b.x, y - 16);
      ctx.fillText(String(s), b.x, y - 16);
    }
  }
}

function drawBanana(bn: Banana) {
  ctx.save();
  ctx.translate(bn.x, bn.y);
  ctx.rotate(bn.rot);
  ctx.strokeStyle = '#f2d23b'; ctx.lineWidth = 4.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(0, -4, 7, 0.35, 2.8); ctx.stroke();
  ctx.fillStyle = '#5a3b17';
  circle(6.2, -0.6, 1.6); circle(-6.6, -1, 1.6);
  ctx.restore();
}

function drawBus(bus: Bus) {
  const L = HAZARD.busLength, x = bus.x - L / 2, top = bus.y - 34, hgt = 48, d = bus.dir;
  ctx.fillStyle = 'rgba(30,18,8,.35)';
  ctx.beginPath(); ctx.ellipse(bus.x, bus.y + 16, L / 2 + 6, 10, 0, 0, 7); ctx.fill();
  // carrocería
  ctx.fillStyle = '#e9a23b'; rr(x, top, L, hgt, 8);
  ctx.fillStyle = '#f6e7c8'; ctx.fillRect(x + 4, top + 26, L - 8, 7);
  ctx.fillStyle = COLORS.roj; ctx.fillRect(x + 4, top + 33, L - 8, 3);
  ctx.fillStyle = '#3f8f5a'; ctx.fillRect(x + 4, top + 36, L - 8, 2);
  // ventanillas
  ctx.fillStyle = '#2d3e4a';
  for (let i = 0; i < 5; i++) rr(x + 12 + i * 20, top + 6, 15, 15, 3);
  // parabrisas y cartel
  const fx = d === 1 ? x + L - 16 : x + 4;
  ctx.fillStyle = '#9fd4ee'; rr(fx, top + 6, 12, 18, 3);
  ctx.fillStyle = COLORS.ink; rr(d === 1 ? x + L - 34 : x + 18, top - 9, 18, 11, 2);
  ctx.fillStyle = COLORS.sol; ctx.font = '9px Bungee, Impact, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('60', d === 1 ? x + L - 25 : x + 27, top - 3);
  // ruedas
  ctx.fillStyle = '#1b1712';
  circle(x + 26, top + hgt, 8); circle(x + L - 26, top + hgt, 8);
  ctx.fillStyle = '#8a8178';
  circle(x + 26, top + hgt, 3.5); circle(x + L - 26, top + hgt, 3.5);
  // humo
  if (G.tick % 4 === 0) G.parts.push({ x: d === 1 ? x - 4 : x + L + 4, y: top + hgt - 4, vx: -d * 1.5, vy: -0.6, life: 30, max: 30, c: 'rgba(80,70,60,.45)', s: 5 });
}

function drawDog(dg: Dog) {
  const x = dg.x, y = dg.y, f = dg.face, run = Math.sin(dg.anim);
  ctx.fillStyle = 'rgba(40,22,8,.35)';
  ctx.beginPath(); ctx.ellipse(x, y + 1, 14, 4, 0, 0, 7); ctx.fill();
  // patas
  ctx.strokeStyle = '#6b4420'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 7, y - 6); ctx.lineTo(x - 7 + run * 3, y);
  ctx.moveTo(x - 3, y - 6); ctx.lineTo(x - 3 - run * 3, y);
  ctx.moveTo(x + 5, y - 6); ctx.lineTo(x + 5 - run * 3, y);
  ctx.moveTo(x + 9, y - 6); ctx.lineTo(x + 9 + run * 3, y);
  ctx.stroke();
  // cola
  const wag = Math.sin(G.tick * 0.5) * 4;
  ctx.strokeStyle = '#a0692e'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x - f * 11, y - 11); ctx.quadraticCurveTo(x - f * 17, y - 16, x - f * 18, y - 20 + wag); ctx.stroke();
  // cuerpo
  ctx.fillStyle = '#a0692e';
  ctx.beginPath(); ctx.ellipse(x, y - 10, 13, 6.5, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#6b4420';
  ctx.beginPath(); ctx.ellipse(x - f * 3, y - 12, 4, 3, 0, 0, 7); ctx.fill();
  // cabeza
  const hx = x + f * 12, hy = y - 15;
  ctx.fillStyle = '#a0692e'; circle(hx, hy, 6);
  ctx.fillStyle = '#c48a52';
  ctx.beginPath(); ctx.ellipse(hx + f * 5, hy + 1.5, 4, 2.8, 0, 0, 7); ctx.fill();
  ctx.fillStyle = COLORS.ink; circle(hx + f * 8.5, hy + 1, 1.5); circle(hx + f * 2, hy - 1.5, 1.3);
  ctx.fillStyle = '#6b4420';
  ctx.beginPath(); ctx.moveTo(hx - f * 2, hy - 4); ctx.lineTo(hx - f * 6, hy + 3); ctx.lineTo(hx - f * 1, hy + 1); ctx.closePath(); ctx.fill();
  if (dg.yelp > 0) {
    ctx.font = '14px Bungee, Impact, sans-serif'; ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.sol; ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 3;
    ctx.strokeText('!', hx, hy - 12); ctx.fillText('!', hx, hy - 12);
  }
}

/* ---------- frame ---------- */
function drawMinimap() {
  if (viewW >= W) return;
  const mw = 150, s = mw / (F.r - F.l), mh = (F.b - F.t) * s;
  const x0 = (viewW - mw) / 2, y0 = 8;
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = 'rgba(27,23,18,.72)';
  rr(x0 - 4, y0 - 4, mw + 8, mh + 8, 6);
  ctx.strokeStyle = 'rgba(243,235,221,.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x0, y0, mw, mh);
  ctx.beginPath(); ctx.moveTo(x0 + mw / 2, y0); ctx.lineTo(x0 + mw / 2, y0 + mh); ctx.stroke();
  const mx = (x: number) => x0 + (x - F.l) * s, my = (y: number) => y0 + (y - F.t) * s;
  // arcos
  for (const side of [0, 1] as const) {
    const gh = G.teamM[side].goalHalf * s;
    ctx.fillStyle = side ? COLORS.roj : COLORS.cel;
    ctx.fillRect(side ? x0 + mw : x0 - 3, my(CY) - gh, 3, gh * 2);
  }
  // porción visible
  ctx.strokeStyle = 'rgba(255,210,63,.8)';
  ctx.strokeRect(Math.max(x0, mx(camX)), y0, Math.min(mw, viewW * s), mh);
  for (const p of G.players) {
    ctx.fillStyle = p.team ? COLORS.roj : COLORS.cel;
    circle(mx(p.x), my(p.y), p.human ? 3.2 : 2.4);
  }
  ctx.fillStyle = '#fff';
  for (const b of G.balls) circle(mx(b.x), my(b.y), 2);
  ctx.restore();
}

export function draw() {
  updateCamera();
  ctx.setTransform(dpr, 0, 0, dpr, -camX * dpr, 0);
  ctx.save();
  if (G.shake) ctx.translate((R() - 0.5) * G.shake, (R() - 0.5) * G.shake);
  ctx.drawImage(bg, 0, 0, W, H);
  drawGoal(0); drawGoal(1);
  if (G.bus) drawBusLane(G.bus);
  drawWind();
  G.bananas.forEach((bn) => { if (bn.cd === 0) drawBanana(bn); });
  G.balls.forEach(drawBallShadow);

  const ents: [number, () => void][] = [];
  G.players.forEach((p) => ents.push([p.y, () => drawPlayer(p)]));
  G.balls.forEach((b) => ents.push([b.y + 1, () => drawBall(b)]));
  if (G.dog) { const dg = G.dog; ents.push([dg.y, () => drawDog(dg)]); }
  if (G.bus && G.bus.driving) { const bus = G.bus; ents.push([bus.y + 14, () => drawBus(bus)]); }
  ents.sort((a, b) => a[0] - b[0]).forEach((e) => e[1]());

  ([0, 1] as const).forEach((s) => { if (G.teamM[s].ghost) drawGhost(s); });
  for (const q of G.parts) { ctx.globalAlpha = Math.max(0, q.life / q.max); ctx.fillStyle = q.c; circle(q.x, q.y, q.s); }
  ctx.globalAlpha = 1;
  ctx.restore();

  // Capa de pantalla (sin cámara): minimapa y carteles.
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawMinimap();
  const fl = G.flash;
  if (fl) {
    const k = fl.max - fl.t, sc = k < 10 ? 0.4 + (k / 10) * 0.6 : 1, al = fl.t < 20 ? fl.t / 20 : 1;
    const fit = Math.min(1, viewW / 680);
    ctx.save();
    ctx.globalAlpha = al;
    ctx.translate(viewW / 2, H / 2 - 10);
    ctx.scale(sc * fit, sc * fit);
    ctx.rotate(-0.04);
    ctx.font = `${fl.text.length > 12 ? 52 : 78}px Bungee, Impact, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 12; ctx.strokeText(fl.text, 0, 0);
    ctx.fillStyle = fl.color; ctx.fillText(fl.text, 0, 0);
    ctx.restore();
  }
}
