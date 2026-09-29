import { BiomeId, GameEventsEmitter, LevelIdentifier } from 'renderer/types';

import { GameScene } from './GameScene/GameScene';
import { DungeonLevelScene } from './DungeonLevelScene';

export type LevelSceneClass = new (emitter: GameEventsEmitter, level: LevelIdentifier) => GameScene;

export const BIOME_SCENES: Record<BiomeId, LevelSceneClass> = {
  dungeon: DungeonLevelScene,
};
