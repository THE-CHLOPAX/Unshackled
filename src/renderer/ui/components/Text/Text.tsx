import type { CSSProperties, ReactNode } from 'react';

import styled from 'styled-components';

import { TextSize } from 'renderer/ui/types';
import { FONT_SIZES } from 'renderer/ui/constants';

import { COLORS } from '../../../constants';

type TextProps = {
  children: ReactNode;
  size?: TextSize;
  color?: string;
  className?: string;
  nowrap?: boolean;
  style?: CSSProperties;
};

export const Text = ({
  children,
  size = 'md',
  color = COLORS.FONT_COLOR_PRIMARY,
  nowrap = false,
  className,
  style,
}: TextProps) => (
  <StyledText $size={size} $color={color} $nowrap={nowrap} className={className} style={style}>
    {children}
  </StyledText>
);

const StyledText = styled.span<{ $size: TextSize; $color: string; $nowrap: boolean }>`
  font-family: 'Alagard', monospace;
  font-size: ${({ $size }) => FONT_SIZES[$size]}px;
  line-height: 0.8;
  color: ${({ $color }) => $color};
  white-space: ${({ $nowrap }) => ($nowrap ? 'nowrap' : 'initial')};
`;
