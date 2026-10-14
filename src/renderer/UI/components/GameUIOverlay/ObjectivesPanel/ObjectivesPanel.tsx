import styled from 'styled-components';

import { COLORS, OBJECTIVE_LABELS } from 'renderer/constants';
import { getRadialGradient } from 'renderer/UI/utils/getBgRadialGradient';
import { ProgressTrackerObjective } from '3D/classes/scenes/GameScene/ProgressTracker/ProgressTracker';

import { Text } from '../../Text/Text';

export type ObjectivesPanelProps = {
  objectiveType: ProgressTrackerObjective['type'];
};

export function ObjectivesPanel({ objectiveType }: ObjectivesPanelProps) {
  return (
    <Wrapper>
      <Content>
        <Text color={COLORS.FONT_COLOR_HIGHLIGHT} nowrap>
          Objectives
        </Text>
        <List>
          <Text color={COLORS.FONT_COLOR_DIMMED} nowrap>
            • {OBJECTIVE_LABELS[objectiveType]}
          </Text>
        </List>
      </Content>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 40px 60px;
  margin-left: -50px;
  background: ${getRadialGradient(COLORS.BG_COLOR)};
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 7px;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;
