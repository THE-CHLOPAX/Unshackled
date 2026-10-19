import styled from 'styled-components';

import { COLORS } from 'renderer/constants';
import { Ornament, PanelScalable, Text } from 'UI';

export type PlayerSlotProps = {
  name: string;
};

export const PlayerSlot = ({ name }: PlayerSlotProps) => (
  <Wrapper>
    <TopOrnament short />
    <Slot>
      <Text size="lg" color={COLORS.FONT_COLOR_PRIMARY}>
        {name}
      </Text>
    </Slot>
  </Wrapper>
);

const Wrapper = styled.div`
  position: relative;
`;

const TopOrnament = styled(Ornament)`
  position: absolute;
  top: -16px;
  left: 50%;
  width: 100%;
  transform: translateX(-50%);
  z-index: 2;
`;

const Slot = styled(PanelScalable)`
  width: 175px;
  height: 330px;

  .panel-scalable-content {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    background: radial-gradient(
      ellipse at center,
      ${COLORS.BG_COLOR_HIGHLIGHTED_HALF} 0%,
      ${COLORS.BG_COLOR} 100%
    );
  }
`;
