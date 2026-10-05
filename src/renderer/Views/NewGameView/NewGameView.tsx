import styled from 'styled-components';
import { useMemo, useState } from 'react';
import { InternalFlex, logger, useViewsStore } from '@tgdf';

import { useRunStore } from 'Store/useRunStore';
import { createNewRun } from 'renderer/utils/createNewRun';
import { COLORS, PLAYER_CLASSES } from 'renderer/constants';
import { writeSaveFile } from 'renderer/utils/writeSaveFile';
import { PlayerClassId, PlayerProfile } from 'renderer/types';
import { Button, MenuSubviewLayout, PanelScalable } from 'UI';
import { useActivePlayersStore } from 'Store/useActivePlayersStore';

import { GameOption } from './GameOption';
import { ClassSelector } from './ClassSelector';

export const NewGameView = () => {
  const { setCurrentRun } = useRunStore();
  const { setView } = useViewsStore();
  const { basePlayer, additionalPlayers } = useActivePlayersStore();
  const players = useMemo(
    () => [basePlayer, ...additionalPlayers],
    [basePlayer, additionalPlayers]
  );

  const [selectedClasses, setSelectedClasses] = useState<Map<string, PlayerClassId>>(new Map());

  const playerProfiles: PlayerProfile[] = players.map(({ id, name }) => ({
    id,
    name,
    class: selectedClasses.get(id) ?? PLAYER_CLASSES[0],
  }));

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
        setView('MenuView');
      });
  };

  const handleClassChange = (playerId: string, classId: PlayerClassId) => {
    setSelectedClasses((prev) => {
      const newMap = new Map(prev);
      newMap.set(playerId, classId);
      return newMap;
    });
  };

  return (
    <MenuSubviewLayout title="New game">
      <Wrapper color={COLORS.BG_COLOR_HIGHLIGHTED}>
        <SelectorsWrapper justify="center">
          {playerProfiles.map((player) => (
            <ClassSelector
              key={player.id}
              classId={selectedClasses.get(player.id) ?? PLAYER_CLASSES[0]}
              onChange={(classId) => handleClassChange(player.id, classId)}
            />
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
