// Estado mutable del partido. Un solo objeto G que leen la simulación, el dibujo y la UI.
import { MATCH_SECONDS, PHYS } from './config';
import type { CardDef } from './cards';
import type {
  ActiveCard, Ball, Banana, Bus, Dog, Flash, Mods, Particle, Phase, Player, Team, TeamMods,
} from './types';
import { hyp } from './util';

export const defaultMods = (): Mods => ({
  fric: PHYS.friction,
  grav: PHYS.gravity,
  lift: 1,
  wind: [0, 0],
  bomba: false,
  bananas: false,
  multi: false,
  bus: false,
  dog: false,
});

export const defaultTeamMods = (): TeamMods => ({
  speed: 1,
  head: 1,
  meter: 1,
  ghost: false,
  goalHalf: PHYS.goalHalf,
});

function mkPlayer(team: Team, human: boolean, role: Player['role'], skin: string, hair: string): Player {
  return {
    team, human, role, skin, hair,
    x: 0, y: 0, vx: 0, vy: 0, fx: team ? -1 : 1, fy: 0,
    stun: 0, punchT: 0, punchCd: 0, kickCd: 0, kickAnim: 0, noPick: 0,
    meter: 0, anim: 0, aimOff: 0, shield: 0, holdT: 0,
  };
}

export const G = {
  phase: 'title' as Phase,
  paused: false,
  score: [0, 0] as [number, number],
  timeLeft: MATCH_SECONDS,
  tick: 0,
  players: [
    mkPlayer(0, true, 'att', '#f1c7a0', '#2b1a10'),
    mkPlayer(0, false, 'sup', '#8d5a3b', '#111111'),
    mkPlayer(0, false, 'def', '#caa27a', '#4a2f18'),
    mkPlayer(1, false, 'att', '#e8b48a', '#d9a441'),
    mkPlayer(1, false, 'sup', '#c98e62', '#6b3b1a'),
    mkPlayer(1, false, 'def', '#a97748', '#2e1c0c'),
    mkPlayer(0, false, 'gk', '#e0b088', '#3a2414'),
    mkPlayer(1, false, 'gk', '#b67c52', '#1c120a'),
  ] as Player[],
  balls: [] as Ball[],
  bananas: [] as Banana[],
  parts: [] as Particle[],
  active: [] as ActiveCard[],
  mods: defaultMods(),
  teamM: [defaultTeamMods(), defaultTeamMods()] as [TeamMods, TeamMods],
  bus: null as Bus | null,
  dog: null as Dog | null,
  flash: null as Flash | null,
  shake: 0,
  goalT: 0,
  lastScorer: 0 as Team,
  pickTeam: 0 as Team,
  pickChoices: [] as CardDef[],
};

export const human = () => G.players[0];
export const holding = (p: Player) => G.balls.find((b) => b.owner === p);
export const headOf = (p: Player) => G.teamM[p.team].head;
/** Todos los compañeros de campo (nunca el arquero). */
export const teammatesOf = (p: Player) => G.players.filter((q) => q.team === p.team && q !== p && q.role !== 'gk');
/** Compañero de campo más cercano (nunca el arquero); usado para pases y decisiones simples. */
export const mateOf = (p: Player) => {
  const mates = teammatesOf(p);
  let best = mates[0], bd = Infinity;
  for (const m of mates) {
    const d = hyp(m.x - p.x, m.y - p.y);
    if (d < bd) { bd = d; best = m; }
  }
  return best;
};
export const keeperOf = (team: number) => G.players.find((q) => q.team === team && q.role === 'gk')!;
