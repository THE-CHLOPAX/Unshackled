import { ipc, NativeSaveFileResponse } from '@tgdf';

import { WorldOutputData } from '../types';

function replaceMapsWithEntries(_key: string, value: unknown): unknown {
  return value instanceof Map ? Array.from(value.entries()) : value;
}

export function serializeWorldMap(output: WorldOutputData): string {
  return JSON.stringify(output, replaceMapsWithEntries, 2);
}

export function saveWorldMap(
  name: string,
  output: WorldOutputData
): Promise<NativeSaveFileResponse> {
  return new Promise((resolve) => {
    ipc.once('save-file-response', (data) => resolve(data));
    ipc.send('save-file-request', { name, json: serializeWorldMap(output) });
  });
}
