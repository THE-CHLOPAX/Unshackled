import { describe, it, expect } from 'vitest';

import { vec2toIndex } from './vec2ToIndex';

describe('vec2toIndex', () => {
  it('returns the x coordinate for the first row', () => {
    expect(vec2toIndex(0, 0, 8)).toBe(0);
    expect(vec2toIndex(3, 0, 8)).toBe(3);
    expect(vec2toIndex(7, 0, 8)).toBe(7);
  });

  it('offsets by z rows of width cells', () => {
    expect(vec2toIndex(0, 1, 8)).toBe(8);
    expect(vec2toIndex(0, 2, 8)).toBe(16);
    expect(vec2toIndex(3, 2, 8)).toBe(19);
  });

  it('returns the last valid index for the bottom-right corner of the grid', () => {
    expect(vec2toIndex(7, 7, 8)).toBe(63);
  });

  it('supports non-square grids', () => {
    expect(vec2toIndex(2, 1, 4)).toBe(6);
    expect(vec2toIndex(3, 0, 4)).toBe(3);
  });
});
