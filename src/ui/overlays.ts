// Pantallas superpuestas: título, elección de carta, pausa y final.
import type { CardDef } from '../cards';
import type { Team } from '../types';
import { pick } from '../util';
import { sfx } from '../audio';

const $ = (id: string) => document.getElementById(id)!;
const TILTS = [-3, 1.5, 3.5];
let aiTimers: number[] = [];

export const hideTitle = () => { $('titleOv').hidden = true; };

export function showPick(team: Team, choices: CardDef[], initial: boolean, onChoose: (c: CardDef) => void) {
  aiTimers.forEach(clearTimeout);
  aiTimers = [];
  $('pickEyebrow').textContent = initial ? 'Antes de arrancar' : team === 0 ? 'Te hicieron un gol' : 'Le hiciste un gol al rival';
  const title = $('pickTitle');
  title.textContent = initial ? 'Elegí la regla de la casa' : team === 0 ? 'Elegí una carta de caos' : 'El rival está eligiendo…';
  const cards = $('cards');
  cards.innerHTML = '';
  choices.forEach((c, i) => {
    const b = document.createElement('button');
    b.className = `card t-${c.type}${team ? ' rival' : ''}`;
    b.style.setProperty('--tilt', `${TILTS[i]}deg`);
    const tag = c.type === 'global' ? 'Para todos' : team ? 'Para el rival' : 'Para tu equipo';
    const desc = team && c.dr ? c.dr : c.d;
    b.innerHTML = `<span class="c-tag">${tag}</span><span class="c-sym">${c.sym}</span><span class="c-name">${c.name}</span><span class="c-desc">${desc}</span><span class="c-key">${i + 1}</span>`;
    if (team === 0) b.onclick = () => onChoose(c);
    else b.disabled = true;
    cards.append(b);
  });
  $('pickOv').hidden = false;

  if (team === 0) {
    setTimeout(() => (cards.querySelector('button') as HTMLButtonElement | null)?.focus({ preventScroll: true }), 50);
  } else {
    const c = pick(choices);
    aiTimers.push(window.setTimeout(() => {
      cards.children[choices.indexOf(c)]?.classList.add('chosen');
      title.textContent = `El rival eligió ${c.name}`;
      sfx('card');
    }, 1000));
    aiTimers.push(window.setTimeout(() => onChoose(c), 2400));
  }
}

export function hidePick() {
  $('pickOv').hidden = true;
  (document.activeElement as HTMLElement | null)?.blur();
}

export function showPause(on: boolean) {
  $('pauseOv').hidden = !on;
}

export function showEnd(a: number, b: number, msg: string) {
  $('fA').textContent = String(a);
  $('fB').textContent = String(b);
  $('endMsg').textContent = msg;
  $('endOv').hidden = false;
}

export const hideEnd = () => { $('endOv').hidden = true; };
