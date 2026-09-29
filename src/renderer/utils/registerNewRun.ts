import { ipc } from '@tgdf';
import { v4 as uuidv4 } from 'uuid';

import { SAVE_FILES_LOCATION } from 'renderer/constants';
import { PlayerProfile, RunIdentifier } from 'renderer/types';

const DEFAULT_NEW_GAME_NAME = 'New game';

export async function registerNewRun(players: Set<PlayerProfile>): Promise<RunIdentifier> {
  return new Promise((resolve, reject) => {
    const run: RunIdentifier = {
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

    const json = JSON.stringify(run, null, 2);

    ipc.once('save-file-response', ({ ok }) => {
      if (ok) {
        resolve(run);
      } else {
        reject(new Error('Failed to save file'));
      }
    });
    ipc.send('save-file-request', { ...SAVE_FILES_LOCATION, json, name: run.id });
  });
}
