import { GameScene } from '3D/classes/scenes/GameScene/GameScene';
import { DungeonLevelScene } from '3D/classes/scenes/DungeonLevelScene';
import { BiomeId, GameEventsEmitter, LevelIdentifier } from 'renderer/types';
import { ActivePlayerWithProfile } from 'renderer/utils/assignPlayerProfiles';

export type LevelSceneClass = new (
  emitter: GameEventsEmitter,
  level: LevelIdentifier,
  players: ActivePlayerWithProfile[]
) => GameScene;

export const BIOME_SCENES: Record<BiomeId, LevelSceneClass> = {
  dungeon: DungeonLevelScene,
};
