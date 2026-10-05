import styled from 'styled-components';

import { PlayerClassId } from 'renderer/types';
import { Ornament, PanelScalable, Text } from 'UI';
import { COLORS, PLAYER_CLASSES } from 'renderer/constants';

export type ClassSelectorProps = {
  classId: PlayerClassId;
  onChange: (classId: PlayerClassId) => void;
};

export const ClassSelector = ({ classId, onChange }: ClassSelectorProps) => {
  const handleClick = () => {
    const nextIndex = (PLAYER_CLASSES.indexOf(classId) + 1) % PLAYER_CLASSES.length;
    onChange(PLAYER_CLASSES[nextIndex]);
  };

  return (
    <Wrapper onClick={handleClick}>
      <TopOrnament short />
      <Slot>
        <ClassText size="lg" color={COLORS.FONT_COLOR_HIGHLIGHT}>
          {classId}
        </ClassText>
      </Slot>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  position: relative;
  cursor: pointer;

  &:not(:hover) span {
    color: ${COLORS.FONT_COLOR_PRIMARY};
  }
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

const ClassText = styled(Text)`
  text-transform: capitalize;
`;
