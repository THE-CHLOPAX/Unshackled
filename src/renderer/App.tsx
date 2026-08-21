import '@radix-ui/themes/styles.css';
import '@tgdf/internal-ui/global.css';
import React, { useState } from 'react';
import { Theme } from '@radix-ui/themes';
import { useGamepadStore, ViewManager } from '@tgdf';

import * as views from './ui/views';
import { useFMODAudioInitialization } from './FMOD';
import { LoadingView } from './ui/views/LoadingView';
import { useActivePlayersStore } from './store/useActivePlayersStore';

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
