// Marcador, reloj, barra de aguante y chips de cartas activas.
import { cardById } from '../cards';
import { G, human } from '../state';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

export function updateHud() {
  $('sA').textContent = String(G.score[0]);
  $('sB').textContent = String(G.score[1]);
  const s = Math.ceil(G.timeLeft);
  $('clock').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const h = human();
  $('meterFill').style.width = `${h.stamina}%`;
  const meter = $('meter');
  const low = h.staminaLocked || h.stamina < 20;
  if (meter.classList.contains('low') !== low) {
    meter.classList.toggle('low', low);
    $('meterLbl').textContent = low ? '¡Sin aguante!' : 'Aguante';
  }
}

export function renderChips() {
  const el = $('chips');
  el.innerHTML = '';
  if (!G.active.length) {
    el.textContent = 'Sin cartas de caos todavía';
    return;
  }
  const lbl = document.createElement('span');
  lbl.textContent = 'En juego:';
  el.append(lbl);
  for (const a of G.active) {
    const c = cardById(a.id);
    const s = document.createElement('span');
    s.className = 'chip' + (c.type === 'team' ? ` t${a.team}` : '');
    s.textContent = c.name;
    el.append(s);
  }
}

export function setMuteLabel(muted: boolean) {
  const b = $('muteBtn');
  b.textContent = muted ? 'Sonido: no' : 'Sonido: sí';
  b.setAttribute('aria-pressed', String(muted));
}
