import { logger } from '@tgdf';
import { useState, useEffect } from 'react';

import { MESSAGES } from 'FMOD/constants';
import { FMODAudio } from 'FMOD/FMODAudio';
import { fetchWasmBinary } from 'FMOD/utils/fetchWasmBinary';

export type UseFMODAudioResult = {
  instance: FMODAudio | null;
  isReady: boolean;
  isLoading: boolean;
  isError: boolean;
};

export type UseFMODAudioProps = {
  preloadBankUrls: string[];
};

export const useFMODAudioInitialization = ({
  preloadBankUrls,
}: UseFMODAudioProps): UseFMODAudioResult => {
  const [isAlreadyReady] = useState(() => {
    const audioInstance = FMODAudio.getInstance();
    return (
      audioInstance.isInitialized &&
      preloadBankUrls.every((bankUrl) => audioInstance.isBankLoaded(bankUrl))
    );
  });
  const [instance, setInstance] = useState<FMODAudio | null>(() =>
    isAlreadyReady ? FMODAudio.getInstance() : null
  );
  const [isReady, setIsReady] = useState(isAlreadyReady);
  const [isLoading, setIsLoading] = useState(!isAlreadyReady);
  const [isError, setIsError] = useState(false);

  const loadBanks = async (audioInstance: FMODAudio) => {
    const loadPromises = preloadBankUrls.map((bankUrl) => audioInstance.loadBank(bankUrl));
    await Promise.all(loadPromises);
  };

  const init = async (audioInstance: FMODAudio) => {
    const wasmBinary = await fetchWasmBinary();

    const onError = () => {
      setIsReady(false);
      setIsLoading(false);
      setIsError(true);
      logger({ message: MESSAGES.HOOK_INITIALIZATION_FAILED, type: 'error' });
    };

    try {
      const initialized = await audioInstance.init(wasmBinary);
      if (initialized) {
        await loadBanks(audioInstance);
        setIsReady(true);
        setIsLoading(false);
        audioInstance.logAvailableEvents();
      } else {
        onError();
      }
    } catch (_e) {
      onError();
    }
  };

  useEffect(() => {
    if (isAlreadyReady) return;

    const audioInstance = FMODAudio.getInstance();
    setInstance(audioInstance);

    init(audioInstance);
  }, []);

  return {
    instance,
    isReady,
    isLoading,
    isError,
  };
};
