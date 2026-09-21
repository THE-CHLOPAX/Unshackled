import { useMemo, useState } from 'react';
import { Emitter, useGraphicsStore } from '@tgdf';

import { GameEventsMap } from 'renderer/types';

import { LoadingView } from './LoadingView';
import { useLoadScene } from '../../3D/hooks/useLoadScene';
import { TestScene } from '../../3D/classes/scenes/TestScene';
import { BackToViewLayout } from '../layouts/BackToViewLayout';
import { GameUIOverlay } from '../components/GameUIOverlay/GameUIOverlay';
import { ThreeDViewerPixelated } from '../components/ThreeDViewerPixelated';

export function TestView() {
  const gameEventsEmitter = useMemo(() => new Emitter<GameEventsMap>(), []);

  const { resolution } = useGraphicsStore();
  const { scene, loadingProgress } = useLoadScene(TestScene, gameEventsEmitter);

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
          <GameUIOverlay emitter={gameEventsEmitter} />
        </>
      )}
    </BackToViewLayout>
  );
}
