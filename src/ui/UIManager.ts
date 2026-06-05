import type { Tile } from "../entities/Tile.js";
import { WorldMap } from "../map/WorldMap.js";

interface UIScene {
  worldMap: WorldMap;
  graphics: Phaser.GameObjects.Graphics;
  time: { now: number };
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

  constructor(scene: UIScene) {
    this.scene = scene;
    this.moneyEl = document.getElementById("stat-money");
    this.popEl = document.getElementById("stat-pop");
    this.incomeEl = document.getElementById("stat-income");
    this.expensesEl = document.getElementById("stat-expenses");
    this.dateEl = document.getElementById("stat-date");
    this.tileInfoEl = document.getElementById("tile-info");
    this.toolbarButtons = document.querySelectorAll("#toolbar button[data-tool]");
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
      this.scene.worldMap.save();
    });

    document.getElementById("btn-load")?.addEventListener("click", () => {
      const loaded = WorldMap.load();
      if (loaded) {
        this.scene.worldMap = loaded;
        this.scene.graphics.clear();
        this.scene.worldMap.render(this.scene.graphics);
      }
    });

    document.addEventListener("keydown", (e) => {
      const keyMap: Record<string, string> = {
        r: "road",
        z: "residential",
        c: "commercial",
        i: "industrial",
        p: "powerplant",
        b: "bulldoze",
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
