import { describe, it, expect } from 'vitest';

import { getChunkBoundaries } from './getChunkBoundaries';

describe('getChunkBoundaries', () => {
  it('splits an evenly divisible grid into equally sized chunks', () => {
    const boundaries = getChunkBoundaries(8, 8, 4);

    expect(boundaries).toEqual([
      { start: { x: 0, z: 0 }, end: { x: 4, z: 4 } },
      { start: { x: 0, z: 4 }, end: { x: 4, z: 8 } },
      { start: { x: 4, z: 0 }, end: { x: 8, z: 4 } },
      { start: { x: 4, z: 4 }, end: { x: 8, z: 8 } },
    ]);
  });

  it('clamps the trailing chunk edges when the grid does not divide evenly', () => {
    const boundaries = getChunkBoundaries(10, 10, 4);

    expect(boundaries).toHaveLength(9);
    expect(boundaries).toContainEqual({ start: { x: 8, z: 0 }, end: { x: 10, z: 4 } });
    expect(boundaries).toContainEqual({ start: { x: 0, z: 8 }, end: { x: 4, z: 10 } });
    expect(boundaries).toContainEqual({ start: { x: 8, z: 8 }, end: { x: 10, z: 10 } });
  });

  it('returns a single chunk clamped to the grid when the chunk size exceeds it', () => {
    const boundaries = getChunkBoundaries(5, 5, 10);

    expect(boundaries).toEqual([{ start: { x: 0, z: 0 }, end: { x: 5, z: 5 } }]);
  });

  it('supports non-square grids', () => {
    const boundaries = getChunkBoundaries(12, 4, 4);

    expect(boundaries).toEqual([
      { start: { x: 0, z: 0 }, end: { x: 4, z: 4 } },
      { start: { x: 4, z: 0 }, end: { x: 8, z: 4 } },
      { start: { x: 8, z: 0 }, end: { x: 12, z: 4 } },
    ]);
  });

  it('produces one chunk per cell when the chunk size is 1', () => {
    const boundaries = getChunkBoundaries(2, 2, 1);

    expect(boundaries).toEqual([
      { start: { x: 0, z: 0 }, end: { x: 1, z: 1 } },
      { start: { x: 0, z: 1 }, end: { x: 1, z: 2 } },
      { start: { x: 1, z: 0 }, end: { x: 2, z: 1 } },
      { start: { x: 1, z: 1 }, end: { x: 2, z: 2 } },
    ]);
  });

  it('returns an empty array for a zero-width or zero-height grid', () => {
    expect(getChunkBoundaries(0, 8, 4)).toEqual([]);
    expect(getChunkBoundaries(8, 0, 4)).toEqual([]);
  });
});
