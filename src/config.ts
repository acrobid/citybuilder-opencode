export const TILE_SIZE = 32;
export const MAP_COLS = 96;
export const MAP_ROWS = 96;

export const COLORS = {
  EMPTY: 0x2d5a1e,
  ROAD: 0x555555,
  RESIDENTIAL: 0x33aa33,
  COMMERCIAL: 0x3366cc,
  INDUSTRIAL: 0xcc9933,
  POWERPLANT: 0xff4444,
  POWERED_OVERLAY: 0xffff00,
  PREVIEW_VALID: 0x00ff00,
  PREVIEW_INVALID: 0xff0000,
  GRID_LINE: 0x1a4a0e,
  ROAD_LINE: 0x666666,
} as const;

export const GAME_WIDTH = 1024;
export const GAME_HEIGHT = 768;

// ── Planet ──
export const PLANET_CENTER_X = (MAP_COLS * TILE_SIZE) / 2; // 1024
export const PLANET_CENTER_Y = (MAP_ROWS * TILE_SIZE) / 2; // 1024
export const PLANET_RADIUS = 14 * TILE_SIZE; // 448px

// ── Orbit Rings ──
export const ORBIT_RINGS = {
  inner: { radius: PLANET_RADIUS + 64, speed: 0.4, name: "Inner" },
  mid: { radius: PLANET_RADIUS + 128, speed: 0.25, name: "Mid" },
  outer: { radius: PLANET_RADIUS + 192, speed: 0.15, name: "Outer" },
} as const;
export type OrbitRing = keyof typeof ORBIT_RINGS;

// ── 10 Satellite Types ──
export const SATELLITE_TYPES = {
  laser: {
    name: "Laser Turret",
    ring: "inner" as OrbitRing,
    fireRate: 400,
    damage: 8,
    range: 250,
    cost: 150,
    projectileSpeed: 500,
    special: null,
  },
  missile: {
    name: "Missile Battery",
    ring: "mid" as OrbitRing,
    fireRate: 1400,
    damage: 35,
    range: 450,
    cost: 300,
    projectileSpeed: 300,
    special: null,
  },
  plasma: {
    name: "Plasma Cannon",
    ring: "inner" as OrbitRing,
    fireRate: 900,
    damage: 25,
    range: 200,
    cost: 250,
    projectileSpeed: 350,
    special: "splash",
  },
  railgun: {
    name: "Railgun",
    ring: "mid" as OrbitRing,
    fireRate: 2200,
    damage: 60,
    range: 550,
    cost: 400,
    projectileSpeed: 800,
    special: "pierce",
  },
  ion: {
    name: "Ion Beam",
    ring: "outer" as OrbitRing,
    fireRate: 700,
    damage: 12,
    range: 500,
    cost: 350,
    projectileSpeed: 600,
    special: "beam",
  },
  tesla: {
    name: "Tesla Coil",
    ring: "inner" as OrbitRing,
    fireRate: 600,
    damage: 10,
    range: 250,
    cost: 200,
    projectileSpeed: 450,
    special: "chain",
  },
  gravity: {
    name: "Gravity Well",
    ring: "outer" as OrbitRing,
    fireRate: 0,
    damage: 0,
    range: 350,
    cost: 300,
    projectileSpeed: 0,
    special: "slow",
  },
  emp: {
    name: "EMP Launcher",
    ring: "mid" as OrbitRing,
    fireRate: 1800,
    damage: 15,
    range: 450,
    cost: 350,
    projectileSpeed: 350,
    special: "stun",
  },
  shield: {
    name: "Shield Projector",
    ring: "outer" as OrbitRing,
    fireRate: 0,
    damage: 5,
    range: 400,
    cost: 400,
    projectileSpeed: 0,
    special: "shield",
  },
  drone: {
    name: "Drone Hub",
    ring: "outer" as OrbitRing,
    fireRate: 3000,
    damage: 15,
    range: 400,
    cost: 450,
    projectileSpeed: 0,
    special: "drone",
  },
} as const;
export type SatelliteType = keyof typeof SATELLITE_TYPES;

// ── Synergy Config ──
export const SYNERGY = {
  twinMaxAngle: (30 * Math.PI) / 180, // 30° in radians
  trinityMaxAngle: (25 * Math.PI) / 180, // 25° in radians
  crossRingMaxAngle: (35 * Math.PI) / 180, // 35° in radians
  twinFireRateBonus: 0.2, // +20% fire rate
  twinDamageBonus: 0.15, // +15% damage
  trinityDamageBonus: 0.3, // +30% damage
  crossRingRangeBonus: 0.1, // +10% range
} as const;

// ── Enemy Types ──
export const ENEMY_TYPES = {
  asteroid: { speed: 30, health: 80, damage: 1, radius: 24, score: 10, spawnDelay: 800 },
  scout: { speed: 60, health: 40, damage: 1, radius: 20, score: 20, spawnDelay: 400 },
  mothership: { speed: 15, health: 500, damage: 3, radius: 48, score: 100, spawnDelay: 2000 },
} as const;
export type EnemyTypeName = keyof typeof ENEMY_TYPES;

// ── Wave Config ──
export const WAVE_CONFIG = {
  initialDelay: 3000, // 3s grace period before wave 1
  buildPhaseDuration: 30000, // 30s between waves (decreases by 500ms per wave)
  minInterval: 20000, // minimum time between waves
  baseEnemies: 30, // asteroids in wave 1
  enemiesPerWave: 20, // extra asteroids per wave level
  scoutsStartWave: 2, // scouts first appear in wave 2
  scoutsPerWave: 20, // extra scouts per wave level
  mothershipEvery: 5, // mothership every Nth wave
  waveReward: 2000, // base money reward
  waveRewardPerWave: 500, // extra money per wave level
} as const;

// ── Colors ──
export const SPACE_COLORS = {
  SPACE_BG: 0x050510,
  STAR_DIM: 0x334466,
  STAR_BRIGHT: 0x8899cc,
  PLANET_RIM: 0x4488cc,
  ORBIT_RING: 0x334466,
  ASTEROID: 0x886644,
  SCOUT_BODY: 0x33ff66,
  MOTHERSHIP_BODY: 0xff3366,
  LASER_BEAM: 0x00ffff,
  MISSILE_TRAIL: 0xff8800,
  PLASMA_BLOB: 0x00ff88,
  RAILGUN_TRACER: 0xff4444,
  ION_BEAM: 0x88aaff,
  TESLA_ARC: 0x00ccff,
  SHIELD_ARC: 0x88ccff,
  DRONE_BODY: 0xffaa00,
  EXPLOSION: 0xffaa00,
} as const;
