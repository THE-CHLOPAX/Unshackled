import styled from 'styled-components';

import { GameEventsEmitter, PlayerStatistics } from 'renderer/types';

import { PlayerStats } from './PlayerStats/PlayerStats';
import { GameOverModal } from './GameOverModal/GameOverModal';
import { DamageIndicator } from './DamageIndicator/DamageIndicator';

export type GameUIOverlayProps = {
  emitter: GameEventsEmitter;
  playerStatistics?: PlayerStatistics | null;
};

export const GameUIOverlay = ({ emitter, playerStatistics }: GameUIOverlayProps) => {
  return (
    <Wrapper>
      {playerStatistics && <PlayerStats {...playerStatistics} />}
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
