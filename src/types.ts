export type Team = 0 | 1;
export type Role = 'att' | 'def' | 'sup' | 'gk';
export type Phase = 'title' | 'pick' | 'play' | 'goal' | 'end';
export type Vec = [number, number];

export type CardId =
  | 'hielo' | 'luna' | 'banana' | 'multi' | 'bomba' | 'pampero' | 'colectivo' | 'perro'
  | 'cabezon' | 'arco' | 'turbo' | 'fantasma' | 'aguante';

export interface Player {
  team: Team;
  human: boolean;
  role: Role;
  skin: string;
  hair: string;
  x: number; y: number; vx: number; vy: number;
  /** Dirección a la que mira (vector unitario). */
  fx: number; fy: number;
  stun: number;
  /** Barrida: frames activos y cooldown hasta la próxima. */
  slideT: number; slideCd: number;
  kickCd: number; kickAnim: number;
  noPick: number;
  /** Aguante para correr (0-100). */
  stamina: number;
  /** Se re-habilita correr recién cuando el aguante sube de PLAY.staminaRecoverThreshold. */
  staminaLocked: boolean;
  anim: number;
  aimOff: number;
  /** Frames en que no le pueden sacar la pelota (recién la recibió). */
  shield: number;
  /** Frames que el arquero lleva con la pelota en la mano. */
  holdT: number;
}

export interface Ball {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  owner: Player | null;
  last: Player | null;
  fuse: number;
  spin: number;
  /** La lleva el perro en la boca. */
  dogged: boolean;
  /** Ya se definió si el arquero ataja este tiro. */
  rolled: boolean;
}

export interface Banana { x: number; y: number; cd: number; rot: number }

export interface Bus {
  timer: number;
  warn: number;
  driving: boolean;
  x: number; y: number;
  dir: 1 | -1;
}

export interface Dog {
  x: number; y: number; vx: number; vy: number;
  tx: number; ty: number;
  face: 1 | -1;
  ball: Ball | null;
  carryT: number;
  rest: number;
  yelp: number;
  anim: number;
}

export interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; c: string; s: number }

export interface Input { x: number; y: number; kick: boolean; slide: boolean; sprint: boolean; aim: Vec | null }

export interface ActiveCard { id: CardId; team: Team; wind?: Vec }

export interface Mods {
  fric: number;
  grav: number;
  lift: number;
  wind: Vec;
  bomba: boolean;
  bananas: boolean;
  multi: boolean;
  bus: boolean;
  dog: boolean;
}

export interface TeamMods {
  speed: number;
  head: number;
  /** Multiplicador de la velocidad a la que se recupera el aguante. */
  staminaRegen: number;
  ghost: boolean;
  /** Mitad del ancho del arco que defiende este equipo. */
  goalHalf: number;
}

export interface Flash { text: string; color: string; t: number; max: number }
