export interface Stroke {
  id: string;
  path: Path2D; // The hit area and drawing path
  targetColor: string; // The correct color needed
  currentColor: string | null; // The color currently painted (null if empty)
  zIndex: number; // For drawing order
}

export type ShapeType = 'rect' | 'circle' | 'ellipse' | 'path';

export interface RealisticShape {
  type: ShapeType;
  color: string;
  // Properties for different shapes
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  r?: number; // radius
  rx?: number; // radius x
  ry?: number; // radius y
  rotation?: number;
  points?: {x: number, y: number, cp1x?: number, cp1y?: number, cp2x?: number, cp2y?: number}[]; // For paths
  zIndex: number;
}

export interface LevelData {
  strokes: Stroke[];
  shapes: RealisticShape[];
}

export interface GameState {
  status: 'idle' | 'playing' | 'won' | 'lost';
  madness: number; // 0 to 100
  startTime: number;
  endTime: number | null;
}

export const GAME_CONSTANTS = {
  CANVAS_WIDTH: 360,
  CANVAS_HEIGHT: 640, // 9:16 Aspect Ratio roughly
  MADNESS_INCREASE_RATE: 0.05, // Madness per frame (approx)
  MADNESS_PENALTY: 15,
  MADNESS_REWARD: 2,
};