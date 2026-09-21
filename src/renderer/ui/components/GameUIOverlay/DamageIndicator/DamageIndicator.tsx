import { useEffect, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';

import { COLORS } from 'renderer/constants';
import { GameEventsEmitter } from 'renderer/types';
import { hexStringToRgbaString } from 'renderer/ui/utils/hexStringToRgbaString';

const DAMAGE_FLASH_DURATION_MS = 400;

export type DamageIndicatorProps = {
  emitter: GameEventsEmitter;
};

let damageFlashIdCounter = 0;

export const DamageIndicator = ({ emitter }: DamageIndicatorProps) => {
  const [damageFlashes, setDamageFlashes] = useState<number[]>([]);
  const activeTimeouts = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(() => {
    return () => {
      activeTimeouts.current.forEach((timeoutId) => clearTimeout(timeoutId));
      activeTimeouts.current.clear();
    };
  }, []);

  useEffect(() => {
    const handleDamageTaken = () => {
      const id = damageFlashIdCounter++;
      setDamageFlashes((current) => [...current, id]);

      const timeoutId = setTimeout(() => {
        activeTimeouts.current.delete(timeoutId);
        setDamageFlashes((current) => current.filter((flashId) => flashId !== id));
      }, DAMAGE_FLASH_DURATION_MS);
      activeTimeouts.current.add(timeoutId);
    };

    emitter.on('player-damage-taken', handleDamageTaken);
    return () => emitter.off('player-damage-taken', handleDamageTaken);
  }, [emitter]);

  return (
    <>
      {damageFlashes.map((id) => (
        <StyledDamageIndicator key={id} />
      ))}
    </>
  );
};

const damageFlash = keyframes`
  0% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
`;

const StyledDamageIndicator = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 125%;
  height: 100%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  background: radial-gradient(
    circle,
    ${hexStringToRgbaString(COLORS.RED, 0)} 50%,
    ${hexStringToRgbaString(COLORS.RED, 0.5)} 80%,
    ${hexStringToRgbaString(COLORS.RED, 0.8)} 100%
  );
  animation: ${damageFlash} ${DAMAGE_FLASH_DURATION_MS}ms ease-out;
`;
