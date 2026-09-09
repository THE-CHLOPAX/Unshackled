import { WorldObjectDefinition } from '3D/types';
import { WORLD_TILE_DEFINITIONS } from '3D/worldDefinitions';

export const WORLD_GRID_SIZE = 64;

export const CELL_ROTATIONS = [0, 90, 180, 270] as const;

export const tileDefinitionByCode: ReadonlyMap<number, WorldObjectDefinition> = new Map(
  WORLD_TILE_DEFINITIONS.map((definition) => [definition.code, definition])
);
