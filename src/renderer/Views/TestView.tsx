import { useState } from 'react';
import { useGraphicsStore } from '@tgdf';

import { GameUIOverlay } from 'UI';
import { TestScene } from '3D/classes/scenes/TestScene';
import { useLoadScene } from 'renderer/hooks/useLoadScene';
import { BackToViewLayout } from 'UI/layouts/BackToViewLayout';
import { ThreeDViewerPixelated } from 'UI/components/ThreeDViewerPixelated';

import { LoadingView } from './LoadingView';

export function TestView() {
  const { resolution } = useGraphicsStore();
  const { scene, loadingProgress, emitter } = useLoadScene((emitter) => new TestScene(emitter));

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
