import { logger } from '@tgdf';
import { useCallback, useEffect, useState } from 'react';

import { RunIdentifier } from 'renderer/types';
import { loadSaveFiles } from 'renderer/utils/loadSaveFiles';

export type UseSaveFilesResult = {
  saveFiles: RunIdentifier[];
  loading: boolean;
  reload: () => Promise<void>;
};

export function useSaveFiles(): UseSaveFilesResult {
  const [saveFiles, setSaveFiles] = useState<RunIdentifier[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const files = await loadSaveFiles();
      setSaveFiles(files.sort((a, b) => b.updatedAt - a.updatedAt));
    } catch (error) {
      logger({ message: 'Failed to load save files: ' + (error as Error).message, type: 'error' });
      setSaveFiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { saveFiles, loading, reload };
}
