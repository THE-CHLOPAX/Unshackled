import { Emitter, logger } from '@tgdf';
import { useEffect, useMemo, useState } from 'react';

import { GameEventsEmitter, GameEventsMap } from 'renderer/types';

import { GameScene } from '../classes/scenes/GameScene/GameScene';

export type UseLoadSceneResult = {
  scene: GameScene | null;
  loadingProgress: number;
  loading: boolean;
  emitter: GameEventsEmitter;
};

export function useLoadScene(
  sceneClass: new (emitter: GameEventsEmitter) => GameScene
): UseLoadSceneResult {
  const emitter = useMemo(() => new Emitter<GameEventsMap>(), []);

  const [scene, setScene] = useState<GameScene | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const nextScene = new sceneClass(emitter);

    const reportProgress = (progress: number): void => {
      if (!cancelled) setLoadingProgress(progress);
    };

    const runLoading = async () => {
      try {
        await nextScene.initializePhysics();
        if (cancelled) return;
        reportProgress(0.2);
        await nextScene.preloadAssets();
        if (cancelled) return;
        reportProgress(0.4);
        await nextScene.generateLevel();
        if (cancelled) return;
        reportProgress(0.6);
        await nextScene.precompileShaders();
        if (cancelled) return;
        reportProgress(0.8);
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

  return { scene, loadingProgress, loading, emitter };
}
