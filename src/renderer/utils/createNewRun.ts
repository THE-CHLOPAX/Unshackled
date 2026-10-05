import { v4 as uuidv4 } from 'uuid';

import { PlayerProfile, RunIdentifier } from 'renderer/types';

const DEFAULT_NEW_GAME_NAME = 'New game';

export function createNewRun(players: Set<PlayerProfile>): RunIdentifier {
  return {
    version: 1,
    id: uuidv4(),
    name: DEFAULT_NEW_GAME_NAME,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    progress: {
      biomeId: 'dungeon',
      levelIndex: 0,
    },
    completedLevelIds: [],
    players: Array.from(players),
  };
}
