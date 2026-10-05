import { ipc, isDev, logger } from '@tgdf';

import { RunIdentifier } from 'renderer/types';
import { SAVE_FILES_LOCATION, SAVE_FILES_LOCATION_DEV } from 'renderer/constants';

function parseSaveFile({ name, contents }: { name: string; contents: string }): RunIdentifier[] {
  try {
    return [JSON.parse(contents)];
  } catch (error) {
    logger({
      message: `Skipping invalid save file ${name}: ${(error as Error).message}`,
      type: 'warn',
    });
    return [];
  }
}

export async function loadSaveFiles(): Promise<RunIdentifier[]> {
  return new Promise((resolve, reject) => {
    ipc.once('list-files-response', (response) => {
      if (response.ok) {
        resolve(response.files.flatMap(parseSaveFile));
      } else {
        reject(new Error(response.error || 'Failed to load save files'));
      }
    });
    ipc.send('list-files-request', {
      ...(isDev ? SAVE_FILES_LOCATION_DEV : SAVE_FILES_LOCATION),
      extension: 'json',
    });
  });
}
