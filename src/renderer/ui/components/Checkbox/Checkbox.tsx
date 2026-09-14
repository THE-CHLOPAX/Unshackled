import styled from 'styled-components';

import { Text } from '../Text/Text';
import { SmallPanel } from '../SmallPanel/SmallPanel';

export type CheckboxProps = {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
};

export const Checkbox = ({ checked, onChange, disabled = false, className }: CheckboxProps) => {
  return (
    <Wrapper
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      className={className}
      onClick={() => onChange?.(!checked)}
    >
      <SmallPanel active={checked}>{checked && <Text size="sm">X</Text>}</SmallPanel>
    </Wrapper>
  );
};

const Wrapper = styled.button`
  display: inline-flex;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed !important;
  }
`;
