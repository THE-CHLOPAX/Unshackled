import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';

export type WorldEditorGlobalState = {
  lastEditedMapName: string | null;
  setLastEditedMapName: (value: string | null) => void;
};

export const useWorldEditorStore = create<WorldEditorGlobalState>()(
  devtools(
    persist(
      (set) => ({
        lastEditedMapName: null,
        setLastEditedMapName: (value: string | null) => set({ lastEditedMapName: value }),
      }),
      {
        name: 'world-editor-store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({ lastEditedMapName: state.lastEditedMapName }),
      }
    ),
    { name: 'world-editor-store' }
  )
);
