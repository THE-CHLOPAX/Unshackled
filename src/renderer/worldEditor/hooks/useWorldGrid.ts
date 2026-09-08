import { useCallback, useMemo, useRef, useState } from 'react';

import { WorldCell, WorldOutputData, WorldTileCodes } from '3D/types';

import { WORLD_GRID_SIZE } from '../const';

const CELL_COUNT = WORLD_GRID_SIZE * WORLD_GRID_SIZE;

function createEmptyCells(): WorldCell[] {
  return Array.from({ length: CELL_COUNT }, () => ({ code: WorldTileCodes.Empty, rotation: 0 }));
}

export type WorldGridApi = {
  cellsRef: React.MutableRefObject<WorldCell[]>;
  version: number;
  gridSize: number;
  paint: (index: number, code: number, rotation: number) => void;
  paintBatch: (cells: Map<number, WorldCell>) => void;
  erase: (index: number) => void;
  rotateAt: (index: number) => void;
  clear: () => void;
  toOutput: () => WorldOutputData;
};

export function useWorldGrid(): WorldGridApi {
  const cellsRef = useRef<WorldCell[]>(createEmptyCells());
  const [version, setVersion] = useState(0);

  const bump = useCallback(() => setVersion((value) => value + 1), []);

  const paint = useCallback(
    (index: number, code: number, rotation: number) => {
      const cell = cellsRef.current[index];
      if (!cell || (cell.code === code && cell.rotation === rotation)) return;
      cellsRef.current[index] = { code, rotation };
      bump();
    },
    [bump]
  );

  const paintBatch = useCallback(
    (cells: Map<number, WorldCell>) => {
      cells.forEach(({ code, rotation }, index) => {
        if (index < 0 || index >= CELL_COUNT) return;
        cellsRef.current[index] = { code, rotation };
      });
      bump();
    },
    [bump]
  );

  const erase = useCallback(
    (index: number) => {
      const cell = cellsRef.current[index];
      if (!cell || cell.code === WorldTileCodes.Empty) return;
      cellsRef.current[index] = { code: WorldTileCodes.Empty, rotation: 0 };
      bump();
    },
    [bump]
  );

  const rotateAt = useCallback(
    (index: number) => {
      const cell = cellsRef.current[index];
      if (!cell || cell.code === WorldTileCodes.Empty) return;
      cellsRef.current[index] = { code: cell.code, rotation: (cell.rotation + 90) % 360 };
      bump();
    },
    [bump]
  );

  const clear = useCallback(() => {
    cellsRef.current = createEmptyCells();
    bump();
  }, [bump]);

  const toOutput = useCallback((): WorldOutputData => {
    const data = new Map<number, WorldCell>();

    cellsRef.current.forEach((cell, index) => {
      if (cell.code === WorldTileCodes.Empty) return;
      data.set(index, { code: cell.code, rotation: cell.rotation });
    });

    return {
      width: WORLD_GRID_SIZE,
      height: WORLD_GRID_SIZE,
      data,
    };
  }, []);

  return useMemo(
    () => ({
      cellsRef,
      version,
      gridSize: WORLD_GRID_SIZE,
      paint,
      paintBatch,
      erase,
      rotateAt,
      clear,
      toOutput,
    }),
    [version, paint, erase, rotateAt, clear, toOutput]
  );
}
