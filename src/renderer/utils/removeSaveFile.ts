import { ipc, isDev } from '@tgdf';

import { SAVE_FILES_LOCATION, SAVE_FILES_LOCATION_DEV } from 'renderer/constants';

export async function removeSaveFile(runId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ipc.once('remove-file-response', (response) => {
      if (response.ok) {
        resolve();
      } else {
        reject(new Error(response.error || 'Failed to remove file'));
      }
    });
    ipc.send('remove-file-request', {
      ...(isDev ? SAVE_FILES_LOCATION_DEV : SAVE_FILES_LOCATION),
      name: runId,
    });
  });
}
