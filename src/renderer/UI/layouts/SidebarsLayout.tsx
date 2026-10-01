import styled from 'styled-components';

import { COLORS } from 'renderer/constants';

export const SidebarsLayout = ({ children }: { children: React.ReactNode }) => {
  return <Wrapper>{children}</Wrapper>;
};

const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  height: 100%;

  &:before,
  &:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 15%;
    height: 100%;
    background: ${COLORS.BROWN_DARK};
    border-right: 4px solid ${COLORS.BG_COLOR_HIGHLIGHTED};
  }

  &:after {
    left: auto;
    right: 0;
    border-right: none;
    border-left: 4px solid ${COLORS.BG_COLOR_HIGHLIGHTED};
  }
`;
