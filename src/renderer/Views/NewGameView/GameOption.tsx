import styled from 'styled-components';

import { Checkbox, Text } from 'UI';
import { COLORS } from 'renderer/constants';

export type GameOptionProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export const GameOption = ({ label, checked, onChange }: GameOptionProps) => {
  return (
    <Wrapper onClick={() => onChange(!checked)}>
      <Label>{label}</Label>
      <Checkbox checked={checked} />
    </Wrapper>
  );
};

const Label = styled(Text)``;

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  justify-content: space-between;
  gap: 24px;
  cursor: pointer;

  ${Label} {
    color: ${COLORS.FONT_COLOR_DIMMED};
  }

  &:hover ${Label} {
    color: ${COLORS.FONT_COLOR_HIGHLIGHT};
  }
`;
