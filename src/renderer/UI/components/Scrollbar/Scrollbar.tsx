import type { PointerEvent as ReactPointerEvent } from 'react';

import styled from 'styled-components';
import { useCallback, useEffect, useRef, useState } from 'react';

import { COLORS } from 'renderer/constants';

import { UI_BACKGROUND_IMAGE_URLS } from '../../constants';

const SCALE = 3;

const ARROW_NATIVE_WIDTH = 7;
const ARROW_NATIVE_HEIGHT = 14;
const THUMB_NATIVE_WIDTH = 5;
const THUMB_NATIVE_HEIGHT = 12;

const ARROW_THICKNESS_PX = ARROW_NATIVE_WIDTH * SCALE;
const ARROW_LENGTH_PX = ARROW_NATIVE_HEIGHT * SCALE;
const THUMB_THICKNESS_PX = THUMB_NATIVE_WIDTH * SCALE;
const THUMB_LENGTH_PX = THUMB_NATIVE_HEIGHT * SCALE;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export type ScrollbarProps = {
  progress: number;
  orientation: 'vertical' | 'horizontal';
  onStep: (dir: 1 | -1) => void;
  onProgressChange: (nextProgress: number) => void;
};

export const Scrollbar = ({ progress, orientation, onStep, onProgressChange }: ScrollbarProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackLength, setTrackLength] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const observer = new ResizeObserver(([entry]) => {
      setTrackLength(
        orientation === 'vertical' ? entry.contentRect.height : entry.contentRect.width
      );
    });
    observer.observe(track);

    return () => observer.disconnect();
  }, [orientation]);

  const clampedProgress = clamp(progress, 0, 1);
  const usableLength = Math.max(trackLength - THUMB_LENGTH_PX, 0);
  const thumbOffset = usableLength * clampedProgress;

  const progressFromClientPos = useCallback(
    (clientPos: number) => {
      const track = trackRef.current;
      if (!track || usableLength <= 0) return 0;
      const rect = track.getBoundingClientRect();
      const start = orientation === 'vertical' ? rect.top : rect.left;
      const raw = (clientPos - start - THUMB_LENGTH_PX / 2) / usableLength;
      return clamp(raw, 0, 1);
    },
    [orientation, usableLength]
  );

  const clientPosFromEvent = (event: ReactPointerEvent) =>
    orientation === 'vertical' ? event.clientY : event.clientX;

  const handleTrackPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      onProgressChange(progressFromClientPos(clientPosFromEvent(event)));
    },
    [onProgressChange, progressFromClientPos]
  );

  const handleTrackPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.buttons === 0) return;
      onProgressChange(progressFromClientPos(clientPosFromEvent(event)));
    },
    [onProgressChange, progressFromClientPos]
  );

  return (
    <Wrapper $orientation={orientation}>
      <ArrowStart $orientation={orientation} onClick={() => onStep(-1)} />
      <Track
        ref={trackRef}
        $orientation={orientation}
        onPointerDown={handleTrackPointerDown}
        onPointerMove={handleTrackPointerMove}
      >
        <Thumb $orientation={orientation} $offset={thumbOffset} />
      </Track>
      <ArrowEnd $orientation={orientation} onClick={() => onStep(1)} />
    </Wrapper>
  );
};

const Wrapper = styled.div<{ $orientation: ScrollbarProps['orientation'] }>`
  position: relative;
  display: flex;
  flex-direction: ${({ $orientation }) => ($orientation === 'vertical' ? 'column' : 'row')};
  width: ${({ $orientation }) =>
    $orientation === 'vertical' ? `${ARROW_NATIVE_WIDTH * SCALE}px` : '100%'};
  height: ${({ $orientation }) =>
    $orientation === 'vertical' ? '100%' : `${ARROW_NATIVE_WIDTH * SCALE}px`};
`;

const Track = styled.div<{ $orientation: ScrollbarProps['orientation'] }>`
  position: relative;
  flex: 1;
  cursor: pointer;

  &:after {
    content: '';
    position: absolute;
    top: ${({ $orientation }) => ($orientation === 'horizontal' ? '50%' : '0')};
    left: ${({ $orientation }) => ($orientation === 'horizontal' ? '0' : '50%')};
    display: block;
    background: ${COLORS.FONT_COLOR_DIMMED};
    height: ${({ $orientation }) => ($orientation === 'vertical' ? '100%' : `${SCALE}px`)};
    width: ${({ $orientation }) => ($orientation === 'vertical' ? `${SCALE}px` : '100%')};
    transform: ${({ $orientation }) =>
      $orientation === 'horizontal' ? 'translateY(-50%)' : 'translateX(-50%)'};
    z-index: 0;
  }
`;

const Arrow = styled.button<{ $orientation: ScrollbarProps['orientation'] }>`
  position: relative;
  border: none;
  background: transparent;
  padding: 0;
  width: ${({ $orientation }) =>
    $orientation === 'horizontal'
      ? `${ARROW_NATIVE_HEIGHT * SCALE}px`
      : `${ARROW_NATIVE_WIDTH * SCALE}px`};
  height: ${({ $orientation }) =>
    $orientation === 'horizontal'
      ? `${ARROW_NATIVE_WIDTH * SCALE}px`
      : `${ARROW_NATIVE_HEIGHT * SCALE}px`};
  z-index: 1;

  &:after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: ${ARROW_THICKNESS_PX}px;
    height: ${ARROW_LENGTH_PX}px;
    background-image: url(${UI_BACKGROUND_IMAGE_URLS.scrollArrow});
    background-repeat: no-repeat;
    background-position: center;
    background-size: 100% 100%;
    image-rendering: pixelated;
    transform-origin: center;
  }
`;

const ArrowStart = styled(Arrow)`
  &:after {
    transform: ${({ $orientation }) =>
      $orientation === 'horizontal'
        ? 'translate(-50%, -50%) rotate(-90deg)'
        : 'translate(-50%, -50%)'};
  }
`;

const ArrowEnd = styled(Arrow)`
  &:after {
    transform: ${({ $orientation }) =>
      $orientation === 'horizontal'
        ? 'translate(-50%, -50%) rotate(90deg)'
        : 'translate(-50%, -50%) rotate(180deg)'};
  }
`;

const Thumb = styled.div<{ $orientation: ScrollbarProps['orientation']; $offset: number }>`
  position: absolute;
  top: ${({ $orientation, $offset }) => ($orientation === 'horizontal' ? '50%' : `${$offset}px`)};
  left: ${({ $orientation, $offset }) => ($orientation === 'horizontal' ? `${$offset}px` : '50%')};
  width: ${({ $orientation }) =>
    $orientation === 'horizontal' ? `${THUMB_LENGTH_PX}px` : `${THUMB_THICKNESS_PX}px`};
  height: ${({ $orientation }) =>
    $orientation === 'horizontal' ? `${THUMB_THICKNESS_PX}px` : `${THUMB_LENGTH_PX}px`};
  z-index: 1;

  transform: ${({ $orientation }) =>
    $orientation === 'horizontal' ? 'translateY(-50%)' : 'translateX(-50%)'};

  &:after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: ${THUMB_THICKNESS_PX}px;
    height: ${THUMB_LENGTH_PX}px;
    background-image: url(${UI_BACKGROUND_IMAGE_URLS.scrollThumb});
    background-repeat: no-repeat;
    background-position: center;
    background-size: 100% 100%;
    image-rendering: pixelated;
    transform-origin: center;
    transform: ${({ $orientation }) =>
      $orientation === 'horizontal'
        ? 'translate(-50%, -50%) rotate(90deg)'
        : 'translate(-50%, -50%)'};
  }
`;
