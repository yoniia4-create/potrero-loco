// Constantes del juego. Todo lo "tuneable" vive acá.

export const W = 960;
export const H = 600;

/** Límites de la cancha (coordenadas internas del canvas). */
export const F = { l: 56, r: 904, t: 72, b: 568 } as const;
export const CY = (F.t + F.b) / 2;
export const CX = (F.l + F.r) / 2;

export const MATCH_SECONDS = 120;
export const STEP_MS = 1000 / 60;
export const MAX_ACTIVE_CARDS = 4;

export const COLORS = {
  cel: '#6ec6ff',
  roj: '#e8433f',
  sol: '#ffd23f',
  ink: '#1b1712',
  chalk: '#f3ebdd',
  paper: '#f6e7c8',
} as const;

export const PHYS = {
  playerSpeed: 2.7,
  aiSpeedFactor: 0.93,
  carrySpeedFactor: 0.9,
  kickSpeed: 10.5,
  friction: 0.972,
  airFriction: 0.996,
  gravity: 0.42,
  goalHeight: 46,
  goalHalf: 72,
  bigGoalHalf: 124,
  bombFuse: 480, // frames (8 s)
  meterPassive: 0.045,
  meterKick: 5,
  meterPunch: 16,
  punchStun: 55,
} as const;

export const HAZARD = {
  busInterval: 600, // frames entre colectivos (10 s)
  busWarn: 90, // frames de aviso (1,5 s)
  busSpeed: 9,
  busLength: 130,
  busHalfWidth: 23,
  dogSpeed: 3.0,
  dogCarrySpeed: 3.3,
  dogCarryFrames: 180,
  dogRestFrames: 150,
  bananaCount: 9,
  bananaRespawn: 240,
} as const;
