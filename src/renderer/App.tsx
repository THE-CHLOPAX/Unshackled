import '@radix-ui/themes/styles.css';
import '@tgdf/internal-ui/global.css';
import { Theme } from '@radix-ui/themes';
import React, { useMemo, useState } from 'react';
import { useGamepadStore, ViewManager } from '@tgdf';

import * as views from 'Views';
import { LoadingView } from 'Views/LoadingView';
import { useSaveFiles } from 'renderer/hooks/useSaveFiles';
import { useActivePlayersStore } from 'Store/useActivePlayersStore';

import { useFMODAudioInitialization } from './FMOD';

const App: React.FC = () => {
  useGamepadStore();
  useActivePlayersStore();

  const { loading: saveFilesLoading } = useSaveFiles();

  const { isReady: isFMODReady } = useFMODAudioInitialization({
    preloadBankUrls: [
      '/assets/sounds/banks/Master.bank',
      '/assets/sounds/banks/Master.strings.bank',
    ],
  });

  const [loadingFinished, setLoadingFinished] = useState(false);

  const progress = useMemo(() => {
    const readyChecks = [!saveFilesLoading, isFMODReady];
    const fulfilledChecks = readyChecks.filter(Boolean);
    return fulfilledChecks.length / readyChecks.length;
  }, [saveFilesLoading, isFMODReady]);

  return (
    <Theme>
      {loadingFinished ? (
        <ViewManager views={views} />
      ) : (
        <LoadingView progress={progress} onComplete={() => setLoadingFinished(true)} />
      )}
    </Theme>
  );
};

export default App;
