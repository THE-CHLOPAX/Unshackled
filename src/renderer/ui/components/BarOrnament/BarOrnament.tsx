import styled from 'styled-components';

import { COLORS } from 'renderer/constants';

import { UI_BACKGROUND_IMAGE_URLS } from '../../constants';

const DEFAULT_SCALE = 3;

const NATIVE_WIDTH = 189;
const NATIVE_HEIGHT = 16;
const NATIVE_WIDTH_SHORT = 105;
const NATIVE_HEIGHT_SHORT = 14;

// The hollow track between the frame's two horizontal border lines and its
// end caps, measured directly from the svg's painted pixels.
const FILL_NATIVE_LEFT = 3;
const FILL_NATIVE_TOP = 6;
const FILL_NATIVE_WIDTH = 181;
const FILL_NATIVE_HEIGHT = 4;
const FILL_BG_INSET = 5;

const SHORT_FILL_NATIVE_LEFT = 1;
const SHORT_FILL_NATIVE_TOP = 5;
const SHORT_FILL_NATIVE_WIDTH = 103;
const SHORT_FILL_BG_LEFT_INSET = 1;
const SHORT_FILL_BG_RIGHT_INSET = 1;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export type BarOrnamentProps = {
  progress: number;
  fillColor: string;
  className?: string;
  scale?: number;
  short?: boolean;
};

export const BarOrnament = ({
  progress,
  fillColor,
  className,
  scale = DEFAULT_SCALE,
  short = false,
}: BarOrnamentProps) => {
  const clampedProgress = clamp(progress, 0, 1);

  return (
    <Wrapper className={className} $scale={scale} $short={short}>
      <FillBg $scale={scale} $short={short} />
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

const FillBg = styled.div<{ $scale: number; $short: boolean }>`
  width: 100%;
  height: 100%;
  background: ${COLORS.BG_COLOR};
  clip-path: ${({ $scale, $short }) =>
    $short
      ? `inset(${FILL_BG_INSET * $scale}px ${SHORT_FILL_BG_RIGHT_INSET * $scale}px ${
          FILL_BG_INSET * $scale
        }px ${SHORT_FILL_BG_LEFT_INSET * $scale}px)`
      : `inset(${FILL_BG_INSET * $scale}px)`};
`;

const Fill = styled.div<{ $progress: number; $color: string; $scale: number; $short: boolean }>`
  position: absolute;
  left: ${({ $scale, $short }) => ($short ? SHORT_FILL_NATIVE_LEFT : FILL_NATIVE_LEFT) * $scale}px;
  top: ${({ $scale, $short }) => ($short ? SHORT_FILL_NATIVE_TOP : FILL_NATIVE_TOP) * $scale}px;
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
  background-image: url(${({ $short }) =>
    $short
      ? UI_BACKGROUND_IMAGE_URLS.barOrnamentShortFrame
      : UI_BACKGROUND_IMAGE_URLS.barOrnamentFrame});
  background-repeat: no-repeat;
  background-size: 100% 100%;
  image-rendering: pixelated;
  pointer-events: none;
`;
