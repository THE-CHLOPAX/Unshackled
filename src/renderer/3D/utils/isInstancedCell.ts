import { WORLD_PROP_DEFINITIONS, WORLD_TILE_DEFINITIONS } from '3D/worldDefinitions';

import { WorldTileCodes } from '../types';

export function isInstancedCell(code: WorldTileCodes): boolean {
  const found = [...WORLD_TILE_DEFINITIONS, ...WORLD_PROP_DEFINITIONS].find(
    (def) => def.code === code
  );
  return found !== undefined && found.type === 'instanced';
}
