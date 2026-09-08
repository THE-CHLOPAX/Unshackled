import { ipc } from '@tgdf';

import { WorldCell, WorldOutputData } from '../types';

function reviveDataAsMap(key: string, value: unknown): unknown {
  return key === 'data' ? new Map(value as [number, WorldCell][]) : value;
}

export function deserializeWorldMap(input: string): WorldOutputData {
  return JSON.parse(input, reviveDataAsMap);
}

export function loadWorldMap(path?: string): Promise<WorldOutputData> {
  return new Promise((resolve, reject) => {
    ipc.once('load-file-response', (data) => {
      const { ok, contents } = data;
      if (!ok || contents === null) reject('Failed to load world map data.');
      else {
        const deserializedData = deserializeWorldMap(contents);
        resolve(deserializedData);
      }
    });

    ipc.send('load-file-request', { path });
  });
}
