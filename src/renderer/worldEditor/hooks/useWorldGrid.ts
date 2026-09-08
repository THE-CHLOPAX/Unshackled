import { useCallback, useMemo, useRef, useState } from 'react';

import { WorldCell, WorldOutputData, WorldTileCodes, WORLD_LAYER_COUNT } from '3D/types';

import { WORLD_GRID_SIZE } from '../const';

const CELL_COUNT = WORLD_GRID_SIZE * WORLD_GRID_SIZE;

function createEmptyLayer(): WorldCell[] {
  return Array.from({ length: CELL_COUNT }, () => ({ code: WorldTileCodes.Empty, rotation: 0 }));
}

function createEmptyLayers(): WorldCell[][] {
  return Array.from({ length: WORLD_LAYER_COUNT }, createEmptyLayer);
}

export type WorldGridApi = {
  layersRef: React.MutableRefObject<WorldCell[][]>;
  version: number;
  gridSize: number;
  layerCount: number;
  paint: (layer: number, index: number, code: number, rotation: number) => void;
  paintBatch: (layers: Map<number, WorldCell>[]) => void;
  erase: (layer: number, index: number) => void;
  rotateAt: (layer: number, index: number) => void;
  clearLayer: (layer: number) => void;
  clearAll: () => void;
  toOutput: () => WorldOutputData;
};

export function useWorldGrid(): WorldGridApi {
  const layersRef = useRef<WorldCell[][]>(createEmptyLayers());
  const [version, setVersion] = useState(0);

  const bump = useCallback(() => setVersion((value) => value + 1), []);

  const paint = useCallback(
    (layer: number, index: number, code: number, rotation: number) => {
      const cells = layersRef.current[layer];
      const cell = cells?.[index];
      if (!cell || (cell.code === code && cell.rotation === rotation)) return;
      cells[index] = { code, rotation };
      bump();
    },
    [bump]
  );

  const paintBatch = useCallback(
    (layers: Map<number, WorldCell>[]) => {
      layers.forEach((layerData, layerIndex) => {
        const cells = layersRef.current[layerIndex];
        if (!cells) return;
        layerData.forEach(({ code, rotation }, index) => {
          if (index < 0 || index >= CELL_COUNT) return;
          cells[index] = { code, rotation };
        });
      });
      bump();
    },
    [bump]
  );

  const erase = useCallback(
    (layer: number, index: number) => {
      const cells = layersRef.current[layer];
      const cell = cells?.[index];
      if (!cell || cell.code === WorldTileCodes.Empty) return;
      cells[index] = { code: WorldTileCodes.Empty, rotation: 0 };
      bump();
    },
    [bump]
  );

  const rotateAt = useCallback(
    (layer: number, index: number) => {
      const cells = layersRef.current[layer];
      const cell = cells?.[index];
      if (!cell || cell.code === WorldTileCodes.Empty) return;
      cells[index] = { code: cell.code, rotation: (cell.rotation + 90) % 360 };
      bump();
    },
    [bump]
  );

  const clearLayer = useCallback(
    (layer: number) => {
      if (!layersRef.current[layer]) return;
      layersRef.current[layer] = createEmptyLayer();
      bump();
    },
    [bump]
  );

  const clearAll = useCallback(() => {
    layersRef.current = createEmptyLayers();
    bump();
  }, [bump]);

  const toOutput = useCallback((): WorldOutputData => {
    const layers = layersRef.current.map((cells) => {
      const data = new Map<number, WorldCell>();
      cells.forEach((cell, index) => {
        if (cell.code === WorldTileCodes.Empty) return;
        data.set(index, { code: cell.code, rotation: cell.rotation });
      });
      return data;
    });

    return {
      version: 2,
      width: WORLD_GRID_SIZE,
      height: WORLD_GRID_SIZE,
      layers,
    };
  }, []);

  return useMemo(
    () => ({
      layersRef,
      version,
      gridSize: WORLD_GRID_SIZE,
      layerCount: WORLD_LAYER_COUNT,
      paint,
      paintBatch,
      erase,
      rotateAt,
      clearLayer,
      clearAll,
      toOutput,
    }),
    [version, paint, paintBatch, erase, rotateAt, clearLayer, clearAll, toOutput]
  );
}
