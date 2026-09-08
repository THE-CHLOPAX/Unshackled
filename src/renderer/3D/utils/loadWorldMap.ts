import { ipc } from '@tgdf';

import { WorldCell, WorldOutputData } from '../types';

function reviveDataAsMap(key: string, value: unknown): unknown {
  return key === 'data' ? new Map(value as [number, WorldCell][]) : value;
}

export function deserializeWorldMap(input: string): WorldOutputData {
  return JSON.parse(input, reviveDataAsMap);
}

export function loadWorldMap(
  fileName?: string
): Promise<{ fileName: string; map: WorldOutputData }> {
  return new Promise((resolve, reject) => {
    ipc.once('load-file-response', (data) => {
      const { ok, contents, path } = data;
      if (!ok || contents === null || path === null) reject('Failed to load world map data.');
      else {
        const pathSegments = path.split('/');
        const fileNameReturned = pathSegments[pathSegments.length - 1];
        resolve({ fileName: fileNameReturned, map: deserializeWorldMap(contents) });
      }
    });

    ipc.send('load-file-request', { path: fileName });
  });
}
