import styled from 'styled-components';
import {
  useKeyPress,
  useGamepadButtonPress,
  KEYBOARD_MAPPINGS,
  GAMEPAD_MAPPINGS,
  useViewsStore,
} from '@tgdf';

import * as views from 'Views';
import { COLORS } from 'renderer/constants';

import { Icon } from '../components/Icon/Icon';
import { ButtonIcon } from '../components/ButtonIcon/ButtonIcon';

export type BackToViewLayoutProps = {
  backToView: keyof typeof views;
  children: React.ReactNode;
  noButton?: boolean;
};

export function BackToViewLayout({
  backToView,
  children,
  noButton = false,
}: BackToViewLayoutProps) {
  const { setView } = useViewsStore();

  // Listen for Escape key to go back
  useKeyPress(KEYBOARD_MAPPINGS.Escape, () => {
    setView(backToView);
  });

  // Listen for Start button to go back
  useGamepadButtonPress(GAMEPAD_MAPPINGS.START, () => {
    setView(backToView);
  });

  return (
    <>
      {noButton === false && (
        <StyledButtonIcon
          icon={<Icon icon="arrowLeft" scale={2} color={COLORS.FONT_COLOR_DIMMED} />}
          onClick={() => setView(backToView)}
        />
      )}
      {children}
    </>
  );
}

const StyledButtonIcon = styled(ButtonIcon)`
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 1;
`;
