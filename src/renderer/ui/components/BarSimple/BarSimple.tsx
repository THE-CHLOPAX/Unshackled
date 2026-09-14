import styled from 'styled-components';

import { COLORS } from 'renderer/constants';

import barSimpleFrame from '../../../assets/svg/bar-simple.svg?url';
import barSimpleShortFrame from '../../../assets/svg/bar-simple-short.svg?url';

const DEFAULT_SCALE = 3;

const NATIVE_WIDTH = 138;
const NATIVE_HEIGHT = 6;
const NATIVE_WIDTH_SHORT = 73;
const NATIVE_HEIGHT_SHORT = 6;

const FILL_NATIVE_LEFT = 1;
const FILL_NATIVE_TOP = 1;
const FILL_NATIVE_WIDTH = NATIVE_WIDTH - FILL_NATIVE_LEFT * 2;
const FILL_NATIVE_HEIGHT = NATIVE_HEIGHT - FILL_NATIVE_TOP * 2;

const SHORT_FILL_NATIVE_WIDTH = NATIVE_WIDTH_SHORT - FILL_NATIVE_LEFT * 2;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export type BarSimpleProps = {
  progress: number;
  fillColor: string;
  className?: string;
  scale?: number;
  short?: boolean;
};

export const BarSimple = ({
  progress,
  fillColor,
  className,
  scale = DEFAULT_SCALE,
  short = false,
}: BarSimpleProps) => {
  const clampedProgress = clamp(progress, 0, 1);

  return (
    <Wrapper className={className} $scale={scale} $short={short}>
      <FillBg $scale={scale} />
      <Fill $progress={clampedProgress} $color={fillColor} $scale={scale} $short={short} />
      <Frame $short={short} />
    </Wrapper>
  );
};

const Wrapper = styled.div<{ $scale: number; $short: boolean }>`
  position: relative;
  width: ${({ $scale, $short }) => ($short ? NATIVE_WIDTH_SHORT : NATIVE_WIDTH) * $scale}px;
  height: ${({ $scale, $short }) => ($short ? NATIVE_HEIGHT_SHORT : NATIVE_HEIGHT) * $scale}px;
`;

const FillBg = styled.div<{ $scale: number }>`
  width: 100%;
  height: 100%;
  background: ${COLORS.BG_COLOR};
  clip-path: ${({ $scale }) => `inset(${FILL_NATIVE_TOP * $scale}px)`};
`;

const Fill = styled.div<{ $progress: number; $color: string; $scale: number; $short: boolean }>`
  position: absolute;
  left: ${({ $scale }) => FILL_NATIVE_LEFT * $scale}px;
  top: ${({ $scale }) => FILL_NATIVE_TOP * $scale}px;
  width: ${({ $progress, $scale, $short }) =>
    ($short ? SHORT_FILL_NATIVE_WIDTH : FILL_NATIVE_WIDTH) * $scale * $progress}px;
  height: ${({ $scale }) => FILL_NATIVE_HEIGHT * $scale}px;
  background: ${({ $color }) => $color};
  border-top: ${({ $scale }) => $scale}px solid rgba(255, 255, 255, 0.3);
  border-bottom: ${({ $scale }) => $scale}px solid rgba(0, 0, 0, 0.15);
`;

const Frame = styled.div<{ $short: boolean }>`
  position: absolute;
  inset: 0;
  background-image: url(${({ $short }) => ($short ? barSimpleShortFrame : barSimpleFrame)});
  background-repeat: no-repeat;
  background-size: 100% 100%;
  image-rendering: pixelated;
  pointer-events: none;
`;
