import { useEffect, useState } from 'react';
import { logger, useDebouncedCallback, useGraphicsStore } from '@tgdf';

import { GameUIOverlay } from 'UI';
import { RunProgress } from 'renderer/types';
import { useRunStore } from 'Store/useRunStore';
import { useLoadScene } from 'renderer/hooks/useLoadScene';
import { pickRandomLevel } from '3D/utils/pickRandomLevel';
import { BIOME_SCENES } from '3D/classes/scenes/biomeScenes';
import { writeSaveFile } from 'renderer/utils/writeSaveFile';
import { BackToViewLayout } from 'UI/layouts/BackToViewLayout';
import { usePlayerStats } from 'renderer/3D/hooks/usePlayerStats';
import { useActivePlayersStore } from 'Store/useActivePlayersStore';
import { assignPlayerProfiles } from 'renderer/utils/assignPlayerProfiles';
import { ThreeDViewerPixelated } from 'UI/components/ThreeDViewerPixelated';
import { getIncrementedProgress } from 'renderer/utils/getIncrementedProgress';

import { LoadingView } from './LoadingView';

const LEVEL_COMPLETE_DEBOUNCE_TIME = 3000;

export function GameView() {
  const { currentRun, setCurrentRun } = useRunStore();
  const progress = currentRun?.progress;

  const handleLevelComplete = (levelId: string) => {
    if (!currentRun) {
      return;
    }

    const incrementedRun = getIncrementedProgress(currentRun, levelId);

    setCurrentRun(incrementedRun);
    writeSaveFile(incrementedRun).catch((error) => {
      logger({ message: 'Failed to save run progress: ' + error.message, type: 'error' });
    });
  };

  return (
    <BackToViewLayout backToView="MenuView">
      {progress && (
        <LevelSession
          key={`${progress.biomeId}:${progress.levelIndex}`}
          progress={progress}
          onLevelComplete={handleLevelComplete}
        />
      )}
    </BackToViewLayout>
  );
}

type LevelSessionProps = {
  progress: RunProgress;
  onLevelComplete: (levelId: string) => void;
};

function LevelSession({ progress, onLevelComplete }: LevelSessionProps) {
  const { resolution } = useGraphicsStore();
  const [level] = useState(() => pickRandomLevel(progress));
  const { scene, loadingProgress, emitter } = useLoadScene((emitter) => {
    const players = assignPlayerProfiles(
      Array.from(useActivePlayersStore.getState().getActivePlayers()),
      useRunStore.getState().currentRun?.players ?? []
    );
    return new BIOME_SCENES[progress.biomeId](emitter, level, players);
  });

  const playerStats = usePlayerStats({
    healthPointsController: scene?.players[0]?.healthPointsController ?? null,
  });

  const onLevelCompleteDebounced = useDebouncedCallback(
    () => onLevelComplete(level.id),
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
      <GameUIOverlay emitter={emitter} playerStatistics={playerStats} />
    </>
  );
}
