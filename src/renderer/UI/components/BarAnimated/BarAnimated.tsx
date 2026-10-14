import type { CSSProperties } from 'react';

import styled from 'styled-components';

import { COLORS } from 'renderer/constants';

import { BarSimple, BarSimpleProps } from '../BarSimple/BarSimple';

const MINIMAL_PROGRESS = 0.01;
const TRANSITION_DURATION_S = 0.5;
const RECENT_CHANGE_WIDTH_VARIABLE = '--bar-recent-change-width';

export type BarAnimatedProps = BarSimpleProps & {
  recentChange: number;
  recentChangeFading: boolean;
  recentChangeColor?: string;
};

export const BarAnimated = ({
  progress,
  recentChange,
  recentChangeFading,
  recentChangeColor = COLORS.GOLDEN,
  style,
  ...barSimpleProps
}: BarAnimatedProps) => {
  const clampedProgress = Math.max(MINIMAL_PROGRESS, progress);
  const recentChangeWidth = `${(100 * recentChange) / clampedProgress}%`;

  return (
    <StyledBarSimple
      {...barSimpleProps}
      progress={clampedProgress}
      style={{ ...style, [RECENT_CHANGE_WIDTH_VARIABLE]: recentChangeWidth } as CSSProperties}
      $isGrowing={recentChange < 0}
      $recentChangeFading={recentChangeFading}
      $recentChangeColor={recentChangeColor}
    />
  );
};

const StyledBarSimple = styled(BarSimple)<{
  $isGrowing: boolean;
  $recentChangeFading: boolean;
  $recentChangeColor: string;
}>`
  .bar-simple-fill {
    transition: ${({ $isGrowing }) => `width ${$isGrowing ? TRANSITION_DURATION_S : 0}s`};

    &:after {
      content: '';
      display: block;
      position: absolute;
      top: 0;
      right: 0;
      transform: translateX(100%) scaleY(2);
      height: 100%;
      transition: ${({ $recentChangeFading }) =>
        `width ${$recentChangeFading ? TRANSITION_DURATION_S : 0}s`};
      width: var(${RECENT_CHANGE_WIDTH_VARIABLE}, 0%);
      background: ${({ $recentChangeColor }) => $recentChangeColor};
    }
  }
`;
