import styled from 'styled-components';
import { useMemo, useState } from 'react';
import { InternalFlex, logger, useViewsStore } from '@tgdf';

import { Button, PanelScalable } from 'UI';
import { COLORS } from 'renderer/constants';
import { PlayerProfile } from 'renderer/types';
import { useRunStore } from 'Store/useRunStore';
import { GameOption } from 'Views/NewGameView/GameOption';
import { PlayerSlot } from 'Views/NewGameView/PlayerSlot';
import { createNewRun } from 'renderer/utils/createNewRun';
import { writeSaveFile } from 'renderer/utils/writeSaveFile';
import { MenuSubviewLayout } from 'Views/layouts/MenuSubviewLayout';
import { useActivePlayersStore } from 'Store/useActivePlayersStore';
import { createNewPlayerProfile } from 'renderer/utils/createNewPlayerProfile';

export const NewGameView = () => {
  const { setCurrentRun } = useRunStore();
  const { setView } = useViewsStore();
  const { basePlayer, additionalPlayers } = useActivePlayersStore();
  const players = useMemo(
    () => [basePlayer, ...additionalPlayers],
    [basePlayer, additionalPlayers]
  );

  const playerProfiles: PlayerProfile[] = players.map(({ id, name }) =>
    createNewPlayerProfile(id, name)
  );

  const [skipTutorial, setSkipTutorial] = useState(false);
  const [autosave, setAutosave] = useState(true);

  const handleStartNewGame = () => {
    writeSaveFile(createNewRun(new Set(playerProfiles)))
      .then((run) => {
        setCurrentRun(run);
        setView('GameView');
      })
      .catch((error) => {
        logger({
          message: 'Failed to save new run: ' + error.message,
          type: 'error',
        });
        setView('MenuView', { reloadSaveFiles: true });
      });
  };

  return (
    <MenuSubviewLayout title="New game">
      <Wrapper color={COLORS.BG_COLOR_HIGHLIGHTED}>
        <SelectorsWrapper justify="center">
          {playerProfiles.map((player) => (
            <PlayerSlot key={player.id} name={player.name} />
          ))}
        </SelectorsWrapper>
        <Footer justify="between" align="center">
          <InternalFlex direction="column" gap={8}>
            <GameOption
              label="Skip tutorial"
              checked={skipTutorial}
              onChange={() => setSkipTutorial(!skipTutorial)}
            />
            <GameOption
              label="Autosave"
              checked={autosave}
              onChange={() => setAutosave(!autosave)}
            />
          </InternalFlex>
          <StyledButton label="Play" onClick={handleStartNewGame} />
        </Footer>
      </Wrapper>
    </MenuSubviewLayout>
  );
};

const Wrapper = styled(PanelScalable)`
  min-width: 402px;
  width: fit-content;
  height: 100%;

  > .panel-scalable-content {
    display: flex;
    flex-direction: column;
    padding: 0;
  }
`;

const SelectorsWrapper = styled(InternalFlex)`
  flex: 1;
  width: 100%;
  gap: 2vw !important;
  padding: 35px 25px 25px;
`;

const Footer = styled(InternalFlex)`
  background: ${COLORS.BG_COLOR};
  height: 95px;
  border-top: 3px solid ${COLORS.BROWN};
  padding-inline: 25px;
  width: 100%;
`;

const StyledButton = styled(Button)`
  margin-top: -10px;
`;
