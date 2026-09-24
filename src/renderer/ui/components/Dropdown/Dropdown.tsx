import { useRef, useState } from 'react';
import { styled } from 'styled-components';
import { useKeyPress, useClickOutside, KEYBOARD_MAPPINGS } from '@tgdf';

import { Text } from '../Text/Text';
import { COLORS } from '../../../constants';
import { UI_BACKGROUND_IMAGE_URLS } from '../../constants';

const { dropdownActiveBg, dropdownInactiveBg } = UI_BACKGROUND_IMAGE_URLS;

const SCALE = 3;

const NATIVE_WIDTH = 57;
const ACTIVE_HEIGHT = 16;
const INACTIVE_HEIGHT = 14;
const SPIKE_HEIGHT = ACTIVE_HEIGHT - INACTIVE_HEIGHT;
const LABEL_OFFSET = 17;
const OPTION_ROW_HEIGHT = 12;

export type DropdownOption = {
  label: string;
  value: string;
};

export type DropdownProps = {
  options: DropdownOption[];
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
};

export const Dropdown = ({
  options,
  value,
  placeholder = 'Select...',
  onChange,
  disabled = false,
}: DropdownProps) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useKeyPress(KEYBOARD_MAPPINGS.Escape, () => setOpen(false));
  useClickOutside(containerRef, () => setOpen(false), open);

  const selectedOption = options.find((option) => option.value === value);

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue);
    setOpen(false);
  };

  return (
    <Container ref={containerRef}>
      <Trigger
        type="button"
        disabled={disabled}
        $open={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <Text color={selectedOption ? COLORS.FONT_COLOR_PRIMARY : COLORS.FONT_COLOR_DIMMED}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
      </Trigger>

      {open && !disabled && (
        <OptionsPanel $rows={options.length}>
          {options.map((option) => (
            <Option
              key={option.value}
              type="button"
              $selected={option.value === value}
              onClick={() => handleSelect(option.value)}
            >
              <Text>{option.label}</Text>
            </Option>
          ))}
        </OptionsPanel>
      )}
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  display: inline-block;
`;

const Trigger = styled.button<{ $open: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  background: none;
  border: none;
  padding: 0;
  padding-top: ${SPIKE_HEIGHT * SCALE}px;
  padding-left: ${LABEL_OFFSET * SCALE}px;
  width: ${NATIVE_WIDTH * SCALE}px;
  height: ${ACTIVE_HEIGHT * SCALE}px;
  background-image: url(${({ $open }) => ($open ? dropdownActiveBg : dropdownInactiveBg)});
  background-repeat: no-repeat;
  background-position: bottom center;
  background-size: 100% auto;
  image-rendering: pixelated;
  cursor: pointer;

  &:hover:not(:disabled) {
    background-image: url(${dropdownActiveBg});
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed !important;
  }
`;

const OptionsPanel = styled.div<{ $rows: number }>`
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background: ${COLORS.BG_COLOR};
  height: ${({ $rows }) => $rows * OPTION_ROW_HEIGHT * SCALE}px;
  border: ${1 * SCALE}px solid ${COLORS.FONT_COLOR_DIMMED};
  z-index: 10;
`;

const Option = styled.button<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  width: 100%;
  height: ${OPTION_ROW_HEIGHT * SCALE}px;
  padding-left: ${LABEL_OFFSET * SCALE}px;
  background: ${({ $selected }) => ($selected ? COLORS.BG_COLOR_HIGHLIGHTED : 'transparent')};
  border: none;
  cursor: pointer;

  &:hover {
    background-color: ${COLORS.BG_COLOR_HIGHLIGHTED};
  }
`;
