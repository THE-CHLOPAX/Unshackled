import styled from 'styled-components';

import { COLORS } from 'renderer/constants';

import barSimpleFrame from '../../../assets/svg/bar-simple.svg?url';

const DEFAULT_SCALE = 3;

const NATIVE_WIDTH = 138;
const NATIVE_HEIGHT = 6;

// The frame's 1px border on every side, in native pixels.
const FILL_NATIVE_LEFT = 1;
const FILL_NATIVE_TOP = 1;
const FILL_NATIVE_WIDTH = NATIVE_WIDTH - FILL_NATIVE_LEFT * 2;
const FILL_NATIVE_HEIGHT = NATIVE_HEIGHT - FILL_NATIVE_TOP * 2;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export type BarSimpleProps = {
  progress: number;
  fillColor: string;
  className?: string;
  scale?: number;
};

export const BarSimple = ({
  progress,
  fillColor,
  className,
  scale = DEFAULT_SCALE,
}: BarSimpleProps) => {
  const clampedProgress = clamp(progress, 0, 1);

  return (
    <Wrapper className={className} $scale={scale}>
      <Fill $progress={clampedProgress} $color={fillColor} $scale={scale} />
      <Frame />
    </Wrapper>
  );
};

const Wrapper = styled.div<{ $scale: number }>`
  position: relative;
  width: ${({ $scale }) => NATIVE_WIDTH * $scale}px;
  height: ${({ $scale }) => NATIVE_HEIGHT * $scale}px;
  background: ${COLORS.BG_COLOR};
`;

const Fill = styled.div<{ $progress: number; $color: string; $scale: number }>`
  position: absolute;
  left: ${({ $scale }) => FILL_NATIVE_LEFT * $scale}px;
  top: ${({ $scale }) => FILL_NATIVE_TOP * $scale}px;
  width: ${({ $progress, $scale }) => FILL_NATIVE_WIDTH * $scale * $progress}px;
  height: ${({ $scale }) => FILL_NATIVE_HEIGHT * $scale}px;
  background: ${({ $color }) => $color};
  border-top: ${({ $scale }) => $scale}px solid rgba(255, 255, 255, 0.3);
  border-bottom: ${({ $scale }) => $scale}px solid rgba(0, 0, 0, 0.15);
`;

const Frame = styled.div`
  position: absolute;
  inset: 0;
  background-image: url(${barSimpleFrame});
  background-repeat: no-repeat;
  background-size: 100% 100%;
  image-rendering: pixelated;
  pointer-events: none;
`;
