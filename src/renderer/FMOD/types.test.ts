import type { FMODEventParameters, IntRange } from './types';

import { describe, it, expectTypeOf } from 'vitest';

import { FMOD_EVENTS } from './constants';

const _DISCRETE_EVENT = {
  path: 'event:/Discrete',
  parameters: { Material: { min: 1, max: 3, discrete: true } },
} as const;

describe('FMOD event types', () => {
  it('builds an integer union for a range', () => {
    expectTypeOf<IntRange<0, 3>>().toEqualTypeOf<0 | 1 | 2 | 3>();
    expectTypeOf<IntRange<2, 4>>().toEqualTypeOf<2 | 3 | 4>();
  });

  it('exposes parameter ranges as literal types', () => {
    expectTypeOf(FMOD_EVENTS.GENERIC_FOOTSTEP.parameters.Surface.min).toEqualTypeOf<0>();
    expectTypeOf(FMOD_EVENTS.GENERIC_FOOTSTEP.parameters.Surface.max).toEqualTypeOf<10>();
  });

  it('allows only settable parameter names', () => {
    expectTypeOf<FMODEventParameters<typeof FMOD_EVENTS.GENERIC_FOOTSTEP>>().toEqualTypeOf<{
      Surface?: number;
    }>();

    const footstep: FMODEventParameters<typeof FMOD_EVENTS.GENERIC_FOOTSTEP> = {
      // @ts-expect-error unknown parameter name
      Surfce: 1,
    };
    // @ts-expect-error automatic parameters cannot be set
    const hit: FMODEventParameters<typeof FMOD_EVENTS.GENERIC_HIT> = { Distance: 1 };

    expectTypeOf<FMODEventParameters<typeof FMOD_EVENTS.GENERIC_DASH>>().toEqualTypeOf<
      Record<string, never>
    >();

    expectTypeOf(footstep).not.toBeAny();
    expectTypeOf(hit).not.toBeAny();
  });

  it('restricts discrete parameters to integers within the range', () => {
    expectTypeOf<FMODEventParameters<typeof _DISCRETE_EVENT>>().toEqualTypeOf<{
      Material?: 1 | 2 | 3;
    }>();

    // @ts-expect-error out of the discrete range
    const outOfRange: FMODEventParameters<typeof _DISCRETE_EVENT> = { Material: 4 };

    expectTypeOf(outOfRange).not.toBeAny();
  });
});
