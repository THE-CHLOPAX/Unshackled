import * as THREE from 'three';

import { PlayerActionType } from '3D/types';
import { MODELS, DEFAULT_RIGID_BODY_OPTIONS } from '3D/constants';

import { Player, PlayerOptions } from '../Player';
import { healingAura, dash, punchRight } from './actions';
import { AttackState, RunningState } from '../../../states';

export const config: PlayerOptions = {
  modelOptions: {
    id: MODELS.MONK.id,
  },
  movementOptions: {
    speed: 2.3,
    sprintSpeed: 4,
    walkSpeed: 1,
  },
  rigidBodyOptions: { ...DEFAULT_RIGID_BODY_OPTIONS, colliderSize: new THREE.Vector3(1, 2, 1) },
  animationControllerOptions: {
    playbackRates: {
      spawn: 2.5,
      kick: 1.5,
      hit: 1.8,
      run: 0.9,
    },
  },
  healthOptions: {
    initialHealthPoints: 100,
  },
  sequenceSkills: [healingAura, dash],
  sequenceTimeoutMs: 500,
  actions: {
    [PlayerActionType.ACTION_UP]: (entity: Player) => {
      return new AttackState(entity, punchRight);
    },
    [PlayerActionType.RUN]: (entity: Player) => {
      return new RunningState(entity);
    },
  },
};
