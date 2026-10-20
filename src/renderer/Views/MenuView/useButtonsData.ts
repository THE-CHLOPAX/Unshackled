import { useMemo } from 'react';
import { useViewsStore, ipc, isDev } from '@tgdf';

import { ButtonProps } from 'UI';
import { RunIdentifier } from 'renderer/types';
import { useRunStore } from 'Store/useRunStore';

export function useButtonsData(saveFiles: RunIdentifier[]): ButtonProps[] {
  const { setView } = useViewsStore();
  const { setCurrentRun } = useRunStore();

  return useMemo(() => {
    const buttons: ButtonProps[] = [
      {
        label: 'New game',
        onClick: () => setView('NewGameView'),
      },
      {
        label: 'Load game',
        onClick: () => setView('LoadGameView'),
        disabled: saveFiles.length === 0,
      },
      {
        label: 'Settings',
        onClick: () => setView('SettingsView'),
      },
      ...(isDev
        ? [
            {
              label: 'Components',
              onClick: () => setView('ComponentsView'),
            },
            {
              label: 'Test',
              onClick: () => setView('TestView'),
            },
            {
              label: 'World editor',
              onClick: () => setView('WorldEditorView'),
            },
          ]
        : []),
      {
        label: 'Quit',
        onClick: () => {
          ipc.send('app-quit-request', undefined);
        },
      },
    ];

    if (saveFiles.length > 0) {
      buttons.unshift({
        label: 'Continue',
        onClick: () => {
          setCurrentRun(saveFiles[0]);
          setView('GameView');
        },
      });
    }

    return buttons;
  }, [saveFiles, setView, setCurrentRun]);
}
