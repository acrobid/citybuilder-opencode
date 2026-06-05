import type { Tile } from "../entities/Tile.js";
import { WorldMap } from "../map/WorldMap.js";
import type { DefenseSystem } from "../systems/DefenseSystem.js";
import type { WaveSystem } from "../systems/WaveSystem.js";

interface UIScene {
  worldMap: WorldMap;
  graphics: Phaser.GameObjects.Graphics;
  time: { now: number };
  defenseSystem: DefenseSystem;
  waveSystem: WaveSystem;
}

export class UIManager {
  scene: UIScene;
  moneyEl: HTMLElement | null;
  popEl: HTMLElement | null;
  incomeEl: HTMLElement | null;
  expensesEl: HTMLElement | null;
  dateEl: HTMLElement | null;
  tileInfoEl: HTMLElement | null;
  toolbarButtons: NodeListOf<HTMLButtonElement>;
  phaseEl: HTMLElement | null;
  waveEl: HTMLElement | null;
  enemiesEl: HTMLElement | null;
  gameOverEl: HTMLElement | null;
  goWaveEl: HTMLElement | null;

  constructor(scene: UIScene) {
    this.scene = scene;
    this.moneyEl = document.getElementById("stat-money");
    this.popEl = document.getElementById("stat-pop");
    this.incomeEl = document.getElementById("stat-income");
    this.expensesEl = document.getElementById("stat-expenses");
    this.dateEl = document.getElementById("stat-date");
    this.tileInfoEl = document.getElementById("tile-info");
    this.toolbarButtons = document.querySelectorAll("#toolbar button[data-tool]");
    this.phaseEl = document.getElementById("stat-phase");
    this.waveEl = document.getElementById("stat-wave");
    this.enemiesEl = document.getElementById("stat-enemies");
    this.gameOverEl = document.getElementById("game-over");
    this.goWaveEl = document.getElementById("go-wave");
    document.getElementById("btn-restart")?.addEventListener("click", () => {
      location.reload();
    });
    this.setupToolbar();
  }

  setupToolbar(): void {
    this.toolbarButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const tool = btn.getAttribute("data-tool");
        if (window.gameState.selectedTool === tool) {
          window.gameState.selectedTool = null;
        } else {
          window.gameState.selectedTool = tool;
        }
        this.updateToolbarHighlight();
      });
    });

    document.getElementById("btn-save")?.addEventListener("click", () => {
      const satellites = this.scene.defenseSystem.getSatelliteData();
      this.scene.worldMap.save(satellites);
    });

    document.getElementById("btn-load")?.addEventListener("click", () => {
      const result = WorldMap.load();
      if (result) {
        this.scene.worldMap = result.map;
        this.scene.defenseSystem.loadSatellites(result.satellites);
        this.scene.waveSystem.loadState(window.gameState.wave, this.scene.time.now);
        this.scene.graphics.clear();
        this.scene.worldMap.render(this.scene.graphics);
      }
    });

    document.getElementById("btn-spawn-wave")?.addEventListener("click", () => {
      this.scene.waveSystem.forceStartWave(this.scene.time.now);
    });

    document.addEventListener("keydown", (e) => {
      const keyMap: Record<string, string> = {
        r: "road",
        z: "residential",
        c: "commercial",
        u: "industrial",
        w: "powerplant",
        b: "bulldoze",
        j: "laser",
        m: "missile",
        a: "plasma",
        g: "railgun",
        o: "ion",
        t: "tesla",
        v: "gravity",
        e: "emp",
        h: "shield",
        d: "drone",
      };
      const key = e.key.toLowerCase();
      if (key === "escape") {
        window.gameState.selectedTool = null;
      } else if (keyMap[key]) {
        if (window.gameState.selectedTool === keyMap[key]) {
          window.gameState.selectedTool = null;
        } else {
          window.gameState.selectedTool = keyMap[key];
        }
      }
      this.updateToolbarHighlight();
    });
  }

  updateToolbarHighlight(): void {
    this.toolbarButtons.forEach((btn) => {
      const tool = btn.getAttribute("data-tool");
      btn.classList.toggle("active", tool === window.gameState.selectedTool);
    });
  }

  update(): void {
    const gs = window.gameState;
    if (this.moneyEl) this.moneyEl.textContent = String(gs.money);
    if (this.popEl) this.popEl.textContent = String(gs.population);
    if (this.incomeEl) this.incomeEl.textContent = String(gs.income);
    if (this.expensesEl) this.expensesEl.textContent = String(gs.expenses);
    if (this.dateEl) {
      const month = (gs.date % 12) + 1;
      const year = Math.floor(gs.date / 12) + 1;
      this.dateEl.textContent = `Month ${month}, Year ${year}`;
    }
    const phase = gs.waveActive ? "Defending" : "Building";
    if (this.phaseEl) this.phaseEl.textContent = phase;
    if (this.waveEl) this.waveEl.textContent = String(gs.wave);
    if (this.enemiesEl) this.enemiesEl.textContent = String(gs.enemiesRemaining);
  }

  showGameOver(wave: number): void {
    if (this.gameOverEl) this.gameOverEl.style.display = "block";
    if (this.goWaveEl) this.goWaveEl.textContent = `Survived ${wave} waves`;
  }

  showTileInfo(tile: Tile | null): void {
    if (!this.tileInfoEl) return;
    if (!tile || tile.zone === "empty") {
      this.tileInfoEl.textContent = "";
      return;
    }
    const lines = [
      `Zone: ${tile.zone}`,
      `Level: ${tile.level}`,
      `Powered: ${tile.isPowered ? "Yes" : "No"}`,
      `Road: ${tile.roadConnected ? "Yes" : "No"}`,
    ];
    this.tileInfoEl.textContent = lines.join(" | ");
  }
}
