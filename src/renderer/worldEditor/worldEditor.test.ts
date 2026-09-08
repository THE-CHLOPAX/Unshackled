import { describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { serializeWorldMap } from '3D/utils/saveWorldMap';
import { deserializeWorldMap } from '3D/utils/loadWorldMap';

import { WORLD_GRID_SIZE } from './const';
import { useWorldGrid } from './hooks/useWorldGrid';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), once: vi.fn(), removeListener: vi.fn() },
}));

describe('useWorldGrid', () => {
  it('starts with no cells and reports its grid size', () => {
    const { result } = renderHook(() => useWorldGrid());
    const output = result.current.toOutput();

    expect(output.width).toBe(WORLD_GRID_SIZE);
    expect(output.height).toBe(WORLD_GRID_SIZE);
    expect(output.data.size).toBe(0);
  });

  it('paints a single cell without touching its neighbours', () => {
    const { result } = renderHook(() => useWorldGrid());

    act(() => result.current.paint(10, 0x888888, 90));
    const output = result.current.toOutput();

    expect(output.data.get(10)).toEqual({ code: 0x888888, rotation: 90 });
    expect(output.data.has(9)).toBe(false);
    expect(output.data.has(11)).toBe(false);
  });

  it('omits an erased cell from the output', () => {
    const { result } = renderHook(() => useWorldGrid());

    act(() => result.current.paint(5, 0x123456, 180));
    act(() => result.current.erase(5));

    expect(result.current.toOutput().data.has(5)).toBe(false);
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

    expect(result.current.toOutput().data.has(20)).toBe(false);
  });

  it('clears every painted cell', () => {
    const { result } = renderHook(() => useWorldGrid());

    act(() => result.current.paint(1, 0x111111, 0));
    act(() => result.current.paint(2000, 0x222222, 90));
    act(() => result.current.clear());

    expect(result.current.toOutput().data.size).toBe(0);
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
