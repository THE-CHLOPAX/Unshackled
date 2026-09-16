import * as THREE from 'three';

import { attackActions } from './actions';
import { Player } from '../../players/Player';
import { EntityAIOptions } from '../../EntityAI';
import { stateMachineSkeleton } from './stateMachineSkeleton';
import { AnimationClipNamesShared } from '../../../../../3D/types';
import { MODELS, DEFAULT_RIGID_BODY_OPTIONS } from '../../../../../3D/constants';

export const config: EntityAIOptions = {
  modelOptions: {
    id: MODELS.SKELETON.id,
    scale: new THREE.Vector3(0.012, 0.012, 0.012),
  },
  movementOptions: {
    speed: 2.5,
    sprintSpeed: 4,
    walkSpeed: 0.3,
  },
  rigidBodyOptions: {
    ...DEFAULT_RIGID_BODY_OPTIONS,
  },
  animationControllerOptions: {
    playbackRates: {
      [AnimationClipNamesShared.WALK]: 1.5,
      [AnimationClipNamesShared.RUN]: 1.5,
    },
    fadeOutDurations: {
      [AnimationClipNamesShared.IDLE]: 0.1,
    },
  },
  detectionRadius: 8,
  enemyTypes: [Player],
  roaming: {
    radius: 5,
    interval: {
      min: 3000,
      max: 7000,
    },
  },
  attack: {
    actions: attackActions,
  },
  healthOptions: {
    initialHealthPoints: 20,
  },
  stateMachine: stateMachineSkeleton,
};
