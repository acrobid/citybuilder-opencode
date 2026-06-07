import * as Phaser from "phaser";
import type { Tile } from "../entities/Tile.js";
import { WorldMap } from "../map/WorldMap.js";
import type { DefenseSystem } from "../systems/DefenseSystem.js";
import type { WaveSystem } from "../systems/WaveSystem.js";

interface UIScene {
  worldMap: WorldMap;
  time: { now: number };
  defenseSystem: DefenseSystem;
  waveSystem: WaveSystem;
  game: Phaser.Game;
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
  fpsEl: HTMLElement | null;
  gameOverEl: HTMLElement | null;
  goWaveEl: HTMLElement | null;
  pauseOverlay: HTMLElement | null;
  pauseBtn: HTMLElement | null;
  private _prevMoney = -1;
  private _prevPop = -1;
  private _prevIncome = -1;
  private _prevExpenses = -1;
  private _prevDateMonth = -1;
  private _prevDateYear = -1;
  private _prevPhase = "";
  private _prevWave = -1;
  private _prevEnemies = -1;
  private _prevFps = -1;
  private _prevTileInfo = "";

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
    this.fpsEl = document.getElementById("stat-fps");
    this.gameOverEl = document.getElementById("game-over");
    this.goWaveEl = document.getElementById("go-wave");
    document.getElementById("btn-restart")?.addEventListener("click", () => {
      location.reload();
    });
    this.pauseOverlay = document.getElementById("pause-overlay");
    this.pauseBtn = document.getElementById("btn-pause");
    this.pauseBtn?.addEventListener("click", () => this.togglePause());
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
        this.scene.worldMap.markDirty();
      }
    });

    document.getElementById("btn-spawn-wave")?.addEventListener("click", () => {
      this.scene.waveSystem.forceStartWave(this.scene.time.now);
    });

    document.getElementById("btn-spawn-wave-closer")?.addEventListener("click", () => {
      this.scene.waveSystem.forceStartWaveCloser(this.scene.time.now);
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
        d: "shrapnel",
      };
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        this.togglePause();
        return;
      }
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

  update(fps: number): void {
    const gs = window.gameState;
    if (this.moneyEl && gs.money !== this._prevMoney) {
      this._prevMoney = gs.money;
      this.moneyEl.textContent = String(gs.money);
    }
    if (this.popEl && gs.population !== this._prevPop) {
      this._prevPop = gs.population;
      this.popEl.textContent = String(gs.population);
    }
    if (this.incomeEl && gs.income !== this._prevIncome) {
      this._prevIncome = gs.income;
      this.incomeEl.textContent = String(gs.income);
    }
    if (this.expensesEl && gs.expenses !== this._prevExpenses) {
      this._prevExpenses = gs.expenses;
      this.expensesEl.textContent = String(gs.expenses);
    }
    if (this.dateEl) {
      const month = (gs.date % 12) + 1;
      const year = Math.floor(gs.date / 12) + 1;
      if (month !== this._prevDateMonth || year !== this._prevDateYear) {
        this._prevDateMonth = month;
        this._prevDateYear = year;
        this.dateEl.textContent = `Month ${month}, Year ${year}`;
      }
    }
    const phase = gs.waveActive ? "Defending" : "Building";
    if (this.phaseEl && phase !== this._prevPhase) {
      this._prevPhase = phase;
      this.phaseEl.textContent = phase;
    }
    if (this.waveEl && gs.wave !== this._prevWave) {
      this._prevWave = gs.wave;
      this.waveEl.textContent = String(gs.wave);
    }
    if (this.enemiesEl && gs.enemiesRemaining !== this._prevEnemies) {
      this._prevEnemies = gs.enemiesRemaining;
      this.enemiesEl.textContent = String(gs.enemiesRemaining);
    }
    if (this.fpsEl && fps !== this._prevFps) {
      this._prevFps = fps;
      this.fpsEl.textContent = String(fps);
      this.fpsEl.style.color = fps >= 50 ? "#66cc66" : fps >= 30 ? "#cccc66" : "#cc6666";
    }
  }

  showGameOver(wave: number): void {
    if (this.gameOverEl) this.gameOverEl.style.display = "block";
    if (this.goWaveEl) this.goWaveEl.textContent = `Survived ${wave} waves`;
  }

  togglePause(): void {
    const gs = window.gameState;
    gs.paused = !gs.paused;
    if (gs.paused) {
      if (this.pauseOverlay) this.pauseOverlay.style.display = "flex";
      if (this.pauseBtn) this.pauseBtn.textContent = "Resume (Space)";
      this.scene.game.pause();
    } else {
      if (this.pauseOverlay) this.pauseOverlay.style.display = "none";
      if (this.pauseBtn) this.pauseBtn.textContent = "Pause (Space)";
      this.scene.game.resume();
    }
  }

  showTileInfo(tile: Tile | null): void {
    if (!this.tileInfoEl) return;
    if (!tile || tile.zone === "empty") {
      if (this._prevTileInfo !== "") {
        this._prevTileInfo = "";
        this.tileInfoEl.textContent = "";
      }
      return;
    }
    const text = `Zone: ${tile.zone} | Level: ${tile.level} | Powered: ${tile.isPowered ? "Yes" : "No"} | Road: ${tile.roadConnected ? "Yes" : "No"}`;
    if (text !== this._prevTileInfo) {
      this._prevTileInfo = text;
      this.tileInfoEl.textContent = text;
    }
  }
}
