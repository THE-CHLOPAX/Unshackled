import { useEffect, useState } from 'react';

import { useSaveFilesStore } from 'Store/useSaveFilesStore';

export function useReloadSaveFiles(enabled: boolean): boolean {
  const reload = useSaveFilesStore((state) => state.reload);
  const [reloadFinished, setReloadFinished] = useState(!enabled);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    reload().then(() => {
      if (!cancelled) setReloadFinished(true);
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, reload]);

  return reloadFinished;
}
