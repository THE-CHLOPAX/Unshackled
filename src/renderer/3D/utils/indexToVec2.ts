import { WorldVec2 } from '../types';

export function indexToVec2(index: number, width: number): WorldVec2 | null {
  if (width === 0) return null;
  return {
    x: index % width,
    z: Math.floor(index / width),
  };
}
