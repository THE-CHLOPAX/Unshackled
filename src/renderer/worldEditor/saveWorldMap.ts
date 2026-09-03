import { ipc, NativeSaveFileResponse } from '@tgdf';

import { WorldGeneratorOutput } from './types';

export function serializeWorldMap(output: WorldGeneratorOutput): string {
  return JSON.stringify(output, null, 2);
}

export function saveWorldMap(
  name: string,
  output: WorldGeneratorOutput
): Promise<NativeSaveFileResponse> {
  return new Promise((resolve) => {
    ipc.once('save-file-response', (data) => resolve(data));
    ipc.send('save-file-request', { name, json: serializeWorldMap(output) });
  });
}
