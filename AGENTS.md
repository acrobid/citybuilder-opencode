<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->

---

# City Builder + City Defender

Phaser 4.0 game: top-down city builder with tower-defense expansion on a circular planet.

## Quick Start

```sh
pnpm dev    # or: vp dev --config vite/config.dev.mjs
vp check    # format, lint, typecheck
```

## What's In Progress

Only **PLAN2.md** has remaining work:

- **Step 5.2**: Save/Load satellite state in `src/systems/DefenseSystem.ts`, `src/map/WorldMap.ts`, `src/ui/UIManager.ts`
- **Step 6.1**: End-to-end playtest

The city builder base (`docs/archive/citybuilder-plan.md`) is 100% complete.

## Key Files

| File                                | Purpose                                                                 |
| ----------------------------------- | ----------------------------------------------------------------------- |
| `src/config.ts`                     | All game constants (tiles, planet, satellites, enemies, waves)          |
| `src/main.ts`                       | App bootstrap, `window.gameState` init                                  |
| `src/scenes/GameScene.ts`           | Main scene, wires all systems together                                  |
| `src/map/WorldMap.ts`               | 96x96 tile grid, save/load, planet-surface checks                       |
| `src/systems/DefenseSystem.ts`      | Satellite placement, orbit, targeting, synergy, projectiles (690 lines) |
| `src/systems/WaveSystem.ts`         | Wave spawning, enemy management, difficulty scaling (399 lines)         |
| `src/systems/EconomySystem.ts`      | 10s money ticks                                                         |
| `src/systems/PowerSystem.ts`        | BFS power spread, 20-tile radius                                        |
| `src/systems/ZoneSystem.ts`         | Auto-growth for RCI zones                                               |
| `src/systems/PopulationSystem.ts`   | Population tracking                                                     |
| `src/entities/Enemy.ts`             | Enemy entity (asteroid, scout, mothership)                              |
| `src/entities/OrbitalSatellite.ts`  | Satellite entity with orbit movement                                    |
| `src/entities/Tile.ts`              | Grid tile entity                                                        |
| `src/graphics/SpaceGraphics.ts`     | Starfield, planet rim, orbit rings                                      |
| `src/graphics/SatelliteGraphics.ts` | 10 satellite sprites, projectiles, range circles                        |
| `src/graphics/EnemyGraphics.ts`     | Enemy rendering, explosions                                             |
| `src/graphics/TileGraphics.ts`      | Building/road/tile rendering                                            |
| `src/input/InputHandler.ts`         | Camera drag/zoom, tool-based placement                                  |
| `src/ui/UIManager.ts`               | DOM overlay bridge (toolbar, stats, wave counter)                       |
| `src/buildings/Buildings.ts`        | Building registry + placement validation                                |
| `index.html`                        | DOM layout (sidebar toolbar, stats, wave info)                          |
| `src/style.css`                     | Full game CSS (dark theme)                                              |

## What to Ignore

- `dist/` — build output
- `docs/archive/` — completed plans and full reference
- `screenshot.png`, `public/assets/*.png` — binary assets
- `package-lock.json` — this project uses pnpm
- `log.js` — anonymous usage tracker (not project code)
