import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { RunIdentifier } from 'renderer/types';
import { useSaveFilesStore } from 'Store/useSaveFilesStore';

import { MenuView } from './MenuView';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

vi.mock('../LoadingView', () => ({
  LoadingView: ({ progress, onComplete }: { progress: number; onComplete: () => void }) => (
    <div data-testid="loading-view" data-progress={progress}>
      <button onClick={onComplete}>complete loading</button>
    </div>
  ),
}));

const initialSaveFilesState = useSaveFilesStore.getState();

const SAVE_FILE = {
  version: 1,
  id: 'run-1',
  name: 'Run 1',
  createdAt: 0,
  updatedAt: 0,
  progress: { biomeId: 'dungeon', levelIndex: 0 },
  completedLevelIds: [],
  players: [],
} satisfies RunIdentifier;

function createDeferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function getProgress(): number {
  return Number(screen.getByTestId('loading-view').getAttribute('data-progress'));
}

describe('MenuView', () => {
  let reloadDeferred: ReturnType<typeof createDeferred>;
  let reload: ReturnType<typeof vi.fn<() => Promise<void>>>;

  async function finishSaveFilesReload(saveFiles: RunIdentifier[]) {
    await act(async () => {
      useSaveFilesStore.setState({ saveFiles });
      reloadDeferred.resolve();
      await reloadDeferred.promise;
    });
  }

  beforeEach(() => {
    reloadDeferred = createDeferred();
    reload = vi.fn(() => reloadDeferred.promise);
    useSaveFilesStore.setState({ saveFiles: [], reload });
  });

  afterEach(() => {
    useSaveFilesStore.setState(initialSaveFilesState, true);
    vi.clearAllMocks();
  });

  describe('without reloadSaveFiles', () => {
    it('renders the menu straight away without reloading the save files', () => {
      render(<MenuView />);

      expect(screen.queryByTestId('loading-view')).toBeNull();
      expect(screen.getByText('New game')).toBeTruthy();
      expect(reload).not.toHaveBeenCalled();
    });

    it('uses the save files that are already in the store', () => {
      useSaveFilesStore.setState({ saveFiles: [SAVE_FILE] });

      render(<MenuView />);

      expect(screen.getByText('Continue')).toBeTruthy();
    });
  });

  describe('with reloadSaveFiles', () => {
    it('renders the loading bar instead of the menu and reloads the save files', () => {
      render(<MenuView reloadSaveFiles />);

      expect(getProgress()).toBe(0);
      expect(screen.queryByText('New game')).toBeNull();
      expect(reload).toHaveBeenCalledOnce();
    });

    it('completes the loading bar once the save files have reloaded', async () => {
      render(<MenuView reloadSaveFiles />);

      await finishSaveFilesReload([]);

      expect(getProgress()).toBe(1);
    });

    it('renders the menu with the reloaded save files once the loading bar completes', async () => {
      render(<MenuView reloadSaveFiles />);
      await finishSaveFilesReload([SAVE_FILE]);

      fireEvent.click(screen.getByText('complete loading'));

      expect(screen.queryByTestId('loading-view')).toBeNull();
      expect(screen.getByText('Continue')).toBeTruthy();
    });
  });
});
