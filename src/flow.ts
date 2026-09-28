// Flujo del partido: saque, paso de simulación, goles, cartas y final.
import { CX, CY, F, MATCH_SECONDS, PHYS, PLAY } from './config';
import { initAudio, sfx } from './audio';
import { addCard, offerCards, recompute, type CardDef } from './cards';
import { flashText, updateFx } from './fx';
import { clearPressed, humanInput } from './input';
import { G } from './state';
import { aiInput } from './sim/ai';
import { newBall, pickups, releaseFromDog, updateBall } from './sim/ball';
import { createDog, resetBus, updateBananas, updateBus, updateDog } from './sim/hazards';
import { separatePlayers, updatePlayer } from './sim/player';
import type { Input, Team } from './types';
import { renderChips } from './ui/hud';
import { hidePick, showEnd, showPause, showPick } from './ui/overlays';

const NO_INPUT: Input = { x: 0, y: 0, kick: false, slide: false, sprint: false, aim: null };

/** Saque del medio. Si se indica un equipo, ese equipo arranca con la pelota. */
export function kickoff(kickTeam: Team | null = null) {
  const k = kickTeam;
  // Orden de G.players: vos, compañero(sup), compañero(def), rival atacante, rival mediocampo, rival defensor, arquero celeste, arquero rojo.
  const pos: [number, number][] =
    k === 0
      ? [[CX - 14, CY], [CX - 150, CY + 100], [F.l + 140, CY - 80], [CX + 110, CY - 40], [CX + 220, CY + 80], [F.r - 190, CY + 60]]
    : k === 1
      ? [[CX - 110, CY + 40], [CX - 220, CY - 80], [F.l + 190, CY - 60], [CX + 14, CY], [CX + 150, CY - 100], [F.r - 140, CY + 80]]
      : [[CX - 150, CY], [F.l + 170, CY + 100], [F.l + 80, CY - 100], [CX + 150, CY], [F.r - 170, CY - 100], [F.r - 80, CY + 100]];
  pos.push([F.l + 24, CY], [F.r - 24, CY]);
  G.players.forEach((p, i) => {
    Object.assign(p, {
      x: pos[i][0], y: pos[i][1], vx: 0, vy: 0, stun: 0, slideT: 0,
      fx: p.team ? -1 : 1, fy: 0, noPick: 0, kickAnim: 0, shield: 0, holdT: 0,
    });
  });
  const bp: [number, number][] = [[CX, CY], [CX, CY - 150], [CX, CY + 150]];
  G.balls.forEach((b, i) => {
    releaseFromDog(b);
    Object.assign(b, newBall(bp[i][0], bp[i][1]));
    b.fuse = PHYS.bombFuse + i * 170;
  });
  if (k !== null && G.balls[0]) {
    const kicker = G.players.find((p) => p.team === k && p.role !== 'gk' && (p.human || p.role === 'att'))!;
    G.balls[0].owner = kicker;
    kicker.shield = PLAY.kickoffShield;
  }
  if (G.bus) resetBus(G.bus);
  if (G.dog) G.dog = createDog();
}

export function step() {
  G.tick++;
  if (G.paused) { clearPressed(); return; }
  if (G.phase === 'play' || G.phase === 'goal') {
    const playing = G.phase === 'play';
    if (playing) {
      G.timeLeft -= 1 / 60;
      if (G.timeLeft <= 0) { G.timeLeft = 0; endMatch(); }
    }
    const inputs = G.players.map((p) => (G.phase !== 'play' ? NO_INPUT : p.human ? humanInput() : aiInput(p)));
    G.players.forEach((p, i) => updatePlayer(p, inputs[i]));
    separatePlayers();
    if (G.phase === 'play') {
      pickups();
      for (const b of G.balls) {
        updateBall(b);
        if (G.phase !== 'play') break; // hubo gol
      }
    }
    if (G.phase === 'play') {
      updateBananas();
      if (G.bus) updateBus(G.bus);
      if (G.dog) updateDog(G.dog);
    }
    if (G.phase === 'goal' && --G.goalT <= 0) afterGoal();
  }
  updateFx();
  clearPressed();
}

function afterGoal() {
  // Con menos de 3 segundos no tiene sentido elegir carta: se termina.
  if (G.timeLeft <= 3) endMatch();
  else startPick((1 - G.lastScorer) as Team, false);
}

export function startPick(team: Team, initial: boolean) {
  G.phase = 'pick';
  G.pickTeam = team;
  G.pickChoices = offerCards(team, initial);
  showPick(team, G.pickChoices, initial, choose);
}

export function choose(c: CardDef) {
  if (G.phase !== 'pick') return;
  addCard(c, G.pickTeam);
  renderChips();
  hidePick();
  kickoff(G.pickTeam);
  G.phase = 'play';
  flashText(c.name.toUpperCase(), '#ffd23f', 70);
  sfx('card');
}

function endMatch() {
  G.phase = 'end';
  const [a, b] = G.score;
  const msg = a > b ? '¡Ganaste el potrero!' : a < b ? 'Perdiste. Revancha y listo.' : 'Empate. Nadie se va a casa.';
  showEnd(a, b, msg);
}

export function newMatch() {
  initAudio();
  G.score = [0, 0];
  G.timeLeft = MATCH_SECONDS;
  G.active = [];
  G.bananas = [];
  G.balls = [newBall(CX, CY)];
  G.parts = [];
  G.bus = null;
  G.dog = null;
  G.paused = false;
  G.players.forEach((p) => { p.stamina = 100; p.staminaLocked = false; });
  recompute();
  renderChips();
  kickoff();
  startPick(0, true);
}

export function togglePause() {
  if (G.phase !== 'play' && G.phase !== 'goal') return;
  G.paused = !G.paused;
  showPause(G.paused);
}
