import { describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { WORLD_LAYER_COUNT } from '3D/constants';
import { serializeWorldMap } from '3D/utils/saveWorldMap';
import { deserializeWorldMap } from '3D/utils/loadWorldMap';

import { WORLD_GRID_SIZE } from './const';
import { useWorldGrid } from './hooks/useWorldGrid';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), once: vi.fn(), removeListener: vi.fn() },
}));

describe('useWorldGrid', () => {
  it('starts with empty layers and reports its grid size', () => {
    const { result } = renderHook(() => useWorldGrid());
    const output = result.current.toOutput();

    expect(output.width).toBe(WORLD_GRID_SIZE);
    expect(output.height).toBe(WORLD_GRID_SIZE);
    expect(output.layers).toHaveLength(result.current.layerCount);
    expect(output.layers.every((layer) => layer.size === 0)).toBe(true);
  });

  it('paints a cell on the target layer without touching neighbours or other layers', () => {
    const { result } = renderHook(() => useWorldGrid());

    act(() => result.current.paint(1, 10, 0x888888, 90));
    const output = result.current.toOutput();

    expect(output.layers[1].get(10)).toEqual({ code: 0x888888, rotation: 90 });
    expect(output.layers[0].has(10)).toBe(false);
    expect(output.layers[1].has(9)).toBe(false);
    expect(output.layers[1].has(11)).toBe(false);
  });

  it('keeps the lower-layer cell when painting the same coord one layer up', () => {
    const { result } = renderHook(() => useWorldGrid());

    act(() => result.current.paint(0, 5, 0x552222, 0));
    act(() => result.current.paint(1, 5, 0x5a5a5a, 0));
    const output = result.current.toOutput();

    expect(output.layers[0].get(5)).toEqual({ code: 0x552222, rotation: 0 });
    expect(output.layers[1].get(5)).toEqual({ code: 0x5a5a5a, rotation: 0 });
  });

  it('omits an erased cell from its layer', () => {
    const { result } = renderHook(() => useWorldGrid());

    act(() => result.current.paint(2, 5, 0x123456, 180));
    act(() => result.current.erase(2, 5));

    expect(result.current.toOutput().layers[2].has(5)).toBe(false);
  });

  it('cycles rotation in 90 degree steps and wraps at 360', () => {
    const { result } = renderHook(() => useWorldGrid());

    act(() => result.current.paint(0, 0, 0xabcdef, 270));
    act(() => result.current.rotateAt(0, 0));

    expect(result.current.toOutput().layers[0].get(0)).toEqual({ code: 0xabcdef, rotation: 0 });
  });

  it('does not rotate an empty cell', () => {
    const { result } = renderHook(() => useWorldGrid());

    act(() => result.current.rotateAt(0, 20));

    expect(result.current.toOutput().layers[0].has(20)).toBe(false);
  });

  it('clearLayer wipes only the given layer', () => {
    const { result } = renderHook(() => useWorldGrid());

    act(() => result.current.paint(0, 1, 0x111111, 0));
    act(() => result.current.paint(1, 2, 0x222222, 90));
    act(() => result.current.clearLayer(0));
    const output = result.current.toOutput();

    expect(output.layers[0].size).toBe(0);
    expect(output.layers[1].get(2)).toEqual({ code: 0x222222, rotation: 90 });
  });

  it('clearAll wipes every layer', () => {
    const { result } = renderHook(() => useWorldGrid());

    act(() => result.current.paint(0, 1, 0x111111, 0));
    act(() => result.current.paint(2, 2000, 0x222222, 90));
    act(() => result.current.clearAll());

    expect(result.current.toOutput().layers.every((layer) => layer.size === 0)).toBe(true);
  });
});

describe('serializeWorldMap', () => {
  it('round-trips layered cells through JSON without loss', () => {
    const { result } = renderHook(() => useWorldGrid());
    act(() => result.current.paint(0, 42, 0xffaa33, 180));
    act(() => result.current.paint(2, 42, 0x00ff00, 0));

    const output = result.current.toOutput();
    const parsed = deserializeWorldMap(serializeWorldMap(output));

    expect(parsed).toEqual(output);
    expect(parsed.layers[0].get(42)).toEqual({ code: 0xffaa33, rotation: 180 });
    expect(parsed.layers[2].get(42)).toEqual({ code: 0x00ff00, rotation: 0 });
  });

  it('migrates a legacy single-grid map into layer 0', () => {
    const legacy = JSON.stringify({
      width: WORLD_GRID_SIZE,
      height: WORLD_GRID_SIZE,
      data: [[1881, { code: 8947848, rotation: 90 }]],
    });

    const parsed = deserializeWorldMap(legacy);

    expect(parsed.version).toBe(2);
    expect(parsed.layers).toHaveLength(WORLD_LAYER_COUNT);
    expect(parsed.layers[0].get(1881)).toEqual({ code: 8947848, rotation: 90 });
    expect(parsed.layers[1].size).toBe(0);
  });
});
