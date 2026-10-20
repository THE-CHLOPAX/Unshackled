import type { ComponentProps } from 'react';

import styled from 'styled-components';
import {
  useKeyPress,
  useGamepadButtonPress,
  KEYBOARD_MAPPINGS,
  GAMEPAD_MAPPINGS,
  useViewsStore,
  ViewProps,
} from '@tgdf';

import * as views from 'Views';
import { COLORS } from 'renderer/constants';

import { Icon } from '../components/Icon/Icon';
import { withUIClick } from '../utils/withUIClick';
import { ButtonIcon } from '../components/ButtonIcon/ButtonIcon';

type ViewName = keyof typeof views;

export type BackToViewLayoutProps<V extends ViewName = ViewName> = {
  backToView: V;
  backToViewProps?: ComponentProps<(typeof views)[V]>;
  children: React.ReactNode;
  noButton?: boolean;
};

export function BackToViewLayout<V extends ViewName>({
  backToView,
  backToViewProps,
  children,
  noButton = false,
}: BackToViewLayoutProps<V>) {
  const { setView } = useViewsStore();

  const goBackToView = () => setView(backToView, backToViewProps as ViewProps | undefined);

  // Listen for Escape key to go back
  useKeyPress(KEYBOARD_MAPPINGS.Escape, () => {
    goBackToView();
  });

  // Listen for Start button to go back
  useGamepadButtonPress(GAMEPAD_MAPPINGS.START, () => {
    goBackToView();
  });

  return (
    <>
      {noButton === false && (
        <StyledButtonIcon
          icon={<Icon icon="arrowLeft" scale={2} color={COLORS.FONT_COLOR_DIMMED} />}
          onClick={withUIClick(goBackToView)}
        />
      )}
      {children}
    </>
  );
}

const StyledButtonIcon = styled(ButtonIcon)`
  position: absolute;
  top: 15px;
  left: 22px;
  z-index: 1;
`;
