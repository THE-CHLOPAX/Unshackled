import { ipc, isDev } from '@tgdf';

import { RunIdentifier } from 'renderer/types';
import { SAVE_FILES_LOCATION, SAVE_FILES_LOCATION_DEV } from 'renderer/constants';

export async function writeSaveFile(run: RunIdentifier): Promise<RunIdentifier> {
  return new Promise((resolve, reject) => {
    const updatedAt = Date.now();

    const updatedRun = { ...run, updatedAt };

    ipc.once('save-file-response', (response) => {
      if (response.ok) {
        resolve(updatedRun);
      } else {
        reject(new Error(response.error || 'Failed to save file'));
      }
    });
    ipc.send('save-file-request', {
      ...(isDev ? SAVE_FILES_LOCATION_DEV : SAVE_FILES_LOCATION),
      json: JSON.stringify(updatedRun, null, 2),
      name: updatedRun.id,
    });
  });
}
