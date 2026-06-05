# City Builder — Implementation Plan

> **Tech**: Phaser 4.0 + Vite + TypeScript/CSS  
> **Perspective**: Top-down 2D grid  
> **Scope**: Full (grid, camera, roads, zones, economy, power, save/load, DOM HUD)  
> **Project root**: `.`

---

## How to Use This File

1. Find the first unchecked `- [ ]` in the Progress section below.
2. Read that step's full checklist and instructions. Do exactly what it says.
3. Follow the exact file paths and verification steps. Do not improvise file locations.
4. When finished, mark the step `[x]` and move to the next.
5. **Always start** by reading `src/config.ts` and any files referenced in the step — they may have been modified by prior steps.
6. **One step at a time.** Do not skip ahead or combine steps.

---

## Architecture Summary

```
canvas (Phaser)                DOM overlay (HTML/CSS)
┌─────────────────┐            ┌──────────────────┐
│ Grid map        │            │ Toolbar buttons  │
│ (Graphics obj)  │            │ Stats (money etc)│
│ Camera pan/zoom │            │ Budget panel     │
│ Preview tile    │            │ Tile info popup  │
└─────────────────┘            └──────────────────┘
         ↕ window.gameState bridge ↕
```

- **Phaser** handles the game canvas: grid, camera, input.
- **DOM** handles UI chrome: toolbar, stats.
- **Bridge**: `window.gameState` is a plain object shared between both. The game writes stats to it; the DOM reads from it. The DOM writes `selectedTool` to it; the game reads from it.

---

## Complete File Map

```
citybuilder-opencode/
├── index.html
├── package.json
├── vite.config.ts
├── src/
│   ├── main.ts
│   ├── config.ts
│   ├── style.css
│   ├── global.d.ts
│   ├── scenes/
│   │   ├── BootScene.ts
│   │   └── GameScene.ts
│   ├── map/
│   │   └── WorldMap.ts
│   ├── entities/
│   │   └── Tile.ts
│   ├── buildings/
│   │   ├── Building.ts
│   │   └── Buildings.ts
│   ├── systems/
│   │   ├── EconomySystem.ts
│   │   ├── PopulationSystem.ts
│   │   ├── PowerSystem.ts
│   │   └── ZoneSystem.ts
│   ├── input/
│   │   └── InputHandler.ts
│   └── ui/
│       └── UIManager.ts
```

---

## Global State Bridge

`window.gameState` is initialized in `src/main.ts` before the Phaser Game is created. The game (InputHandler, EconomySystem, etc.) reads and writes to it. The DOM (UIManager, toolbar buttons) reads and writes to it.

```ts
window.gameState = {
  selectedTool: null, // 'road' | 'residential' | 'commercial' | 'industrial' | 'bulldoze' | 'powerplant' | null
  money: 0,
  population: 0,
  date: 0, // incremented each economy tick
  income: 0, // last tick's income
  expenses: 0, // last tick's expenses
};
```

TypeScript declaration for this lives in `src/global.d.ts`.

---

## Progress

All steps use `.ts` extension (TypeScript) instead of `.js` as in the original scaffold's language.

### Phase 1: Scaffold & Grid

#### Step 1.1 — Scaffold the project

What to do:

1. Run `npx @phaserjs/game@latest` from `/Users/joshuacarter/webdev`. When prompted:
   - Project name: `citybuilder-opencode`
   - Template: Vite
   - Project type: Minimal
2. Delete all template source files inside the newly created `src/` folder. Keep only the `src/` directory itself.
3. Create an empty `src/style.css` file.
4. Run `pnpm install` in the project directory.
5. Run `pnpm run dev` and verify the dev server starts without errors. You should see a blank page. Stop the dev server after stopping.

Files created or modified: `index.html` (replaced by scaffold), `package.json` (updated by scaffold), `vite.config.ts` (created by scaffold).

> **Note**: This step was completed previously. All file paths are relative to the project root.

- [x] Step 1.1 complete

---

#### Step 1.2 — Create config and main entry point

What to do:

**1. Create `src/config.ts`** with this exact content:

```ts
export const TILE_SIZE = 32;
export const MAP_COLS = 64;
export const MAP_ROWS = 64;

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
```

**2. Create `src/main.ts`** with this exact content:

```ts
import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "./config.js";
import { BootScene } from "./scenes/BootScene.js";
import { GameScene } from "./scenes/GameScene.js";

window.gameState = {
  selectedTool: null,
  money: 0,
  population: 0,
  date: 0,
  income: 0,
  expenses: 0,
};

new Phaser.Game({
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: "game-container",
  backgroundColor: "#1a1a2e",
  scene: [BootScene, GameScene],
});
```

**3. Create `src/scenes/BootScene.ts`** with this exact content:

```ts
import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create(): void {
    console.log("BootScene: create");
    this.scene.start("GameScene");
  }
}
```

**4. Create `src/scenes/GameScene.ts`** with this exact content:

```ts
import Phaser from "phaser";

export class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  create(): void {
    console.log("GameScene: create");
  }
}
```

**5. Create `src/global.d.ts`** with this exact content:

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
    };
  }
}
```

**6. How to verify:**

- Run `pnpm run dev` and open the browser.
- Open the browser console (F12).
- You should see a dark background canvas and both `BootScene: create` and `GameScene: create` logged in the console.
- There should be no errors.

Files created: `src/config.ts`, `src/main.ts`, `src/scenes/BootScene.ts`, `src/scenes/GameScene.ts`, `src/global.d.ts`.

- [x] Step 1.2 complete

---

#### Step 1.3 — Create Tile entity

What to do:

**Create `src/entities/Tile.ts`** with this exact content:

```ts
export type ZoneType =
  | "empty"
  | "road"
  | "residential"
  | "commercial"
  | "industrial"
  | "powerplant";

export class Tile {
  x: number;
  y: number;
  zone: ZoneType = "empty";
  level = 0;
  isPowered = false;
  roadConnected = false;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}
```

Files created: `src/entities/Tile.ts`.

- [x] Step 1.3 complete

---

#### Step 1.4 — Create WorldMap with grid rendering + camera bounds

What to do:

**1. Create `src/map/WorldMap.ts`** with all grid logic. The file should include:

- Constructor that creates a 64×64 grid of Tile objects
- `tileAt(worldX, worldY)` — world coords to tile lookup, returns `Tile | null`
- `getNeighbors(tile)` — returns 4 adjacent tiles
- `isRoadAdjacent(tile)` — checks if any neighbor is a road
- `canPlace2x2(tile)` — checks if a 2×2 area is all empty
- `recalculateConnectivity()` — updates `roadConnected` for each tile
- `render(graphics)` — fills each tile with `COLORS.EMPTY`, draws grid lines

**2. Modify `src/scenes/GameScene.ts`** to create a WorldMap and render it:

```ts
import Phaser from "phaser";
import { MAP_COLS, MAP_ROWS, TILE_SIZE } from "../config.js";
import { WorldMap } from "../map/WorldMap.js";

export class GameScene extends Phaser.Scene {
  worldMap: WorldMap;
  graphics: Phaser.GameObjects.Graphics;

  constructor() {
    super("GameScene");
  }

  create(): void {
    console.log("GameScene: create");
    this.worldMap = new WorldMap();
    this.graphics = this.add.graphics();
    this.cameras.main.setBounds(0, 0, MAP_COLS * TILE_SIZE, MAP_ROWS * TILE_SIZE);
    this.cameras.main.setZoom(1);
    this.worldMap.render(this.graphics);
  }
}
```

**3. How to verify:**

- `pnpm run dev` and open the browser.
- You should see a large 64×64 grid of dark green tiles with subtle grid lines.
- The camera viewport should show the top-left portion of the map.

> **Note**: The existing `src/map/WorldMap.ts` has already been pre-created with extra features beyond this step (level rendering, power overlay, save/load). These will be wired in later phases.

Files created: `src/map/WorldMap.ts`.
Files modified: `src/scenes/GameScene.ts`.

- [x] Step 1.4 complete

---

### Phase 2: Camera Controls

#### Step 2.1 — Drag-to-pan, scroll zoom, edge scroll

What to do:

**1. Create `src/input/InputHandler.ts`** with:

- Drag-to-pan: pointer down starts drag, pointer up stops. Camera follows pointer delta divided by zoom. 3px dead zone to distinguish click from drag.
- Scroll-wheel zoom: `Phaser.Math.Clamp(zoom - deltaY * 0.001, 0.5, 3)`, re-centers on cursor world position.
- Edge scroll: when pointer is within 20px of canvas edge, camera auto-scrolls at `300px/s` divided by zoom.
- `update(time, delta)` method called each frame.

Import Phaser, `GAME_WIDTH`, `GAME_HEIGHT`. Constructor takes `scene` parameter.

```ts
import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE, COLORS } from "../config.js";
import type { WorldMap } from "../map/WorldMap.js";
import type { EconomySystem } from "../systems/EconomySystem.js";
import type { UIManager } from "../ui/UIManager.js";

interface ToolScene {
  worldMap: WorldMap;
  graphics: Phaser.GameObjects.Graphics;
  economy: EconomySystem;
  uiManager: UIManager;
  cameras: { main: Phaser.Cameras.Scene2D.Camera };
  input: Phaser.Input.InputPlugin;
  time: { now: number };
}
```

**2. Modify `src/scenes/GameScene.ts`** to add InputHandler:

```ts
import Phaser from "phaser";
import { MAP_COLS, MAP_ROWS, TILE_SIZE } from "../config.js";
import { WorldMap } from "../map/WorldMap.js";
import { InputHandler } from "../input/InputHandler.js";

export class GameScene extends Phaser.Scene {
  worldMap: WorldMap;
  graphics: Phaser.GameObjects.Graphics;
  inputHandler: InputHandler;

  constructor() {
    super("GameScene");
  }

  create(): void {
    console.log("GameScene: create");
    this.worldMap = new WorldMap();
    this.graphics = this.add.graphics();
    this.inputHandler = new InputHandler(this);
    this.cameras.main.setBounds(0, 0, MAP_COLS * TILE_SIZE, MAP_ROWS * TILE_SIZE);
    this.cameras.main.setZoom(1);
    this.worldMap.render(this.graphics);
  }

  update(time: number, delta: number): void {
    this.inputHandler.update(time, delta);
    this.worldMap.render(this.graphics);
  }
}
```

**3. How to verify:**

- `pnpm run dev` and open the browser.
- Click and drag on the canvas — the map should pan.
- Scroll the mouse wheel — the map should zoom in/out, centered on the cursor position.
- Move the mouse to the edges of the canvas — the camera should auto-scroll in that direction.

Files created: `src/input/InputHandler.ts`.
Files modified: `src/scenes/GameScene.ts`.

- [x] Step 2.1 complete

---

### Phase 3: Tool System & Preview

#### Step 3.1 — Building registry + validation

What to do:

**1. Create `src/buildings/Building.ts`**:

```ts
export interface BuildingConfig {
  type: string;
  name: string;
  cost: number;
  maintenance: number;
  size: number;
  refundRatio?: number;
}

export class Building {
  type: string;
  name: string;
  cost: number;
  maintenance: number;
  size: number;
  refundRatio: number;

  constructor(config: BuildingConfig) {
    this.type = config.type;
    this.name = config.name;
    this.cost = config.cost;
    this.maintenance = config.maintenance;
    this.size = config.size;
    this.refundRatio = config.refundRatio || 0.5;
  }
}
```

**2. Create `src/buildings/Buildings.ts`** with building registry and validation:

- `BUILDING_TYPES` object with 5 entries: road ($10, 1×1), residential ($50, 1×1), commercial ($75, 1×1), industrial ($100, 1×1), powerplant ($500, 2×2)
- `canPlace(tile, buildingType, worldMap, gameState)` — validates tile is empty, enough money, road adjacency (except road and powerplant), 2×2 space for powerplant
- `getBuildingCost(zone, level)` / `getBuildingRefund(zone, level)` — return purchase/refund amounts

**3. How to verify:**

- Import the functions in browser console to confirm they return correct values. No visible change to the game yet.

Files created: `src/buildings/Building.ts`, `src/buildings/Buildings.ts`.

- [x] Step 3.1 complete

---

#### Step 3.2 — Tool selection + preview tile + placement + bulldoze + EconomySystem

What to do:

**1. Update `src/input/InputHandler.ts`** to add tool handling:

- In `setupCamera()`, update pointerup to detect clicks vs drags (3px threshold). On click without drag, call `handleClick`.
- Add `setupTools()` method that listens for pointermove. On move (not dragging), compute hovered tile, show tile info via UIManager, and draw preview overlay.
- `drawPreview(tile)` — re-render the map then draw a semi-transparent green/red square on the hovered tile (or 2×2 for powerplant).
- `handleClick(pointer)` — gets world point → tile. If bulldoze, call `doBulldoze`. Else validate with `canPlace`, then call `doPlace`. Then `recalculateConnectivity()` and re-render.
- `doPlace(tile, tool)` — set tile zone/level, deduct cost via EconomySystem.
- `doBulldoze(tile)` — for powerplant, clear surrounding 2×2; else clear single tile. Refund via EconomySystem.
- `clearPowerPlant(tile)` — scan 3×3 area around clicked tile for powerplant tiles and clear them.

Import `canPlace`, `BUILDING_TYPES`, `getBuildingRefund` from `../buildings/Buildings.js`.

**2. Create `src/systems/EconomySystem.ts`** with:

- Constructor takes gameState, sets money=10000, income=0, expenses=0, date=0.
- `tick(worldMap)` — iterates all tiles, computes income (residential=10×level, commercial=20×level, industrial=15×level) and expenses (road=1, powerplant=25), updates gameState. Called every 10s.
- `update(time, worldMap)` — checks if 10s has elapsed, calls tick.
- `canAfford(cost)`, `deduct(cost)`, `refund(amount)` — money management.

**3. Modify `src/scenes/GameScene.ts`** to add EconomySystem:

```ts
import Phaser from "phaser";
import { MAP_COLS, MAP_ROWS, TILE_SIZE } from "../config.js";
import { WorldMap } from "../map/WorldMap.js";
import { InputHandler } from "../input/InputHandler.js";
import { EconomySystem } from "../systems/EconomySystem.js";

export class GameScene extends Phaser.Scene {
  worldMap: WorldMap;
  graphics: Phaser.GameObjects.Graphics;
  economy: EconomySystem;
  inputHandler: InputHandler;

  constructor() {
    super("GameScene");
  }

  create(): void {
    console.log("GameScene: create");
    this.worldMap = new WorldMap();
    this.graphics = this.add.graphics();
    this.economy = new EconomySystem(window.gameState);
    this.inputHandler = new InputHandler(this);
    this.cameras.main.setBounds(0, 0, MAP_COLS * TILE_SIZE, MAP_ROWS * TILE_SIZE);
    this.cameras.main.setZoom(1);
    this.worldMap.render(this.graphics);
  }

  update(time: number, delta: number): void {
    this.inputHandler.update(time, delta);
    this.economy.update(time, this.worldMap);
    this.worldMap.render(this.graphics);
  }
}
```

**4. How to verify:**

- `pnpm run dev` and open the browser.
- Open the console and type: `window.gameState.selectedTool = 'road'`
- Move your mouse over the map — you should see a green preview square following the cursor on empty tiles, and a red preview square on tiles that already have something.
- Set `window.gameState.selectedTool = 'residential'` — preview should only be green on empty tiles adjacent to a road.
- Click on a valid tile with 'road' selected — a road tile should be placed.
- Click on a valid tile with 'residential' selected — a green residential tile should appear.
- Set `window.gameState.selectedTool = 'bulldoze'` — click on a placed tile to remove it.
- Money should deduct when placing, and partially refund when bulldozing.

Files created: `src/systems/EconomySystem.ts`.
Files modified: `src/input/InputHandler.ts` (updated), `src/scenes/GameScene.ts` (replaced).

- [x] Step 3.2 complete

---

### Phase 4: DOM UI

#### Step 4.1 — HTML layout

What to do:

**Replace `index.html`** with this exact content:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>City Builder</title>
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
        <div id="toolbar">
          <button data-tool="road">Road ($10)</button>
          <button data-tool="residential">Residential ($50)</button>
          <button data-tool="commercial">Commercial ($75)</button>
          <button data-tool="industrial">Industrial ($100)</button>
          <button data-tool="powerplant">Power Plant ($500)</button>
          <button data-tool="bulldoze" class="danger">Bulldoze</button>
          <hr style="border-color: #444; margin: 4px 0;" />
          <button id="btn-save">Save Game</button>
          <button id="btn-load">Load Game</button>
        </div>
        <div id="tile-info"></div>
      </div>
    </div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

**2. How to verify:**

- `pnpm run dev` and open the browser.
- You should see the Phaser canvas on the left and a dark sidebar on the right with toolbar buttons and stats (all showing zeros).

Files modified: `index.html`.

- [x] Step 4.1 complete

---

#### Step 4.2 — CSS

What to do:

**Replace `src/style.css`** with styling for:

- Flex layout: `#app` fills viewport, `#game-container` flexes to fill, `#sidebar` is 220px fixed.
- Dark theme: sidebar `#1a1a2e`, text `#e0e0e0`, monospace font.
- Toolbar buttons: dark background `#2a2a3e`, hover `#3a3a5e`, active `#4455aa`, danger variant `#aa3333`.
- Tile info panel: small text, gray, min-height 40px.

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  overflow: hidden;
  background: #0f0f1a;
}

#app {
  display: flex;
  height: 100vh;
}

#game-container {
  flex: 1;
}

#sidebar {
  width: 220px;
  background: #1a1a2e;
  color: #e0e0e0;
  padding: 12px;
  font-family: monospace;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

#stats {
  line-height: 1.6;
}

#toolbar {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

#toolbar button {
  padding: 8px 10px;
  border: 1px solid #444;
  background: #2a2a3e;
  color: #ddd;
  cursor: pointer;
  font-family: monospace;
  font-size: 12px;
  border-radius: 4px;
  text-align: left;
}

#toolbar button:hover {
  background: #3a3a5e;
}

#toolbar button.active {
  background: #4455aa;
  border-color: #6677cc;
  color: #fff;
}

#toolbar button.danger {
  border-color: #882222;
}

#toolbar button.danger.active {
  background: #aa3333;
}

#tile-info {
  font-size: 11px;
  color: #999;
  min-height: 40px;
}
```

Files modified: `src/style.css`.

- [x] Step 4.2 complete

---

#### Step 4.3 — UIManager (DOM bridge)

What to do:

**1. Create `src/ui/UIManager.ts`** with:

- Constructor takes `scene` parameter, stores it as `this.scene`.
- Queries DOM elements: `#toolbar button`, `#stat-money`, `#stat-pop`, `#stat-income`, `#stat-expenses`, `#stat-date`, `#tile-info`.
- `setupToolbar()` — click handlers toggle `window.gameState.selectedTool` (click same tool to deselect). Keyboard shortcuts: R=road, Z=residential, C=commercial, I=industrial, P=powerplant, B=bulldoze, Escape=deselect. Save/Load button handlers use `this.scene.worldMap.save()` and `WorldMap.load()`.
- `updateToolbarHighlight()` — adds/removes `.active` class on buttons.
- `update()` — called each frame, reads `window.gameState` and updates stats DOM elements.
- `showTileInfo(tile)` — sets `#tile-info` text to zone/level/powered/road status.

Import `{ WorldMap }` from `../map/WorldMap.js`.

**2. Modify `src/scenes/GameScene.ts`** to add UIManager (pass `this` to constructor).

**3. How to verify:**

- `pnpm run dev` and open the browser.
- Click toolbar buttons — they should highlight blue when selected. Click again to deselect.
- Press keyboard keys: R for road, Z for residential, C for commercial, I for industrial, P for power plant, B for bulldoze. Escape to deselect.
- Place roads and buildings — the stats panel should update: money changes, date increments every 10s, income/expenses update.
- Hover over placed tiles — the tile info section in the sidebar shows zone type, level, power status, road connection.

Files created: `src/ui/UIManager.ts`.
Files modified: `src/scenes/GameScene.ts`.

- [x] Step 4.3 complete

---

### Phase 5: Zone Growth

#### Step 5.1 — Auto-upgrading zones

What to do:

**1. The file `src/systems/ZoneSystem.ts` already exists** with zone growth logic. Verify it contains:

- `tickInterval = 15000`, `growthChance = 0.15`
- `tick(worldMap)` — iterates zones, skips if level >= 4, no road, no power. Random chance to increment level.
- `update(time, worldMap)` — calls tick every 15s.

**2. The file `src/map/WorldMap.ts` already exists** with level-aware rendering. Verify it contains:

- `render()` uses `getLevelColor(baseColor, level)` (returns base color unchanged)
- For tiles with level >= 2, draws a brighter inner square with `brightenColor()`
- Level 4 has inset=3, levels 2-3 have inset=5
- Grid lines drawn at 0.15 opacity

**3. Modify `src/scenes/GameScene.ts`** to add ZoneSystem.

**4. How to verify:**

- `pnpm run dev` and open the browser.
- Place a residential zone next to a road.
- Wait 15+ seconds — the tile should visually change (become brighter/more filled) as its level increases from 1 to 2, then 3, then 4.

- [x] Step 5.1 complete

---

### Phase 6: Power System

#### Step 6.1 — Power plants + coverage + power overlay

What to do:

**1. The file `src/systems/PowerSystem.ts` already exists** with:

- `powerRadius = 20`, `tickInterval = 3000`
- `recalculate(worldMap)` — resets all `isPowered` to false, finds all powerplant tiles, runs BFS from each.
- `bfsPower(worldMap, startX, startY)` — BFS flood fill within `powerRadius`. Sets `tile.isPowered = true`.
- `update(time, worldMap)` — calls recalculate every 3s.

**2. The file `src/systems/ZoneSystem.ts` already includes** the power requirement check (`if (!tile.isPowered) continue`).

**3. The file `src/map/WorldMap.ts` already includes** power rendering:

- Unpowered zones (not empty, not road) are darkened by 80 via `darkenColor()`
- Powered zones (residential/commercial/industrial) get a subtle yellow tint overlay (0xffdd00 at 0.08 alpha)
- `darkenColor(color, amount)` helper method exists

**4. Modify `src/scenes/GameScene.ts`** to add PowerSystem.

**5. How to verify:**

- `pnpm run dev` and open the browser.
- Place a power plant (2×2 tiles, costs $500). It appears as a red square.
- Wait a few seconds — tiles within 20-tile radius get the power overlay (subtle yellow tint) and unpowered buildings appear darker.
- Place a residential zone: outside the powered area it's dark and won't grow. Inside the powered area it's bright and grows. The tile info panel shows "Powered: Yes/No".

- [x] Step 6.1 complete

---

### Phase 7: Population

#### Step 7.1 — Population tracking

What to do:

**1. The file `src/systems/PopulationSystem.ts` already exists** with:

- Constructor takes gameState, sets population to 0.
- `calculate(worldMap)` — iterates residential tiles that are road-connected and powered. Adds 50 × level per tile.
- `update(time, worldMap)` — calls calculate every 10s.

**2. Modify `src/scenes/GameScene.ts`** to add PopulationSystem.

**3. How to verify:**

- `pnpm run dev` and open the browser.
- Place residential zones next to roads inside a powered area.
- Wait for them to grow — the Population stat in the sidebar increases.
- Level 1 residential = 50 pop, level 4 = 200 pop each.

- [x] Step 7.1 complete

---

### Phase 8: Save & Load

#### Step 8.1 — Save/load to localStorage

What to do:

**1. The file `src/map/WorldMap.ts` already includes** `save()` and `static load()` methods:

- `save()` — serializes all tiles (zone, level, isPowered, roadConnected) and gameState (money, population, date, income, expenses, selectedTool) to JSON in localStorage key `citybuilder-save`.
- `load()` — reads from localStorage, parses JSON, restores gameState, creates a new WorldMap, restores tile data.

**2. The `index.html` already includes** Save/Load buttons (with `id="btn-save"` and `id="btn-load"`).

**3. The `src/ui/UIManager.ts`** handles Save/Load button clicks via the scene reference:

- Save: `this.scene.worldMap.save()`
- Load: `WorldMap.load()` → replaces `this.scene.worldMap`, resets system timers to `this.scene.time.now`, re-renders.

**4. How to verify:**

- `pnpm run dev` and open the browser.
- Build a small city: place some roads and residential zones.
- Click "Save Game".
- Refresh the page.
- Click "Load Game".
- Your city should be restored exactly as it was, with the same money and population.

- [x] Step 8.1 complete

---

### Phase 9: Edge Cases & Final Verification

#### Step 9.1 — Test edge cases

What to do:

1. **Test placing a road on the map edge** — should not crash.
2. **Test bulldozing a 2×2 power plant** — all 4 tiles should be cleared.
3. **Try to place a power plant on or near the map edge** — should be rejected (preview shows red, click does nothing).
4. **Hover outside the map bounds** (e.g. in the black area beyond the grid) — should not show any errors.
5. **Click rapidly on the same tile** — should only place one building (no double placement).
6. **Spend all money until negative** — the game should block further placement but continue running. Roads still incur maintenance, which can push money further negative.
7. **Place a residential zone NOT touching a road, then later build a road next to it** — the zone should switch from "No Road" to "Road: Yes" and begin growing.

Any issues found: fix them in the appropriate file.

- [x] Step 9.1 — Edge cases tested and fixed

---

#### Step 9.2 — Final full-system checklist

Verify every system works together:

- [x] Grid renders correctly at all zoom levels (0.5x to 3x).
- [x] Camera pans with drag, zooms with scroll wheel, edge-scrolls.
- [x] All 6 toolbar buttons work: Road, Residential, Commercial, Industrial, Power Plant, Bulldoze.
- [x] Keyboard shortcuts work: R, Z, C, I, P, B, Escape.
- [x] Placement preview follows cursor (green when valid, red when invalid).
- [x] Money deducts on placement and partially refunds on bulldoze.
- [x] Economy ticks every ~10s — income/expenses update, date advances.
- [x] Zones grow after ~15s when powered and road-connected (up to level 4).
- [x] Power plants spread power within a 20-tile radius.
- [x] Unpowered zones are visually darker and don't grow.
- [x] Population stat reflects residential zone count and levels.
- [x] Tile info panel shows correct data on hover.
- [x] Save saves the entire city state.
- [x] Load restores the entire city state.
- [x] No console errors during normal gameplay.

- [x] Step 9.2 — Full system verification complete

---

## Done

When all checkboxes above are checked, the city builder is complete. The game is playable: place roads, zone RCI, manage power, watch the city grow, track finances and population, and save/load your city.
