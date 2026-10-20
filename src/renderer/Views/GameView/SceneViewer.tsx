import { useState, useEffect } from 'react';
import { useGraphicsStore, useDebouncedCallback } from '@tgdf';

import { GameUIOverlay } from 'renderer/UI';
import { RunProgress } from 'renderer/types';
import { useRunStore } from 'renderer/Store/useRunStore';
import { useLoadScene } from 'renderer/hooks/useLoadScene';
import { pickRandomLevel } from 'renderer/3D/utils/pickRandomLevel';
import { BIOME_SCENES } from 'renderer/3D/classes/scenes/biomeScenes';
import { Player } from 'renderer/3D/classes/gameObjects/players/Player';
import { assignPlayerProfiles } from 'renderer/utils/assignPlayerProfiles';
import { useActivePlayersStore } from 'renderer/Store/useActivePlayersStore';
import { ThreeDViewerPixelated } from 'renderer/UI/components/ThreeDViewerPixelated';

import { LoadingView } from '../LoadingView';

type SceneViewerProps = {
  progress: RunProgress;
  onLevelComplete: (levelId: string, players?: readonly Player[]) => void;
};

const LEVEL_COMPLETE_DEBOUNCE_TIME = 3000;

export function SceneViewer({ progress, onLevelComplete }: SceneViewerProps) {
  const { resolution } = useGraphicsStore();
  const [level] = useState(() => pickRandomLevel(progress));
  const { scene, loadingProgress, emitter } = useLoadScene((emitter) => {
    const players = assignPlayerProfiles(
      Array.from(useActivePlayersStore.getState().getActivePlayers()),
      useRunStore.getState().currentRun?.players ?? []
    );
    return new BIOME_SCENES[progress.biomeId](emitter, level, players);
  });

  const onLevelCompleteDebounced = useDebouncedCallback(
    () => onLevelComplete(level.id, scene?.players),
    LEVEL_COMPLETE_DEBOUNCE_TIME
  );

  const [loadingFinished, setLoadingFinished] = useState(false);

  useEffect(() => {
    const handleLevelComplete = () => {
      onLevelCompleteDebounced();
    };

    emitter.on('level-complete', handleLevelComplete);
    return () => {
      emitter.off('level-complete', handleLevelComplete);
    };
  }, [emitter, onLevelCompleteDebounced]);

  return !loadingFinished || scene === null ? (
    <LoadingView progress={loadingProgress} onComplete={() => setLoadingFinished(true)} />
  ) : (
    // TODO: in coop update we need to have multiple ThreedViewer + UIOverlay pairs per each active player
    // Then pass the corresponding player to each UIOverlay instead of hardcoded 0 index player.
    <>
      <ThreeDViewerPixelated scene={scene} resX={resolution.width} resY={resolution.height} debug />
      <GameUIOverlay
        emitter={emitter}
        player={scene.players[0]}
        objectiveType={scene.options.objective?.type}
      />
    </>
  );
}
