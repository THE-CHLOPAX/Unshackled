import styled from 'styled-components';

import { COLORS } from 'renderer/constants';

import { BarSimple, BarSimpleProps } from '../BarSimple/BarSimple';

const MINIMAL_PROGRESS = 0.01;
const TRANSITION_DURATION_S = 0.5;

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
  ...barSimpleProps
}: BarAnimatedProps) => {
  const clampedProgress = Math.max(MINIMAL_PROGRESS, progress);

  return (
    <StyledBarSimple
      {...barSimpleProps}
      progress={clampedProgress}
      $progress={clampedProgress}
      $recentChange={recentChange}
      $recentChangeFading={recentChangeFading}
      $recentChangeColor={recentChangeColor}
    />
  );
};

const StyledBarSimple = styled(BarSimple)<{
  $progress: number;
  $recentChange: number;
  $recentChangeFading: boolean;
  $recentChangeColor: string;
}>`
  .bar-simple-fill {
    transition: ${({ $recentChange }) =>
      `width ${$recentChange < 0 ? TRANSITION_DURATION_S : 0}s`};

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
      width: ${({ $progress, $recentChange }) => `${(100 * $recentChange) / $progress}%`};
      background: ${({ $recentChangeColor }) => $recentChangeColor};
    }
  }
`;
