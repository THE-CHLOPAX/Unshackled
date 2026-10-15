import { useState } from 'react';
import { useGraphicsStore } from '@tgdf';

import { GameUIOverlay } from 'UI';
import { TestScene } from '3D/classes/scenes/TestScene';
import { useLoadScene } from 'renderer/hooks/useLoadScene';
import { BackToViewLayout } from 'UI/layouts/BackToViewLayout';
import { useActivePlayersStore } from 'Store/useActivePlayersStore';
import { assignPlayerProfiles } from 'renderer/utils/assignPlayerProfiles';
import { ThreeDViewerPixelated } from 'UI/components/ThreeDViewerPixelated';
import { createNewPlayerProfile } from 'renderer/utils/createNewPlayerProfile';

import { LoadingView } from './LoadingView';

export function TestView() {
  const { resolution } = useGraphicsStore();
  const { scene, loadingProgress, emitter } = useLoadScene((emitter) => {
    const mockProfile = createNewPlayerProfile('test-player', 'Test player');
    const players = assignPlayerProfiles(
      Array.from(useActivePlayersStore.getState().getActivePlayers()),
      [mockProfile]
    );
    return new TestScene(emitter, players);
  });

  const [loadingFinished, setLoadingFinished] = useState(false);

  return (
    <BackToViewLayout backToView="MenuView">
      {!loadingFinished || scene === null ? (
        <LoadingView progress={loadingProgress} onComplete={() => setLoadingFinished(true)} />
      ) : (
        <>
          <ThreeDViewerPixelated
            scene={scene}
            resX={resolution.width}
            resY={resolution.height}
            debug
          />
          <GameUIOverlay emitter={emitter} />
        </>
      )}
    </BackToViewLayout>
  );
}
