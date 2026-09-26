// Fondo pre-renderizado: pared, tierra, cal y piedras. Se dibuja una vez.
import { CX, CY, F, H, W } from '../config';
import { hyp, mulberry } from '../util';

export function makeBackground(dpr: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = W * dpr;
  c.height = H * dpr;
  const g = c.getContext('2d')!;
  g.scale(dpr, dpr);
  const r = mulberry(7);

  // Fuera de la cancha
  g.fillStyle = '#4a321d';
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 80; i++) {
    g.fillStyle = `rgba(${r() < 0.5 ? 30 : 90},${r() < 0.5 ? 20 : 70},10,.25)`;
    g.beginPath();
    g.ellipse(r() * W, r() * H, 10 + r() * 30, 5 + r() * 12, 0, 0, 7);
    g.fill();
  }

  // Pared de ladrillos
  const wallH = F.t - 10;
  g.fillStyle = '#8c4a32';
  g.fillRect(0, 0, W, wallH);
  g.strokeStyle = '#6a3322';
  g.lineWidth = 2;
  for (let y = 0; y < wallH; y += 14) {
    g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
    for (let x = ((y / 14) % 2) * 20; x < W; x += 40) {
      g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 14); g.stroke();
    }
  }
  g.fillStyle = 'rgba(0,0,0,.25)';
  g.fillRect(0, F.t - 14, W, 4);

  // Cartel y grafitis
  g.save();
  g.translate(W / 2, wallH / 2);
  g.rotate(-0.012);
  g.fillStyle = '#efe6d2';
  g.fillRect(-190, -18, 380, 36);
  g.fillStyle = '#1b1712';
  g.font = '17px Bungee, Impact, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('PROHIBIDO JUGAR A LA PELOTA', 0, 2);
  g.restore();
  g.save();
  g.font = '22px Bungee, Impact, sans-serif';
  g.fillStyle = 'rgba(110,198,255,.55)';
  g.rotate(-0.05);
  g.fillText('LOS PIBES', 60, 42);
  g.restore();
  g.save();
  g.font = '18px Bungee, Impact, sans-serif';
  g.fillStyle = 'rgba(255,210,63,.5)';
  g.translate(W - 250, 40);
  g.rotate(0.04);
  g.fillText('EL QUE PIERDE PAGA', 0, 0);
  g.restore();

  // Tierra
  g.fillStyle = '#c48a52';
  g.fillRect(F.l, F.t, F.r - F.l, F.b - F.t);
  for (let i = 0; i < 170; i++) {
    g.fillStyle = r() < 0.45 ? 'rgba(222,170,110,.35)' : 'rgba(140,90,45,.3)';
    g.beginPath();
    g.ellipse(F.l + r() * (F.r - F.l), F.t + r() * (F.b - F.t), 8 + r() * 50, 4 + r() * 20, r() * 3, 0, 7);
    g.fill();
  }
  for (let i = 0; i < 420; i++) {
    g.fillStyle = r() < 0.5 ? 'rgba(90,60,30,.55)' : 'rgba(240,215,170,.5)';
    g.fillRect(F.l + r() * (F.r - F.l), F.t + r() * (F.b - F.t), 1.5 + r() * 2, 1.5 + r() * 2);
  }

  // Pasto en los bordes
  g.strokeStyle = '#6f7d3a';
  g.lineWidth = 2;
  for (let i = 0; i < 140; i++) {
    let x: number, y: number;
    if (r() < 0.5) { x = F.l + r() * (F.r - F.l); y = r() < 0.5 ? F.t + r() * 10 : F.b - r() * 10; }
    else { y = F.t + r() * (F.b - F.t); x = r() < 0.5 ? F.l + r() * 10 : F.r - r() * 10; }
    for (let k = 0; k < 3; k++) {
      g.beginPath();
      g.moveTo(x + k * 2, y);
      g.lineTo(x + k * 2 + (r() - 0.5) * 4, y - 4 - r() * 5);
      g.stroke();
    }
  }

  // Líneas de cal
  const chalk = (pts: [number, number][]) => {
    for (let pass = 0; pass < 2; pass++) {
      g.strokeStyle = pass ? 'rgba(243,235,221,.35)' : 'rgba(243,235,221,.78)';
      g.lineWidth = pass ? 5 : 2.6;
      g.lineCap = 'round';
      g.beginPath();
      pts.forEach(([x, y], i) => {
        const jx = x + (r() - 0.5) * 1.6, jy = y + (r() - 0.5) * 1.6;
        if (i) g.lineTo(jx, jy); else g.moveTo(jx, jy);
      });
      g.stroke();
    }
  };
  const seg = (x1: number, y1: number, x2: number, y2: number) => {
    const n = Math.ceil(hyp(x2 - x1, y2 - y1) / 18);
    const pts: [number, number][] = [];
    for (let i = 0; i <= n; i++) pts.push([x1 + ((x2 - x1) * i) / n, y1 + ((y2 - y1) * i) / n]);
    chalk(pts);
  };
  seg(F.l, F.t, F.r, F.t); seg(F.r, F.t, F.r, F.b); seg(F.r, F.b, F.l, F.b); seg(F.l, F.b, F.l, F.t);
  seg(CX, F.t, CX, F.b);
  const circ: [number, number][] = [];
  for (let i = 0; i <= 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    circ.push([CX + Math.cos(a) * 72, CY + Math.sin(a) * 72]);
  }
  chalk(circ);
  for (const s of [0, 1]) {
    const x0 = s ? F.r : F.l, d = s ? -1 : 1;
    seg(x0, CY - 150, x0 + d * 110, CY - 150);
    seg(x0 + d * 110, CY - 150, x0 + d * 110, CY + 150);
    seg(x0 + d * 110, CY + 150, x0, CY + 150);
  }
  g.fillStyle = 'rgba(243,235,221,.8)';
  g.beginPath(); g.arc(CX, CY, 4, 0, 7); g.fill();

  // Piedras
  for (let i = 0; i < 14; i++) {
    const x = F.l + 30 + r() * (F.r - F.l - 60), y = F.t + 20 + r() * (F.b - F.t - 40);
    g.fillStyle = 'rgba(60,40,25,.35)';
    g.beginPath(); g.ellipse(x + 1, y + 2, 5, 3, 0, 0, 7); g.fill();
    g.fillStyle = '#9a8b78';
    g.beginPath(); g.ellipse(x, y, 4 + r() * 3, 3 + r() * 2, r(), 0, 7); g.fill();
  }
  return c;
}
