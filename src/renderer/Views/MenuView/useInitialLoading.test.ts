import { act, renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useFMODAudioInitialization } from 'renderer/FMOD/hooks/useFMODAudioInitialization';

vi.mock('renderer/FMOD/hooks/useFMODAudioInitialization', () => ({
  useFMODAudioInitialization: vi.fn(),
}));

function mockFMODState({ isReady = false, isError = false } = {}) {
  vi.mocked(useFMODAudioInitialization).mockReturnValue({
    instance: null,
    isReady,
    isLoading: !isReady && !isError,
    isError,
  });
}

async function importUseInitialLoading() {
  const { useInitialLoading } = await import('./useInitialLoading');
  return useInitialLoading;
}

describe('useInitialLoading', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockFMODState();
  });

  describe('progress', () => {
    it('is 0 when save files and FMOD are both still loading', async () => {
      const useInitialLoading = await importUseInitialLoading();

      const { result } = renderHook(() => useInitialLoading(true));

      expect(result.current.progress).toBe(0);
    });

    it('is 0.5 when only save files have loaded', async () => {
      const useInitialLoading = await importUseInitialLoading();

      const { result } = renderHook(() => useInitialLoading(false));

      expect(result.current.progress).toBe(0.5);
    });

    it('is 0.5 when only FMOD is ready', async () => {
      mockFMODState({ isReady: true });
      const useInitialLoading = await importUseInitialLoading();

      const { result } = renderHook(() => useInitialLoading(true));

      expect(result.current.progress).toBe(0.5);
    });

    it('is 1 when save files have loaded and FMOD is ready', async () => {
      mockFMODState({ isReady: true });
      const useInitialLoading = await importUseInitialLoading();

      const { result } = renderHook(() => useInitialLoading(false));

      expect(result.current.progress).toBe(1);
    });

    it('treats a failed FMOD initialization as finished so loading is not blocked', async () => {
      mockFMODState({ isError: true });
      const useInitialLoading = await importUseInitialLoading();

      const { result } = renderHook(() => useInitialLoading(false));

      expect(result.current.progress).toBe(1);
    });

    it('updates when save files finish loading', async () => {
      mockFMODState({ isReady: true });
      const useInitialLoading = await importUseInitialLoading();

      const { result, rerender } = renderHook(
        ({ saveFilesLoading }) => useInitialLoading(saveFilesLoading),
        { initialProps: { saveFilesLoading: true } }
      );
      expect(result.current.progress).toBe(0.5);

      rerender({ saveFilesLoading: false });

      expect(result.current.progress).toBe(1);
    });
  });

  describe('loadingFinished', () => {
    it('is false until finishLoading is called', async () => {
      const useInitialLoading = await importUseInitialLoading();

      const { result } = renderHook(() => useInitialLoading(false));
      expect(result.current.loadingFinished).toBe(false);

      act(() => result.current.finishLoading());

      expect(result.current.loadingFinished).toBe(true);
    });

    it('stays finished for later mounts once loading has finished', async () => {
      const useInitialLoading = await importUseInitialLoading();

      const firstMount = renderHook(() => useInitialLoading(false));
      act(() => firstMount.result.current.finishLoading());
      firstMount.unmount();

      const { result } = renderHook(() => useInitialLoading(true));

      expect(result.current.loadingFinished).toBe(true);
    });

    it('does not persist when a mount unmounts before loading has finished', async () => {
      const useInitialLoading = await importUseInitialLoading();

      const firstMount = renderHook(() => useInitialLoading(true));
      firstMount.unmount();

      const { result } = renderHook(() => useInitialLoading(true));

      expect(result.current.loadingFinished).toBe(false);
    });
  });
});
