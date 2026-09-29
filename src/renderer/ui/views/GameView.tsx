import { useState } from 'react';
import { useGraphicsStore } from '@tgdf';

import { GameUIOverlay } from 'UI';
import { RunProgress } from 'renderer/types';
import { useRunStore } from 'renderer/store/useRunStore';
import { useLoadScene } from 'renderer/hooks/useLoadScene';
import { pickRandomLevel } from '3D/utils/pickRandomLevel';
import { BIOME_SCENES } from '3D/classes/scenes/biomeScenes';

import { LoadingView } from './LoadingView';
import { BackToViewLayout } from '../layouts/BackToViewLayout';
import { ThreeDViewerPixelated } from '../components/ThreeDViewerPixelated';

export function GameView() {
  const progress = useRunStore((state) => state.currentRun?.progress);

  return (
    <BackToViewLayout backToView="MenuView" noButton>
      {progress && (
        <LevelSession key={`${progress.biomeId}:${progress.levelIndex}`} progress={progress} />
      )}
    </BackToViewLayout>
  );
}

type LevelSessionProps = {
  progress: RunProgress;
};

function LevelSession({ progress }: LevelSessionProps) {
  const { resolution } = useGraphicsStore();
  const { scene, loadingProgress, emitter } = useLoadScene(
    (emitter) => new BIOME_SCENES[progress.biomeId](emitter, pickRandomLevel(progress))
  );

  const [loadingFinished, setLoadingFinished] = useState(false);

  return !loadingFinished || scene === null ? (
    <LoadingView progress={loadingProgress} onComplete={() => setLoadingFinished(true)} />
  ) : (
    <>
      <ThreeDViewerPixelated scene={scene} resX={resolution.width} resY={resolution.height} debug />
      <GameUIOverlay emitter={emitter} />
    </>
  );
}
