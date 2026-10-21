import { logger } from '@tgdf';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { RunIdentifier } from 'renderer/types';
import { useSaveFilesStore } from 'Store/useSaveFilesStore';
import { loadSaveFiles } from 'renderer/utils/loadSaveFiles';

vi.mock('@tgdf', () => ({ isElectron: true, logger: vi.fn() }));
vi.mock('renderer/utils/loadSaveFiles', () => ({ loadSaveFiles: vi.fn() }));

function createRun(id: string, updatedAt: number): RunIdentifier {
  return { id, updatedAt } as RunIdentifier;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('useSaveFilesStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSaveFilesStore.setState({ saveFiles: [], loading: true });
  });

  it('starts with no save files and in a loading state', () => {
    const { saveFiles, loading } = useSaveFilesStore.getState();

    expect(saveFiles).toEqual([]);
    expect(loading).toBe(true);
  });

  it('loads save files sorted by most recently updated', async () => {
    const older = createRun('older', 1);
    const newer = createRun('newer', 2);
    vi.mocked(loadSaveFiles).mockResolvedValue([older, newer]);

    await useSaveFilesStore.getState().reload();

    expect(useSaveFilesStore.getState()).toMatchObject({
      saveFiles: [newer, older],
      loading: false,
    });
  });

  it('keeps cached save files available while reloading', async () => {
    const cached = [createRun('cached', 1)];
    const fresh = [createRun('fresh', 2)];
    useSaveFilesStore.setState({ saveFiles: cached, loading: false });
    const request = deferred<RunIdentifier[]>();
    vi.mocked(loadSaveFiles).mockReturnValue(request.promise);

    const reloadPromise = useSaveFilesStore.getState().reload();

    expect(useSaveFilesStore.getState()).toMatchObject({ saveFiles: cached, loading: true });

    request.resolve(fresh);
    await reloadPromise;

    expect(useSaveFilesStore.getState()).toMatchObject({ saveFiles: fresh, loading: false });
  });

  it('runs a follow-up request when a reload is requested while one is running', async () => {
    const staleRequest = deferred<RunIdentifier[]>();
    const freshRequest = deferred<RunIdentifier[]>();
    const stale = [createRun('stale', 1)];
    const fresh = [createRun('fresh', 2)];
    vi.mocked(loadSaveFiles)
      .mockReturnValueOnce(staleRequest.promise)
      .mockReturnValueOnce(freshRequest.promise);

    const first = useSaveFilesStore.getState().reload();
    const second = useSaveFilesStore.getState().reload();

    staleRequest.resolve(stale);
    await first;

    expect(useSaveFilesStore.getState().saveFiles).toEqual(stale);
    expect(loadSaveFiles).toHaveBeenCalledTimes(2);

    freshRequest.resolve(fresh);
    await second;

    expect(useSaveFilesStore.getState()).toMatchObject({ saveFiles: fresh, loading: false });
  });

  it('collapses every reload requested while one is running into a single follow-up', async () => {
    const firstRequest = deferred<RunIdentifier[]>();
    vi.mocked(loadSaveFiles).mockReturnValueOnce(firstRequest.promise).mockResolvedValue([]);

    const first = useSaveFilesStore.getState().reload();
    const second = useSaveFilesStore.getState().reload();
    const third = useSaveFilesStore.getState().reload();

    firstRequest.resolve([]);
    await Promise.all([first, second, third]);

    expect(second).toBe(third);
    expect(second).not.toBe(first);
    expect(loadSaveFiles).toHaveBeenCalledTimes(2);
  });

  it('sends a new request once the previous reload has finished', async () => {
    vi.mocked(loadSaveFiles).mockResolvedValue([]);

    await useSaveFilesStore.getState().reload();
    await useSaveFilesStore.getState().reload();

    expect(loadSaveFiles).toHaveBeenCalledTimes(2);
  });

  it('logs an error and clears save files when loading fails', async () => {
    useSaveFilesStore.setState({ saveFiles: [createRun('cached', 1)] });
    vi.mocked(loadSaveFiles).mockRejectedValue(new Error('ipc failure'));

    await useSaveFilesStore.getState().reload();

    expect(useSaveFilesStore.getState()).toMatchObject({ saveFiles: [], loading: false });
    expect(logger).toHaveBeenCalledWith({
      message: 'Failed to load save files: ipc failure',
      type: 'error',
    });
  });
});
