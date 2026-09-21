import { describe, it, expect, vi, beforeEach } from 'vitest';

import { WORLD_LAYER_COUNT } from '../constants';

const mockState = vi.hoisted(() => ({ isElectron: false }));
const mockIpc = vi.hoisted(() => ({
  send: vi.fn(),
  on: vi.fn(),
  once: vi.fn(),
  removeAllListeners: vi.fn(),
}));

vi.mock('@tgdf', () => ({
  ipc: mockIpc,
  get isElectron() {
    return mockState.isElectron;
  },
}));

import { deserializeWorldMap, loadWorldMap } from './loadWorldMap';

describe('deserializeWorldMap', () => {
  it('revives a `layers` array into Maps, padded to WORLD_LAYER_COUNT', () => {
    const input = JSON.stringify({
      version: 2,
      width: 2,
      height: 3,
      layers: [[[0, { code: 1, rotation: 0 }]], [[1, { code: 2, rotation: 90 }]]],
    });

    const result = deserializeWorldMap(input);

    expect(result.version).toBe(2);
    expect(result.width).toBe(2);
    expect(result.height).toBe(3);
    expect(result.layers).toHaveLength(WORLD_LAYER_COUNT);
    expect(result.layers[0]).toEqual(new Map([[0, { code: 1, rotation: 0 }]]));
    expect(result.layers[1]).toEqual(new Map([[1, { code: 2, rotation: 90 }]]));
    expect(result.layers[2]).toEqual(new Map());
    expect(result.layers[3]).toEqual(new Map());
  });

  it('truncates a `layers` array longer than WORLD_LAYER_COUNT', () => {
    const layers = Array.from({ length: WORLD_LAYER_COUNT + 2 }, (_, i) => [
      [i, { code: i, rotation: 0 }],
    ]);
    const input = JSON.stringify({ version: 2, width: 1, height: 1, layers });

    const result = deserializeWorldMap(input);

    expect(result.layers).toHaveLength(WORLD_LAYER_COUNT);
    expect(result.layers[0]).toEqual(new Map([[0, { code: 0, rotation: 0 }]]));
  });

  it('migrates a legacy `data` field into a single padded layer', () => {
    const input = JSON.stringify({
      width: 4,
      height: 4,
      data: [[0, { code: 5, rotation: 180 }]],
    });

    const result = deserializeWorldMap(input);

    expect(result.version).toBe(2);
    expect(result.layers).toHaveLength(WORLD_LAYER_COUNT);
    expect(result.layers[0]).toEqual(new Map([[0, { code: 5, rotation: 180 }]]));
    expect(result.layers[1]).toEqual(new Map());
  });

  it('defaults to an empty first layer when there is neither `data` nor `layers`', () => {
    const input = JSON.stringify({ width: 1, height: 1 });

    const result = deserializeWorldMap(input);

    expect(result.layers).toHaveLength(WORLD_LAYER_COUNT);
    result.layers.forEach((layer) => expect(layer).toEqual(new Map()));
  });
});

describe('loadWorldMap', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockIpc.send.mockReset();
    mockIpc.once.mockReset();
    mockState.isElectron = false;
  });

  describe('in Electron', () => {
    beforeEach(() => {
      mockState.isElectron = true;
    });

    function respondWith(response: { ok: boolean; path: string | null; contents: string | null }) {
      mockIpc.send.mockImplementation(() => {
        const calls = mockIpc.once.mock.calls;
        const [, callback] = calls[calls.length - 1];
        callback(response);
      });
    }

    it('sends a load-file-request for the given file name', async () => {
      respondWith({
        ok: true,
        path: '/root/worldMaps/dungeon-1.json',
        contents: JSON.stringify({ width: 1, height: 1, layers: [] }),
      });

      await loadWorldMap('dungeon-1.json');

      expect(mockIpc.send).toHaveBeenCalledWith('load-file-request', { path: 'dungeon-1.json' });
    });

    it('resolves with the parsed map and the file name from the returned path', async () => {
      respondWith({
        ok: true,
        path: '/root/worldMaps/dungeon-1.json',
        contents: JSON.stringify({
          width: 2,
          height: 2,
          layers: [[[0, { code: 1, rotation: 0 }]]],
        }),
      });

      const result = await loadWorldMap('dungeon-1.json');

      expect(result.fileName).toBe('dungeon-1.json');
      expect(result.map.width).toBe(2);
      expect(result.map.layers[0]).toEqual(new Map([[0, { code: 1, rotation: 0 }]]));
    });

    it('rejects when the main process reports failure', async () => {
      respondWith({ ok: false, path: null, contents: null });

      await expect(loadWorldMap('missing.json')).rejects.toBeTruthy();
    });

    it('rejects when contents or path come back null despite ok being true', async () => {
      respondWith({ ok: true, path: null, contents: '{}' });

      await expect(loadWorldMap('dungeon-1.json')).rejects.toBeTruthy();
    });
  });

  describe('in the browser', () => {
    beforeEach(() => {
      mockState.isElectron = false;
      vi.stubGlobal('fetch', vi.fn());
    });

    it('rejects without fetching when no file name is provided', async () => {
      await expect(loadWorldMap()).rejects.toBeTruthy();

      expect(fetch).not.toHaveBeenCalled();
    });

    it('fetches the map from the assets folder and resolves with the parsed contents', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        text: () =>
          Promise.resolve(
            JSON.stringify({ width: 1, height: 1, layers: [[[0, { code: 3, rotation: 0 }]]] })
          ),
      } as Response);

      const result = await loadWorldMap('dungeon-1.json');

      expect(fetch).toHaveBeenCalledWith('./assets/worldMaps/dungeon-1.json');
      expect(result.fileName).toBe('dungeon-1.json');
      expect(result.map.layers[0]).toEqual(new Map([[0, { code: 3, rotation: 0 }]]));
    });

    it('rejects when the fetch response is not ok', async () => {
      vi.mocked(fetch).mockResolvedValue({ ok: false } as Response);

      await expect(loadWorldMap('missing.json')).rejects.toBeTruthy();
    });

    it('rejects when fetch throws a network error', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('network error'));

      await expect(loadWorldMap('dungeon-1.json')).rejects.toBeTruthy();
    });
  });
});
