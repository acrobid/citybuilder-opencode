# City Defender — Implementation Plan (Tower Defense Expansion)

> **Tech**: Phaser 4.0 + Vite + TypeScript/CSS
> **Perspective**: Top-down 2D grid on a circular planet with orbiting defense satellites
> **Scope**: Planet map, 10 satellite types on orbit rings, synergy system, 3 enemy types, wave system, game-over condition
> **Project root**: `.`
> **Builds on**: All prior city-builder systems (grid, zones, power, economy, save/load) — see `src/` for implementation.
> **Full archive**: `docs/archive/defender-plan-full.md` (2814 lines with all completed step instructions)

---

## How to Use This File

1. Find the first unchecked `- [ ]` in the Progress section below.
2. Work through each unchecked item one at a time.
3. **Always start** by reading `src/config.ts` and any files referenced in the step.
4. When finished, mark the step `[x]`.

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

## Complete File Map

```
./
├── index.html                         ← wave counter, 10 satellite buttons, synergy display
├── src/
│   ├── main.ts                        ← wave/gameOver fields in gameState
│   ├── config.ts                      ← planet, orbit, satellite types, enemy types, wave config
│   ├── style.css                      ← satellite buttons, wave info, game-over styles
│   ├── global.d.ts                    ← gameState type declarations
│   ├── scenes/
│   │   └── GameScene.ts               ← WaveSystem, DefenseSystem, enemy rendering
│   ├── map/
│   │   └── WorldMap.ts                ← isOnPlanetSurface(), space rendering, save/load
│   ├── entities/
│   │   ├── Tile.ts                     (unchanged — satellites are NOT tile-based)
│   │   ├── Enemy.ts                    ★ Enemy entity
│   │   └── OrbitalSatellite.ts         ★ OrbitalSatellite entity
│   ├── buildings/
│   │   ├── Building.ts                 (unchanged)
│   │   └── Buildings.ts               ← planet-surface placement validation
│   ├── systems/
│   │   ├── EconomySystem.ts            (unchanged)
│   │   ├── PopulationSystem.ts         (unchanged)
│   │   ├── PowerSystem.ts              (unchanged)
│   │   ├── ZoneSystem.ts              (unchanged)
│   │   ├── WaveSystem.ts               ★ wave spawning, enemy management, difficulty scaling
│   │   └── DefenseSystem.ts            ★ satellite management, orbit, targeting, synergy, projectiles
│   ├── input/
│   │   └── InputHandler.ts            ← orbit-ring satellite placement
│   ├── ui/
│   │   └── UIManager.ts               ← 10 satellite buttons, wave display, synergy, game-over, keybindings
│   └── graphics/
│       ├── TileGraphics.ts             (unchanged)
│       ├── SpaceGraphics.ts            ★ starfield, planet rim, orbit ring rendering
│       ├── EnemyGraphics.ts            ★ asteroid, scout, mothership, explosion rendering
│       └── SatelliteGraphics.ts        ★ 10 satellite sprites, projectiles, range circles
```

---

## Global State Bridge

`window.gameState` fields in `src/main.ts`:

```ts
wave: 0,               // current wave number (0 = pre-wave-1 build phase)
waveActive: false,     // true when enemies are spawning/active
enemiesRemaining: 0,   // count of living + queued enemies
gameOver: false,       // true when population = 0 after wave 1+
```

Type declarations in `src/global.d.ts` must match.

---

## Config

All game constants (planet radius, orbit rings, satellite stats, enemy stats, wave config) are in `src/config.ts`. Read it before working on any system.

---

## Progress

- [x] Step 1.1 — Update config and global types
- [x] Step 1.2 — Create space graphics (starfield, planet rim, orbit rings)
- [x] Step 1.3 — Integrate space rendering into WorldMap
- [x] Step 1.4 — Add planet-surface validation to building placement
- [x] Step 2.1 — Create Enemy entity
- [x] Step 2.2 — Create WaveSystem
- [x] Step 2.3 — Create enemy graphics
- [x] Step 3.1 — Create OrbitalSatellite entity
- [x] Step 3.2 — Create satellite graphics (10 types + projectiles + range circles)
- [x] Step 3.3 — Create DefenseSystem
- [x] Step 3.4 — Wire satellite placement in InputHandler
- [x] Step 4.1 — Update HTML with satellite buttons and wave/defense UI
- [x] Step 4.2 — Update CSS
- [x] Step 4.3 — Update UIManager with wave/defense/game-over
- [x] Step 5.1 — Wire everything into GameScene

---

### Step 5.2 — Save/Load (satellite state)

**What to do:**

**Modify `src/map/WorldMap.ts`** — In `save()`, add satellite serialization:

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

In `static load()`, change return type to include satellites:

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

**Add to `src/systems/DefenseSystem.ts`:**

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

**Update save handler in `src/ui/UIManager.ts`:**

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

**Update load handler in `src/ui/UIManager.ts`:**

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

**Files modified:** `src/map/WorldMap.ts`, `src/systems/DefenseSystem.ts`, `src/ui/UIManager.ts`

**Verification:** Place satellites, save, reload, load — satellites should be restored at their saved positions and resume orbiting.

- [ ] Step 5.2 complete

---

### Step 6.1 — End-to-end playtest

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
