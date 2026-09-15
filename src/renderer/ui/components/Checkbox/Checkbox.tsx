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
      <SmallPanel active={checked}>{checked && <Mark size="lg">x</Mark>}</SmallPanel>
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

// Text's line-height (0.8, tuned for multi-line pixel-font body copy) still
// leaves the "x" glyph itself off-center within its own line box, so this
// centers the glyph's actual ink — not its line box — dead center in
// SmallPanel regardless of font metrics.
const Mark = styled(Text)`
  display: block;
  width: 14px;
  height: 19px;
  position: absolute;
  top: 50%;
  left: 50%;
  line-height: 1;
  transform: translate(-50%, -50%);
`;
