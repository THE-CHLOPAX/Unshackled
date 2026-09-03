import { useEffect, useState } from 'react';
import { executeAsyncOperationsWithProgress } from '@tgdf';

import { GameScene } from '../classes/scenes/GameScene/GameScene';

export type UseLoadSceneResult = {
  scene: GameScene | null;
  loadingProgress: number;
  loading: boolean;
};

export function useLoadScene(sceneClass: new () => GameScene): UseLoadSceneResult {
  const [scene, setScene] = useState<GameScene | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const nextScene = new sceneClass();

    const buildPromise = nextScene
      .initializePhysics()
      .then(() => nextScene.preloadAssets())
      .then(() => nextScene.completeLevelInitialization());

    const trackedOperations: Array<Promise<unknown>> = [nextScene.preloadAssets(), buildPromise];

    const reportProgress = (progress: number): void => {
      if (!cancelled) setLoadingProgress(progress);
    };

    executeAsyncOperationsWithProgress(trackedOperations, reportProgress).then(() => {
      if (cancelled) {
        nextScene.dispose();
        return;
      }
      setScene(nextScene);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // Scene cleanup on unmount
  useEffect(() => {
    return () => {
      scene?.dispose();
    };
  }, [scene]);

  return { scene, loadingProgress, loading };
}
