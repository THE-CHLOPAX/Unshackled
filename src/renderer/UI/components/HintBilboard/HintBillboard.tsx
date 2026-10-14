import type { ReactNode } from 'react';

import styled from 'styled-components';

import { COLORS } from 'renderer/constants';
import { getRadialGradient } from 'renderer/UI/utils/getBgRadialGradient';

import { Text } from '../Text/Text';
import { SmallPanel } from '../SmallPanel/SmallPanel';

export type HintBillboardHint = {
  icon: ReactNode;
  label: string;
};

export type HintBillboardProps = {
  title?: string;
  hints: HintBillboardHint[];
};

export const HintBillboard = ({ title, hints }: HintBillboardProps) => {
  return (
    <Wrapper>
      {title !== undefined && (
        <Text size="md" color={COLORS.FONT_COLOR_HIGHLIGHT}>
          - {title} -
        </Text>
      )}
      {hints.map(({ icon, label }) => (
        <HintRow key={label}>
          <HintSmallPanel scale={2}>
            {typeof icon === 'string' || typeof icon === 'number' ? (
              <Text color={COLORS.FONT_COLOR_HIGHLIGHT}>{icon}</Text>
            ) : (
              icon
            )}
          </HintSmallPanel>
          <Text size="md">{label}</Text>
        </HintRow>
      ))}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  gap: 6px;
  background: ${getRadialGradient(COLORS.BG_COLOR)};
  padding: 15px 30px;
`;

const HintRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 8px;
`;

const HintSmallPanel = styled(SmallPanel)`
  padding-left: 2px;
  padding-bottom: 2px;
  height: 28px;
`;
