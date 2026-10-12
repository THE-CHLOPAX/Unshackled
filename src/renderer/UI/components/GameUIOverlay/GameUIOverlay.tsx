import styled from 'styled-components';

import { GameEventsEmitter, PlayerStatistics } from 'renderer/types';
import { ProgressTrackerObjective } from '3D/classes/scenes/GameScene/ProgressTracker/ProgressTracker';

import { PlayerStats } from './PlayerStats/PlayerStats';
import { GameOverModal } from './GameOverModal/GameOverModal';
import { ObjectivesPanel } from './ObjectivesPanel/ObjectivesPanel';
import { DamageIndicator } from './DamageIndicator/DamageIndicator';

export type GameUIOverlayProps = {
  emitter: GameEventsEmitter;
  playerStatistics?: PlayerStatistics | null;
  objectiveType?: ProgressTrackerObjective['type'];
};

export const GameUIOverlay = ({ emitter, playerStatistics, objectiveType }: GameUIOverlayProps) => {
  return (
    <Wrapper>
      {objectiveType && (
        <ObjectivesWrapper>
          <ObjectivesPanel objectiveType={objectiveType} />
        </ObjectivesWrapper>
      )}
      {playerStatistics && (
        <PlayerStatsWrapper>
          <PlayerStats {...playerStatistics} />
        </PlayerStatsWrapper>
      )}
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

const ObjectivesWrapper = styled.div`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  left: 22px;
  z-index: 1;
`;

const PlayerStatsWrapper = styled.div`
  position: absolute;
  bottom: 22px;
  left: 22px;
  z-index: 1;
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
