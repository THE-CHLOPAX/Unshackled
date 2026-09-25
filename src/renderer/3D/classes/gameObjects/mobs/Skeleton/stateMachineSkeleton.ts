import { FMOD_EVENTS } from 'renderer/FMOD';
import { flashRed } from '3D/utils/flashRed';
import { shouldChase } from '3D/classes/states/utils/shouldChase';
import { shouldAttack } from '3D/classes/states/utils/shouldAttack';
import { AIRoamingOptions, StateMachine, StateNode } from '3D/types';
import { deadStateNode } from '3D/classes/states/utils/deadStateNode';
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
  state: (entity) =>
    new AIChasingState(entity, { footstepEventPath: FMOD_EVENTS.SKELETON_FOOTSTEP }),
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

export const stateMachineSkeleton: StateMachine = {
  initialNode: aiIdleStateNode,
  onDamage: ({ entity }) => {
    entity.fmodSoundController.playSound(FMOD_EVENTS.GENERIC_HIT);
    flashRed(entity);
    return null;
  },
  onDeath: ({ entity }) => {
    flashRed(entity);
    entity.fmodSoundController.playSound(FMOD_EVENTS.GENERIC_HIT);
    entity.fmodSoundController.playSound(FMOD_EVENTS.SKELETON_ATTACK, { volume: 0.5 });
    return deadStateNode;
  },
};
