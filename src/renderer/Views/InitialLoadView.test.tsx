import { DEFAULT_VIEW, useViewsStore } from '@tgdf';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useSaveFilesStore } from 'Store/useSaveFilesStore';
import { useFMODAudioInitialization } from 'renderer/FMOD/hooks/useFMODAudioInitialization';

import { InitialLoadView, INITIAL_FMOD_BANK_URLS } from './InitialLoadView';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

vi.mock('renderer/FMOD/hooks/useFMODAudioInitialization', () => ({
  useFMODAudioInitialization: vi.fn(),
}));

vi.mock('./LoadingView', () => ({
  LoadingView: ({ progress, onComplete }: { progress: number; onComplete: () => void }) => (
    <div data-testid="loading-view" data-progress={progress}>
      <button onClick={onComplete}>complete loading</button>
    </div>
  ),
}));

const initialSaveFilesState = useSaveFilesStore.getState();

function createDeferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function mockFMODState({ isReady = false, isError = false } = {}) {
  vi.mocked(useFMODAudioInitialization).mockReturnValue({
    instance: null,
    isReady,
    isLoading: !isReady && !isError,
    isError,
  });
}

function getProgress(): number {
  return Number(screen.getByTestId('loading-view').getAttribute('data-progress'));
}

describe('InitialLoadView', () => {
  let reloadDeferred: ReturnType<typeof createDeferred>;
  let reload: ReturnType<typeof vi.fn<() => Promise<void>>>;

  async function finishSaveFilesReload() {
    await act(async () => {
      reloadDeferred.resolve();
      await reloadDeferred.promise;
    });
  }

  beforeEach(() => {
    reloadDeferred = createDeferred();
    reload = vi.fn(() => reloadDeferred.promise);
    useSaveFilesStore.setState({ reload });
    useViewsStore.setState({
      currentView: DEFAULT_VIEW,
      currentViewProps: {},
      viewHistory: [DEFAULT_VIEW],
    });
    mockFMODState();
  });

  afterEach(() => {
    useSaveFilesStore.setState(initialSaveFilesState, true);
    vi.clearAllMocks();
  });

  it('reloads the save files and initializes FMOD with the master banks', () => {
    render(<InitialLoadView />);

    expect(reload).toHaveBeenCalledOnce();
    expect(useFMODAudioInitialization).toHaveBeenCalledWith({
      preloadBankUrls: INITIAL_FMOD_BANK_URLS,
    });
  });

  it('reports no progress while both save files and FMOD are loading', () => {
    render(<InitialLoadView />);

    expect(getProgress()).toBe(0);
  });

  it('reports half progress when only the save files have loaded', async () => {
    render(<InitialLoadView />);

    await finishSaveFilesReload();

    expect(getProgress()).toBe(0.5);
  });

  it('reports half progress when only FMOD is ready', () => {
    mockFMODState({ isReady: true });

    render(<InitialLoadView />);

    expect(getProgress()).toBe(0.5);
  });

  it('reports full progress when both the save files and FMOD are ready', async () => {
    mockFMODState({ isReady: true });
    render(<InitialLoadView />);

    await finishSaveFilesReload();

    expect(getProgress()).toBe(1);
  });

  it('treats a failed FMOD initialization as finished so loading is not blocked', async () => {
    mockFMODState({ isError: true });
    render(<InitialLoadView />);

    await finishSaveFilesReload();

    expect(getProgress()).toBe(1);
  });

  it('goes to the MenuView without asking it to reload the save files once loading completes', async () => {
    mockFMODState({ isReady: true });
    render(<InitialLoadView />);
    await finishSaveFilesReload();

    fireEvent.click(screen.getByText('complete loading'));

    const { currentView, currentViewProps } = useViewsStore.getState();
    expect(currentView).toBe('MenuView');
    expect(currentViewProps).toEqual({});
  });
});
