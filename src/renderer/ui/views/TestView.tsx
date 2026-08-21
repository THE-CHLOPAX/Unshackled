import * as THREE from 'three';
import { useState } from 'react';
import { useAssetStore, useGraphicsStore } from '@tgdf';

import { LoadingView } from './LoadingView';
import { CHECKERBOARD_TEXTURE } from '../../3D/constants';
import { useLoadScene } from '../../3D/hooks/useLoadScene';
import { TestScene } from '../../3D/classes/scenes/TestScene';
import { BackToViewLayout } from '../layouts/BackToViewLayout';
import { ThreeDViewerPixelated } from '../components/ThreeDViewerPixelated';
import { EXPLOSION_SPRITESHEET_TEXTURE, ARCANE_CIRCLE_TEXTURE, MODELS } from '../../3D/constants';

export function TestView() {
  const { loadTexture, loadModelGLTF } = useAssetStore();
  const { resolution } = useGraphicsStore();
  const { scene, loadingProgress } = useLoadScene({
    sceneClass: TestScene,
    asyncPreloadOperations: [
      loadTexture(CHECKERBOARD_TEXTURE, './assets/checker.png'),
      loadTexture(EXPLOSION_SPRITESHEET_TEXTURE, './assets/explosion.png', THREE.SRGBColorSpace),
      loadTexture(ARCANE_CIRCLE_TEXTURE, './assets/arcane-circle.png'),
      loadModelGLTF(MODELS.MONK.id, MODELS.MONK.path, {
        nameExtractor: MODELS.MONK.nameExtractor,
        centerOrigin: true,
      }),
      loadModelGLTF(MODELS.SKELETON.id, MODELS.SKELETON.path, {
        nameExtractor: MODELS.SKELETON.nameExtractor,
        centerOrigin: true,
      }),
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
