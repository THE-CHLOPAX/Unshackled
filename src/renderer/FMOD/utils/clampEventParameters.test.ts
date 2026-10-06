import { describe, it, expect } from 'vitest';

import { clampEventParameters } from './clampEventParameters';

const EVENT = {
  path: 'event:/Test',
  volume: 1,
  parameters: {
    Surface: { min: 0, max: 10 },
    Pitch: { min: -1, max: 1 },
  },
} as const;

describe('clampEventParameters', () => {
  it('keeps values that are within the parameter range', () => {
    expect(clampEventParameters(EVENT, { Surface: 4, Pitch: -0.5 })).toEqual({
      Surface: 4,
      Pitch: -0.5,
    });
  });

  it('clamps values below the minimum and above the maximum', () => {
    expect(clampEventParameters(EVENT, { Surface: -3, Pitch: 7 })).toEqual({
      Surface: 0,
      Pitch: 1,
    });
  });

  it('omits parameters that were not provided', () => {
    expect(clampEventParameters(EVENT, { Surface: 12 })).toEqual({ Surface: 10 });
  });
});
