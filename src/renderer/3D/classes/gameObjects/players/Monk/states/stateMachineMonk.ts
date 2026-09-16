import { Input } from '@tgdf';

import { mapInputToControls } from '3D/utils/mapInputToControls';
import { ChainedAction, PlayerActionType, StateNode } from '3D/types';
import {
  AimingState,
  AttackState,
  IdleState,
  RunningState,
  SprintingState,
} from '3D/classes/states';

import { punchRight } from '../actions';
import { Rock } from '../childObjects/Rock';
import { DashStateMonk } from './DashStateMonk';

type StateTransition = [PlayerActionType, StateNode] | [PlayerActionType, StateNode, boolean];

function getInputBasedStateNode(transitions: StateTransition[]): StateNode | null {
  const controlsStates = mapInputToControls(Input.getState());
  for (const [actionType, newStateNode, additionalCondition] of transitions) {
    const additionalConditionResolved =
      additionalCondition === undefined || additionalCondition === true;
    if (
      controlsStates.some(
        (controlState) => controlState.type === actionType && additionalConditionResolved
      )
    ) {
      return newStateNode;
    }
  }
  return null;
}

function resolveLocomotionNode(): StateNode {
  const newStateNode = getInputBasedStateNode([
    [PlayerActionType.SPRINT, sprintingStateNode],
    [PlayerActionType.RUN, runningStateNode],
  ]);

  return newStateNode ?? idleStateNode;
}

function getAttackStateNode(action: ChainedAction): StateNode<AttackState> {
  return {
    state: (entity) => new AttackState(entity, action),
    onInput: ({ input, currentState }) => {
      const chain = currentState.chain;
      if (currentState.isChainWindowOpen && chain) {
        const controlsStates = mapInputToControls(input);
        if (controlsStates.some((controlState) => controlState.type === chain.requiredInput)) {
          return getAttackStateNode(chain.next);
        }
      }

      return null;
    },
    onUpdate: ({ currentState }) => {
      if (currentState.isBusy) return null;

      return resolveLocomotionNode();
    },
  };
}

const aimingStateNode: StateNode<AimingState> = {
  state: (entity) =>
    new AimingState(entity, {
      triggerInput: PlayerActionType.ACTION_UP,
      projectile: { ctor: Rock, maxRange: 8, speed: 18 },
    }),
  onUpdate: ({ currentState }) => {
    if (!currentState.isReadyToLeave) return null;

    return resolveLocomotionNode();
  },
};

const dashingStateNode: StateNode<DashStateMonk> = {
  state: (entity) => new DashStateMonk(entity, { speed: 12, durationMs: 150 }),
  onUpdate: ({ currentState }) => {
    if (!currentState.isComplete) return null;

    return resolveLocomotionNode();
  },
};

const sprintingStateNode: StateNode<SprintingState> = {
  state: (entity) => new SprintingState(entity),
  onInput: ({ entity }) => {
    return getInputBasedStateNode([
      [
        PlayerActionType.ACTION_RIGHT,
        dashingStateNode,
        !entity.cooldownController.isOnCooldown(DashStateMonk.COOLDOWN_ID),
      ],
      [PlayerActionType.RUN, runningStateNode],
      [PlayerActionType.IDLE, idleStateNode],
    ]);
  },
};

const runningStateNode: StateNode<RunningState> = {
  state: (entity) => new RunningState(entity),
  onInput: ({ entity }) => {
    return getInputBasedStateNode([
      [PlayerActionType.ACTION_UP, aimingStateNode],
      [PlayerActionType.ACTION_LEFT, getAttackStateNode(punchRight)],
      [
        PlayerActionType.ACTION_RIGHT,
        dashingStateNode,
        !entity.cooldownController.isOnCooldown(DashStateMonk.COOLDOWN_ID),
      ],
      [PlayerActionType.SPRINT, sprintingStateNode],
      [PlayerActionType.IDLE, idleStateNode],
    ]);
  },
};

const idleStateNode: StateNode<IdleState> = {
  state: (entity) => new IdleState(entity),
  onInput: () => {
    return getInputBasedStateNode([
      [PlayerActionType.ACTION_UP, aimingStateNode],
      [PlayerActionType.ACTION_LEFT, getAttackStateNode(punchRight)],
      [PlayerActionType.RUN, runningStateNode],
    ]);
  },
};

export const stateMachineMonk = idleStateNode;
