import { Flame } from '3D/classes/gameObjects/Flame';
import { WorldObjectDefinition, WorldTileCodes } from 'renderer/types';
import { SpawnMarker } from '3D/classes/gameObjects/SpawnMarker/SpawnMarker';
import { LevelEndMarker } from '3D/classes/gameObjects/LevelEndMarker/LevelEndMarker';
import { SkeletonSpawner } from '3D/classes/gameObjects/SkeletonSpawner/SkeletonSpawner';

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
