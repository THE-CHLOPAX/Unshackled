import { FMOD_EVENTS } from 'renderer/FMOD';
import { flashRed } from '3D/utils/flashRed';
import { deadStateNode } from '3D/classes/states/utils/deadStateNode';
import { getInputBasedStateNode } from '3D/classes/states/utils/getInputBasedStateNode';
import { ChainedAction, Interactable, PlayerActionType, StateMachine, StateNode } from '3D/types';
import {
  AimingState,
  AttackState,
  IdleState,
  InteractState,
  RunningState,
  SprintingState,
} from '3D/classes/states';

import { Player } from '../../Player';
import { punchRight } from '../actions';
import { Rock } from '../childObjects/Rock';
import { DashStateMonk } from './DashStateMonk';

const INTERACT_TRIGGER_DELAY_S = 0.4;

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
  onUpdate: ({ entity }) => {
    if (canSprint(entity)) {
      return null;
    }
    return resolveLocomotionNode(entity);
  },
};

const runningStateNode: StateNode<RunningState> = {
  state: (entity) => new RunningState(entity),
  onInput: ({ entity }) => {
    return getInputBasedStateNode(entity.inputSource.getControls(), [
      [PlayerActionType.ACTION_UP, () => aimingStateNode],
      [
        PlayerActionType.ACTION_LEFT,
        () => getAttackStateNode(punchRight),
        canAttack(entity, punchRight),
      ],
      [
        PlayerActionType.ACTION_RIGHT,
        () => dashingStateNode,
        !entity.cooldownController.isOnCooldown(DashStateMonk.COOLDOWN_ID),
      ],
      [PlayerActionType.SPRINT, () => resolveSprintingNode(entity)],
      [PlayerActionType.IDLE, () => idleStateNode],
    ]);
  },
};

const idleStateNode: StateNode<IdleState> = {
  state: (entity) => new IdleState(entity),
  onInput: ({ entity }) => {
    return getInputBasedStateNode(entity.inputSource.getControls(), [
      [PlayerActionType.ACTION_UP, () => aimingStateNode],
      [
        PlayerActionType.ACTION_LEFT,
        () => getAttackStateNode(punchRight),
        canAttack(entity, punchRight),
      ],
      [PlayerActionType.RUN, () => runningStateNode],
    ]);
  },
};

function getInteractStateNode(target: Interactable): StateNode<InteractState> {
  return {
    state: (entity) =>
      new InteractState(entity, target, { triggerDelayS: INTERACT_TRIGGER_DELAY_S }),
    onUpdate: ({ entity, currentState }) => {
      if (!currentState.isComplete) return null;

      return resolveLocomotionNode(entity);
    },
  };
}

function resolveLocomotionNode(entity: Player): StateNode {
  const newStateNode = getInputBasedStateNode(entity.inputSource.getControls(), [
    [PlayerActionType.SPRINT, () => resolveSprintingNode(entity)],
    [PlayerActionType.RUN, () => runningStateNode],
  ]);

  return newStateNode ?? idleStateNode;
}

function resolveSprintingNode(entity: Player): StateNode {
  entity.staminaPointsController.markShortTermDrainAttempt();
  return canSprint(entity) ? sprintingStateNode : runningStateNode;
}

function canSprint(entity: Player): boolean {
  return entity.staminaPointsController.shortTermStamina > 0;
}

function canAttack(entity: Player, action: ChainedAction): boolean {
  if (!action.staminaCost) return true;
  return entity.staminaPointsController.shortTermStamina >= action.staminaCost;
}

function getAttackStateNode(action: ChainedAction): StateNode<AttackState> {
  return {
    state: (entity) => new AttackState(entity, action),
    onInput: ({ entity, currentState }) => {
      const chain = currentState.chain;
      if (currentState.isChainWindowOpen && chain) {
        const controlsStates = entity.inputSource.getControls();
        if (controlsStates.some((controlState) => controlState.type === chain.requiredInput)) {
          if (!canAttack(entity, chain.next)) return null;
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
    entity.scene.camera.addShake(3);
    flashRed(entity);
    return null;
  },
  onDeath: ({ entity }) => {
    flashRed(entity);
    entity.fmodSoundController.playSound(FMOD_EVENTS.GENERIC_HIT);
    entity.scene.camera.addShake(3);
    return deadStateNode;
  },
  onInteract: ({ currentState, target }) => {
    const canInteract =
      currentState instanceof IdleState ||
      currentState instanceof RunningState ||
      currentState instanceof SprintingState;

    return canInteract ? getInteractStateNode(target) : null;
  },
};
