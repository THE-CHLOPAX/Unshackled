import { useState } from 'react';
import { useGraphicsStore } from '@tgdf';

import { LoadingView } from './LoadingView';
import { MODELS, TEXTURES } from '../../3D/constants';
import { useLoadScene } from '../../3D/hooks/useLoadScene';
import { BackToViewLayout } from '../layouts/BackToViewLayout';
import { ThreeDViewerPixelated } from '../components/ThreeDViewerPixelated';
import { DungeonLevelScene } from '../../3D/classes/scenes/DungeonLevelScene';

export function DungeonTestView() {
  const { resolution } = useGraphicsStore();
  const { scene, loadingProgress } = useLoadScene({
    sceneClass: DungeonLevelScene,
    sceneBuilder: () => new Promise((resolve) => resolve()),
    preloadAssets: [
      MODELS.MONK,
      MODELS.DUNGEON_DOOR,
      MODELS.DUNGEON_DOOR_FRAME,
      MODELS.DUNGEON_PILLAR,
      MODELS.DUNGEON_WALL_TORCH,
      MODELS.DUNGEON_WALL_BRICK_TALL,
      MODELS.DUNGEON_FLOOR,
      MODELS.DUNGEON_PLINTH,
      TEXTURES.ARCANE_CIRCLE,
      TEXTURES.EXPLOSION,
    ],
  });

  const [loadingFinished, setLoadingFinished] = useState(false);

  return (
    <BackToViewLayout backToView="MenuView">
      {!loadingFinished || scene === null ? (
        <LoadingView progress={loadingProgress} onComplete={() => setLoadingFinished(true)} />
      ) : (
        <ThreeDViewerPixelated
          scene={scene}
          resX={resolution.width}
          resY={resolution.height}
          debug
        />
      )}
    </BackToViewLayout>
  );
}
