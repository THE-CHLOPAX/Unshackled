import type { ReactNode } from 'react';

import styled from 'styled-components';

import { SmallPanel } from '../SmallPanel/SmallPanel';

export type ButtonIconProps = {
  icon: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
};

// Same interaction model as Button (SmallPanel inactive by default, active on
// hover, opacity drop when disabled) but renders an icon instead of a label.
export const ButtonIcon = ({ icon, onClick, disabled = false, className }: ButtonIconProps) => {
  return (
    <Wrapper type="button" disabled={disabled} onClick={onClick} className={className}>
      <SmallPanel activateOnHover={!disabled}>{icon}</SmallPanel>
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
