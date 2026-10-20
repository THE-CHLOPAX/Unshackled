import { useViewsStore } from '@tgdf';

import { useReloadSaveFiles } from 'renderer/hooks/useReloadSaveFiles';
import { useFMODAudioInitialization } from 'renderer/FMOD/hooks/useFMODAudioInitialization';

import { LoadingView } from './LoadingView';

export const INITIAL_FMOD_BANK_URLS = [
  '/assets/sounds/banks/Master.bank',
  '/assets/sounds/banks/Master.strings.bank',
];

export function InitialLoadView() {
  const { setView } = useViewsStore();
  const saveFilesLoaded = useReloadSaveFiles(true);
  const { isReady: isFMODReady, isError: isFMODError } = useFMODAudioInitialization({
    preloadBankUrls: INITIAL_FMOD_BANK_URLS,
  });

  const readyChecks = [saveFilesLoaded, isFMODReady || isFMODError];
  const progress = readyChecks.filter(Boolean).length / readyChecks.length;

  return <LoadingView progress={progress} onComplete={() => setView('MenuView')} />;
}
