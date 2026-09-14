import type { ChangeEvent } from 'react';

import styled from 'styled-components';

import { TextSize } from 'renderer/ui/types';

import { COLORS } from '../../../constants';
import { FONT_SIZES, UI_BACKGROUND_IMAGE_URLS } from '../../constants';

const SCALE = 3;

const NATIVE_WIDTH = 57;
const ACTIVE_HEIGHT = 16;
const INACTIVE_HEIGHT = 14;
const SPIKE_HEIGHT = ACTIVE_HEIGHT - INACTIVE_HEIGHT;

export type TextInputProps = {
  value: string;
  fontSize?: TextSize;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export const TextInput = ({
  value,
  onChange,
  placeholder,
  fontSize = 'md',
  disabled = false,
  className,
}: TextInputProps) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange?.(event.target.value);
  };

  return (
    <Input
      type="text"
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={handleChange}
      className={className}
      $fontSize={fontSize}
    />
  );
};

const Input = styled.input<{ $fontSize: TextSize }>`
  box-sizing: border-box;
  width: ${NATIVE_WIDTH * SCALE}px;
  height: ${ACTIVE_HEIGHT * SCALE}px;
  padding: ${SPIKE_HEIGHT * SCALE}px ${5 * SCALE}px 0;
  border: none;
  outline: none;
  background: none;
  background-image: url(${UI_BACKGROUND_IMAGE_URLS.inputInactiveBg});
  background-repeat: no-repeat;
  background-position: bottom center;
  background-size: 100% auto;
  image-rendering: pixelated;
  font-family: 'Alagard', monospace;
  font-size: ${({ $fontSize }) => FONT_SIZES[$fontSize]}px;
  line-height: 0.8;
  color: ${COLORS.FONT_COLOR_PRIMARY};

  &::placeholder {
    color: ${COLORS.FONT_COLOR_DIMMED};
  }

  &:focus {
    padding-top: ${SCALE * 2}px;
    background-image: url(${UI_BACKGROUND_IMAGE_URLS.inputActiveBg});
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
