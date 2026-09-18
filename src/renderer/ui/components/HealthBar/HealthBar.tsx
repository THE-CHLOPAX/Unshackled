import { useEffect, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';

import { BarSimple, Text } from 'UI';
import { COLORS } from 'renderer/constants';
import { Entity } from '3D/classes/gameObjects/Entity';

const FLOATING_NUMBER_DURATION_MS = 1000;
const MINIMAL_PROGRESS = 0.01;
const DAMAGE_THRESHOLDS = {
  CRITICAL: 0.25,
  STRONG: 0.1,
};

export type HealthBarProps = {
  entity: Entity;
  progress: number;
  progressDelta: number;
  progressDeltaAccumulated: number;
  fadeOutEnabled?: boolean;
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
  progressDelta,
  progressDeltaAccumulated,
  fadeOutEnabled = false,
}: HealthBarProps) => {
  const [floatingNumbers, setFloatingNumbers] = useState<FloatingNumber[]>([]);
  const activeTimeouts = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(() => {
    return () => {
      activeTimeouts.current.forEach((timeoutId) => clearTimeout(timeoutId));
      activeTimeouts.current.clear();
    };
  }, []);

  useEffect(() => {
    if (progressDelta === 0) return;

    const isHeal = progressDelta < 0;
    const { initialHealthPoints } = entity.healthPointsController;
    const amount = Math.round(Math.abs(progressDelta) * initialHealthPoints);
    if (amount === 0) return;

    const id = floatingNumberIdCounter++;

    setFloatingNumbers((current) => [
      ...current,
      {
        id,
        text: `${amount}`,
        color: isHeal ? COLORS.GREEN : getDamageIndicatorColor(amount, initialHealthPoints),
        offsetX: (Math.random() - 0.5) * 30,
        offsetY: (Math.random() - 0.5) * 10 - 15,
      },
    ]);

    const timeoutId = setTimeout(() => {
      activeTimeouts.current.delete(timeoutId);
      setFloatingNumbers((current) => current.filter((entry) => entry.id !== id));
    }, FLOATING_NUMBER_DURATION_MS);
    activeTimeouts.current.add(timeoutId);
  }, [progressDelta, entity]);

  return (
    <Wrapper>
      <Text>{entity.name}</Text>
      <StyledBarSimple
        fillColor={COLORS.RED}
        progress={getClampedProgress(progress)}
        $fadeOutEnabled={fadeOutEnabled}
        $progressDeltaAccumulated={progressDeltaAccumulated}
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

function getClampedProgress(progress: number): number {
  return Math.max(MINIMAL_PROGRESS, progress);
}

function getDamageIndicatorColor(amount: number, initialHealthPoints: number): string {
  const percentage = amount / initialHealthPoints;
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

const StyledBarSimple = styled(BarSimple)<{
  progress: number;
  $fadeOutEnabled: boolean;
  $progressDeltaAccumulated: number;
}>`
  .bar-simple-fill {
    transition: ${({ $progressDeltaAccumulated }) =>
      `width ${$progressDeltaAccumulated < 0 ? 0.5 : 0}s`};

    &:after {
      content: '';
      display: block;
      position: absolute;
      top: 0;
      right: 0;
      transform: translateX(100%) scaleY(2);
      height: 100%;
      transition: ${({ $fadeOutEnabled }) => `width ${$fadeOutEnabled ? 0.5 : 0}s`};
      width: ${({ progress, $progressDeltaAccumulated }) =>
        `${(100 * $progressDeltaAccumulated) / getClampedProgress(progress)}%`};
      background: ${COLORS.GOLDEN};
    }
  }
`;
