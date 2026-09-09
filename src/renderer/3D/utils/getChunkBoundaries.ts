import { WorldChunkBoundary, WorldVec2 } from '../types';

export function getChunkBoundaries(
  width: number,
  height: number,
  chunkSize: number
): WorldChunkBoundary[] {
  const chunkBoundaries: WorldChunkBoundary[] = [];

  const chunksInWidth = Math.ceil(width / chunkSize);
  const chunksInHeight = Math.ceil(height / chunkSize);

  for (let x = 0; x < chunksInWidth; x++) {
    for (let z = 0; z < chunksInHeight; z++) {
      const start: WorldVec2 = {
        x: x * chunkSize,
        z: z * chunkSize,
      };
      const end = {
        x: Math.min(x * chunkSize + chunkSize, width),
        z: Math.min(z * chunkSize + chunkSize, height),
      };
      chunkBoundaries.push({ start, end });
    }
  }

  return chunkBoundaries;
}
