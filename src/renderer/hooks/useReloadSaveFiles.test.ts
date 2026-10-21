import { act, renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useSaveFilesStore } from 'Store/useSaveFilesStore';
import { useReloadSaveFiles } from 'renderer/hooks/useReloadSaveFiles';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

const initialSaveFilesState = useSaveFilesStore.getState();

function createDeferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

describe('useReloadSaveFiles', () => {
  let reloadDeferred: ReturnType<typeof createDeferred>;
  let reload: ReturnType<typeof vi.fn<() => Promise<void>>>;

  beforeEach(() => {
    reloadDeferred = createDeferred();
    reload = vi.fn(() => reloadDeferred.promise);
    useSaveFilesStore.setState({ reload });
  });

  afterEach(() => {
    useSaveFilesStore.setState(initialSaveFilesState, true);
  });

  it('is finished straight away and does not reload when disabled', () => {
    const { result } = renderHook(() => useReloadSaveFiles(false));

    expect(result.current).toBe(true);
    expect(reload).not.toHaveBeenCalled();
  });

  it('reloads the save files and is finished once the reload resolves', async () => {
    const { result } = renderHook(() => useReloadSaveFiles(true));

    expect(result.current).toBe(false);
    expect(reload).toHaveBeenCalledOnce();

    await act(async () => {
      reloadDeferred.resolve();
      await reloadDeferred.promise;
    });

    expect(result.current).toBe(true);
  });
});
