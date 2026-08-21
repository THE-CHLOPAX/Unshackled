import styled from 'styled-components';

import { COLORS } from 'renderer/constants';

import { BarSimple } from '../BarSimple/BarSimple';

export type HealthBarProps = {
  progress: number;
};

export const HealthBar = ({ progress }: HealthBarProps) => {
  return <StyledBarSimple fillColor={COLORS.RED} progress={progress} scale={1.5} />;
};

const StyledBarSimple = styled(BarSimple)`
  .bar-simple-fill {
    background-color: ${COLORS.BG_COLOR};
  }
`;
