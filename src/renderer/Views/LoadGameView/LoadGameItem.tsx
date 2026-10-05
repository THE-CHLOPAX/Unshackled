import styled from 'styled-components';
import { InternalFlex, useViewsStore } from '@tgdf';

import { PanelScalable, Text } from 'UI';
import { COLORS } from 'renderer/constants';
import { RunIdentifier } from 'renderer/types';
import { useRunStore } from 'Store/useRunStore';

import { EditSaveButton } from './EditSaveButton';
import { DeleteSaveButton } from './DeleteSaveButton';

export type LoadGameItemProps = {
  run: RunIdentifier;
  onDeleted?: () => void;
};

export const LoadGameItem = ({ run, onDeleted }: LoadGameItemProps) => {
  const { id, name, updatedAt, progress } = run;
  const { setView } = useViewsStore();
  const { setCurrentRun } = useRunStore();

  const handleClick = () => {
    setCurrentRun(run);
    setView('GameView');
  };

  const updatedAtDate = new Date(updatedAt).toISOString();
  const updatedAtDay = updatedAtDate.split('T')[0];
  const updatedAtTime = updatedAtDate.split('T')[1].split('.')[0];

  return (
    <Wrapper onClick={handleClick}>
      <RowsWrapper direction="column" justify="between">
        <Row direction="row" align="start" justify="between">
          <Text size="lg" color={COLORS.FONT_COLOR_HIGHLIGHT}>
            {name}
          </Text>
          <ProgressWrapper>
            <BiomeText>{progress.biomeId}</BiomeText>
            <Text color={COLORS.FONT_COLOR_DIMMED}>lvl.{progress.levelIndex + 1}</Text>
          </ProgressWrapper>
        </Row>
        <Row direction="row" align="end" justify="between">
          <ActionButtonsWrapper onClick={(event) => event.stopPropagation()}>
            <DeleteSaveButton runId={id} onDeleted={onDeleted} />
            <EditSaveButton />
          </ActionButtonsWrapper>
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

const Row = styled(InternalFlex)`
  width: 100%;
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

const ActionButtonsWrapper = styled.div`
  display: flex;
  gap: 8px;
`;
