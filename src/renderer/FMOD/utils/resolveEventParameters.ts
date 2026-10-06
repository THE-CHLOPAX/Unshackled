import type { FMODEventDefinition, FMODEventParameters, FMODParameterDefinition } from '../types';

function isSettable({ automatic, readOnly, global }: FMODParameterDefinition): boolean {
  return !automatic && !readOnly && !global;
}

function clamp(value: number, { min, max }: FMODParameterDefinition): number {
  return Math.min(Math.max(value, min), max);
}

export function resolveEventParameters<E extends FMODEventDefinition>(
  event: E,
  overrides: FMODEventParameters<E> = {} as FMODEventParameters<E>
): Record<string, number> {
  const definitions: Readonly<Record<string, FMODParameterDefinition | undefined>> =
    event.parameters;
  const resolved: Record<string, number> = {};

  for (const [name, definition] of Object.entries(event.parameters)) {
    if (isSettable(definition)) {
      resolved[name] = clamp(definition.defaultValue, definition);
    }
  }

  for (const [name, value] of Object.entries(overrides) as [string, number | undefined][]) {
    if (value === undefined) continue;

    const definition = definitions[name];
    resolved[name] = definition ? clamp(value, definition) : value;
  }

  return resolved;
}
