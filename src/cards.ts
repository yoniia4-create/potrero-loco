// Cartas de caos. Cada carta es un dato con su efecto en `apply`.
// Para agregar una carta: sumala a CARDS y, si necesita entidades propias, a syncEntities().
import { CX, CY, F, HAZARD, MAX_ACTIVE_CARDS, PHYS } from './config';
import { G, defaultMods, defaultTeamMods } from './state';
import { newBall, releaseFromDog } from './sim/ball';
import { createBus, createDog, spawnBanana } from './sim/hazards';
import type { ActiveCard, CardId, Mods, Team, TeamMods } from './types';
import { R, shuffle } from './util';

export interface CardDef {
  id: CardId;
  name: string;
  /** Símbolo tipográfico (no emoji) que va en la figurita. */
  sym: string;
  type: 'global' | 'team';
  /** Descripción cuando la elige tu equipo (o para todos). */
  d: string;
  /** Descripción cuando la elige el rival (cartas de equipo). */
  dr?: string;
  apply: (m: Mods, own: TeamMods, rival: TeamMods, card: ActiveCard) => void;
}

export const CARDS: CardDef[] = [
  { id: 'hielo', name: 'Pelota de Hielo', sym: '❄︎', type: 'global', d: 'La pelota patina y casi no frena.',
    apply: (m) => { m.fric = 0.996; } },
  { id: 'luna', name: 'Gravedad Lunar', sym: '☾', type: 'global', d: 'Pelotazos altísimos que caen lento.',
    apply: (m) => { m.grav = 0.13; m.lift = 2.6; } },
  { id: 'banana', name: 'Lluvia de Bananas', sym: '◗', type: 'global', d: 'Cáscaras por toda la cancha. Pisás una y volás.',
    apply: (m) => { m.bananas = true; } },
  { id: 'multi', name: 'Multipelota', sym: '⁂', type: 'global', d: 'Entran dos pelotas más.',
    apply: (m) => { m.multi = true; } },
  { id: 'bomba', name: 'Pelota Bomba', sym: '✹', type: 'global', d: 'Cada 8 segundos la pelota explota y voltea a todos cerca.',
    apply: (m) => { m.bomba = true; } },
  { id: 'pampero', name: 'Viento Pampero', sym: '≋', type: 'global', d: 'Un viento fuerte empuja la pelota hacia un lado.',
    apply: (m, _o, _r, c) => { m.wind = c.wind ?? [0, 0]; } },
  { id: 'colectivo', name: 'Colectivo 60', sym: '▤', type: 'global', d: 'Cada tanto cruza un colectivo. Toca bocina antes. Atropella a cualquiera.',
    apply: (m) => { m.bus = true; } },
  { id: 'perro', name: 'Perro Callejero', sym: '❧', type: 'global', d: 'Entra un perro que se roba la pelota. Con una barrida la suelta.',
    apply: (m) => { m.dog = true; } },
  { id: 'cabezon', name: 'Cabezón XL', sym: '●', type: 'team',
    d: 'Tu equipo juega con cabezas dobles y barridas de más alcance.', dr: 'El rival juega con cabezas dobles y barridas de más alcance.',
    apply: (_m, own) => { own.head = 1.8; } },
  { id: 'arco', name: 'Arco Gigante', sym: '▭', type: 'team', d: 'El arco rival se agranda.', dr: 'Tu arco se agranda.',
    apply: (_m, _own, rival) => { rival.goalHalf = PHYS.bigGoalHalf; } },
  { id: 'turbo', name: 'Turbo', sym: '»', type: 'team', d: 'Tu equipo corre 35% más rápido.', dr: 'El rival corre 35% más rápido.',
    apply: (_m, own) => { own.speed = 1.35; } },
  { id: 'fantasma', name: 'Arquero Fantasma', sym: '♜', type: 'team',
    d: 'Un fantasma patrulla tu arco y rechaza tiros.', dr: 'Un fantasma patrulla el arco rival.',
    apply: (_m, own) => { own.ghost = true; } },
  { id: 'aguante', name: 'Fondo Físico', sym: '✦', type: 'team', d: 'Tu equipo recupera el aguante para correr el doble de rápido.', dr: 'El rival recupera el aguante para correr el doble de rápido.',
    apply: (_m, own) => { own.staminaRegen = 2.2; } },
];

export const cardById = (id: CardId) => CARDS.find((c) => c.id === id)!;

/** Recalcula todos los modificadores a partir de las cartas activas. */
export function recompute() {
  G.mods = defaultMods();
  G.teamM = [defaultTeamMods(), defaultTeamMods()];
  for (const a of G.active) {
    cardById(a.id).apply(G.mods, G.teamM[a.team], G.teamM[1 - a.team], a);
  }
  syncEntities();
}

/** Crea o quita las entidades que dependen de cartas. */
function syncEntities() {
  const m = G.mods;
  if (m.bananas && !G.bananas.length) for (let i = 0; i < HAZARD.bananaCount; i++) G.bananas.push(spawnBanana());
  if (!m.bananas) G.bananas = [];

  if (m.multi) while (G.balls.length < 3) G.balls.push(newBall(CX, F.t + 80 + R() * (CY - F.t)));
  if (!m.multi && G.balls.length > 1) {
    G.balls.slice(1).forEach(releaseFromDog);
    G.balls.length = 1;
  }

  if (m.bus && !G.bus) G.bus = createBus();
  if (!m.bus) G.bus = null;

  if (m.dog && !G.dog) G.dog = createDog();
  if (!m.dog && G.dog) {
    if (G.dog.ball) releaseFromDog(G.dog.ball);
    G.dog = null;
  }
}

/** Tres cartas al azar que el equipo todavía no tiene. */
export function offerCards(team: Team, initial: boolean): CardDef[] {
  const pool = CARDS.filter((c) =>
    (!initial || c.type === 'global') &&
    !G.active.some((a) => a.id === c.id && (c.type === 'global' || a.team === team)),
  );
  return shuffle(pool).slice(0, 3);
}

export function addCard(c: CardDef, team: Team) {
  const a: ActiveCard = { id: c.id, team };
  if (c.id === 'pampero') {
    const ang = R() * Math.PI * 2;
    a.wind = [Math.cos(ang) * 0.075, Math.sin(ang) * 0.075];
  }
  G.active.push(a);
  if (G.active.length > MAX_ACTIVE_CARDS) G.active.shift();
  recompute();
}
