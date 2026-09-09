import { logger } from '@tgdf';
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

    const runLoading = async () => {
      try {
        await nextScene.initializePhysics();
        if (cancelled) return;
        reportProgress(0.25);
        await nextScene.preloadAssets();
        if (cancelled) return;
        reportProgress(0.5);
        await nextScene.generateLevel();
        if (cancelled) return;
        reportProgress(0.75);
        await nextScene.completeLevelInitialization();
        if (cancelled) return;
        reportProgress(1);
        setScene(nextScene);
        setLoading(false);
      } catch (error) {
        if (!cancelled) {
          logger({ message: `Failed to load scene: ${error}`, type: 'error' });
        }
      } finally {
        if (cancelled) {
          nextScene.dispose();
        }
      }
    };

    runLoading();

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
