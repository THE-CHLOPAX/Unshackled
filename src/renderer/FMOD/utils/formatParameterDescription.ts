import type { FMODParameterDescription } from '../fmodstudio';

const PARAMETER_FLAG_NAMES: Array<[number, string]> = [
  [0x01, 'read-only'],
  [0x02, 'automatic'],
  [0x04, 'global'],
  [0x08, 'discrete'],
  [0x10, 'labeled'],
];

export function formatParameterDescription(parameter: FMODParameterDescription): string {
  const { name, minimum, maximum, defaultvalue, flags } = parameter;
  const flagNames = PARAMETER_FLAG_NAMES.filter(([bit]) => (flags & bit) !== 0).map(
    ([, flagName]) => flagName
  );
  const flagsSuffix = flagNames.length > 0 ? ` [${flagNames.join(', ')}]` : '';

  return `${name}: ${minimum} to ${maximum} (default ${defaultvalue})${flagsSuffix}`;
}
