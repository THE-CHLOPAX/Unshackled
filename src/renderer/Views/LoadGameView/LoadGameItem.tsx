import { InternalFlex } from '@tgdf';
import styled from 'styled-components';

import { PanelScalable, Text } from 'UI';
import { COLORS } from 'renderer/constants';
import { PlayerProfile } from 'renderer/types';

export type LoadGameItemProps = {
  name: string;
  updatedAt: number;
  players: PlayerProfile[];
  progress: {
    biomeId: string;
    levelIndex: number;
  };
};

export const LoadGameItem = ({ name, updatedAt, players, progress }: LoadGameItemProps) => {
  const updatedAtDate = new Date(updatedAt).toISOString();
  const updatedAtDay = updatedAtDate.split('T')[0];
  const updatedAtTime = updatedAtDate.split('T')[1].split('.')[0];

  return (
    <Wrapper>
      <RowsWrapper direction="column" justify="between">
        <Row>
          <Text size="xl" color={COLORS.FONT_COLOR_HIGHLIGHT}>
            {name}
          </Text>
          <ProgressWrapper>
            <BiomeText>{progress.biomeId}</BiomeText>
            <Text color={COLORS.FONT_COLOR_DIMMED}>lvl.{progress.levelIndex}</Text>
          </ProgressWrapper>
        </Row>
        <Row>
          <PlayersWrapper>
            {players.map((player) => (
              <PlayerItem key={player.id}>
                <PlayerClassText>{player.class}</PlayerClassText>
                <Text color={COLORS.FONT_COLOR_DIMMED}>lvl. 4</Text>
              </PlayerItem>
            ))}
          </PlayersWrapper>
          <DateWrapper>
            <Text>{updatedAtDay}</Text>
            <Text color={COLORS.FONT_COLOR_DIMMED}>{updatedAtTime}</Text>
          </DateWrapper>
        </Row>
      </RowsWrapper>
    </Wrapper>
  );
};

const Wrapper = styled(PanelScalable)`
  width: 100%;
  height: 120px;

  .panel-scalable-content {
    height: 100%;
    justify-content: space-between;
    padding-block: 12px;
  }

  &:not(:hover) span {
    color: ${COLORS.FONT_COLOR_DIMMED};
  }

  &:hover {
    cursor: pointer;

    .panel-scalable-content {
      background: ${COLORS.BG_COLOR_HIGHLIGHTED};
    }
  }
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
`;

const PlayersWrapper = styled.div`
  margin-top: auto;
  display: flex;
  flex-direction: row;
  gap: 12px;
`;

const ProgressWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 4px;
  gap: 1px;
  text-align: right;
`;

const BiomeText = styled(Text)`
  text-transform: capitalize;
`;

const PlayerItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
`;

const PlayerClassText = styled(Text)`
  text-transform: capitalize;
`;

const RowsWrapper = styled(InternalFlex)`
  height: 100%;
  width: 100%;
`;

const DateWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
`;
