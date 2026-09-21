import styled from 'styled-components';

import { GameEventsEmitter } from 'renderer/types';

import { GameOverModal } from './GameOverModal/GameOverModal';
import { DamageIndicator } from './DamageIndicator/DamageIndicator';

export type GameUIOverlayProps = {
  emitter: GameEventsEmitter;
};

export const GameUIOverlay = ({ emitter }: GameUIOverlayProps) => {
  return (
    <Wrapper>
      <Vignette />
      <DamageIndicator emitter={emitter} />
      <GameOverModal emitter={emitter} />
    </Wrapper>
  );
};

const Wrapper = styled.div`
  position: relative;
  width: 100vw;
  height: 100vh;
`;

const Vignette = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 125%;
  height: 100%;
  transform: translate(-50%, -50%);
  background: radial-gradient(
    circle,
    rgba(0, 0, 0, 0) 50%,
    rgba(0, 0, 0, 0.3) 80%,
    rgba(0, 0, 0, 0.8) 100%
  );
`;
