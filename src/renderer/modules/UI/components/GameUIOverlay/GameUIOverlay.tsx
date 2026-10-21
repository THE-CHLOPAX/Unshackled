import styled from 'styled-components';

import { GameEventsEmitter } from 'renderer/types';
import { Player } from '3D/classes/gameObjects/players/Player';
import { PlayerStats } from 'UI/components/GameUIOverlay/PlayerStats/PlayerStats';
import { ObjectivesPanel } from 'UI/components/GameUIOverlay/ObjectivesPanel/ObjectivesPanel';
import { DamageIndicator } from 'UI/components/GameUIOverlay/DamageIndicator/DamageIndicator';
import { ProgressTrackerObjective } from '3D/classes/scenes/GameScene/ProgressTracker/ProgressTracker';

export type GameUIOverlayProps = {
  emitter: GameEventsEmitter;
  player?: Player;
  objectiveType?: ProgressTrackerObjective['type'];
  isGameOver: boolean;
};

export const GameUIOverlay = ({
  emitter,
  player,
  objectiveType,
  isGameOver,
}: GameUIOverlayProps) => {
  return (
    <Wrapper>
      {!isGameOver && objectiveType && (
        <ObjectivesWrapper>
          <ObjectivesPanel objectiveType={objectiveType} />
        </ObjectivesWrapper>
      )}
      {!isGameOver && player && (
        <PlayerStatsWrapper>
          <PlayerStats player={player} />
        </PlayerStatsWrapper>
      )}
      <Vignette />
      <DamageIndicator emitter={emitter} />
    </Wrapper>
  );
};

const Wrapper = styled.div`
  position: absolute;
  inset: 0;
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
