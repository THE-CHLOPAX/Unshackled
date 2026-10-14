import { BiomeId, GameEventsEmitter, LevelIdentifier } from 'renderer/types';
import { ActivePlayerWithProfile } from 'renderer/utils/assignPlayerProfiles';

import { GameScene } from './GameScene/GameScene';
import { DungeonLevelScene } from './DungeonLevelScene';

export type LevelSceneClass = new (
  emitter: GameEventsEmitter,
  level: LevelIdentifier,
  players: ActivePlayerWithProfile[]
) => GameScene;

export const BIOME_SCENES: Record<BiomeId, LevelSceneClass> = {
  dungeon: DungeonLevelScene,
};
