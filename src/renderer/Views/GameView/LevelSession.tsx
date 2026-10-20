import styled from 'styled-components';
import { useState, useEffect } from 'react';
import { useDebouncedCallback } from '@tgdf';

import { RunProgress } from 'renderer/types';
import { useRunStore } from 'renderer/Store/useRunStore';
import { useLoadScene } from 'renderer/hooks/useLoadScene';
import { useIsGameOver } from 'renderer/hooks/useIsGameOver';
import { pickRandomLevel } from 'renderer/3D/utils/pickRandomLevel';
import { BIOME_SCENES } from 'renderer/3D/classes/scenes/biomeScenes';
import { Player } from 'renderer/3D/classes/gameObjects/players/Player';
import { assignPlayerProfiles } from 'renderer/utils/assignPlayerProfiles';
import { useActivePlayersStore } from 'renderer/Store/useActivePlayersStore';
import { GameOverModal } from 'renderer/UI/components/GameUIOverlay/GameOverModal/GameOverModal';

import { SceneViewer } from './SceneViewer';
import { LoadingView } from '../LoadingView';

type LevelSessionProps = {
  progress: RunProgress;
  onLevelComplete: (levelId: string, players?: readonly Player[]) => void;
};

const LEVEL_COMPLETE_DEBOUNCE_TIME = 3000;
const RENDERED_VIEWERS_LIMIT = 1;

export function LevelSession({ progress, onLevelComplete }: LevelSessionProps) {
  const [level] = useState(() => pickRandomLevel(progress));
  const { scene, loadingProgress, emitter } = useLoadScene((emitter) => {
    const players = assignPlayerProfiles(
      Array.from(useActivePlayersStore.getState().getActivePlayers()),
      useRunStore.getState().currentRun?.players ?? []
    );
    return new BIOME_SCENES[progress.biomeId](emitter, level, players);
  });

  const isGameOver = useIsGameOver(emitter);

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
    <Wrapper>
      {scene.players.slice(0, RENDERED_VIEWERS_LIMIT).map((player) => (
        <SceneViewer key={player.uuid} scene={scene} player={player} />
      ))}
      {isGameOver && (
        <GameOverWrapper>
          <GameOverModal />
        </GameOverWrapper>
      )}
    </Wrapper>
  );
}

const Wrapper = styled.div`
  position: absolute;
  inset: 0;
`;

const GameOverWrapper = styled.div`
  position: absolute;
  inset: 0;
`;
