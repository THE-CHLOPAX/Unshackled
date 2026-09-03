import { describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { WORLD_GEN_GRID_SIZE, EMPTY_CELL_CODE } from '3D/classes/worldGenerator/const';

import { useWorldGrid } from './useWorldGrid';
import { serializeWorldMap } from './saveWorldMap';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), once: vi.fn(), removeListener: vi.fn() },
}));

const CELL_COUNT = WORLD_GEN_GRID_SIZE * WORLD_GEN_GRID_SIZE;

describe('useWorldGrid', () => {
  it('starts as a dense fully-empty grid', () => {
    const { result } = renderHook(() => useWorldGrid());
    const output = result.current.toOutput();

    expect(output.width).toBe(WORLD_GEN_GRID_SIZE);
    expect(output.height).toBe(WORLD_GEN_GRID_SIZE);
    expect(output.data).toHaveLength(CELL_COUNT);
    expect(output.data.every((cell) => cell.code === EMPTY_CELL_CODE && cell.rotation === 0)).toBe(
      true
    );
  });

  it('paints a single cell without touching its neighbours', () => {
    const { result } = renderHook(() => useWorldGrid());

    act(() => result.current.paint(10, 0x888888, 90));
    const output = result.current.toOutput();

    expect(output.data[10]).toEqual({ code: 0x888888, rotation: 90 });
    expect(output.data[9]).toEqual({ code: EMPTY_CELL_CODE, rotation: 0 });
    expect(output.data[11]).toEqual({ code: EMPTY_CELL_CODE, rotation: 0 });
  });

  it('erases a painted cell back to empty', () => {
    const { result } = renderHook(() => useWorldGrid());

    act(() => result.current.paint(5, 0x123456, 180));
    act(() => result.current.erase(5));

    expect(result.current.toOutput().data[5]).toEqual({ code: EMPTY_CELL_CODE, rotation: 0 });
  });

  it('cycles rotation in 90 degree steps and wraps at 360', () => {
    const { result } = renderHook(() => useWorldGrid());

    act(() => result.current.paint(0, 0xabcdef, 270));
    act(() => result.current.rotateAt(0));

    expect(result.current.toOutput().data[0]).toEqual({ code: 0xabcdef, rotation: 0 });
  });

  it('does not rotate an empty cell', () => {
    const { result } = renderHook(() => useWorldGrid());

    act(() => result.current.rotateAt(20));

    expect(result.current.toOutput().data[20]).toEqual({ code: EMPTY_CELL_CODE, rotation: 0 });
  });

  it('clears every painted cell', () => {
    const { result } = renderHook(() => useWorldGrid());

    act(() => result.current.paint(1, 0x111111, 0));
    act(() => result.current.paint(2000, 0x222222, 90));
    act(() => result.current.clear());

    const allEmpty = result.current.toOutput().data.every((cell) => cell.code === EMPTY_CELL_CODE);
    expect(allEmpty).toBe(true);
  });
});

describe('serializeWorldMap', () => {
  it('round-trips through JSON without losing cells', () => {
    const { result } = renderHook(() => useWorldGrid());
    act(() => result.current.paint(42, 0xffaa33, 180));

    const output = result.current.toOutput();
    const parsed = JSON.parse(serializeWorldMap(output));

    expect(parsed).toEqual(output);
    expect(parsed.data[42]).toEqual({ code: 0xffaa33, rotation: 180 });
  });
});
