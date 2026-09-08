import { useEffect, useState } from 'react';

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

    const reportProgress = (progress: number): void => {
      if (!cancelled) setLoadingProgress(progress);
    };

    nextScene
      .initializePhysics()
      .then(() => {
        reportProgress(0.25);
        return nextScene.preloadAssets();
      })
      .then(() => {
        reportProgress(0.5);
        return nextScene.generateLevel();
      })
      .then(() => {
        reportProgress(0.75);
        return nextScene.completeLevelInitialization();
      })
      .then(() => {
        if (cancelled) {
          nextScene.dispose();
          return;
        }
        reportProgress(1);
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
