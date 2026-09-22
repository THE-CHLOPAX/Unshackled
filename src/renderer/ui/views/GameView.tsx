import { useState } from 'react';
import { useGraphicsStore } from '@tgdf';

import { GameUIOverlay } from 'UI';
import { useLoadScene } from '3D/hooks/useLoadScene';
import { DungeonLevelScene } from '3D/classes/scenes/DungeonLevelScene';

import { LoadingView } from './LoadingView';
import { BackToViewLayout } from '../layouts/BackToViewLayout';
import { ThreeDViewerPixelated } from '../components/ThreeDViewerPixelated';

export function GameView() {
  const { resolution } = useGraphicsStore();
  const { scene, loadingProgress, emitter } = useLoadScene(DungeonLevelScene);

  const [loadingFinished, setLoadingFinished] = useState(false);

  return (
    <BackToViewLayout backToView="MenuView" noButton>
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
