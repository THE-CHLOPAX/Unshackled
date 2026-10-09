import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { PlayerProfile, RunIdentifier } from 'renderer/types';

export type RunState = {
  currentRun: RunIdentifier | null;
  setCurrentRun: (run: RunIdentifier | null) => void;
  updatePlayerProfile: (playerProfileId: string, changes: Partial<PlayerProfile>) => void;
};

export const useRunStore = create<RunState>()(
  devtools(
    (set) => ({
      currentRun: null,
      setCurrentRun: (run: RunIdentifier | null) => set({ currentRun: run }),
      updatePlayerProfile: (playerProfileId: string, changes: Partial<PlayerProfile>) =>
        set(({ currentRun }) => {
          if (!currentRun?.players.some((profile) => profile.id === playerProfileId)) {
            return {};
          }

          return {
            currentRun: {
              ...currentRun,
              players: currentRun.players.map((profile) =>
                profile.id === playerProfileId ? { ...profile, ...changes } : profile
              ),
            },
          };
        }),
    }),
    { name: 'run-store' }
  )
);
