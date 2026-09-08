import { describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { WorldTileCodes } from '3D/types';
import { serializeWorldMap } from '3D/utils/saveWorldMap';
import { deserializeWorldMap } from '3D/utils/loadWorldMap';

import { WORLD_GRID_SIZE } from './const';
import { useWorldGrid } from './hooks/useWorldGrid';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), once: vi.fn(), removeListener: vi.fn() },
}));

const CELL_COUNT = WORLD_GRID_SIZE * WORLD_GRID_SIZE;

describe('useWorldGrid', () => {
  it('starts as a dense fully-empty grid', () => {
    const { result } = renderHook(() => useWorldGrid());
    const output = result.current.toOutput();

    expect(output.width).toBe(WORLD_GRID_SIZE);
    expect(output.height).toBe(WORLD_GRID_SIZE);
    expect(output.data.size).toBe(CELL_COUNT);
    expect(
      Array.from(output.data.values()).every(
        (cell) => cell.code === WorldTileCodes.Empty && cell.rotation === 0
      )
    ).toBe(true);
  });

  it('paints a single cell without touching its neighbours', () => {
    const { result } = renderHook(() => useWorldGrid());

    act(() => result.current.paint(10, 0x888888, 90));
    const output = result.current.toOutput();

    expect(output.data.get(10)).toEqual({ code: 0x888888, rotation: 90 });
    expect(output.data.get(9)).toEqual({ code: WorldTileCodes.Empty, rotation: 0 });
    expect(output.data.get(11)).toEqual({ code: WorldTileCodes.Empty, rotation: 0 });
  });

  it('erases a painted cell back to empty', () => {
    const { result } = renderHook(() => useWorldGrid());

    act(() => result.current.paint(5, 0x123456, 180));
    act(() => result.current.erase(5));

    expect(result.current.toOutput().data.get(5)).toEqual({
      code: WorldTileCodes.Empty,
      rotation: 0,
    });
  });

  it('cycles rotation in 90 degree steps and wraps at 360', () => {
    const { result } = renderHook(() => useWorldGrid());

    act(() => result.current.paint(0, 0xabcdef, 270));
    act(() => result.current.rotateAt(0));

    expect(result.current.toOutput().data.get(0)).toEqual({ code: 0xabcdef, rotation: 0 });
  });

  it('does not rotate an empty cell', () => {
    const { result } = renderHook(() => useWorldGrid());

    act(() => result.current.rotateAt(20));

    expect(result.current.toOutput().data.get(20)).toEqual({
      code: WorldTileCodes.Empty,
      rotation: 0,
    });
  });

  it('clears every painted cell', () => {
    const { result } = renderHook(() => useWorldGrid());

    act(() => result.current.paint(1, 0x111111, 0));
    act(() => result.current.paint(2000, 0x222222, 90));
    act(() => result.current.clear());

    const allEmpty = Array.from(result.current.toOutput().data.values()).every(
      (cell) => cell.code === WorldTileCodes.Empty
    );
    expect(allEmpty).toBe(true);
  });
});

describe('serializeWorldMap', () => {
  it('round-trips through JSON without losing cells', () => {
    const { result } = renderHook(() => useWorldGrid());
    act(() => result.current.paint(42, 0xffaa33, 180));

    const output = result.current.toOutput();
    const parsed = deserializeWorldMap(serializeWorldMap(output));

    expect(parsed).toEqual(output);
    expect(parsed.data.get(42)).toEqual({ code: 0xffaa33, rotation: 180 });
  });
});
