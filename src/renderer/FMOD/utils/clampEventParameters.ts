import type { FMODEventDefinition, FMODEventParameters, FMODParameterDefinition } from '../types';

export function clampEventParameters<E extends FMODEventDefinition>(
  event: E,
  parameters: FMODEventParameters<E>
): Record<string, number> {
  const definitions: Readonly<Record<string, FMODParameterDefinition | undefined>> =
    event.parameters;
  const clamped: Record<string, number> = {};

  for (const [name, value] of Object.entries(parameters) as [string, number | undefined][]) {
    if (value === undefined) continue;

    const definition = definitions[name];
    clamped[name] = definition ? Math.min(Math.max(value, definition.min), definition.max) : value;
  }

  return clamped;
}
