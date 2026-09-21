import { ipc, isElectron } from '@tgdf';

import { WORLD_LAYER_COUNT } from '../constants';
import { WorldCell, WorldOutputData } from '../types';

type RawWorldData = {
  version?: number;
  width: number;
  height: number;
  data?: Map<number, WorldCell>;
  layers?: Map<number, WorldCell>[];
};

function reviveWorldMap(key: string, value: unknown): unknown {
  if (key === 'data' && Array.isArray(value)) {
    return new Map(value as [number, WorldCell][]);
  }
  if (key === 'layers' && Array.isArray(value)) {
    return (value as [number, WorldCell][][]).map((entries) => new Map(entries));
  }
  return value;
}

function migrateWorldMap(parsed: RawWorldData): WorldOutputData {
  const source = parsed.layers ?? [parsed.data ?? new Map<number, WorldCell>()];
  const layers = source.slice(0, WORLD_LAYER_COUNT);
  while (layers.length < WORLD_LAYER_COUNT) layers.push(new Map<number, WorldCell>());

  return { version: 2, width: parsed.width, height: parsed.height, layers };
}

export function deserializeWorldMap(input: string): WorldOutputData {
  return migrateWorldMap(JSON.parse(input, reviveWorldMap) as RawWorldData);
}

export function loadWorldMap(
  fileName?: string
): Promise<{ fileName: string; map: WorldOutputData }> {
  return new Promise((resolve, reject) => {
    if (isElectron) {
      ipc.once('load-file-response', (data) => {
        const { ok, contents, path } = data;
        if (!ok || contents === null || path === null) {
          reject('Failed to load world map data.');
          return;
        }
        try {
          const fileNameReturned = path.split(/[/\\]/).pop() ?? '';
          resolve({ fileName: fileNameReturned, map: deserializeWorldMap(contents) });
        } catch (error) {
          reject(`Failed to load world map data: ${String(error)}`);
        }
      });

      ipc.send('load-file-request', { path: fileName });
    } else {
      if (!fileName) {
        reject('Failed to load world map data. No file name provided.');
        return;
      }

      fetch(`./assets/worldMaps/${fileName}`)
        .then((response) => {
          if (!response.ok) throw new Error(String(response.status));
          return response.text();
        })
        .then((contents) => resolve({ fileName, map: deserializeWorldMap(contents) }))
        .catch(() => reject('Failed to load world map data.'));
    }
  });
}
