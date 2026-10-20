import { useState } from 'react';
import styled from 'styled-components';

import { TestScene } from '3D/classes/scenes/TestScene';
import { useLoadScene } from 'renderer/hooks/useLoadScene';
import { useIsGameOver } from 'renderer/hooks/useIsGameOver';
import { BackToViewLayout } from 'UI/layouts/BackToViewLayout';
import { useActivePlayersStore } from 'Store/useActivePlayersStore';
import { assignPlayerProfiles } from 'renderer/utils/assignPlayerProfiles';
import { createNewPlayerProfile } from 'renderer/utils/createNewPlayerProfile';
import { GameOverModal } from 'UI/components/GameUIOverlay/GameOverModal/GameOverModal';

import { LoadingView } from './LoadingView';
import { SceneViewer } from './GameView/SceneViewer';

export function TestView() {
  const { scene, loadingProgress, emitter } = useLoadScene((emitter) => {
    const mockProfile = createNewPlayerProfile('test-player', 'Test player');
    const players = assignPlayerProfiles(
      Array.from(useActivePlayersStore.getState().getActivePlayers()),
      [mockProfile]
    );
    return new TestScene(emitter, players);
  });

  const isGameOver = useIsGameOver(emitter);
  const [loadingFinished, setLoadingFinished] = useState(false);

  const player = scene?.players[0];

  return (
    <BackToViewLayout backToView="MenuView">
      {!loadingFinished || scene === null ? (
        <LoadingView progress={loadingProgress} onComplete={() => setLoadingFinished(true)} />
      ) : (
        <>
          <Wrapper>
            {player && <SceneViewer scene={scene} player={player} isGameOver={isGameOver} />}
          </Wrapper>
          {isGameOver && <GameOverModal />}
        </>
      )}
    </BackToViewLayout>
  );
}

const Wrapper = styled.div`
  position: absolute;
  inset: 0;
`;
