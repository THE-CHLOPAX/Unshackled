import { Flame } from '3D/classes/gameObjects/props/Flame';
import { SpawnMarker } from '3D/classes/gameObjects/props/SpawnMarker';
import { WorldObjectDefinition, WorldTileCodes } from 'renderer/types';
import { SkeletonSpawner } from '3D/classes/gameObjects/SkeletonSpawner';
import { LevelEndMarker } from '3D/classes/gameObjects/props/LevelEndMarker';

export const WORLD_TILE_DEFINITIONS_SHARED: WorldObjectDefinition[] = [];

export const WORLD_PROP_DEFINITIONS_SHARED: WorldObjectDefinition[] = [
  { type: 'entity', code: WorldTileCodes.SpawnMarker, label: 'Spawn', object: SpawnMarker },
  {
    type: 'entity',
    code: WorldTileCodes.LevelEndMarker,
    label: 'Level end',
    object: LevelEndMarker,
  },
  {
    type: 'entity',
    code: WorldTileCodes.Flame,
    label: 'Flame',
    object: Flame,
  },
  {
    type: 'entity',
    code: WorldTileCodes.SkeletonSpawner,
    label: 'Skeleton spawner',
    disableModelScaling: true,
    object: SkeletonSpawner,
  },
];
