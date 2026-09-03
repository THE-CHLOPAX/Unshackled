import { useCallback, useMemo, useRef, useState } from 'react';

import { EMPTY_CELL_CODE, WORLD_GEN_GRID_SIZE } from '3D/classes/worldGenerator/const';
import { WorldGeneratorCell, WorldGeneratorOutput } from '3D/classes/worldGenerator/types';

const CELL_COUNT = WORLD_GEN_GRID_SIZE * WORLD_GEN_GRID_SIZE;

function createEmptyCells(): WorldGeneratorCell[] {
  return Array.from({ length: CELL_COUNT }, () => ({ code: EMPTY_CELL_CODE, rotation: 0 }));
}

export type WorldGridApi = {
  cellsRef: React.MutableRefObject<WorldGeneratorCell[]>;
  version: number;
  gridSize: number;
  paint: (index: number, code: number, rotation: number) => void;
  paintBatch: (cells: WorldGeneratorCell[]) => void;
  erase: (index: number) => void;
  rotateAt: (index: number) => void;
  clear: () => void;
  toOutput: () => WorldGeneratorOutput;
};

export function useWorldGrid(): WorldGridApi {
  const cellsRef = useRef<WorldGeneratorCell[]>(createEmptyCells());
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
    (cells: WorldGeneratorCell[]) => {
      cells.forEach((cell, index) => {
        const { code, rotation } = cell;
        cellsRef.current[index] = { code, rotation };
      });
      bump();
    },
    [bump]
  );

  const erase = useCallback(
    (index: number) => {
      const cell = cellsRef.current[index];
      if (!cell || cell.code === EMPTY_CELL_CODE) return;
      cellsRef.current[index] = { code: EMPTY_CELL_CODE, rotation: 0 };
      bump();
    },
    [bump]
  );

  const rotateAt = useCallback(
    (index: number) => {
      const cell = cellsRef.current[index];
      if (!cell || cell.code === EMPTY_CELL_CODE) return;
      cellsRef.current[index] = { code: cell.code, rotation: (cell.rotation + 90) % 360 };
      bump();
    },
    [bump]
  );

  const clear = useCallback(() => {
    cellsRef.current = createEmptyCells();
    bump();
  }, [bump]);

  const toOutput = useCallback(
    (): WorldGeneratorOutput => ({
      width: WORLD_GEN_GRID_SIZE,
      height: WORLD_GEN_GRID_SIZE,
      data: cellsRef.current.map((cell) => ({ code: cell.code, rotation: cell.rotation })),
    }),
    []
  );

  return useMemo(
    () => ({
      cellsRef,
      version,
      gridSize: WORLD_GEN_GRID_SIZE,
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
