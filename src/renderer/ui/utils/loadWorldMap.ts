import { ipc } from '@tgdf';

import { WorldGeneratorOutput } from '3D/classes/worldGenerator/types';

export function deserializeWorldMap(input: string): WorldGeneratorOutput {
  return JSON.parse(input);
}

export function loadWorldMap(): Promise<WorldGeneratorOutput> {
  return new Promise((resolve, reject) => {
    ipc.once('load-file-response', (data) => {
      const { ok, contents } = data;
      if (!ok || contents === null) reject('Failed to load world map data.');
      else {
        const deserializedData = deserializeWorldMap(contents);
        resolve(deserializedData);
      }
    });
    ipc.send('load-file-request', undefined);
  });
}
