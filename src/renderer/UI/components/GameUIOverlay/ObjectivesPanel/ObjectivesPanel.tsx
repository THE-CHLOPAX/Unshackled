import styled from 'styled-components';

import { COLORS, OBJECTIVE_LABELS } from 'renderer/constants';
import { ProgressTrackerObjective } from '3D/classes/scenes/GameScene/ProgressTracker/ProgressTracker';

import { Text } from '../../Text/Text';
import { PanelScalable } from '../../PanelScalable/PanelScalable';

export type ObjectivesPanelProps = {
  objectiveType: ProgressTrackerObjective['type'];
};

export function ObjectivesPanel({ objectiveType }: ObjectivesPanelProps) {
  return (
    <PanelScalable>
      <Content>
        <Text size="lg" color={COLORS.FONT_COLOR_HIGHLIGHT} nowrap>
          Objectives
        </Text>
        <List>
          <Text color={COLORS.FONT_COLOR_DIMMED} nowrap>
            • {OBJECTIVE_LABELS[objectiveType]}
          </Text>
        </List>
      </Content>
    </PanelScalable>
  );
}

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;
