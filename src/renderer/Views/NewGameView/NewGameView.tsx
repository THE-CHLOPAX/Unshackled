import { InternalFlex } from '@tgdf';
import styled from 'styled-components';
import { useMemo, useState } from 'react';

import { PlayerClassId } from 'renderer/types';
import { COLORS, PLAYER_CLASSES } from 'renderer/constants';
import { Button, MenuSubviewLayout, PanelScalable } from 'UI';
import { useActivePlayersStore } from 'Store/useActivePlayersStore';

import { GameOption } from './GameOption';
import { ClassSelector } from './ClassSelector';

export const NewGameView = () => {
  const { basePlayer, additionalPlayers } = useActivePlayersStore();
  const players = useMemo(
    () => [basePlayer, basePlayer, basePlayer, basePlayer],
    [basePlayer, additionalPlayers]
  );

  const [selectedClasses, setSelectedClasses] = useState<Record<string, PlayerClassId>>({});

  const [skipTutorial, setSkipTutorial] = useState(false);
  const [autosave, setAutosave] = useState(true);

  const handleClassChange = (playerId: string, classId: PlayerClassId) => {
    setSelectedClasses((prev) => ({ ...prev, [playerId]: classId }));
  };

  return (
    <MenuSubviewLayout title="New game">
      <Wrapper color={COLORS.BG_COLOR_HIGHLIGHTED}>
        <SelectorsWrapper justify="center">
          {players.map((player) => (
            <ClassSelector
              key={player.id}
              classId={selectedClasses[player.id] ?? PLAYER_CLASSES[0]}
              onChange={(classId) => handleClassChange(player.id, classId)}
            />
          ))}
        </SelectorsWrapper>
        <Footer justify="between" align="center">
          <InternalFlex direction="column" gap={8}>
            <GameOption label="Skip tutorial" checked={skipTutorial} onChange={setSkipTutorial} />
            <GameOption label="Autosave" checked={autosave} onChange={setAutosave} />
          </InternalFlex>
          <StyledButton label="Play" />
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
