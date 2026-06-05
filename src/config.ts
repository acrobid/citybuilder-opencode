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
