import styled, { keyframes } from 'styled-components';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Text } from 'UI';
import { COLORS } from 'renderer/constants';
import { Entity } from '3D/classes/gameObjects/Entity';
import { formatNameBillboard } from 'renderer/UI/utils/formatNameBillboard';

import { BarAnimated } from '../BarAnimated/BarAnimated';
import { useRecentProgressChange } from '../BarAnimated/useRecentProgressChange';

const FLOATING_NUMBER_DURATION_MS = 1000;
const DAMAGE_THRESHOLDS = {
  CRITICAL: 0.25,
  STRONG: 0.1,
};

export type HealthBarProps = {
  entity: Entity;
  progress: number;
  initialProgress?: number;
  name?: string;
};

type FloatingNumber = {
  id: number;
  text: string;
  color: string;
  offsetX: number;
  offsetY: number;
};

let floatingNumberIdCounter = 0;

export const HealthBar = ({
  entity,
  progress,
  initialProgress = progress,
  name,
}: HealthBarProps) => {
  const [floatingNumbers, setFloatingNumbers] = useState<FloatingNumber[]>([]);
  const activeTimeouts = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const { recentChange, recentChangeFading, lastChange } = useRecentProgressChange(progress, {
    initialProgress,
  });

  const displayedName = useMemo(() => {
    if (!name && !entity.name) return '';
    return formatNameBillboard(name ?? entity.name);
  }, [name, entity.name]);

  useEffect(() => {
    return () => {
      activeTimeouts.current.forEach((timeoutId) => clearTimeout(timeoutId));
      activeTimeouts.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!lastChange) return;

    const isHeal = lastChange.delta < 0;
    const { maxHealthPoints } = entity.healthPointsController;
    const amount = Math.round(Math.abs(lastChange.delta) * maxHealthPoints);
    if (amount === 0) return;

    const id = floatingNumberIdCounter++;

    setFloatingNumbers((current) => [
      ...current,
      {
        id,
        text: `${amount}`,
        color: isHeal ? COLORS.GREEN : getDamageIndicatorColor(amount, maxHealthPoints),
        offsetX: (Math.random() - 0.5) * 30,
        offsetY: (Math.random() - 0.5) * 10 - 15,
      },
    ]);

    const timeoutId = setTimeout(() => {
      activeTimeouts.current.delete(timeoutId);
      setFloatingNumbers((current) => current.filter((entry) => entry.id !== id));
    }, FLOATING_NUMBER_DURATION_MS);
    activeTimeouts.current.add(timeoutId);
  }, [lastChange, entity]);

  return (
    <Wrapper>
      <Text>{displayedName}</Text>
      <BarAnimated
        fillColor={COLORS.RED}
        progress={progress}
        recentChange={recentChange}
        recentChangeFading={recentChangeFading}
        short
        scale={1.5}
      />
      {floatingNumbers.map((floatingNumber) => (
        <FloatingText
          key={floatingNumber.id}
          size="lg"
          $offsetX={floatingNumber.offsetX}
          $offsetY={floatingNumber.offsetY}
          color={floatingNumber.color}
          nowrap
        >
          {floatingNumber.text}
        </FloatingText>
      ))}
    </Wrapper>
  );
};

function getDamageIndicatorColor(amount: number, maxHealthPoints: number): string {
  const percentage = amount / maxHealthPoints;
  switch (true) {
    case percentage >= DAMAGE_THRESHOLDS.CRITICAL:
      return COLORS.RED_LIGHT;
    case percentage >= DAMAGE_THRESHOLDS.STRONG:
      return COLORS.SOFT_FAWN;
    default:
      return COLORS.FONT_COLOR_PRIMARY;
  }
}

const Wrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
`;

const floatUp = keyframes`
  0% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateY(-24px) scale(0.5);
    opacity: 0;
  }
`;

const FloatingText = styled(Text)<{ $offsetX: number; $offsetY: number }>`
  position: absolute;
  top: ${({ $offsetY }) => $offsetY}px;
  left: 50%;
  margin-left: ${({ $offsetX }) => $offsetX}px;
  pointer-events: none;
  animation: ${floatUp} ${FLOATING_NUMBER_DURATION_MS}ms ease-out forwards;
`;
