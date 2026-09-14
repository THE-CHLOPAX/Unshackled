import type { ChangeEvent } from 'react';

import styled from 'styled-components';

import { COLORS } from '../../../constants';
import { UI_BACKGROUND_IMAGE_URLS } from '../../constants';

const SCALE = 3;

const NATIVE_WIDTH = 57;
const ACTIVE_HEIGHT = 16;
const INACTIVE_HEIGHT = 14;
const SPIKE_HEIGHT = ACTIVE_HEIGHT - INACTIVE_HEIGHT;

export type TextInputProps = {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export const TextInput = ({
  value,
  onChange,
  placeholder,
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
    />
  );
};

const Input = styled.input`
  box-sizing: border-box;
  min-width: ${NATIVE_WIDTH * SCALE}px;
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
  font-size: 12px;
  color: ${COLORS.FONT_COLOR_PRIMARY};

  &::placeholder {
    color: ${COLORS.FONT_COLOR_DIMMED};
  }

  &:focus {
    padding-top: 0;
    background-image: url(${UI_BACKGROUND_IMAGE_URLS.inputActiveBg});
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
