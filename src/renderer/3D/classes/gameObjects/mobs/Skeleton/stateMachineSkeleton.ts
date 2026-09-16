import { StateNode } from '3D/types';
import { shouldChase } from '3D/classes/states/utils/shouldChase';
import { shouldAttack } from '3D/classes/states/utils/shouldAttack';
import { AIIdleState, AIRoamingState, AIChasingState, AIAttackState } from '3D/classes/states';

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
  state: (entity) => new AIRoamingState(entity),
  onUpdate: ({ entity, currentState }) => {
    if (currentState.bestAttack) {
      if (shouldChase(entity, currentState.bestAttack)) return aiChasingStateNode;
      if (shouldAttack(entity, currentState.bestAttack)) return aiAttackStateNode;
    }

    if (currentState.shouldTransitionToIdle) return aiIdleStateNode;

    return null;
  },
};

export const aiIdleStateNode: StateNode<AIIdleState> = {
  state: (entity) => new AIIdleState(entity),
  onUpdate: ({ entity, currentState }) => {
    if (currentState.bestAttack) {
      if (shouldChase(entity, currentState.bestAttack)) return aiChasingStateNode;
      if (shouldAttack(entity, currentState.bestAttack)) return aiAttackStateNode;
    }

    if (currentState.shouldTransitionToRoaming && entity.roaming) return aiRoamingStateNode;

    return null;
  },
};

export const stateMachineSkeleton = aiIdleStateNode;
