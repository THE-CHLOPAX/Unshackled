import styled from 'styled-components';

import { COLORS } from 'renderer/constants';

import barOrnamentFrame from '../../../assets/svg/bar-ornament.svg?url';

const DEFAULT_SCALE = 3;

const NATIVE_WIDTH = 189;
const NATIVE_HEIGHT = 16;

// The hollow track between the frame's two horizontal border lines and its
// end caps, measured directly from the svg's painted pixels.
const FILL_NATIVE_LEFT = 3;
const FILL_NATIVE_TOP = 6;
const FILL_NATIVE_WIDTH = 181;
const FILL_NATIVE_HEIGHT = 4;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export type BarOrnamentProps = {
  progress: number;
  fillColor: string;
  className?: string;
  scale?: number;
};

export const BarOrnament = ({
  progress,
  fillColor,
  className,
  scale = DEFAULT_SCALE,
}: BarOrnamentProps) => {
  const clampedProgress = clamp(progress, 0, 1);

  return (
    <Wrapper className={className} $scale={scale}>
      <FillBg $scale={scale} />
      <Fill $progress={clampedProgress} $color={fillColor} $scale={scale} />
      <Frame />
    </Wrapper>
  );
};

const Wrapper = styled.div<{ $scale: number }>`
  position: relative;
  width: ${({ $scale }) => NATIVE_WIDTH * $scale}px;
  height: ${({ $scale }) => NATIVE_HEIGHT * $scale}px;
`;

const FillBg = styled.div<{ $scale: number }>`
  width: 100%;
  height: 100%;
  background: ${COLORS.BG_COLOR};
  clip-path: inset(${({ $scale }) => 5 * $scale}px);
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
  background-image: url(${barOrnamentFrame});
  background-repeat: no-repeat;
  background-size: 100% 100%;
  image-rendering: pixelated;
  pointer-events: none;
`;
