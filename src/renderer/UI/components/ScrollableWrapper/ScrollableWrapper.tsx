import type { CSSProperties, ReactNode } from 'react';

import { styled } from 'styled-components';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Scrollbar } from '../Scrollbar/Scrollbar';

const STEP = 40; // px scrolled per arrow-button click

type ScrollState = {
  progress: number;
  thumbRatio: number;
};

const IDLE_SCROLL_STATE: ScrollState = { progress: 0, thumbRatio: 1 };

export type ScrollableWrapperProps = {
  children: ReactNode;
  direction?: 'vertical' | 'horizontal' | 'both';
  className?: string;
  style?: CSSProperties;
};

export const ScrollableWrapper = ({
  children,
  direction = 'vertical',
  className,
  style,
}: ScrollableWrapperProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const innerContentRef = useRef<HTMLDivElement>(null);
  const [verticalState, setVerticalState] = useState<ScrollState>(IDLE_SCROLL_STATE);
  const [horizontalState, setHorizontalState] = useState<ScrollState>(IDLE_SCROLL_STATE);

  const showVertical = direction === 'vertical' || direction === 'both';
  const showHorizontal = direction === 'horizontal' || direction === 'both';

  const updateFromScroll = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;

    if (showVertical) {
      const maxScroll = el.scrollHeight - el.clientHeight;
      setVerticalState({
        progress: maxScroll > 0 ? el.scrollTop / maxScroll : 0,
        thumbRatio: el.scrollHeight > 0 ? Math.min(1, el.clientHeight / el.scrollHeight) : 1,
      });
    }

    if (showHorizontal) {
      const maxScroll = el.scrollWidth - el.clientWidth;
      setHorizontalState({
        progress: maxScroll > 0 ? el.scrollLeft / maxScroll : 0,
        thumbRatio: el.scrollWidth > 0 ? Math.min(1, el.clientWidth / el.scrollWidth) : 1,
      });
    }
  }, [showVertical, showHorizontal]);

  useEffect(() => {
    const el = contentRef.current;
    const innerContent = innerContentRef.current;
    if (!el || !innerContent) return;

    updateFromScroll();

    const observer = new ResizeObserver(updateFromScroll);
    observer.observe(el);
    observer.observe(innerContent);

    return () => observer.disconnect();
  }, [updateFromScroll]);

  const handleVerticalStep = useCallback((dir: -1 | 1) => {
    contentRef.current?.scrollBy({ top: dir * STEP, behavior: 'smooth' });
  }, []);

  const handleHorizontalStep = useCallback((dir: -1 | 1) => {
    contentRef.current?.scrollBy({ left: dir * STEP, behavior: 'smooth' });
  }, []);

  const handleVerticalDrag = useCallback((nextProgress: number) => {
    const el = contentRef.current;
    if (!el) return;
    el.scrollTop = nextProgress * (el.scrollHeight - el.clientHeight);
  }, []);

  const handleHorizontalDrag = useCallback((nextProgress: number) => {
    const el = contentRef.current;
    if (!el) return;
    el.scrollLeft = nextProgress * (el.scrollWidth - el.clientWidth);
  }, []);

  return (
    <Wrapper className={className} style={style}>
      <Content
        ref={contentRef}
        data-testid="scrollable-content"
        onScroll={updateFromScroll}
        $overflowY={showVertical ? 'auto' : 'hidden'}
        $overflowX={showHorizontal ? 'auto' : 'hidden'}
      >
        <InnerContent ref={innerContentRef} $fitContent={showHorizontal}>
          {children}
        </InnerContent>
      </Content>

      {showVertical && verticalState.thumbRatio < 1 && (
        <VerticalSlot>
          <Scrollbar
            orientation="vertical"
            progress={verticalState.progress}
            onStep={handleVerticalStep}
            onProgressChange={handleVerticalDrag}
          />
        </VerticalSlot>
      )}

      {showHorizontal && horizontalState.thumbRatio < 1 && (
        <HorizontalSlot>
          <Scrollbar
            orientation="horizontal"
            progress={horizontalState.progress}
            onStep={handleHorizontalStep}
            onProgressChange={handleHorizontalDrag}
          />
        </HorizontalSlot>
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: 1fr auto;
  width: 100%;
  height: 100%;
`;

const Content = styled.div<{ $overflowY: 'auto' | 'hidden'; $overflowX: 'auto' | 'hidden' }>`
  grid-column: 1;
  grid-row: 1;
  min-width: 0;
  min-height: 0;
  overflow-y: ${({ $overflowY }) => $overflowY};
  overflow-x: ${({ $overflowX }) => $overflowX};
  scrollbar-width: none;
  -ms-overflow-style: none;

  /* This wrapper renders its own Scrollbar — hide the native one it'd replace. */
  &::-webkit-scrollbar {
    display: none;
  }
`;

const InnerContent = styled.div<{ $fitContent: boolean }>`
  width: ${({ $fitContent }) => ($fitContent ? 'max-content' : '100%')};
`;

const VerticalSlot = styled.div`
  grid-column: 2;
  grid-row: 1;
`;

const HorizontalSlot = styled.div`
  grid-column: 1;
  grid-row: 2;
`;
