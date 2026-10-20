import { useGraphicsStore } from '@tgdf';
import { useCallback, useMemo, useState } from 'react';

import { GameUIOverlay } from 'UI';
import { TestScene } from '3D/classes/scenes/TestScene';
import { ViewerContext } from 'UI/contexts/ViewerContext';
import { useLoadScene } from 'renderer/hooks/useLoadScene';
import { useIsGameOver } from 'renderer/hooks/useIsGameOver';
import { BackToViewLayout } from 'UI/layouts/BackToViewLayout';
import { useActivePlayersStore } from 'Store/useActivePlayersStore';
import { assignPlayerProfiles } from 'renderer/utils/assignPlayerProfiles';
import { ThreeDViewerPixelated } from 'UI/components/ThreeDViewerPixelated';
import { BillboardLayer } from 'UI/components/BillboardLayer/BillboardLayer';
import { createNewPlayerProfile } from 'renderer/utils/createNewPlayerProfile';
import { GameOverModal } from 'UI/components/GameUIOverlay/GameOverModal/GameOverModal';
import { BillboardView } from '3D/classes/scenes/GameScene/BillboardRegistry/BillboardView';

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

  const isGameOver = useIsGameOver(emitter);
  const [loadingFinished, setLoadingFinished] = useState(false);

  const billboardView = useMemo(() => scene && new BillboardView(scene.billboards), [scene]);

  const handleAfterRender = useCallback(() => {
    if (scene) billboardView?.updatePositions(scene.camera);
  }, [scene, billboardView]);

  return (
    <BackToViewLayout backToView="MenuView">
      {!loadingFinished || scene === null ? (
        <LoadingView progress={loadingProgress} onComplete={() => setLoadingFinished(true)} />
      ) : (
        <ViewerContext.Provider
          value={{
            player: scene.players[0],
            inputType: scene.players[0].inputType,
            camera: scene.camera,
          }}
        >
          <ThreeDViewerPixelated
            scene={scene}
            resX={resolution.width}
            resY={resolution.height}
            overlay={billboardView && <BillboardLayer view={billboardView} />}
            onAfterRender={handleAfterRender}
            debug
          />
          <GameUIOverlay emitter={emitter} />
          {isGameOver && <GameOverModal />}
        </ViewerContext.Provider>
      )}
    </BackToViewLayout>
  );
}
