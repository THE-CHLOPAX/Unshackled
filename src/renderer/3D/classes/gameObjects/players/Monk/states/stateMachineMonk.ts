import { FMOD_EVENTS } from 'renderer/FMOD';
import { flashRed } from '3D/utils/flashRed';
import { deadStateNode } from '3D/classes/states/utils/deadStateNode';
import { ChainedAction, PlayerActionType, StateMachine, StateNode } from '3D/types';
import { getInputBasedStateNode } from '3D/classes/states/utils/getInputBasedStateNode';
import {
  AimingState,
  AttackState,
  IdleState,
  RunningState,
  SprintingState,
} from '3D/classes/states';

import { Player } from '../../Player';
import { punchRight } from '../actions';
import { Rock } from '../childObjects/Rock';
import { DashStateMonk } from './DashStateMonk';

const aimingStateNode: StateNode<AimingState> = {
  state: (entity) =>
    new AimingState(entity, {
      triggerInput: PlayerActionType.ACTION_UP,
      projectile: { ctor: Rock, maxRange: 8, speed: 18 },
    }),
  onUpdate: ({ entity, currentState }) => {
    if (!currentState.isReadyToLeave) return null;

    return resolveLocomotionNode(entity);
  },
};

const dashingStateNode: StateNode<DashStateMonk> = {
  state: (entity) => new DashStateMonk(entity, { speed: 12, durationMs: 150 }),
  onUpdate: ({ entity, currentState }) => {
    if (!currentState.isComplete) return null;

    return resolveLocomotionNode(entity);
  },
};

const sprintingStateNode: StateNode<SprintingState> = {
  state: (entity) => new SprintingState(entity),
  onInput: ({ entity }) => {
    return getInputBasedStateNode(entity.inputSource.getControls(), [
      [
        PlayerActionType.ACTION_RIGHT,
        () => dashingStateNode,
        !entity.cooldownController.isOnCooldown(DashStateMonk.COOLDOWN_ID),
      ],
      [PlayerActionType.RUN, () => runningStateNode],
      [PlayerActionType.IDLE, () => idleStateNode],
    ]);
  },
};

const runningStateNode: StateNode<RunningState> = {
  state: (entity) => new RunningState(entity),
  onInput: ({ entity }) => {
    return getInputBasedStateNode(entity.inputSource.getControls(), [
      [PlayerActionType.ACTION_UP, () => aimingStateNode],
      [PlayerActionType.ACTION_LEFT, () => getAttackStateNode(punchRight)],
      [
        PlayerActionType.ACTION_RIGHT,
        () => dashingStateNode,
        !entity.cooldownController.isOnCooldown(DashStateMonk.COOLDOWN_ID),
      ],
      [PlayerActionType.SPRINT, () => sprintingStateNode],
      [PlayerActionType.IDLE, () => idleStateNode],
    ]);
  },
};

const idleStateNode: StateNode<IdleState> = {
  state: (entity) => new IdleState(entity),
  onInput: ({ entity }) => {
    return getInputBasedStateNode(entity.inputSource.getControls(), [
      [PlayerActionType.ACTION_UP, () => aimingStateNode],
      [PlayerActionType.ACTION_LEFT, () => getAttackStateNode(punchRight)],
      [PlayerActionType.RUN, () => runningStateNode],
    ]);
  },
};

function resolveLocomotionNode(entity: Player): StateNode {
  const newStateNode = getInputBasedStateNode(entity.inputSource.getControls(), [
    [PlayerActionType.SPRINT, () => sprintingStateNode],
    [PlayerActionType.RUN, () => runningStateNode],
  ]);

  return newStateNode ?? idleStateNode;
}

function getAttackStateNode(action: ChainedAction): StateNode<AttackState> {
  return {
    state: (entity) => new AttackState(entity, action),
    onInput: ({ entity, currentState }) => {
      const chain = currentState.chain;
      if (currentState.isChainWindowOpen && chain) {
        const controlsStates = entity.inputSource.getControls();
        if (controlsStates.some((controlState) => controlState.type === chain.requiredInput)) {
          return getAttackStateNode(chain.next);
        }
      }

      return null;
    },
    onUpdate: ({ entity, currentState }) => {
      if (currentState.isBusy) return null;

      return resolveLocomotionNode(entity);
    },
  };
}

export const stateMachineMonk: StateMachine = {
  initialNode: idleStateNode,
  onDamage: ({ entity }) => {
    entity.fmodSoundController.playSound(FMOD_EVENTS.GENERIC_HIT);
    entity.scene.camera.addShake(0.5);
    flashRed(entity);
    return null;
  },
  onDeath: ({ entity }) => {
    flashRed(entity);
    entity.fmodSoundController.playSound(FMOD_EVENTS.GENERIC_HIT);
    entity.scene.camera.addShake(3);
    return deadStateNode;
  },
};
