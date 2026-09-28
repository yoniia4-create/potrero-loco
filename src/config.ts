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
  aiSpeedFactor: 0.9,
  carrySpeedFactor: 0.9,
  kickSpeed: 10.5,
  friction: 0.972,
  airFriction: 0.996,
  gravity: 0.42,
  goalHeight: 46,
  goalHalf: 72,
  bigGoalHalf: 124,
  bombFuse: 480, // frames (8 s)
  slideStun: 30, // cuadros en el piso al ser barrido con éxito
  knockback: 4.5, // impulso al ser volteado
} as const;

/** Ajustes de ritmo de juego y de la IA. */
export const PLAY = {
  possessionShield: 30, // frames protegido al recibir la pelota
  kickoffShield: 45,
  getUpShield: 40, // frames protegido al levantarse, para que no lo vuelvan a voltear enseguida
  // Barrida: solo funciona contra quien tiene la pelota. Si erra, el que la tira queda un toque en el piso.
  slideRange: 30, // alcance de la barrida (además de 10*headOf)
  slideDuration: 14, // cuadros que dura el intento (activo mientras busca conectar)
  slideLunge: 5.5, // impulso hacia adelante al tirarse
  slideCooldownHuman: 34,
  slideMissStun: 16, // cuadros en el piso si la barrida no conecta con nadie
  aiSlideChance: 0.006, // por frame, cuando está cerca del que lleva la pelota (baja = más aire para el que ataca)
  aiSlideCooldown: 130, // frames entre barridas de la IA
  aiShootRange: 270,
  aiShootChance: 0.05, // por frame dentro del rango
  aiSureShot: 170, // a esta distancia patea siempre
  gkSpeed: 2.3,
  gkDiveSpeed: 3.4, // cuando viene un tiro
  gkReach: 24,
  gkHoldFrames: 45,
  gkSaveBase: 1.0, // chance de atajar un tiro lento
  gkSavePerSpeed: 0.04, // cuánto baja por cada unidad de velocidad del tiro
  gkSaveMin: 0.4,
  gkSaveMax: 0.9,
  // Correr: gasta aguante mientras se mantiene apretado, se recupera solo al soltar.
  sprintMult: 1.4, // multiplicador de velocidad corriendo
  staminaDrain: 0.9, // por frame corriendo
  staminaRegen: 0.4, // por frame sin correr
  staminaRecoverThreshold: 35, // hay que llegar acá para poder volver a correr tras quedarse sin aguante
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
