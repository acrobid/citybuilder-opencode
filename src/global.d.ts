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
