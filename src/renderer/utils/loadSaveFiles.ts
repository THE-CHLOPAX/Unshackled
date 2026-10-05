import { ipc, isDev } from '@tgdf';

import { RunIdentifier } from 'renderer/types';
import { SAVE_FILES_LOCATION, SAVE_FILES_LOCATION_DEV } from 'renderer/constants';

export async function loadSaveFiles(): Promise<RunIdentifier[]> {
  return new Promise((resolve, reject) => {
    ipc.once('list-files-response', (response) => {
      if (response.ok) {
        resolve(response.files.map((file) => JSON.parse(file.contents)));
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
