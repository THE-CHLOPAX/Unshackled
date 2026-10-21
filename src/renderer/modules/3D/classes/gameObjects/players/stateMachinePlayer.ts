import type { Player } from '3D/classes/gameObjects/players/Player';

import { FMOD_EVENTS } from 'FMOD';
import { flashRed } from '3D/utils/flashRed';
import { PlayerActionType } from 'renderer/types';
import { ANIMATION_CLIP_NAMES } from '3D/constants';
import { RollState } from '3D/classes/states/Player/RollState';
import { punchRight } from '3D/classes/gameObjects/players/actions';
import { Rock } from '3D/classes/gameObjects/players/childObjects/Rock';
import { ChainedAction, Interactable, StateMachine, StateNode } from '3D/types';
import { getInputBasedStateNode } from '3D/classes/states/utils/getInputBasedStateNode';
import {
  AimingState,
  AttackState,
  //DashState,
  DeadState,
  IdleState,
  InteractState,
  RunningState,
  SprintingState,
} from '3D/classes/states';

const INTERACT_TRIGGER_DELAY_S = 0.4;

const deadStateNode: StateNode<DeadState> = {
  state: (entity) => new DeadState(entity, ANIMATION_CLIP_NAMES.PLAYER.FALL),
};

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

/* const dashingStateNode: StateNode<DashState> = {
  state: (entity) => new DashState(entity, { speed: 12, durationMs: 150 }),
  onUpdate: ({ entity, currentState }) => {
    if (!currentState.isComplete) return null;

    return resolveLocomotionNode(entity);
  },
}; */

const rollingStateNode: StateNode<RollState> = {
  state: (entity) => new RollState(entity),
  onUpdate: ({ entity, currentState }) => {
    if (!currentState.isComplete) return null;

    return resolveLocomotionNode(entity);
  },
};

const sprintingStateNode: StateNode<SprintingState> = {
  state: (entity) => new SprintingState(entity),
  onInput: ({ entity }) => {
    return getInputBasedStateNode(entity.inputSource.getControls(), [
      [PlayerActionType.ACTION_RIGHT, () => rollingStateNode, canRoll(entity)],
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
      [PlayerActionType.ACTION_RIGHT, () => rollingStateNode, canRoll(entity)],
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
      [PlayerActionType.ACTION_RIGHT, () => rollingStateNode, canRoll(entity)],
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

function canRoll(entity: Player): boolean {
  return (
    entity.staminaPointsController.shortTermStamina >= RollState.STAMINA_COST &&
    !entity.cooldownController.isOnCooldown(RollState.COOLDOWN_ID)
  );
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

export const stateMachinePlayer: StateMachine = {
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
