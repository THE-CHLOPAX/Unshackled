import { describe, it, expect } from 'vitest';

import { resolveEventParameters } from './resolveEventParameters';

const EVENT = {
  path: 'event:/Test',
  volume: 1,
  parameters: {
    Surface: { min: 0, max: 10, defaultValue: 3 },
    Pitch: { min: -1, max: 1, defaultValue: 0 },
    Distance: { min: 0, max: 20, defaultValue: 0, automatic: true, readOnly: true },
    Weather: { min: 0, max: 1, defaultValue: 1, global: true },
  },
} as const;

describe('resolveEventParameters', () => {
  it('returns default values of settable parameters when nothing is overridden', () => {
    expect(resolveEventParameters(EVENT)).toEqual({ Surface: 3, Pitch: 0 });
  });

  it('overrides default values with the provided ones', () => {
    expect(resolveEventParameters(EVENT, { Surface: 4, Pitch: -0.5 })).toEqual({
      Surface: 4,
      Pitch: -0.5,
    });
  });

  it('keeps defaults for parameters that were not overridden', () => {
    expect(resolveEventParameters(EVENT, { Pitch: 0.5 })).toEqual({ Surface: 3, Pitch: 0.5 });
  });

  it('clamps overrides below the minimum and above the maximum', () => {
    expect(resolveEventParameters(EVENT, { Surface: -3, Pitch: 7 })).toEqual({
      Surface: 0,
      Pitch: 1,
    });
  });

  it('clamps default values that are outside of the parameter range', () => {
    const event = {
      path: 'event:/Test',
      volume: 1,
      parameters: { Surface: { min: 0, max: 10, defaultValue: 42 } },
    } as const;

    expect(resolveEventParameters(event)).toEqual({ Surface: 10 });
  });

  it('returns an empty object for events without settable parameters', () => {
    const event = { path: 'event:/Test', volume: 1, parameters: {} } as const;

    expect(resolveEventParameters(event)).toEqual({});
  });
});
