import { useState } from 'react';
import { useGraphicsStore } from '@tgdf';

import { LoadingView } from './LoadingView';
import { useLoadScene } from '../../3D/hooks/useLoadScene';
import { TestScene } from '../../3D/classes/scenes/TestScene';
import { BackToViewLayout } from '../layouts/BackToViewLayout';
import { GameUIOverlay } from '../components/GameUIOverlay/GameUIOverlay';
import { ThreeDViewerPixelated } from '../components/ThreeDViewerPixelated';

export function TestView() {
  const { resolution } = useGraphicsStore();
  const { scene, loadingProgress, emitter } = useLoadScene(TestScene);

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
