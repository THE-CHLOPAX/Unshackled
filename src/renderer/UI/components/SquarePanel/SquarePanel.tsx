import type { CSSProperties, ReactNode } from 'react';

import styled from 'styled-components';

import { UI_IMAGE_URLS } from '../../constants';

const DEFAULT_SCALE = 3;

const NATIVE_WIDTH = 38;
const NATIVE_HEIGHT = 44;
const ORNAMENT_HEIGHT = 8;

export type SquarePanelProps = {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  scale?: number;
};

export const SquarePanel = ({
  children,
  className,
  style,
  scale = DEFAULT_SCALE,
}: SquarePanelProps) => {
  return (
    <Wrapper $scale={scale} className={className} style={style}>
      <Content $scale={scale}>{children}</Content>
    </Wrapper>
  );
};

const Wrapper = styled.div<{ $scale: number }>`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: ${({ $scale }) => NATIVE_WIDTH * $scale}px;
  height: ${({ $scale }) => NATIVE_HEIGHT * $scale}px;
  padding-top: ${({ $scale }) => ORNAMENT_HEIGHT * $scale}px;
  background-image: url(${UI_IMAGE_URLS.squarePanelBg});
  background-repeat: no-repeat;
  background-size: 100% 100%;
  image-rendering: pixelated;
`;

const Content = styled.div<{ $scale: number }>`
  position: absolute;
  inset: ${({ $scale }) => ORNAMENT_HEIGHT * $scale}px ${({ $scale }) => $scale}px
    ${({ $scale }) => $scale}px ${({ $scale }) => $scale}px;
  z-index: -1;
`;
