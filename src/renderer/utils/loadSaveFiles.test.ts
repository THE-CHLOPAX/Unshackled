import { describe, it, expect, vi, beforeEach } from 'vitest';

type ListFilesResponse = {
  ok: boolean;
  files: { name: string; contents: string }[];
  error?: string;
};

const mockState = vi.hoisted(() => ({
  isDev: false,
  response: null as ListFilesResponse | null,
}));

const mockLogger = vi.hoisted(() => vi.fn());

const mockIpc = vi.hoisted(() => {
  const listeners = new Map<string, (response: unknown) => void>();
  return {
    once: vi.fn((event: string, listener: (response: unknown) => void) => {
      listeners.set(event, listener);
    }),
    send: vi.fn(() => {
      const listener = listeners.get('list-files-response');
      listeners.delete('list-files-response');
      listener?.(mockState.response);
    }),
  };
});

vi.mock('@tgdf', () => ({
  ipc: mockIpc,
  logger: mockLogger,
  get isDev() {
    return mockState.isDev;
  },
}));

vi.mock('renderer/constants', () => ({
  SAVE_FILES_LOCATION: { root: 'userData', directory: 'saveFiles' },
  SAVE_FILES_LOCATION_DEV: { root: 'app', directory: 'saveFilesDebug' },
}));

import { loadSaveFiles } from './loadSaveFiles';

function createSaveFile(id: string): { name: string; contents: string } {
  return { name: `${id}.json`, contents: JSON.stringify({ id, name: `Run ${id}` }) };
}

describe('loadSaveFiles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.isDev = false;
    mockState.response = null;
  });

  it('parses every save file returned by the main process', async () => {
    mockState.response = { ok: true, files: [createSaveFile('a'), createSaveFile('b')] };

    const runs = await loadSaveFiles();

    expect(runs.map((run) => run.id)).toEqual(['a', 'b']);
    expect(mockLogger).not.toHaveBeenCalled();
  });

  it('skips a corrupted save file and still loads the remaining ones', async () => {
    mockState.response = {
      ok: true,
      files: [
        createSaveFile('a'),
        { name: 'corrupted.json', contents: '{ "id": "broken", ' },
        createSaveFile('c'),
      ],
    };

    const runs = await loadSaveFiles();

    expect(runs.map((run) => run.id)).toEqual(['a', 'c']);
    expect(mockLogger).toHaveBeenCalledOnce();
    expect(mockLogger).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'warn',
        message: expect.stringContaining('corrupted.json'),
      })
    );
  });

  it('resolves with an empty list when every save file is corrupted', async () => {
    mockState.response = {
      ok: true,
      files: [
        { name: 'first.json', contents: 'not json' },
        { name: 'second.json', contents: '' },
      ],
    };

    await expect(loadSaveFiles()).resolves.toEqual([]);
    expect(mockLogger).toHaveBeenCalledTimes(2);
  });

  it('rejects when the main process fails to list the save files', async () => {
    mockState.response = { ok: false, files: [], error: 'EACCES' };

    await expect(loadSaveFiles()).rejects.toThrow('EACCES');
  });

  it('requests json files from the production save location', async () => {
    mockState.response = { ok: true, files: [] };

    await loadSaveFiles();

    expect(mockIpc.send).toHaveBeenCalledWith('list-files-request', {
      root: 'userData',
      directory: 'saveFiles',
      extension: 'json',
    });
  });

  it('requests json files from the debug save location in development', async () => {
    mockState.isDev = true;
    mockState.response = { ok: true, files: [] };

    await loadSaveFiles();

    expect(mockIpc.send).toHaveBeenCalledWith('list-files-request', {
      root: 'app',
      directory: 'saveFilesDebug',
      extension: 'json',
    });
  });
});
