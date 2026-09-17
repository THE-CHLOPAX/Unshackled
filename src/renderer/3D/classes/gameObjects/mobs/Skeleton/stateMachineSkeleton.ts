import { AIRoamingOptions, StateNode } from '3D/types';
import { shouldChase } from '3D/classes/states/utils/shouldChase';
import { shouldAttack } from '3D/classes/states/utils/shouldAttack';
import {
  AIIdleStateRoaming,
  AIRoamingState,
  AIChasingState,
  AIAttackState,
} from '3D/classes/states';

const ROAMING_OPTIONS: AIRoamingOptions = {
  radius: 5,
  interval: {
    min: 3000,
    max: 7000,
  },
};

const aiAttackStateNode: StateNode<AIAttackState> = {
  state: (entity) => new AIAttackState(entity),
  onUpdate: ({ entity, currentState }) => {
    if (currentState.isAttacking) return null;

    if (!currentState.bestAttack) return aiIdleStateNode;
    if (shouldChase(entity, currentState.bestAttack)) return aiChasingStateNode;

    return null;
  },
};

const aiChasingStateNode: StateNode<AIChasingState> = {
  state: (entity) => new AIChasingState(entity),
  onUpdate: ({ entity, currentState }) => {
    if (!currentState.bestAttack) return aiIdleStateNode;
    if (shouldAttack(entity, currentState.bestAttack)) return aiAttackStateNode;
    if (currentState.hasPathfindingFailed) return aiIdleStateNode;

    return null;
  },
};

const aiRoamingStateNode: StateNode<AIRoamingState> = {
  state: (entity) => new AIRoamingState(entity, ROAMING_OPTIONS),
  onUpdate: ({ entity, currentState }) => {
    if (currentState.bestAttack) {
      if (shouldChase(entity, currentState.bestAttack)) return aiChasingStateNode;
      if (shouldAttack(entity, currentState.bestAttack)) return aiAttackStateNode;
    }

    if (currentState.shouldTransitionToIdle) return aiIdleStateNode;

    return null;
  },
};

export const aiIdleStateNode: StateNode<AIIdleStateRoaming> = {
  state: (entity) => new AIIdleStateRoaming(entity, ROAMING_OPTIONS),
  onUpdate: ({ entity, currentState }) => {
    if (currentState.bestAttack) {
      if (shouldChase(entity, currentState.bestAttack)) return aiChasingStateNode;
      if (shouldAttack(entity, currentState.bestAttack)) return aiAttackStateNode;
    }

    if (currentState.shouldTransitionToRoaming) return aiRoamingStateNode;

    return null;
  },
};

export const stateMachineSkeleton = aiIdleStateNode;
