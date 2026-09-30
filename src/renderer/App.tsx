import '@radix-ui/themes/styles.css';
import '@tgdf/internal-ui/global.css';
import React, { useState } from 'react';
import { Theme } from '@radix-ui/themes';
import { useGamepadStore, ViewManager } from '@tgdf';

import * as views from 'Views';
import { LoadingView } from 'Views/LoadingView';
import { useActivePlayersStore } from 'Store/useActivePlayersStore';

import { useFMODAudioInitialization } from './FMOD';

const App: React.FC = () => {
  useGamepadStore();
  useActivePlayersStore();

  const { isReady } = useFMODAudioInitialization({
    preloadBankUrls: [
      '/assets/sounds/banks/Master.bank',
      '/assets/sounds/banks/Master.strings.bank',
    ],
  });

  const [loadingFinished, setLoadingFinished] = useState(false);

  return (
    <Theme>
      {loadingFinished ? (
        <ViewManager views={views} />
      ) : (
        <LoadingView progress={isReady ? 1 : 0} onComplete={() => setLoadingFinished(true)} />
      )}
    </Theme>
  );
};

export default App;
