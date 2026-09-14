import type { CSSProperties, ReactNode } from 'react';

import styled from 'styled-components';

import { UI_BACKGROUND_IMAGE_URLS } from '../../constants';

const SCALE = 3;

const NATIVE_WIDTH = 14;
const ACTIVE_HEIGHT = 16;
const INACTIVE_HEIGHT = 14;
const SPIKE_HEIGHT = ACTIVE_HEIGHT - INACTIVE_HEIGHT;

export type SmallPanelProps = {
  children?: ReactNode;
  active?: boolean;
  // Swaps to the active background on :hover via CSS instead of the `active`
  // prop — for components like ButtonIcon where the state is hover-driven
  // rather than controlled by React state, matching how Button/Dropdown do it.
  activateOnHover?: boolean;
  className?: string;
  style?: CSSProperties;
};

// Generic small square/rectangular panel used standalone, or as the
// background for other components that need the same frame in an
// inactive/active pair (ButtonIcon, Checkbox).
//
// The content box (height + padding-top) never changes between states, only
// the background-image does — so whatever is centered inside never shifts
// when active/hover toggles, even though the active artwork is 2 native px
// taller than the inactive one.
export const SmallPanel = ({
  children,
  active = false,
  activateOnHover = false,
  className,
  style,
}: SmallPanelProps) => {
  return (
    <Wrapper
      $active={active}
      $activateOnHover={activateOnHover}
      className={className}
      style={style}
    >
      {children}
    </Wrapper>
  );
};

const Wrapper = styled.div<{ $active: boolean; $activateOnHover: boolean }>`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-width: ${NATIVE_WIDTH * SCALE}px;
  height: ${ACTIVE_HEIGHT * SCALE}px;
  padding-top: ${SPIKE_HEIGHT * SCALE}px;
  background-image: url(${({ $active }) =>
    $active
      ? UI_BACKGROUND_IMAGE_URLS.smallPanelActiveBg
      : UI_BACKGROUND_IMAGE_URLS.smallPanelInactiveBg});
  background-repeat: no-repeat;
  background-position: bottom center;
  background-size: 100% auto;
  image-rendering: pixelated;

  ${({ $activateOnHover }) =>
    $activateOnHover &&
    `
    &:hover {
      background-image: url(${UI_BACKGROUND_IMAGE_URLS.smallPanelActiveBg});
    }
  `}
`;
