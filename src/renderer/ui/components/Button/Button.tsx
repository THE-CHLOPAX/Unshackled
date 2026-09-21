import { styled } from 'styled-components';

import { COLORS } from 'renderer/constants';

import { Text } from '../Text/Text';
import { UI_BACKGROUND_IMAGE_URLS } from '../../constants';

const SCALE = 3;

const NATIVE_WIDTH = 35;
const ACTIVE_HEIGHT = 20;
const INACTIVE_HEIGHT = 18;
const SPIKE_HEIGHT = ACTIVE_HEIGHT - INACTIVE_HEIGHT;

export type ButtonProps = {
  onClick?: () => void;
  label: string;
  disabled?: boolean;
};

export const Button = ({ label, onClick, disabled = false }: ButtonProps) => {
  return (
    <Wrapper type="button" disabled={disabled} onClick={onClick}>
      <ButtonLabel size="md">{label}</ButtonLabel>
    </Wrapper>
  );
};

const Wrapper = styled.button`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  padding: 0;
  padding-top: ${SPIKE_HEIGHT * SCALE}px;
  min-width: ${NATIVE_WIDTH * SCALE}px;
  height: ${ACTIVE_HEIGHT * SCALE}px;
  background-image: url(${UI_BACKGROUND_IMAGE_URLS.buttonInactiveBg});
  background-repeat: no-repeat;
  background-position: bottom center;
  background-size: 100% auto;
  image-rendering: pixelated;
  cursor: pointer;
  --button-label-color: ${COLORS.FONT_COLOR_PRIMARY};

  &:hover:not(:disabled) {
    background-image: url(${UI_BACKGROUND_IMAGE_URLS.buttonActiveBg});
    --button-label-color: ${COLORS.FONT_COLOR_HIGHLIGHT};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed !important;
  }
`;

const ButtonLabel = styled(Text)`
  position: relative;
  top: 2px;
  color: var(--button-label-color);
`;
