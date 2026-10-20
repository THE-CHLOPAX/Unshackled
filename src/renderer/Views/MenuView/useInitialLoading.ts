import { useMemo, useState } from 'react';

import { useFMODAudioInitialization } from 'renderer/FMOD/hooks/useFMODAudioInitialization';

let hasInitiallyLoaded = false;

export type UseInitialLoadingResult = {
  progress: number;
  loadingFinished: boolean;
  finishLoading: () => void;
};

export function useInitialLoading(saveFilesLoading: boolean): UseInitialLoadingResult {
  const { isReady: isFMODReady, isError: isFMODError } = useFMODAudioInitialization({
    preloadBankUrls: [
      '/assets/sounds/banks/Master.bank',
      '/assets/sounds/banks/Master.strings.bank',
    ],
  });

  const [loadingFinished, setLoadingFinished] = useState(hasInitiallyLoaded);

  const progress = useMemo(() => {
    const readyChecks = [!saveFilesLoading, isFMODReady || isFMODError];
    const fulfilledChecks = readyChecks.filter(Boolean);
    return fulfilledChecks.length / readyChecks.length;
  }, [saveFilesLoading, isFMODReady, isFMODError]);

  return {
    progress,
    loadingFinished,
    finishLoading: () => {
      hasInitiallyLoaded = true;
      setLoadingFinished(true);
    },
  };
}
