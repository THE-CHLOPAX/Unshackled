import { describe, it, expect } from 'vitest';

import { indexToVec2 } from './indexToVec2';

describe('indexToVec2', () => {
  it('returns the first cell for index 0', () => {
    expect(indexToVec2(0, 8)).toEqual({ x: 0, z: 0 });
  });

  it('returns x within the first row', () => {
    expect(indexToVec2(3, 8)).toEqual({ x: 3, z: 0 });
  });

  it('wraps into the next row once x reaches width', () => {
    expect(indexToVec2(8, 8)).toEqual({ x: 0, z: 1 });
  });

  it('returns the bottom-right cell of a square grid', () => {
    expect(indexToVec2(63, 8)).toEqual({ x: 7, z: 7 });
  });

  it('returns null for a zero-width grid', () => {
    expect(indexToVec2(5, 0)).toBeNull();
  });
});
