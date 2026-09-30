import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { RunIdentifier } from 'renderer/types';

export type RunState = {
  currentRun: RunIdentifier | null;
  setCurrentRun: (run: RunIdentifier | null) => void;
};

export const useRunStore = create<RunState>()(
  devtools(
    (set) => ({
      currentRun: null,
      setCurrentRun: (run: RunIdentifier | null) => set({ currentRun: run }),
    }),
    { name: 'run-store' }
  )
);
