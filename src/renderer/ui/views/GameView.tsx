import { useState } from 'react';
import { useGraphicsStore } from '@tgdf';

import { LoadingView } from './LoadingView';
import { useLoadScene } from '../../3D/hooks/useLoadScene';
import { BackToViewLayout } from '../layouts/BackToViewLayout';
import { ThreeDViewerPixelated } from '../components/ThreeDViewerPixelated';
import { DungeonLevelScene } from '../../3D/classes/scenes/DungeonLevelScene';

export function GameView() {
  const { resolution } = useGraphicsStore();
  const { scene, loadingProgress } = useLoadScene(DungeonLevelScene);

  const [loadingFinished, setLoadingFinished] = useState(false);

  return (
    <BackToViewLayout backToView="MenuView">
      {!loadingFinished || scene === null ? (
        <LoadingView progress={loadingProgress} onComplete={() => setLoadingFinished(true)} />
      ) : (
        <ThreeDViewerPixelated scene={scene} resX={resolution.width} resY={resolution.height} />
      )}
    </BackToViewLayout>
  );
}
