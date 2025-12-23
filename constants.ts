import { ZoneData } from './types';

export const PINCH_THRESHOLD = 0.08; // Distance between index and thumb to trigger pinch
export const MOVEMENT_SMOOTHING = 0.2; // Lerp factor for hand movement
export const OBJECT_Y_FLOAT = 2.5; // Height where objects float
export const OBJECT_Y_FLOOR = 0.5; // Height when placed on floor
export const ZONE_RADIUS = 1.8;

export const ZONES: ZoneData[] = [
  { color: 'red', position: [-4, 0.1, 0], radius: ZONE_RADIUS },
  { color: 'green', position: [0, 0.1, 0], radius: ZONE_RADIUS },
  { color: 'blue', position: [4, 0.1, 0], radius: ZONE_RADIUS },
];

export const COLORS = {
  red: '#ef4444',
  green: '#22c55e',
  blue: '#3b82f6',
  cursor: '#ffffff',
  cursorActive: '#fbbf24',
};
