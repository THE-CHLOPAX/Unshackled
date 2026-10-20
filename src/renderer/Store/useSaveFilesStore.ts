import { create } from 'zustand';
import { isElectron, logger } from '@tgdf';
import { devtools } from 'zustand/middleware';

import { RunIdentifier } from 'renderer/types';
import { loadSaveFiles } from 'renderer/utils/loadSaveFiles';

export type SaveFilesState = {
  saveFiles: RunIdentifier[];
  loading: boolean;
  reload: () => Promise<void>;
};

let pendingReload: Promise<void> | null = null;

async function fetchSortedSaveFiles(): Promise<RunIdentifier[]> {
  try {
    const files = isElectron ? await loadSaveFiles() : [];
    return files.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (error) {
    logger({ message: 'Failed to load save files: ' + (error as Error).message, type: 'error' });
    return [];
  }
}

export const useSaveFilesStore = create<SaveFilesState>()(
  devtools(
    (set) => ({
      saveFiles: [],
      loading: true,

      reload: () => {
        if (pendingReload) return pendingReload;

        set({ loading: true });
        pendingReload = fetchSortedSaveFiles()
          .then((saveFiles) => set({ saveFiles, loading: false }))
          .finally(() => {
            pendingReload = null;
          });

        return pendingReload;
      },
    }),
    { name: 'save-files-store' }
  )
);
