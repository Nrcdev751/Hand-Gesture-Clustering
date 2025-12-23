export type ColorType = 'red' | 'green' | 'blue';

export interface GameShape {
  id: string;
  type: 'cube' | 'sphere' | 'tetrahedron';
  color: ColorType;
  position: [number, number, number]; // [x, y, z]
  isMatched: boolean;
  isGrabbed: boolean;
}

export interface HandData {
  x: number; // Normalized 0-1
  y: number; // Normalized 0-1
  isPinching: boolean;
  isPresent: boolean;
}

export interface ZoneData {
  color: ColorType;
  position: [number, number, number];
  radius: number;
}
