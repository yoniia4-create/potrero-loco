export type Team = 0 | 1;
export type Role = 'att' | 'def' | 'sup';
export type Phase = 'title' | 'pick' | 'play' | 'goal' | 'end';
export type SuperType = 'cannon' | 'zigzag' | 'meteor';
export type Vec = [number, number];

export type CardId =
  | 'hielo' | 'luna' | 'banana' | 'multi' | 'bomba' | 'pampero' | 'colectivo' | 'perro'
  | 'cabezon' | 'arco' | 'turbo' | 'fantasma' | 'super';

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
  punchT: number; punchCd: number;
  kickCd: number; kickAnim: number;
  noPick: number;
  meter: number;
  anim: number;
  aimOff: number;
}

export interface Ball {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  owner: Player | null;
  super: SuperType | null;
  superT: number;
  dx: number; dy: number;
  last: Player | null;
  fuse: number;
  trail: Vec[];
  spin: number;
  /** La lleva el perro en la boca. */
  dogged: boolean;
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

export interface Input { x: number; y: number; kick: boolean; punch: boolean; sup: boolean; aim: Vec | null }

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
  meter: number;
  ghost: boolean;
  /** Mitad del ancho del arco que defiende este equipo. */
  goalHalf: number;
}

export interface Flash { text: string; color: string; t: number; max: number }
