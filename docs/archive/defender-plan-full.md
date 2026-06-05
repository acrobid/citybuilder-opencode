# City Defender — Implementation Plan (Tower Defense Expansion)

> **Tech**: Phaser 4.0 + Vite + TypeScript/CSS  
> **Perspective**: Top-down 2D grid on a circular planet with orbiting defense satellites  
> **Scope**: Planet map, 10 satellite types on orbit rings, synergy system, 3 enemy types, wave system, game-over condition  
> **Project root**: `.`  
> **Builds on**: Completed PLAN.md — all prior systems (grid, zones, power, economy, save/load) must still work

---

## How to Use This File

1. Find the first unchecked `- [ ]` in the Progress section below.
2. Read that step's full checklist and instructions. Do exactly what it says.
3. Follow the exact file paths and verification steps. Do not improvise file locations.
4. When finished, mark the step `[x]` and move to the next.
5. **Always start** by reading `src/config.ts` and any files referenced in the step — they may have been modified by prior steps.
6. **One step at a time.** Do not skip ahead or combine steps.
7. **Verify** after every step using the instructions given. If it doesn't work, fix before continuing.
8. Copy code blocks exactly. Replace placeholders like `…` with the actual surrounding code from the file.

---

## Architecture Summary

```
canvas (Phaser)                            DOM overlay (HTML/CSS)
┌───────────────────────────┐              ┌────────────────────┐
│ Space background + stars  │              │ Toolbar (buildings │
│ Planet circle (64x64 grid)│              │  + 10 satellites)  │
│ Buildings / zones         │              │ Stats (money, pop) │
│ Planet atmospheric rim    │              │ Wave counter       │
│ 3 orbit rings (dashed)    │              │ Orbit ring info    │
│ Satellites on rings       │              │ Synergy indicator  │
│ Sat. range overlays       │              │ Tile info panel    │
│ Projectiles (beams etc)   │              │ Game-over overlay  │
│ Enemies (asteroid/alien)  │              │ Save/Load buttons  │
│ Explosions / effects      │              │                    │
│ Camera pan/zoom           │              │                    │
└───────────────────────────┘              └────────────────────┘
            ↕ window.gameState bridge ↕
```

**Key design decisions:**

- Satellites are **not placed on the grid**. They orbit the planet on 3 concentric rings.
- Placement: select a satellite tool, click in space near the planet — satellite snaps to the nearest orbit ring at the cursor's angular position.
- Satellites continuously orbit (different speeds per ring). This makes synergy dynamic.
- Synergy: satellites close together on the same ring get combat bonuses. Encourages clustering at strategic angles.
- Planet surface tiles are still for city-building (RCI, roads, power). Only the circular planet area is buildable.

---

## 10 Satellite Types

| #   | Name             | Preferred Ring | Fire Rate | Damage   | Range | Cost | Special                                       |
| --- | ---------------- | -------------- | --------- | -------- | ----- | ---- | --------------------------------------------- |
| 1   | Laser Turret     | Inner          | 400ms     | 8        | 140   | $150 | —                                             |
| 2   | Missile Battery  | Mid            | 1400ms    | 35       | 280   | $300 | —                                             |
| 3   | Plasma Cannon    | Inner          | 900ms     | 25       | 100   | $250 | Splash 40px (50% dmg)                         |
| 4   | Railgun          | Mid            | 2200ms    | 60       | 350   | $400 | Pierces (hits all in line)                    |
| 5   | Ion Beam         | Outer          | 700ms     | 12       | 300   | $350 | Beam (hits all along path)                    |
| 6   | Tesla Coil       | Inner          | 600ms     | 10       | 130   | $200 | Chain 2 (arcs to 2 nearest, 50% dmg)          |
| 7   | Gravity Well     | Outer          | —         | 0        | 180   | $300 | Slows enemies 50% in range                    |
| 8   | EMP Launcher     | Mid            | 1800ms    | 15       | 250   | $350 | Stuns target 1.5s                             |
| 9   | Shield Projector | Outer          | —         | —        | 200   | $400 | Blocks enemies in 60° arc (push-back + 5 dmg) |
| 10  | Drone Hub        | Outer          | 3000ms    | 15/drone | 220   | $450 | Spawns 2 seeker drones (lasts 8s)             |

---

## Synergy System

Calculated each frame from current satellite positions:

- **Twin Synergy** (2 satellites on same ring within 30°): +20% fire rate, +15% damage
- **Trinity Synergy** (3+ satellites on same ring within 25°): +30% damage (stacks with Twin)
- **Cross-Ring** (2 satellites on different rings within 35°): +10% range for both

Synergy is displayed as a subtle colored glow on satellites and a "Synergy: X" line in the sidebar tile-info area when hovering a satellite.

---

## Orbit Mechanics

3 concentric rings around the planet center:

| Ring  | Radius (from center)  | Orbit Speed            | Best For                                         |
| ----- | --------------------- | ---------------------- | ------------------------------------------------ |
| Inner | PLANET_RADIUS + 64px  | 0.4 rad/s (~15.7s/rev) | Short-range (Laser, Plasma, Tesla)               |
| Mid   | PLANET_RADIUS + 128px | 0.25 rad/s (~25s/rev)  | Medium-range (Missile, Railgun, EMP)             |
| Outer | PLANET_RADIUS + 192px | 0.15 rad/s (~42s/rev)  | Long-range/support (Ion, Gravity, Shield, Drone) |

- Satellites are placed at a specific `angle` (radians) on a specific `ring`.
- Each frame: `angle += orbitSpeed * (delta / 1000)`. Wraps at 2π.
- World position: `x = centerX + cos(angle) * ringRadius`, `y = centerY + sin(angle) * ringRadius`.
- All angles use standard math convention: 0 = right (3 o'clock), increasing counterclockwise.

---

## Complete File Map (new + modified)

```
citybuilder-opencode/
├── index.html                         ← MODIFIED: wave counter, 10 satellite buttons, synergy display
├── src/
│   ├── main.ts                        ← MODIFIED: add wave/gameOver fields to gameState
│   ├── config.ts                      ← MODIFIED: planet, orbit, 10 satellite types, enemy types, wave config
│   ├── style.css                      ← MODIFIED: satellite buttons, wave info, game-over styles
│   ├── global.d.ts                    ← MODIFIED: new gameState fields
│   ├── scenes/
│   │   └── GameScene.ts               ← MODIFIED: add WaveSystem, DefenseSystem, enemy rendering
│   ├── map/
│   │   └── WorldMap.ts                ← MODIFIED: isOnPlanetSurface(), space rendering integration
│   ├── entities/
│   │   ├── Tile.ts                     (no changes — satellites are NOT tile-based)
│   │   ├── Enemy.ts                    ★ NEW: Enemy entity
│   │   └── OrbitalSatellite.ts         ★ NEW: OrbitalSatellite entity
│   ├── buildings/
│   │   ├── Building.ts                 (no changes)
│   │   └── Buildings.ts               ← MODIFIED: planet-surface placement validation
│   ├── systems/
│   │   ├── EconomySystem.ts            (no changes — satellites don't cost maintenance in v1)
│   │   ├── PopulationSystem.ts         (no changes)
│   │   ├── PowerSystem.ts              (no changes)
│   │   ├── ZoneSystem.ts              (no changes)
│   │   ├── WaveSystem.ts               ★ NEW: wave spawning, enemy management, difficulty scaling
│   │   └── DefenseSystem.ts            ★ NEW: satellite management, orbit movement, targeting, synergy, projectiles
│   ├── input/
│   │   └── InputHandler.ts            ← MODIFIED: orbit-ring satellite placement, drag threshold for clicks
│   ├── ui/
│   │   └── UIManager.ts               ← MODIFIED: 10 satellite buttons, wave display, synergy, game-over, keybindings
│   └── graphics/
│       ├── TileGraphics.ts             (no changes)
│       ├── SpaceGraphics.ts            ★ NEW: starfield, planet rim, orbit ring rendering
│       ├── EnemyGraphics.ts            ★ NEW: asteroid, scout, mothership, explosion rendering
│       └── SatelliteGraphics.ts        ★ NEW: 10 satellite sprites, projectiles, range circles
```

---

## Global State Bridge (new fields)

Add to `window.gameState` in `src/main.ts`:

```ts
wave: 0,               // current wave number (0 = pre-wave-1 build phase)
waveActive: false,     // true when enemies are spawning/active
enemiesRemaining: 0,   // count of living + queued enemies
gameOver: false,       // true when population = 0 after wave 1+
```

TypeScript declaration in `src/global.d.ts` must match.

---

## Config Additions

Append ALL of the following to `src/config.ts` (keep all existing exports — TILE_SIZE, MAP_COLS, MAP_ROWS, COLORS, GAME_WIDTH, GAME_HEIGHT):

```ts
// ── Planet ──
export const PLANET_CENTER_X = (MAP_COLS * TILE_SIZE) / 2; // 1024
export const PLANET_CENTER_Y = (MAP_ROWS * TILE_SIZE) / 2; // 1024
export const PLANET_RADIUS = 28 * TILE_SIZE; // 896px

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
    range: 140,
    cost: 150,
    projectileSpeed: 500,
    special: null,
  },
  missile: {
    name: "Missile Battery",
    ring: "mid" as OrbitRing,
    fireRate: 1400,
    damage: 35,
    range: 280,
    cost: 300,
    projectileSpeed: 300,
    special: null,
  },
  plasma: {
    name: "Plasma Cannon",
    ring: "inner" as OrbitRing,
    fireRate: 900,
    damage: 25,
    range: 100,
    cost: 250,
    projectileSpeed: 350,
    special: "splash",
  },
  railgun: {
    name: "Railgun",
    ring: "mid" as OrbitRing,
    fireRate: 2200,
    damage: 60,
    range: 350,
    cost: 400,
    projectileSpeed: 800,
    special: "pierce",
  },
  ion: {
    name: "Ion Beam",
    ring: "outer" as OrbitRing,
    fireRate: 700,
    damage: 12,
    range: 300,
    cost: 350,
    projectileSpeed: 600,
    special: "beam",
  },
  tesla: {
    name: "Tesla Coil",
    ring: "inner" as OrbitRing,
    fireRate: 600,
    damage: 10,
    range: 130,
    cost: 200,
    projectileSpeed: 450,
    special: "chain",
  },
  gravity: {
    name: "Gravity Well",
    ring: "outer" as OrbitRing,
    fireRate: 0,
    damage: 0,
    range: 180,
    cost: 300,
    projectileSpeed: 0,
    special: "slow",
  },
  emp: {
    name: "EMP Launcher",
    ring: "mid" as OrbitRing,
    fireRate: 1800,
    damage: 15,
    range: 250,
    cost: 350,
    projectileSpeed: 350,
    special: "stun",
  },
  shield: {
    name: "Shield Projector",
    ring: "outer" as OrbitRing,
    fireRate: 0,
    damage: 5,
    range: 200,
    cost: 400,
    projectileSpeed: 0,
    special: "shield",
  },
  drone: {
    name: "Drone Hub",
    ring: "outer" as OrbitRing,
    fireRate: 3000,
    damage: 15,
    range: 220,
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
  asteroid: { speed: 60, health: 30, damage: 1, radius: 8, score: 10, spawnDelay: 800 },
  scout: { speed: 120, health: 15, damage: 1, radius: 6, score: 20, spawnDelay: 400 },
  mothership: { speed: 25, health: 200, damage: 3, radius: 16, score: 100, spawnDelay: 2000 },
} as const;
export type EnemyTypeName = keyof typeof ENEMY_TYPES;

// ── Wave Config ──
export const WAVE_CONFIG = {
  initialDelay: 60000, // 60s build phase before wave 1
  buildPhaseDuration: 30000, // 30s between waves (decreases by 500ms per wave)
  minInterval: 20000, // minimum time between waves
  baseEnemies: 3, // asteroids in wave 1
  enemiesPerWave: 2, // extra asteroids per wave level
  scoutsStartWave: 2, // scouts first appear in wave 2
  scoutsPerWave: 2, // extra scouts per wave level
  mothershipEvery: 5, // mothership every Nth wave
  waveReward: 200, // base money reward
  waveRewardPerWave: 50, // extra money per wave level
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
```

---

## Progress

All steps use `.ts` extension (TypeScript).

---

### Phase 1: Planet Map

#### Step 1.1 — Update config and global types

What to do:

**1. Modify `src/config.ts`**: Append ALL exports from the "Config Additions" section above. Keep every existing export. The file will grow from ~20 lines to ~120 lines.

**2. Modify `src/global.d.ts`**: Replace the existing `gameState` interface. The new one:

```ts
export {};

declare global {
  interface Window {
    gameState: {
      selectedTool: string | null;
      money: number;
      population: number;
      date: number;
      income: number;
      expenses: number;
      wave: number;
      waveActive: boolean;
      enemiesRemaining: number;
      gameOver: boolean;
    };
  }
}
```

**3. Modify `src/main.ts`**: Add the new fields to the `window.gameState = { … }` object. Keep all existing fields, append:

```ts
wave: 0,
waveActive: false,
enemiesRemaining: 0,
gameOver: false,
```

Files modified: `src/config.ts`, `src/global.d.ts`, `src/main.ts`.

Verification:

- `pnpm run dev` — game loads with no console errors.
- In browser console: `window.gameState.wave` should log `0`.
- In browser console: `import('/src/config.js').then(m => console.log(m.PLANET_RADIUS))` should log `896`.

- [x] Step 1.1 complete

---

#### Step 1.2 — Create space graphics (starfield, planet rim, orbit rings)

What to do:

**Create `src/graphics/SpaceGraphics.ts`**:

```ts
import * as Phaser from "phaser";
import {
  TILE_SIZE,
  MAP_COLS,
  MAP_ROWS,
  PLANET_CENTER_X,
  PLANET_CENTER_Y,
  PLANET_RADIUS,
  ORBIT_RINGS,
  SPACE_COLORS,
} from "../config.js";

// ── Helpers ──

/** Deterministic hash for star positions */
function starHash(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) & 0x7fffffff;
  h = ((h >> 13) ^ h) * 1274126177;
  return (h >> 16) & 0xffff;
}

/** Fill a circle using horizontal scanlines */
export function fillCircle(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  r: number,
  color: number,
  alpha: number,
): void {
  g.fillStyle(color, alpha);
  const ir = Math.round(r);
  for (let row = -ir; row <= ir; row++) {
    const w = Math.sqrt(ir * ir - row * row) | 0;
    g.fillRect(Math.round(cx - w), Math.round(cy + row), w * 2, 1);
  }
}

// ── Main rendering ──

/** Draw deep space background + starfield across the entire map, but only on tiles outside the planet */
export function drawSpaceBackground(g: Phaser.GameObjects.Graphics): void {
  const mapW = MAP_COLS * TILE_SIZE;
  const mapH = MAP_ROWS * TILE_SIZE;

  g.fillStyle(SPACE_COLORS.SPACE_BG, 1);
  g.fillRect(0, 0, mapW, mapH);

  for (let y = 0; y < MAP_ROWS; y++) {
    for (let x = 0; x < MAP_COLS; x++) {
      const cx = x * TILE_SIZE + TILE_SIZE / 2;
      const cy = y * TILE_SIZE + TILE_SIZE / 2;
      const dx = cx - PLANET_CENTER_X;
      const dy = cy - PLANET_CENTER_Y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= PLANET_RADIUS) continue; // planet surface — drawn by WorldMap

      const hash = starHash(x, y);
      const px = x * TILE_SIZE;
      const py = y * TILE_SIZE;

      // 15% chance of a star in this tile
      if (hash % 100 < 15) {
        const brightness = hash % 100 < 5 ? 0.8 : 0.3;
        const color = hash % 3 === 0 ? SPACE_COLORS.STAR_BRIGHT : SPACE_COLORS.STAR_DIM;
        const sx = px + (hash % TILE_SIZE);
        const sy = py + ((hash >> 8) % TILE_SIZE);
        const size = hash % 4 === 0 ? 2 : 1;
        g.fillStyle(color, brightness);
        g.fillRect(sx, sy, size, size);
      }
    }
  }
}

/** Draw blue atmospheric rim around the planet edge */
export function drawPlanetRim(g: Phaser.GameObjects.Graphics): void {
  const centerX = PLANET_CENTER_X;
  const centerY = PLANET_CENTER_Y;
  const radius = PLANET_RADIUS;

  // 6 rings of dots fading outward
  for (let i = 0; i < 6; i++) {
    const alpha = 0.18 - i * 0.025;
    const r = radius + i;
    const steps = Math.floor((2 * Math.PI * r) / 5); // dot every ~5px
    g.fillStyle(SPACE_COLORS.PLANET_RIM, alpha);
    for (let s = 0; s < steps; s++) {
      const angle = (s / steps) * Math.PI * 2;
      const rx = centerX + Math.cos(angle) * r;
      const ry = centerY + Math.sin(angle) * r;
      g.fillRect(Math.round(rx), Math.round(ry), 2, 2);
    }
  }
}

/** Draw dashed orbit rings */
export function drawOrbitRings(g: Phaser.GameObjects.Graphics): void {
  const centerX = PLANET_CENTER_X;
  const centerY = PLANET_CENTER_Y;

  for (const [, ring] of Object.entries(ORBIT_RINGS)) {
    const r = ring.radius;
    const steps = Math.floor((2 * Math.PI * r) / 4); // dash every ~4px
    for (let s = 0; s < steps; s++) {
      // Dashed: only draw every other segment
      if (s % 3 === 0) continue;
      const angle = (s / steps) * Math.PI * 2;
      const rx = centerX + Math.cos(angle) * r;
      const ry = centerY + Math.sin(angle) * r;
      g.fillStyle(SPACE_COLORS.ORBIT_RING, 0.3);
      g.fillRect(Math.round(rx), Math.round(ry), 2, 2);
    }
  }
}

// ── Planet surface check ──

/** Check if world coordinates are on the planet surface */
export function isOnPlanet(worldX: number, worldY: number): boolean {
  const dx = worldX - PLANET_CENTER_X;
  const dy = worldY - PLANET_CENTER_Y;
  return Math.sqrt(dx * dx + dy * dy) <= PLANET_RADIUS;
}

/** Check if a tile (by grid col,row) is on the planet surface (uses tile center) */
export function isTileOnPlanet(tileX: number, tileY: number): boolean {
  const cx = tileX * TILE_SIZE + TILE_SIZE / 2;
  const cy = tileY * TILE_SIZE + TILE_SIZE / 2;
  return isOnPlanet(cx, cy);
}

/** Return the nearest orbit ring for a world position, or null if too far away */
export function nearestOrbitRing(worldX: number, worldY: number): keyof typeof ORBIT_RINGS | null {
  const dx = worldX - PLANET_CENTER_X;
  const dy = worldY - PLANET_CENTER_Y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  const rings = Object.entries(ORBIT_RINGS) as [
    keyof typeof ORBIT_RINGS,
    (typeof ORBIT_RINGS)[keyof typeof ORBIT_RINGS],
  ][];
  let best: keyof typeof ORBIT_RINGS | null = null;
  let bestDist = Infinity;

  for (const [key, ring] of rings) {
    const d = Math.abs(dist - ring.radius);
    if (d < bestDist) {
      bestDist = d;
      best = key;
    }
  }

  // Only snap if within 50px of a ring
  if (bestDist > 50) return null;
  return best;
}

/** Get angle from planet center to world position (radians, 0 = right) */
export function angleFromCenter(worldX: number, worldY: number): number {
  return Math.atan2(worldY - PLANET_CENTER_Y, worldX - PLANET_CENTER_X);
}
```

Files created: `src/graphics/SpaceGraphics.ts`.

Verification:

- No visible change yet. File compiles.

- [x] Step 1.2 complete

---

#### Step 1.3 — Integrate space rendering into WorldMap

What to do:

**Modify `src/map/WorldMap.ts`**:

Add import at top:

```ts
import {
  drawSpaceBackground,
  drawPlanetRim,
  drawOrbitRings,
  isTileOnPlanet,
} from "../graphics/SpaceGraphics.js";
```

Add method:

```ts
isOnPlanetSurface(tileX: number, tileY: number): boolean {
  return isTileOnPlanet(tileX, tileY);
}
```

Modify the `render()` method. The method currently starts with `graphics.clear();`. Replace the entire method body with:

```ts
render(graphics: Phaser.GameObjects.Graphics): void {
  graphics.clear();

  // Draw space background first (fills entire map, adds stars outside planet)
  drawSpaceBackground(graphics);

  // Draw planet atmospheric rim
  drawPlanetRim(graphics);

  // Draw orbit rings
  drawOrbitRings(graphics);

  for (let y = 0; y < this.rows; y++) {
    for (let x = 0; x < this.cols; x++) {
      const tile = this.tiles[y][x];
      const px = x * TILE_SIZE;
      const py = y * TILE_SIZE;

      // Skip tiles outside the planet circle (they're already space)
      if (!this.isOnPlanetSurface(x, y)) continue;

      switch (tile.zone) {
        case "road":
          drawRoadTile(graphics, x, y, px, py, this.tiles);
          break;
        case "residential":
          drawResidentialTile(graphics, x, y, px, py, tile.level);
          break;
        case "commercial":
          drawCommercialTile(graphics, x, y, px, py, tile.level);
          break;
        case "industrial":
          drawIndustrialTile(graphics, x, y, px, py, tile.level);
          break;
        case "powerplant":
          drawPowerPlantTile(graphics, x, y, px, py, this.tiles);
          break;
        default:
          drawEmptyTile(graphics, x, y, px, py);
          break;
      }

      // Power overlay (keep existing logic)
      if (tile.zone !== "empty" && tile.zone !== "road" && !tile.isPowered) {
        graphics.fillStyle(0x000000, 0.35);
        graphics.fillRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
      }

      if (
        tile.isPowered &&
        (tile.zone === "residential" || tile.zone === "commercial" || tile.zone === "industrial")
      ) {
        graphics.fillStyle(0xffdd00, 0.08);
        graphics.fillRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
      }

      // Grid lines
      graphics.fillStyle(COLORS.GRID_LINE, 0.1);
      graphics.fillRect(px, py, TILE_SIZE, 1);
      graphics.fillRect(px, py, 1, TILE_SIZE);
    }
  }
}
```

Also modify `canPlace2x2()` to add planet surface check. Replace the method with:

```ts
canPlace2x2(tile: Tile): boolean {
  const { x, y } = tile;
  if (x + 1 >= this.cols || y + 1 >= this.rows) return false;
  if (!this.isOnPlanetSurface(x, y) || !this.isOnPlanetSurface(x + 1, y) ||
      !this.isOnPlanetSurface(x, y + 1) || !this.isOnPlanetSurface(x + 1, y + 1)) return false;
  const tiles = [
    this.tiles[y][x],
    this.tiles[y][x + 1],
    this.tiles[y + 1][x],
    this.tiles[y + 1][x + 1],
  ];
  return tiles.every((t) => t.zone === "empty");
}
```

Files modified: `src/map/WorldMap.ts`.

Verification:

- `pnpm run dev` — a circular planet appears centered in space with stars, blue atmospheric rim, and 3 dashed orbit rings. The planet surface shows green grass with grid lines. Space outside is dark with stars.
- Place roads — they only appear inside the planet circle.
- Place near the edge — tiles outside the circle don't render.
- Camera pan/zoom still works.

- [x] Step 1.3 complete

---

#### Step 1.4 — Add planet-surface validation to building placement

What to do:

**Modify `src/buildings/Buildings.ts`**:

In the `canPlace()` function, add a planet surface check at the top (after the `if (!tile) return false;` line):

```ts
if (!tile) return false;
if (tile.zone !== "empty") return false;
if (!worldMap.isOnPlanetSurface(tile.x, tile.y)) return false;
```

This ensures no building can be placed outside the planet circle.

Files modified: `src/buildings/Buildings.ts`.

Verification:

- `pnpm run dev` — try placing a road in space (outside the planet). It should not place. Preview should show red.
- Place buildings on the planet surface — works normally.

- [x] Step 1.4 complete

---

### Phase 2: Enemies & Waves

#### Step 2.1 — Create Enemy entity

What to do:

**Create `src/entities/Enemy.ts`**:

```ts
import { PLANET_CENTER_X, PLANET_CENTER_Y } from "../config.js";

export type EnemyTypeName = "asteroid" | "scout" | "mothership";

export class Enemy {
  type: EnemyTypeName;
  worldX: number;
  worldY: number;
  health: number;
  maxHealth: number;
  speed: number;
  damage: number;
  radius: number;
  score: number;
  alive = true;
  hasSpawnedScouts = false;
  // Special effects (applied by DefenseSystem)
  slowTimer = 0; // >0 = slowed (remaining ms)
  stunTimer = 0; // >0 = stunned (remaining ms)

  constructor(
    type: EnemyTypeName,
    worldX: number,
    worldY: number,
    health: number,
    speed: number,
    damage: number,
    radius: number,
    score: number,
  ) {
    this.type = type;
    this.worldX = worldX;
    this.worldY = worldY;
    this.health = health;
    this.maxHealth = health;
    this.speed = speed;
    this.damage = damage;
    this.radius = radius;
    this.score = score;
  }

  /** Move toward planet center. Returns true if reached surface. */
  update(delta: number): boolean {
    // Handle stun
    if (this.stunTimer > 0) {
      this.stunTimer -= delta;
      return false; // don't move while stunned
    }

    const dx = PLANET_CENTER_X - this.worldX;
    const dy = PLANET_CENTER_Y - this.worldY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) return true;

    let effectiveSpeed = this.speed;
    if (this.slowTimer > 0) {
      effectiveSpeed *= 0.5;
      this.slowTimer -= delta;
    }

    const move = (effectiveSpeed * delta) / 1000;
    const nx = dx / dist;
    const ny = dy / dist;
    this.worldX += nx * move;
    this.worldY += ny * move;
    return false;
  }

  /** Returns true if enemy died */
  takeDamage(amount: number): boolean {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.alive = false;
      return true;
    }
    return false;
  }

  distanceToCenter(): number {
    const dx = PLANET_CENTER_X - this.worldX;
    const dy = PLANET_CENTER_Y - this.worldY;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
```

Files created: `src/entities/Enemy.ts`.

Verification:

- File compiles with no errors. Not yet wired.

- [x] Step 2.1 complete

---

#### Step 2.2 — Create WaveSystem

What to do:

**Create `src/systems/WaveSystem.ts`**:

```ts
import { Enemy, EnemyTypeName } from "../entities/Enemy.js";
import { ENEMY_TYPES, WAVE_CONFIG, PLANET_CENTER_X, PLANET_CENTER_Y } from "../config.js";
import type { WorldMap } from "../map/WorldMap.js";
import { isOnPlanet } from "../graphics/SpaceGraphics.js";

function randomSpawnPos(): { x: number; y: number } {
  const angle = Math.random() * Math.PI * 2;
  const spawnDist = 1500; // well outside view
  return {
    x: PLANET_CENTER_X + Math.cos(angle) * spawnDist,
    y: PLANET_CENTER_Y + Math.sin(angle) * spawnDist,
  };
}

interface QueuedSpawn {
  type: EnemyTypeName;
  delay: number; // ms from wave start
}

export class WaveSystem {
  enemies: Enemy[] = [];
  private waveNumber = 0;
  private waveActive = false;
  private inBuildPhase = true;
  private gameStarted = false;
  private buildPhaseEnd = 0;
  private waveStartTime = 0;
  private spawnQueue: QueuedSpawn[] = [];
  private spawnIndex = 0;
  private waveClearReward = 0;

  update(time: number, delta: number, worldMap: WorldMap): void {
    // Initialize on first frame
    if (!this.gameStarted) {
      this.gameStarted = true;
      this.buildPhaseEnd = time + WAVE_CONFIG.initialDelay;
      this.inBuildPhase = true;
      this.waveNumber = 0;
      window.gameState.wave = 0;
      window.gameState.waveActive = false;
      return;
    }

    // Build phase: check timer
    if (this.inBuildPhase) {
      if (time >= this.buildPhaseEnd) {
        this.startNextWave(time);
      }
      // Update enemies (mothership-scout spawned enemies may still exist)
      this.updateEnemies(delta, worldMap);
      window.gameState.enemiesRemaining =
        this.enemies.length + (this.spawnQueue.length - this.spawnIndex);
      return;
    }

    // Spawn queued enemies
    const elapsed = time - this.waveStartTime;
    while (this.spawnIndex < this.spawnQueue.length) {
      const s = this.spawnQueue[this.spawnIndex];
      if (elapsed >= s.delay) {
        this.spawnEnemy(s.type);
        this.spawnIndex++;
      } else {
        break;
      }
    }

    // Update all enemies
    this.updateEnemies(delta, worldMap);

    // Check wave complete
    if (this.spawnIndex >= this.spawnQueue.length && this.enemies.length === 0 && this.waveActive) {
      this.completeWave(time);
    }

    window.gameState.enemiesRemaining =
      this.enemies.length + (this.spawnQueue.length - this.spawnIndex);
  }

  private updateEnemies(delta: number, worldMap: WorldMap): void {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (!enemy.alive) {
        this.enemies.splice(i, 1);
        continue;
      }

      const hitSurface = enemy.update(delta);
      if (hitSurface) {
        this.doImpact(enemy, worldMap);
        this.enemies.splice(i, 1);
        continue;
      }

      // Mothership spawns scouts when close
      if (
        enemy.type === "mothership" &&
        !enemy.hasSpawnedScouts &&
        enemy.distanceToCenter() < 800
      ) {
        enemy.hasSpawnedScouts = true;
        this.spawnScoutsFrom(enemy.worldX, enemy.worldY, 3);
      }
    }
  }

  private spawnEnemy(type: EnemyTypeName): void {
    const cfg = ENEMY_TYPES[type];
    const pos = randomSpawnPos();
    const e = new Enemy(
      type,
      pos.x,
      pos.y,
      cfg.health,
      cfg.speed,
      cfg.damage,
      cfg.radius,
      cfg.score,
    );
    this.enemies.push(e);
  }

  private spawnScoutsFrom(x: number, y: number, count: number): void {
    const cfg = ENEMY_TYPES.scout;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const e = new Enemy(
        "scout",
        x + Math.cos(a) * 30,
        y + Math.sin(a) * 30,
        cfg.health,
        cfg.speed,
        cfg.damage,
        cfg.radius,
        cfg.score,
      );
      this.enemies.push(e);
    }
  }

  private doImpact(enemy: Enemy, worldMap: WorldMap): void {
    // Find tile at impact position
    const tile = worldMap.tileAt(enemy.worldX, enemy.worldY);
    if (!tile) return;

    // Damage the tile if it has health
    if (tile.zone !== "empty" && tile.zone !== "road") {
      if (tile.health === undefined || tile.health <= 0) {
        tile.health = tile.zone === "powerplant" ? 5 : 3;
      }
      tile.health -= enemy.damage;
      if (tile.health <= 0) {
        tile.zone = "empty";
        tile.level = 0;
        tile.health = 0;
      }
    } else if (tile.zone === "road") {
      // Roads take damage too
      if (tile.health === undefined || tile.health <= 0) tile.health = 2;
      tile.health -= enemy.damage;
      if (tile.health <= 0) {
        tile.zone = "empty";
        tile.level = 0;
        tile.health = 0;
      }
    }

    worldMap.recalculateConnectivity();
  }

  private startNextWave(time: number): void {
    this.waveNumber++;
    this.waveActive = true;
    this.inBuildPhase = false;
    this.waveStartTime = time;
    window.gameState.wave = this.waveNumber;
    window.gameState.waveActive = true;

    // Calculate composition
    const aCount = WAVE_CONFIG.baseEnemies + (this.waveNumber - 1) * WAVE_CONFIG.enemiesPerWave;
    const sCount =
      this.waveNumber >= WAVE_CONFIG.scoutsStartWave
        ? (this.waveNumber - WAVE_CONFIG.scoutsStartWave + 1) * WAVE_CONFIG.scoutsPerWave
        : 0;
    const hasMothership = this.waveNumber % WAVE_CONFIG.mothershipEvery === 0;

    // Build queue
    this.spawnQueue = [];
    let delay = 0;

    for (let i = 0; i < aCount; i++) {
      this.spawnQueue.push({ type: "asteroid", delay });
      delay += ENEMY_TYPES.asteroid.spawnDelay + Math.random() * 700;
    }
    for (let i = 0; i < sCount; i++) {
      this.spawnQueue.push({ type: "scout", delay });
      delay += ENEMY_TYPES.scout.spawnDelay + Math.random() * 500;
    }
    if (hasMothership) {
      this.spawnQueue.push({ type: "mothership", delay });
    }

    this.spawnIndex = 0;
  }

  private completeWave(time: number): void {
    this.waveActive = false;
    this.inBuildPhase = true;
    window.gameState.waveActive = false;
    window.gameState.enemiesRemaining = 0;
    this.enemies = [];
    this.spawnQueue = [];
    this.spawnIndex = 0;

    // Reward
    this.waveClearReward = WAVE_CONFIG.waveReward + this.waveNumber * WAVE_CONFIG.waveRewardPerWave;
    window.gameState.money += this.waveClearReward;

    // Next build phase
    const interval = Math.max(
      WAVE_CONFIG.minInterval,
      WAVE_CONFIG.buildPhaseDuration - this.waveNumber * 500,
    );
    this.buildPhaseEnd = time + interval;
  }

  getWaveNumber(): number {
    return this.waveNumber;
  }
  isBuildPhase(): boolean {
    return this.inBuildPhase;
  }
  getWaveClearReward(): number {
    return this.waveClearReward;
  }
}
```

Files created: `src/systems/WaveSystem.ts`.

Verification:

- File compiles. Not yet wired.

- [x] Step 2.2 complete

---

#### Step 2.3 — Create enemy graphics

What to do:

**Create `src/graphics/EnemyGraphics.ts`**:

```ts
import * as Phaser from "phaser";
import { SPACE_COLORS } from "../config.js";
import { Enemy } from "../entities/Enemy.js";
import { fillCircle } from "./SpaceGraphics.js";

function drawHealthBar(g: Phaser.GameObjects.Graphics, enemy: Enemy): void {
  const bw = enemy.radius * 2 + 4;
  const bh = 3;
  const bx = Math.round(enemy.worldX - bw / 2);
  const by = Math.round(enemy.worldY - enemy.radius - 10);

  g.fillStyle(0x333333, 0.8);
  g.fillRect(bx, by, bw, bh);

  const ratio = enemy.health / enemy.maxHealth;
  const fillColor = ratio > 0.5 ? 0x44cc44 : ratio > 0.25 ? 0xcccc44 : 0xcc4444;
  g.fillStyle(fillColor, 1);
  g.fillRect(bx, by, Math.round(bw * ratio), bh);
}

function drawAsteroid(g: Phaser.GameObjects.Graphics, enemy: Enemy): void {
  const cx = Math.round(enemy.worldX);
  const cy = Math.round(enemy.worldY);
  const r = enemy.radius;

  fillCircle(g, cx, cy, r, SPACE_COLORS.ASTEROID, 1);

  // Craters
  fillCircle(g, cx - 3, cy - 1, 2, 0x664422, 0.6);
  fillCircle(g, cx + 2, cy + 2, 2, 0x664422, 0.5);
  fillCircle(g, cx + 1, cy - 3, 1, 0x664422, 0.5);

  // Highlight
  fillCircle(g, cx - 2, cy - 2, r - 4, 0xaa8844, 0.3);

  drawHealthBar(g, enemy);
}

function drawScout(g: Phaser.GameObjects.Graphics, enemy: Enemy): void {
  const cx = Math.round(enemy.worldX);
  const cy = Math.round(enemy.worldY);

  // Body
  g.fillStyle(SPACE_COLORS.SCOUT_BODY, 1);
  g.fillRect(cx - 4, cy - 4, 8, 8);

  // Inner glow
  g.fillStyle(0x66ff99, 0.6);
  g.fillRect(cx - 2, cy - 2, 4, 4);

  // Engine trail
  g.fillStyle(0x33ff66, 0.4);
  g.fillRect(cx - 2, cy + 4, 4, 3);

  drawHealthBar(g, enemy);
}

function drawMothership(g: Phaser.GameObjects.Graphics, enemy: Enemy): void {
  const cx = Math.round(enemy.worldX);
  const cy = Math.round(enemy.worldY);
  const r = enemy.radius;

  fillCircle(g, cx, cy, r, SPACE_COLORS.MOTHERSHIP_BODY, 1);
  fillCircle(g, cx, cy, r - 4, 0xcc2244, 0.7);
  fillCircle(g, cx, cy, r - 8, 0xff6688, 0.8);

  // Pulsing aura
  const pulse = r + 2 + Math.sin(Date.now() / 300) * 2;
  fillCircle(g, cx, cy, Math.round(pulse), 0xff3366, 0.12);

  drawHealthBar(g, enemy);
}

export function drawEnemy(g: Phaser.GameObjects.Graphics, enemy: Enemy): void {
  switch (enemy.type) {
    case "asteroid":
      drawAsteroid(g, enemy);
      break;
    case "scout":
      drawScout(g, enemy);
      break;
    case "mothership":
      drawMothership(g, enemy);
      break;
  }
}

/** Short-lived explosion effect */
export function drawExplosion(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  r: number,
  alpha: number,
): void {
  fillCircle(g, Math.round(x), Math.round(y), r, SPACE_COLORS.EXPLOSION, alpha);
  fillCircle(g, Math.round(x), Math.round(y), Math.round(r * 0.6), 0xffdd44, alpha * 0.7);
}
```

Files created: `src/graphics/EnemyGraphics.ts`.

Verification:

- File compiles.

- [x] Step 2.3 complete

---

### Phase 3: Defense Satellites

#### Step 3.1 — Create OrbitalSatellite entity

What to do:

**Create `src/entities/OrbitalSatellite.ts`**:

```ts
import {
  SatelliteType,
  OrbitRing,
  ORBIT_RINGS,
  SATELLITE_TYPES,
  PLANET_CENTER_X,
  PLANET_CENTER_Y,
  SYNERGY,
} from "../config.js";

export class OrbitalSatellite {
  type: SatelliteType;
  ring: OrbitRing;
  angle: number; // radians, current angular position
  lastFireTime = 0; // scene time of last shot
  alive = true;
  // Synergy bonuses (recalculated each frame)
  hasTwinSynergy = false;
  hasTrinitySynergy = false;
  hasCrossRingSynergy = false;

  get config() {
    return SATELLITE_TYPES[this.type];
  }
  get name() {
    return this.config.name;
  }
  get fireRate() {
    let rate = this.config.fireRate;
    if (this.hasTwinSynergy) rate *= 1 - SYNERGY.twinFireRateBonus;
    return rate;
  }
  get damage() {
    let dmg = this.config.damage;
    if (this.hasTwinSynergy) dmg *= 1 + SYNERGY.twinDamageBonus;
    if (this.hasTrinitySynergy) dmg *= 1 + SYNERGY.trinityDamageBonus;
    return Math.round(dmg);
  }
  get range() {
    let rng = this.config.range;
    if (this.hasCrossRingSynergy) rng *= 1 + SYNERGY.crossRingRangeBonus;
    return rng;
  }

  get ringRadius() {
    return ORBIT_RINGS[this.ring].radius;
  }
  get orbitSpeed() {
    return ORBIT_RINGS[this.ring].speed;
  }

  get worldX() {
    return PLANET_CENTER_X + Math.cos(this.angle) * this.ringRadius;
  }
  get worldY() {
    return PLANET_CENTER_Y + Math.sin(this.angle) * this.ringRadius;
  }

  constructor(type: SatelliteType, ring: OrbitRing, angle: number) {
    this.type = type;
    this.ring = ring;
    this.angle = angle;
  }

  /** Move along orbit */
  orbit(delta: number): void {
    this.angle += this.orbitSpeed * (delta / 1000);
    // Normalize to [0, 2π)
    if (this.angle >= Math.PI * 2) this.angle -= Math.PI * 2;
    if (this.angle < 0) this.angle += Math.PI * 2;
  }

  /** Angular distance to another satellite (0 to π) */
  angularDistanceTo(other: OrbitalSatellite): number {
    let diff = Math.abs(this.angle - other.angle);
    if (diff > Math.PI) diff = Math.PI * 2 - diff;
    return diff;
  }
}
```

Files created: `src/entities/OrbitalSatellite.ts`.

Verification:

- File compiles.

- [x] Step 3.1 complete

---

#### Step 3.2 — Create satellite graphics (10 types + projectiles + range circles)

What to do:

**Create `src/graphics/SatelliteGraphics.ts`**:

This file has THREE jobs:

1. Draw each of the 10 satellite types as small sprites on orbit rings
2. Draw their projectiles
3. Draw range circles and synergy indicators

```ts
import * as Phaser from "phaser";
import { SPACE_COLORS, SYNERGY } from "../config.js";
import { OrbitalSatellite } from "../entities/OrbitalSatellite.js";
import { fillCircle } from "./SpaceGraphics.js";

// ── Satellite sprites ──

export function drawSatellite(g: Phaser.GameObjects.Graphics, sat: OrbitalSatellite): void {
  const cx = Math.round(sat.worldX);
  const cy = Math.round(sat.worldY);

  // Synergy glow (underneath)
  if (sat.hasTwinSynergy || sat.hasTrinitySynergy) {
    const glowAlpha = sat.hasTrinitySynergy ? 0.4 : 0.25;
    fillCircle(g, cx, cy, 8, 0xffffff, glowAlpha);
  }
  if (sat.hasCrossRingSynergy) {
    fillCircle(g, cx, cy, 9, 0x88aacc, 0.2);
  }

  // Draw type-specific shape
  switch (sat.type) {
    case "laser":
      drawLaserSat(g, cx, cy);
      break;
    case "missile":
      drawMissileSat(g, cx, cy);
      break;
    case "plasma":
      drawPlasmaSat(g, cx, cy);
      break;
    case "railgun":
      drawRailgunSat(g, cx, cy);
      break;
    case "ion":
      drawIonSat(g, cx, cy);
      break;
    case "tesla":
      drawTeslaSat(g, cx, cy);
      break;
    case "gravity":
      drawGravitySat(g, cx, cy);
      break;
    case "emp":
      drawEmpSat(g, cx, cy);
      break;
    case "shield":
      drawShieldSat(g, cx, cy);
      break;
    case "drone":
      drawDroneSat(g, cx, cy);
      break;
  }
}

// Type 1: Laser Turret — cyan diamond
function drawLaserSat(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  g.fillStyle(0x4488ff, 1);
  g.fillRect(cx - 3, cy - 3, 6, 6);
  g.fillStyle(SPACE_COLORS.LASER_BEAM, 1);
  g.fillRect(cx - 1, cy - 1, 2, 2);
}

// Type 2: Missile Battery — orange triangle
function drawMissileSat(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  g.fillStyle(0xff6644, 1);
  g.fillRect(cx - 3, cy - 2, 6, 5);
  g.fillStyle(SPACE_COLORS.MISSILE_TRAIL, 0.8);
  g.fillRect(cx - 1, cy - 3, 2, 2);
}

// Type 3: Plasma Cannon — green circle
function drawPlasmaSat(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  fillCircle(g, cx, cy, 4, 0x00ff66, 1);
  fillCircle(g, cx, cy, 2, 0x88ffbb, 0.8);
}

// Type 4: Railgun — long red rectangle
function drawRailgunSat(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  g.fillStyle(0xff4444, 1);
  g.fillRect(cx - 5, cy - 2, 10, 4);
  g.fillStyle(0xff8888, 0.6);
  g.fillRect(cx - 3, cy - 1, 6, 2);
}

// Type 5: Ion Beam — blue cross
function drawIonSat(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  g.fillStyle(0x6688cc, 1);
  g.fillRect(cx - 4, cy - 1, 8, 2);
  g.fillRect(cx - 1, cy - 4, 2, 8);
  g.fillStyle(SPACE_COLORS.ION_BEAM, 0.8);
  g.fillRect(cx - 1, cy - 1, 2, 2);
}

// Type 6: Tesla Coil — cyan spark
function drawTeslaSat(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  fillCircle(g, cx, cy, 4, 0x003344, 1);
  g.fillStyle(SPACE_COLORS.TESLA_ARC, 1);
  g.fillRect(cx - 1, cy - 4, 2, 8);
  g.fillRect(cx - 4, cy - 1, 8, 2);
  fillCircle(g, cx, cy, 2, 0xffffff, 0.9);
}

// Type 7: Gravity Well — purple swirl (simplified as ring)
function drawGravitySat(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  fillCircle(g, cx, cy, 5, 0x663388, 1);
  fillCircle(g, cx, cy, 3, 0x9966cc, 0.7);
  fillCircle(g, cx, cy, 1, 0xcc99ff, 1);
}

// Type 8: EMP Launcher — yellow lightning bolt
function drawEmpSat(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  g.fillStyle(0xcccc44, 1);
  g.fillRect(cx - 3, cy - 2, 6, 4);
  g.fillStyle(0xffff66, 0.9);
  // Lightning shape: zigzag
  g.fillRect(cx, cy - 3, 1, 2);
  g.fillRect(cx + 1, cy - 2, 1, 2);
  g.fillRect(cx - 1, cy - 1, 3, 1);
  g.fillRect(cx - 1, cy + 1, 1, 2);
}

// Type 9: Shield Projector — blue arc indicator
function drawShieldSat(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  fillCircle(g, cx, cy, 5, 0x334466, 1);
  g.fillStyle(SPACE_COLORS.SHIELD_ARC, 0.8);
  fillCircle(g, cx, cy, 3, 0x6699cc, 0.6);
  g.fillStyle(0xffffff, 0.5);
  g.fillRect(cx - 1, cy - 1, 2, 2);
}

// Type 10: Drone Hub — orange hexagon (simplified as circle with dots)
function drawDroneSat(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  fillCircle(g, cx, cy, 5, 0x553300, 1);
  g.fillStyle(SPACE_COLORS.DRONE_BODY, 0.9);
  fillCircle(g, cx, cy, 3, 0xffaa00, 0.7);
  // Small drone dots
  g.fillStyle(0xffcc44, 0.8);
  g.fillRect(cx - 5, cy - 2, 2, 2);
  g.fillRect(cx + 3, cy + 2, 2, 2);
}

// ── Range circle (shown on hover) ──
export function drawRangeCircle(
  g: Phaser.GameObjects.Graphics,
  wx: number,
  wy: number,
  range: number,
  color: number,
): void {
  const steps = Math.floor((2 * Math.PI * range) / 6);
  for (let s = 0; s < steps; s++) {
    const a = (s / steps) * Math.PI * 2;
    const rx = wx + Math.cos(a) * range;
    const ry = wy + Math.sin(a) * range;
    g.fillStyle(color, 0.2);
    g.fillRect(Math.round(rx), Math.round(ry), 2, 2);
  }
}

// ── Projectiles ──

export function drawLaserBeam(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
  g.fillStyle(SPACE_COLORS.LASER_BEAM, 1);
  g.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3);
  g.fillStyle(0xffffff, 0.7);
  g.fillRect(Math.round(x), Math.round(y), 1, 1);
}

export function drawMissileProj(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  angle: number,
): void {
  // Trail
  const tx = Math.round(x - Math.cos(angle) * 4);
  const ty = Math.round(y - Math.sin(angle) * 4);
  g.fillStyle(SPACE_COLORS.MISSILE_TRAIL, 0.5);
  g.fillRect(tx - 1, ty - 1, 3, 3);
  // Body
  g.fillStyle(SPACE_COLORS.MISSILE_TRAIL, 1);
  g.fillRect(Math.round(x) - 2, Math.round(y) - 2, 4, 4);
  g.fillStyle(0xffffff, 0.8);
  g.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2);
}

export function drawPlasmaBlob(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
  fillCircle(g, Math.round(x), Math.round(y), 3, SPACE_COLORS.PLASMA_BLOB, 1);
  fillCircle(g, Math.round(x), Math.round(y), 1, 0xffffff, 0.8);
}

export function drawRailgunTracer(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
  g.fillStyle(SPACE_COLORS.RAILGUN_TRACER, 1);
  g.fillRect(Math.round(x) - 3, Math.round(y) - 1, 6, 2);
  g.fillStyle(0xffffff, 0.9);
  g.fillRect(Math.round(x) - 1, Math.round(y), 2, 1);
}

export function drawIonBolt(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
  g.fillStyle(SPACE_COLORS.ION_BEAM, 1);
  g.fillRect(Math.round(x) - 2, Math.round(y) - 2, 4, 4);
  g.fillStyle(0xffffff, 0.6);
  g.fillRect(Math.round(x), Math.round(y), 1, 1);
}

export function drawTeslaBolt(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
  g.fillStyle(SPACE_COLORS.TESLA_ARC, 1);
  g.fillRect(Math.round(x) - 2, Math.round(y) - 1, 4, 2);
  g.fillRect(Math.round(x) - 1, Math.round(y) - 2, 2, 4);
  g.fillStyle(0xffffff, 0.9);
  g.fillRect(Math.round(x), Math.round(y), 1, 1);
}

export function drawEMPWave(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
  fillCircle(g, Math.round(x), Math.round(y), 3, 0xffff44, 0.8);
  fillCircle(g, Math.round(x), Math.round(y), 5, 0xffff44, 0.3);
}

export function drawShieldWave(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
  fillCircle(g, Math.round(x), Math.round(y), 4, SPACE_COLORS.SHIELD_ARC, 0.6);
  fillCircle(g, Math.round(x), Math.round(y), 6, SPACE_COLORS.SHIELD_ARC, 0.2);
}

export function drawDroneProj(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
  g.fillStyle(SPACE_COLORS.DRONE_BODY, 1);
  g.fillRect(Math.round(x) - 2, Math.round(y) - 2, 4, 4);
  g.fillStyle(0xffcc44, 0.7);
  g.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2);
}
```

Files created: `src/graphics/SatelliteGraphics.ts`.

Verification:

- File compiles.

- [x] Step 3.2 complete

---

#### Step 3.3 — Create DefenseSystem (the big one)

What to do:

**Create `src/systems/DefenseSystem.ts`**. This manages ALL satellite logic: placement, orbit movement, synergy calculation, targeting, firing, projectiles, special effects.

```ts
import * as Phaser from "phaser";
import {
  SATELLITE_TYPES,
  ORBIT_RINGS,
  SYNERGY,
  PLANET_CENTER_X,
  PLANET_CENTER_Y,
} from "../config.js";
import type { OrbitRing, SatelliteType } from "../config.js";
import { OrbitalSatellite } from "../entities/OrbitalSatellite.js";
import { Enemy } from "../entities/Enemy.js";
import {
  drawLaserBeam,
  drawMissileProj,
  drawPlasmaBlob,
  drawRailgunTracer,
  drawIonBolt,
  drawTeslaBolt,
  drawEMPWave,
  drawShieldWave,
  drawDroneProj,
} from "../graphics/SatelliteGraphics.js";

interface Projectile {
  worldX: number;
  worldY: number;
  targetEnemy: Enemy | null;
  speed: number;
  damage: number;
  alive: boolean;
  drawType: SatelliteType;
  angle: number;
  // specials
  piercedEnemies: Set<Enemy>; // railgun
  chainCount: number; // tesla
  droneLifetime: number; // drone hub
}

// Drone entity for drone hub
interface Drone {
  worldX: number;
  worldY: number;
  targetEnemy: Enemy | null;
  lifetime: number;
  damage: number;
  speed: number;
}

export class DefenseSystem {
  satellites: OrbitalSatellite[] = [];
  projectiles: Projectile[] = [];
  drones: Drone[] = [];
  private cooldowns: Map<OrbitalSatellite, number> = new Map();
  // Explosion effects (position, radius, remaining time)
  explosions: { x: number; y: number; r: number; time: number }[] = [];

  /** Place a satellite on the nearest ring at the cursor angle. Returns false if can't afford. */
  placeSatellite(type: SatelliteType, angle: number, ring: OrbitRing): boolean {
    const config = SATELLITE_TYPES[type];
    if (window.gameState.money < config.cost) return false;
    window.gameState.money -= config.cost;

    const sat = new OrbitalSatellite(type, ring, angle);
    this.satellites.push(sat);
    this.cooldowns.set(sat, 0);
    return true;
  }

  /** Remove and refund the satellite closest to the given world position */
  removeSatellite(worldX: number, worldY: number): boolean {
    let closest: OrbitalSatellite | null = null;
    let closestDist = 30; // 30px snap radius

    for (const sat of this.satellites) {
      const dx = sat.worldX - worldX;
      const dy = sat.worldY - worldY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < closestDist) {
        closestDist = dist;
        closest = sat;
      }
    }

    if (closest) {
      const refund = Math.floor(SATELLITE_TYPES[closest.type].cost * 0.5);
      window.gameState.money += refund;
      this.satellites = this.satellites.filter((s) => s !== closest);
      this.cooldowns.delete(closest);
      return true;
    }
    return false;
  }

  /** Calculate synergy for all satellites based on current positions */
  private calculateSynergy(): void {
    // Reset all
    for (const sat of this.satellites) {
      sat.hasTwinSynergy = false;
      sat.hasTrinitySynergy = false;
      sat.hasCrossRingSynergy = false;
    }

    const count = this.satellites.length;
    for (let i = 0; i < count; i++) {
      const a = this.satellites[i];
      let sameRingCount = 1;
      let differentRingSynergy = false;

      for (let j = 0; j < count; j++) {
        if (i === j) continue;
        const b = this.satellites[j];
        const angDist = a.angularDistanceTo(b);

        if (a.ring === b.ring) {
          // Same ring: check for twin/trinity
          if (angDist <= SYNERGY.twinMaxAngle) {
            sameRingCount++;
          }
        } else {
          // Different ring: check for cross-ring
          if (angDist <= SYNERGY.crossRingMaxAngle) {
            differentRingSynergy = true;
          }
        }
      }

      if (sameRingCount >= 3) a.hasTrinitySynergy = true;
      if (sameRingCount >= 2) a.hasTwinSynergy = true;
      if (differentRingSynergy) a.hasCrossRingSynergy = true;
    }
  }

  /** Main update: orbit, synergy, fire, projectiles, specials */
  update(time: number, delta: number, enemies: Enemy[]): void {
    // Orbit all satellites
    for (const sat of this.satellites) {
      sat.orbit(delta);
    }

    // Calculate synergy
    this.calculateSynergy();

    // Fire from each satellite
    for (const sat of this.satellites) {
      const config = sat.config;
      if (config.fireRate === 0) continue; // non-firing types (gravity, shield)

      const lastFire = this.cooldowns.get(sat) || 0;
      if (time - lastFire < sat.fireRate) continue;

      // Apply special non-projectile effects
      if (config.special === "slow") {
        this.applyGravityEffect(sat, enemies);
        this.cooldowns.set(sat, time);
        continue;
      }
      if (config.special === "shield") {
        this.applyShieldEffect(sat, enemies, delta);
        this.cooldowns.set(sat, time);
        continue;
      }
      if (config.special === "drone") {
        this.spawnDrones(sat, enemies);
        this.cooldowns.set(sat, time);
        continue;
      }

      // Find closest enemy in range
      const closest = this.findClosestEnemy(sat, enemies);
      if (!closest) continue;

      this.cooldowns.set(sat, time);

      // Create projectile
      const angle = Math.atan2(closest.worldY - sat.worldY, closest.worldX - sat.worldX);
      this.projectiles.push({
        worldX: sat.worldX,
        worldY: sat.worldY,
        targetEnemy: closest,
        speed: config.projectileSpeed,
        damage: sat.damage,
        alive: true,
        drawType: sat.type,
        angle,
        piercedEnemies: new Set(),
        chainCount: 0,
        droneLifetime: 0,
      });
    }

    // Apply continuous effects (for gravity well passives)
    for (const sat of this.satellites) {
      if (sat.config.special === "slow") {
        this.applyGravitySlow(sat, enemies, delta);
      }
    }

    // Update drones
    this.updateDrones(delta, enemies);

    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      if (!p.alive) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // If target is dead, find new target or die
      if (!p.targetEnemy || !p.targetEnemy.alive) {
        if (p.drawType === "tesla" && p.chainCount < 2) {
          // Tesla chains to next enemy
          const next = this.findClosestEnemyAt(p.worldX, p.worldY, 60, enemies, p.piercedEnemies);
          if (next) {
            p.targetEnemy = next;
            p.chainCount++;
            p.damage = Math.floor(p.damage * 0.5);
          } else {
            p.alive = false;
            continue;
          }
        } else if (p.drawType === "railgun") {
          // Railgun keeps going in same direction
          p.worldX += (Math.cos(p.angle) * (p.speed * delta)) / 1000;
          p.worldY += (Math.sin(p.angle) * (p.speed * delta)) / 1000;
          // Check if off screen
          if (
            Math.abs(p.worldX - PLANET_CENTER_X) > 1500 ||
            Math.abs(p.worldY - PLANET_CENTER_Y) > 1500
          ) {
            p.alive = false;
          }
          continue;
        } else {
          p.alive = false;
          continue;
        }
      }

      // Move toward target
      const dx = p.targetEnemy.worldX - p.worldX;
      const dy = p.targetEnemy.worldY - p.worldY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 8) {
        // Hit!
        this.doProjectileHit(p, enemies);
        continue;
      }

      const move = (p.speed * delta) / 1000;
      const nx = dx / dist;
      const ny = dy / dist;
      p.worldX += nx * move;
      p.worldY += ny * move;
      p.angle = Math.atan2(ny, nx);
    }

    // Update explosions
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      this.explosions[i].time -= delta;
      if (this.explosions[i].time <= 0) {
        this.explosions.splice(i, 1);
      }
    }
  }

  private doProjectileHit(p: Projectile, enemies: Enemy[]): void {
    const config = SATELLITE_TYPES[p.drawType];

    if (config.special === "pierce" && p.targetEnemy) {
      // Railgun: damage target and continue
      p.targetEnemy.takeDamage(p.damage);
      p.piercedEnemies.add(p.targetEnemy);
      p.targetEnemy = null; // will continue in update loop
      return;
    }

    if (config.special === "chain" && p.targetEnemy) {
      // Tesla: damage target, then chain
      p.targetEnemy.takeDamage(p.damage);
      p.piercedEnemies.add(p.targetEnemy);
      if (p.chainCount < 2) {
        const next = this.findClosestEnemyAt(p.worldX, p.worldY, 60, enemies, p.piercedEnemies);
        if (next) {
          p.targetEnemy = next;
          p.chainCount++;
          p.damage = Math.floor(p.damage * 0.5);
          return; // don't kill projectile
        }
      }
      // Kill target and explode
      if (p.targetEnemy.alive) p.targetEnemy.takeDamage(Number.MAX_SAFE_INTEGER); // force kill
      this.addExplosion(p.worldX, p.worldY, 6, 200);
      p.alive = false;
      return;
    }

    if (config.special === "splash" && p.targetEnemy) {
      // Plasma: damage target + splash nearby
      p.targetEnemy.takeDamage(p.damage);
      for (const e of enemies) {
        if (!e.alive || e === p.targetEnemy) continue;
        const dx = e.worldX - p.worldX;
        const dy = e.worldY - p.worldY;
        if (Math.sqrt(dx * dx + dy * dy) < 40) {
          e.takeDamage(Math.floor(p.damage * 0.5));
        }
      }
      this.addExplosion(p.worldX, p.worldY, 8, 250);
      p.alive = false;
      return;
    }

    if (config.special === "beam" && p.targetEnemy) {
      // Ion: hit all enemies along the beam path
      const startX = p.worldX;
      const startY = p.worldY;
      for (const e of enemies) {
        if (!e.alive) continue;
        const dx = e.worldX - startX;
        const dy = e.worldY - startY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 20) {
          // thin beam, check proximity to line
          e.takeDamage(p.damage);
        }
      }
      p.targetEnemy.takeDamage(p.damage);
      p.alive = false;
      return;
    }

    if (config.special === "stun" && p.targetEnemy) {
      // EMP: damage + stun
      p.targetEnemy.takeDamage(p.damage);
      p.targetEnemy.stunTimer = 1500;
      this.addExplosion(p.worldX, p.worldY, 10, 300);
      p.alive = false;
      return;
    }

    // Default: direct hit
    if (p.targetEnemy) {
      p.targetEnemy.takeDamage(p.damage);
      if (!p.targetEnemy.alive) {
        this.addExplosion(p.targetEnemy.worldX, p.targetEnemy.worldY, p.targetEnemy.radius, 300);
      }
    }
    p.alive = false;
  }

  private findClosestEnemy(sat: OrbitalSatellite, enemies: Enemy[]): Enemy | null {
    return this.findClosestEnemyAt(sat.worldX, sat.worldY, sat.range, enemies, new Set());
  }

  private findClosestEnemyAt(
    wx: number,
    wy: number,
    range: number,
    enemies: Enemy[],
    exclude: Set<Enemy>,
  ): Enemy | null {
    let best: Enemy | null = null;
    let bestDist = range;
    for (const e of enemies) {
      if (!e.alive || exclude.has(e)) continue;
      const dx = e.worldX - wx;
      const dy = e.worldY - wy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < bestDist) {
        bestDist = dist;
        best = e;
      }
    }
    return best;
  }

  // ── Special effects ──

  private applyGravityEffect(sat: OrbitalSatellite, enemies: Enemy[]): void {
    // Visual pulse (handled by the continuous slow below)
  }

  private applyGravitySlow(sat: OrbitalSatellite, enemies: Enemy[], _delta: number): void {
    for (const e of enemies) {
      if (!e.alive) continue;
      const dx = e.worldX - sat.worldX;
      const dy = e.worldY - sat.worldY;
      if (Math.sqrt(dx * dx + dy * dy) < sat.range) {
        e.slowTimer = 200; // keep refreshing while in range
      }
    }
  }

  private applyShieldEffect(sat: OrbitalSatellite, enemies: Enemy[], _delta: number): void {
    // Shield arc: 60° cone facing outward from planet
    const satAngle = sat.angle; // satellite's angle from planet center
    for (const e of enemies) {
      if (!e.alive) continue;
      const dx = e.worldX - sat.worldX;
      const dy = e.worldY - sat.worldY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > sat.range) continue;

      // Check if enemy is in the shield arc (facing outward from planet)
      const enemyAngle = Math.atan2(e.worldY - PLANET_CENTER_Y, e.worldX - PLANET_CENTER_X);
      let diff = Math.abs(enemyAngle - satAngle);
      if (diff > Math.PI) diff = Math.PI * 2 - diff;
      if (diff < (30 * Math.PI) / 180) {
        // 30° half-angle = 60° cone
        // Push enemy back
        const nx = dx / dist;
        const ny = dy / dist;
        e.worldX += nx * 3;
        e.worldY += ny * 3;
        e.takeDamage(5);
        e.stunTimer = 200;
      }
    }
  }

  private spawnDrones(sat: OrbitalSatellite, enemies: Enemy[]): void {
    const closest = this.findClosestEnemy(sat, enemies);
    if (!closest) return;

    for (let i = 0; i < 2; i++) {
      const offX = (Math.random() - 0.5) * 20;
      const offY = (Math.random() - 0.5) * 20;
      this.drones.push({
        worldX: sat.worldX + offX,
        worldY: sat.worldY + offY,
        targetEnemy: closest,
        lifetime: 8000,
        damage: sat.config.damage,
        speed: 200,
      });
    }
  }

  private updateDrones(delta: number, enemies: Enemy[]): void {
    for (let i = this.drones.length - 1; i >= 0; i--) {
      const d = this.drones[i];
      d.lifetime -= delta;
      if (d.lifetime <= 0) {
        this.drones.splice(i, 1);
        continue;
      }

      // Find or refresh target
      if (!d.targetEnemy || !d.targetEnemy.alive) {
        d.targetEnemy = this.findClosestEnemyAt(d.worldX, d.worldY, 300, enemies, new Set());
      }
      if (!d.targetEnemy) {
        this.drones.splice(i, 1);
        continue;
      }

      // Move toward target
      const dx = d.targetEnemy.worldX - d.worldX;
      const dy = d.targetEnemy.worldY - d.worldY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 6) {
        d.targetEnemy.takeDamage(d.damage);
        this.drones.splice(i, 1);
        continue;
      }
      const move = (d.speed * delta) / 1000;
      d.worldX += (dx / dist) * move;
      d.worldY += (dy / dist) * move;
    }
  }

  // ── Effects ──

  private addExplosion(x: number, y: number, r: number, duration: number): void {
    this.explosions.push({ x, y, r, time: duration });
  }

  // ── Rendering ──

  render(g: Phaser.GameObjects.Graphics): void {
    // Drones
    for (const d of this.drones) {
      drawDroneProj(g, d.worldX, d.worldY);
    }

    // Projectiles
    for (const p of this.projectiles) {
      if (!p.alive) continue;
      switch (p.drawType) {
        case "laser":
          drawLaserBeam(g, p.worldX, p.worldY);
          break;
        case "missile":
          drawMissileProj(g, p.worldX, p.worldY, p.angle);
          break;
        case "plasma":
          drawPlasmaBlob(g, p.worldX, p.worldY);
          break;
        case "railgun":
          drawRailgunTracer(g, p.worldX, p.worldY);
          break;
        case "ion":
          drawIonBolt(g, p.worldX, p.worldY);
          break;
        case "tesla":
          drawTeslaBolt(g, p.worldX, p.worldY);
          break;
        case "emp":
          drawEMPWave(g, p.worldX, p.worldY);
          break;
        case "shield":
          drawShieldWave(g, p.worldX, p.worldY);
          break;
        case "drone":
          drawDroneProj(g, p.worldX, p.worldY);
          break;
        default:
          drawLaserBeam(g, p.worldX, p.worldY);
          break;
      }
    }

    // Explosions
    for (const ex of this.explosions) {
      const alpha = Math.max(0, ex.time / 500);
      const { drawExplosion } = require("../graphics/SatelliteGraphics.js") as never;
      // Re-import at top needed — see note below
      import("../graphics/EnemyGraphics.js").then((m) => {
        m.drawExplosion(g, ex.x, ex.y, ex.r, alpha);
      });
    }
  }
}
```

> **IMPORTANT FIX**: The explosion rendering at the bottom uses a dynamic import which won't work. Instead, modify the file to import `drawExplosion` from EnemyGraphics at the top and use it directly:

At the top of DefenseSystem.ts, add: `import { drawExplosion } from "../graphics/EnemyGraphics.js";`

Then in the render method, replace the explosion block with:

```ts
// Explosions
for (const ex of this.explosions) {
  const alpha = Math.max(0, ex.time / 500);
  drawExplosion(g, ex.x, ex.y, ex.r, alpha);
}
```

Files created: `src/systems/DefenseSystem.ts`.

Verification:

- File compiles. Not yet wired.

- [x] Step 3.3 complete

---

#### Step 3.4 — Wire satellite placement in InputHandler

What to do:

**Modify `src/input/InputHandler.ts`**:

a) Add import:

```ts
import { nearestOrbitRing, angleFromCenter } from "../graphics/SpaceGraphics.js";
import type { DefenseSystem } from "../systems/DefenseSystem.js";
import { SATELLITE_TYPES } from "../config.js";
import type { SatelliteType } from "../config.js";
```

b) Update the `ToolScene` interface to include defenseSystem:

```ts
interface ToolScene {
  worldMap: WorldMap;
  graphics: Phaser.GameObjects.Graphics;
  economy: EconomySystem;
  uiManager?: UIManager;
  defenseSystem?: DefenseSystem;
  cameras: { main: Phaser.Cameras.Scene2D.Camera };
  input: Phaser.Input.InputPlugin;
  time: { now: number };
}
```

c) In `handleClick()`, add satellite handling. After the `if (tool === "bulldoze")` block, add:

```ts
// Check if it's a satellite tool
const satType = tool as SatelliteType;
if (SATELLITE_TYPES[satType as keyof typeof SATELLITE_TYPES]) {
  const ring = nearestOrbitRing(worldPoint.x, worldPoint.y);
  if (ring && this.scene.defenseSystem) {
    const angle = angleFromCenter(worldPoint.x, worldPoint.y);
    this.scene.defenseSystem.placeSatellite(satType, angle, ring);
    this.scene.worldMap.render(this.scene.graphics);
  }
  return;
}
```

d) In the bulldoze handling in `handleClick()`, also check for satellites. Replace the bulldoze branch:

```ts
if (tool === "bulldoze") {
  // Try bulldozing a satellite first
  if (
    this.scene.defenseSystem &&
    this.scene.defenseSystem.removeSatellite(worldPoint.x, worldPoint.y)
  ) {
    this.scene.worldMap.render(this.scene.graphics);
    return;
  }
  this.doBulldoze(tile);
}
```

e) In `setupTools()`, add satellite preview. After the existing `drawPreview(tile)` call in the pointermove handler, add satellite preview logic:

In the `setupTools()` method, modify the pointermove handler to also handle satellite tool previews. After the existing `this.drawPreview(tile);` line, add:

```ts
// Satellite preview
const satType = window.gameState.selectedTool as SatelliteType;
if (satType && SATELLITE_TYPES[satType as keyof typeof SATELLITE_TYPES]) {
  const ring = nearestOrbitRing(worldPoint.x, worldPoint.y);
  if (ring) {
    const angle = angleFromCenter(worldPoint.x, worldPoint.y);
    const satConfig = SATELLITE_TYPES[satType as keyof typeof SATELLITE_TYPES];
    const ringConfig = ORBIT_RINGS[ring as keyof typeof ORBIT_RINGS];
    const wx = PLANET_CENTER_X + Math.cos(angle) * ringConfig.radius;
    const wy = PLANET_CENTER_Y + Math.sin(angle) * ringConfig.radius;
    // Draw preview circle at satellite position
    scene.graphics.fillStyle(0xffffff, 0.3);
    scene.graphics.fillRect(wx - 4, wy - 4, 8, 8);
    // Draw range circle
    drawRangeCircle(scene.graphics, wx, wy, satConfig.range, 0x88ccff);
  }
}
```

Add these imports at the top of InputHandler.ts:

```ts
import { nearestOrbitRing, angleFromCenter, isOnPlanet } from "../graphics/SpaceGraphics.js";
import { SATELLITE_TYPES, ORBIT_RINGS, PLANET_CENTER_X, PLANET_CENTER_Y } from "../config.js";
import type { SatelliteType } from "../config.js";
import { drawRangeCircle } from "../graphics/SatelliteGraphics.js";
```

Files modified: `src/input/InputHandler.ts`.

Verification:

- `pnpm run dev` — not wired to GameScene yet. File should compile.

- [x] Step 3.4 complete

---

### Phase 4: UI Integration

#### Step 4.1 — Update HTML with satellite buttons and wave/defense UI

What to do:

**Modify `index.html`**:

Replace the entire content with the updated version below. Keep the same structure but add satellite buttons, wave info, and game-over overlay:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>City Defender</title>
    <link rel="stylesheet" href="/src/style.css" />
  </head>
  <body>
    <div id="app">
      <div id="game-container"></div>
      <div id="sidebar">
        <div id="stats">
          <div>Money: $<span id="stat-money">0</span></div>
          <div>Population: <span id="stat-pop">0</span></div>
          <div>Income: $<span id="stat-income">0</span>/mo</div>
          <div>Expenses: $<span id="stat-expenses">0</span>/mo</div>
          <div>Date: <span id="stat-date">Month 1, Year 1</span></div>
        </div>
        <div id="wave-info">
          <div>Phase: <span id="stat-phase">Building</span></div>
          <div>Wave: <span id="stat-wave">0</span></div>
          <div>Enemies: <span id="stat-enemies">0</span></div>
        </div>
        <div id="toolbar">
          <div class="toolbar-label">BUILDINGS</div>
          <button data-tool="road">Road ($10)</button>
          <button data-tool="residential">Residential ($50)</button>
          <button data-tool="commercial">Commercial ($75)</button>
          <button data-tool="industrial">Industrial ($100)</button>
          <button data-tool="powerplant">Power Plant ($500)</button>
          <hr style="border-color: #444; margin: 4px 0" />
          <div class="toolbar-label">DEFENSE</div>
          <button data-tool="laser">Laser Turret ($150)</button>
          <button data-tool="missile">Missile Battery ($300)</button>
          <button data-tool="plasma">Plasma Cannon ($250)</button>
          <button data-tool="railgun">Railgun ($400)</button>
          <button data-tool="ion">Ion Beam ($350)</button>
          <button data-tool="tesla">Tesla Coil ($200)</button>
          <button data-tool="gravity">Gravity Well ($300)</button>
          <button data-tool="emp">EMP Launcher ($350)</button>
          <button data-tool="shield">Shield Projector ($400)</button>
          <button data-tool="drone">Drone Hub ($450)</button>
          <hr style="border-color: #444; margin: 4px 0" />
          <button data-tool="bulldoze" class="danger">Bulldoze</button>
          <hr style="border-color: #444; margin: 4px 0" />
          <button id="btn-save">Save Game</button>
          <button id="btn-load">Load Game</button>
        </div>
        <div id="tile-info"></div>
        <div id="game-over" style="display:none;">
          <div style="font-size:14px;color:#ff4444;margin-bottom:8px;">CITY DESTROYED</div>
          <div id="go-wave">Wave: 0</div>
          <button id="btn-restart" style="margin-top:8px;">Restart</button>
        </div>
      </div>
    </div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

Files modified: `index.html`.

Verification:

- `pnpm run dev` — sidebar shows building section, defense section (10 satellites), wave info, and game-over panel (hidden). All 10 satellite buttons visible.

- [x] Step 4.1 complete

---

#### Step 4.2 — Update CSS

What to do:

**Modify `src/style.css`**:

Add these styles at the end of the file (keep all existing):

```css
.toolbar-label {
  font-size: 10px;
  color: #6688aa;
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 4px 0 2px 4px;
}

#wave-info {
  font-size: 12px;
  line-height: 1.5;
  padding: 6px 0;
  border-top: 1px solid #333;
  border-bottom: 1px solid #333;
}

#wave-info #stat-phase {
  color: #88aacc;
}

#toolbar {
  max-height: calc(100vh - 320px);
  overflow-y: auto;
}

#game-over {
  padding: 12px;
  background: #441111;
  border-radius: 4px;
  text-align: center;
}

#game-over button {
  padding: 6px 14px;
  border: 1px solid #882222;
  background: #aa3333;
  color: #ddd;
  cursor: pointer;
  font-family: monospace;
  font-size: 12px;
  border-radius: 4px;
}

#game-over button:hover {
  background: #cc4444;
}
```

Files modified: `src/style.css`.

Verification:

- `pnpm run dev` — toolbar scrollable if too many buttons. Defense section has a label header. Wave-info is styled.

- [x] Step 4.2 complete

---

#### Step 4.3 — Update UIManager with wave/defense/game-over

What to do:

**Modify `src/ui/UIManager.ts`**:

a) Add new property queries in constructor (after existing element queries):

```ts
phaseEl: HTMLElement | null;
waveEl: HTMLElement | null;
enemiesEl: HTMLElement | null;
gameOverEl: HTMLElement | null;
goWaveEl: HTMLElement | null;
```

In constructor, query them:

```ts
this.phaseEl = document.getElementById("stat-phase");
this.waveEl = document.getElementById("stat-wave");
this.enemiesEl = document.getElementById("stat-enemies");
this.gameOverEl = document.getElementById("game-over");
this.goWaveEl = document.getElementById("go-wave");
```

Also update the toolbarButtons selector to include the new satellite buttons:

```ts
this.toolbarButtons = document.querySelectorAll("#toolbar button[data-tool]");
```

(This already captures all `[data-tool]` buttons including the new ones — no change needed.)

b) In `setupToolbar()`, add keyboard shortcuts for satellites. Add to the `keyMap`:

```ts
j: "laser",
m: "missile",
p: "plasma",
g: "railgun",
i: "ion",
t: "tesla",
v: "gravity",
e: "emp",
h: "shield",
d: "drone",
```

c) In `update()`, add wave display (at the end of the method):

```ts
const phase = window.gameState.waveActive ? "Defending" : "Building";
if (this.phaseEl) this.phaseEl.textContent = phase;
if (this.waveEl) this.waveEl.textContent = String(window.gameState.wave);
if (this.enemiesEl) this.enemiesEl.textContent = String(window.gameState.enemiesRemaining);
```

d) Add restart button handler in constructor:

```ts
document.getElementById("btn-restart")?.addEventListener("click", () => {
  location.reload();
});
```

e) Add `showGameOver(wave: number)` method:

```ts
showGameOver(wave: number): void {
  if (this.gameOverEl) this.gameOverEl.style.display = "block";
  if (this.goWaveEl) this.goWaveEl.textContent = `Survived ${wave} waves`;
}
```

f) Update `showTileInfo` to also show satellite info. Add this at the start of the method (the existing `tile` parameter doesn't cover satellites — we'll add a separate method for satellite hover. Actually, satellites are hovered in the space area — we can keep this simple for now and just show "Hover over satellite in space" or similar. Skip satellite hover info for v1.)

Files modified: `src/ui/UIManager.ts`.

Verification:

- `pnpm run dev` — wave info shows "Building" phase, wave 0, 0 enemies. Pressing satellite hotkeys (j, m, p, etc.) should highlight the toolbar button.

- [x] Step 4.3 complete

---

### Phase 5: Integration & Final Assembly

#### Step 5.1 — Wire everything into GameScene

What to do:

**Modify `src/scenes/GameScene.ts`**:

a) Add imports:

```ts
import { WaveSystem } from "../systems/WaveSystem.js";
import { DefenseSystem } from "../systems/DefenseSystem.js";
import { drawEnemy } from "../graphics/EnemyGraphics.js";
import { drawSatellite, drawRangeCircle } from "../graphics/SatelliteGraphics.js";
import { SATELLITE_TYPES, ORBIT_RINGS } from "../config.js";
```

b) Add properties:

```ts
waveSystem: WaveSystem;
defenseSystem: DefenseSystem;
private _gameOver = false;
```

c) In `create()`, after existing system instantiation, add:

```ts
this.waveSystem = new WaveSystem();
this.defenseSystem = new DefenseSystem();
```

d) Replace the entire `update()` method:

```ts
update(time: number, delta: number): void {
  // Skip game logic if game over
  if (this._gameOver) {
    this.worldMap.render(this.graphics);
    // Still render satellites and enemies for visual
    for (const sat of this.defenseSystem.satellites) {
      drawSatellite(this.graphics, sat);
    }
    for (const enemy of this.waveSystem.enemies) {
      if (enemy.alive) drawEnemy(this.graphics, enemy);
    }
    this.defenseSystem.render(this.graphics);
    return;
  }

  this.inputHandler.update(time, delta);
  this.economy.update(time, this.worldMap);
  this.powerSystem.update(time, this.worldMap);
  this.zoneSystem.update(time, this.worldMap);
  this.populationSystem.update(time, this.worldMap);
  this.waveSystem.update(time, delta, this.worldMap);
  this.defenseSystem.update(time, delta, this.waveSystem.enemies);
  this.uiManager.update();

  // Game over check
  if (!this._gameOver && window.gameState.population <= 0 && this.waveSystem.getWaveNumber() > 0) {
    this._gameOver = true;
    window.gameState.gameOver = true;
    this.uiManager.showGameOver(this.waveSystem.getWaveNumber());
  }

  // Render order: world -> satellites -> enemies -> projectiles
  this.worldMap.render(this.graphics);

  // Draw satellites
  for (const sat of this.defenseSystem.satellites) {
    drawSatellite(this.graphics, sat);
  }

  // Draw enemies
  for (const enemy of this.waveSystem.enemies) {
    if (enemy.alive) drawEnemy(this.graphics, enemy);
  }

  // Draw projectiles and effects
  this.defenseSystem.render(this.graphics);

  // Draw range circle for hovered satellite tool
  const tool = window.gameState.selectedTool;
  if (tool && SATELLITE_TYPES[tool as keyof typeof SATELLITE_TYPES]) {
    // The InputHandler already draws a preview. Range circle is drawn there too.
  }
}
```

e) Update UIManager to have access to waveSystem. In the `UIScene` interface in `src/ui/UIManager.ts`, add:

```ts
waveSystem?: { getWaveNumber(): number; isBuildPhase(): boolean };
```

Since GameScene passes itself (`this`) to UIManager and it has `waveSystem`, UIManager can access wave data. But actually, UIManager reads from `window.gameState` which already has the wave info. No additional changes needed for the interface.

Files modified: `src/scenes/GameScene.ts`.

Verification:

- `pnpm run dev` — complete game loads. 60s build phase. Enemy waves spawn. Satellites can be placed and orbit. Everything works together.

- [x] Step 5.1 complete

---

#### Step 5.2 — Save/Load (satellite state)

What to do:

**Modify `src/map/WorldMap.ts`**:

In `save()`, add satellite serialization. Before the `localStorage.setItem()` call, build satellite data:

```ts
save(defenseSystem?: { satellites: { type: string; ring: string; angle: number }[] }): void {
  const data = {
    tiles: this.tiles.map((row) =>
      row.map((tile) => ({
        zone: tile.zone,
        level: tile.level,
        isPowered: tile.isPowered,
        roadConnected: tile.roadConnected,
      })),
    ),
    gameState: {
      money: window.gameState.money,
      population: window.gameState.population,
      date: window.gameState.date,
      income: window.gameState.income,
      expenses: window.gameState.expenses,
      selectedTool: window.gameState.selectedTool,
      wave: window.gameState.wave,
      waveActive: window.gameState.waveActive,
    },
    satellites: defenseSystem
      ? defenseSystem.satellites.map((s) => ({ type: s.type, ring: s.ring, angle: s.angle }))
      : [],
  };
  localStorage.setItem("citybuilder-save", JSON.stringify(data));
}
```

In `static load()`, restore satellites. After restoring tiles, return both map and satellite data:

The current `load()` returns `WorldMap | null`. Change it to return `{ map: WorldMap; satellites: { type: string; ring: string; angle: number }[] } | null`:

```ts
static load(): { map: WorldMap; satellites: { type: string; ring: string; angle: number }[] } | null {
  const raw = localStorage.getItem("citybuilder-save");
  if (!raw) return null;

  const data = JSON.parse(raw);

  if (data.gameState) {
    Object.assign(window.gameState, data.gameState);
  }

  const map = new WorldMap();

  if (data.tiles) {
    for (let y = 0; y < Math.min(data.tiles.length, map.rows); y++) {
      for (let x = 0; x < Math.min(data.tiles[y].length, map.cols); x++) {
        const saved = data.tiles[y][x];
        if (saved) {
          map.tiles[y][x].zone = saved.zone;
          map.tiles[y][x].level = saved.level;
          map.tiles[y][x].isPowered = saved.isPowered;
          map.tiles[y][x].roadConnected = saved.roadConnected;
        }
      }
    }
  }

  return { map, satellites: data.satellites || [] };
}
```

**Modify `src/ui/UIManager.ts`** — update save/load handlers:

In `setupToolbar()`, update the save handler:

```ts
document.getElementById("btn-save")?.addEventListener("click", () => {
  (
    this.scene as unknown as {
      worldMap: { save: (ds?: unknown) => void };
      defenseSystem?: DefenseSystem;
    }
  ).worldMap.save((this.scene as unknown as { defenseSystem?: DefenseSystem }).defenseSystem);
});
```

Update the load handler:

```ts
document.getElementById("btn-load")?.addEventListener("click", () => {
  const result = WorldMap.load();
  if (result) {
    this.scene.worldMap = result.map;
    this.scene.graphics.clear();
    this.scene.worldMap.render(this.scene.graphics);
    // Restore satellites
    const defSys = (this.scene as unknown as { defenseSystem?: DefenseSystem }).defenseSystem;
    if (defSys && result.satellites) {
      defSys.satellites = [];
      for (const s of result.satellites) {
        defSys.placeSatellite(s.type as SatelliteType, s.angle, s.ring as OrbitRing);
      }
    }
  }
});
```

> **Simpler approach**: Since the casting is messy, instead add a `getSatellites()` getter to DefenseSystem and a `loadSatellites()` method.

In `src/systems/DefenseSystem.ts`, add:

```ts
getSatelliteData(): { type: string; ring: string; angle: number }[] {
  return this.satellites.map(s => ({ type: s.type, ring: s.ring, angle: s.angle }));
}

loadSatellites(data: { type: string; ring: string; angle: number }[]): void {
  this.satellites = [];
  this.cooldowns.clear();
  for (const d of data) {
    const sat = new OrbitalSatellite(d.type as SatelliteType, d.ring as OrbitRing, d.angle);
    this.satellites.push(sat);
    this.cooldowns.set(sat, 0);
  }
}
```

Then in UIManager save:

```ts
document.getElementById("btn-save")?.addEventListener("click", () => {
  const scene = this.scene as unknown as {
    worldMap: { save: (sats: { type: string; ring: string; angle: number }[]) => void };
    defenseSystem?: { getSatelliteData(): { type: string; ring: string; angle: number }[] };
  };
  const sats = scene.defenseSystem?.getSatelliteData() || [];
  scene.worldMap.save(sats);
});
```

And in UIManager load:

```ts
document.getElementById("btn-load")?.addEventListener("click", () => {
  const result = WorldMap.load();
  if (result) {
    const scene = this.scene as unknown as {
      worldMap: WorldMap;
      graphics: Phaser.GameObjects.Graphics;
      defenseSystem?: {
        loadSatellites(data: { type: string; ring: string; angle: number }[]): void;
      };
    };
    scene.worldMap = result.map;
    scene.graphics.clear();
    scene.worldMap.render(scene.graphics);
    if (scene.defenseSystem) {
      scene.defenseSystem.loadSatellites(result.satellites);
    }
  }
});
```

Files modified: `src/map/WorldMap.ts`, `src/systems/DefenseSystem.ts`, `src/ui/UIManager.ts`.

Verification:

- Place satellites, save, reload, load — satellites should be restored at their saved positions. They resume orbiting.

- [ ] Step 5.2 complete

---

### Phase 6: Final Verification

#### Step 6.1 — End-to-end playtest

Run through this full sequence and check each box:

- [ ] Game loads with planet in space, stars, atmospheric rim, 3 orbit rings.
- [ ] Camera pans and zooms normally. Edge scroll works.
- [ ] Can only build on planet surface (not in space). Preview shows red outside planet.
- [ ] All existing building tools work: Road, RCI, Power Plant, Bulldoze.
- [ ] All 10 satellite types appear in toolbar. Clicking one highlights it.
- [ ] Hover over orbit ring with satellite tool selected — preview appears at nearest ring.
- [ ] Click to place satellite on orbit ring. Money deducts.
- [ ] Satellite begins orbiting at correct speed (inner=fast, outer=slow).
- [ ] Satellite range circle visible when hovered with same tool.
- [ ] Bulldoze tool removes satellites when clicking near them (refunds 50%).
- [ ] Economy ticks, zones grow, power spreads — all city builder systems still work.
- [ ] Wave counter: 60s build phase, then "Defending" + Wave 1.
- [ ] Asteroids spawn from random angles, fly toward planet.
- [ ] Laser turret fires cyan beams at nearest enemy in range.
- [ ] Missile fires orange projectiles with trails.
- [ ] Plasma Cannon does splash damage (nearby enemies also take damage).
- [ ] Railgun pierces through enemies (projectile continues after hit).
- [ ] Ion Beam hits all enemies along its path.
- [ ] Tesla Coil chains to nearby enemies (arcs).
- [ ] Gravity Well slows enemies in range (visible slow effect).
- [ ] EMP Launcher stuns enemies on hit (they freeze briefly).
- [ ] Shield Projector pushes back and damages enemies in 60° arc.
- [ ] Drone Hub spawns 2 seeker drones that chase enemies.
- [ ] Enemies show health bars that decrease.
- [ ] Destroyed enemies create small explosions and disappear.
- [ ] If enemy reaches planet surface, it damages the tile (health decreases).
- [ ] Destroyed tiles show empty/rubble.
- [ ] Wave clear grants money reward.
- [ ] Second wave after build phase with scouts added.
- [ ] Every 5th wave includes a mothership that spawns scouts.
- [ ] Two satellites on same ring within ~30° get synergy glow (brighter).
- [ ] Three+ satellites close together get trinity synergy (even brighter).
- [ ] Cross-ring synergy applies when satellites on different rings are close.
- [ ] When all residential tiles destroyed and population = 0, game-over overlay appears.
- [ ] Game-over shows "CITY DESTROYED" + wave survived + restart button.
- [ ] Restart reloads the page.
- [ ] Save/Load works (restores buildings, money, satellites, wave state).
- [ ] No console errors during any of the above.

- [ ] Step 6.1 complete

---

## Done

When all checkboxes above are checked, City Defender is complete. The game combines city-building with orbiting-satellite tower defense on a circular planet. Features:

- 64x64 circular planet map with space background
- Full city-building (roads, RCI zones, power plants, economy, zone growth)
- 10 defense satellite types with unique mechanics (splash, pierce, chain, slow, stun, shield, drones)
- 3 orbit rings with different speeds — placement is about angular position
- Dynamic synergy system rewarding clustered satellites
- 3 enemy types (asteroid, scout, mothership) in escalating waves
- Building damage and destruction from impacts
- Wave rewards, difficulty scaling, and game-over condition
- Save/Load with full state restoration
