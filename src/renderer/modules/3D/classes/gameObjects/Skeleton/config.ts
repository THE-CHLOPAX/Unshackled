import * as THREE from 'three';

import { Player } from '3D/classes/gameObjects/Player/Player';
import { attackActions } from '3D/classes/gameObjects/Skeleton/actions';
import { EntityAIOptions } from '3D/classes/gameObjects/EntityAI/EntityAI';
import { MODELS, ANIMATION_CLIP_NAMES, DEFAULT_RIGID_BODY_OPTIONS } from '3D/constants';
import { stateMachineSkeleton } from '3D/classes/gameObjects/Skeleton/stateMachineSkeleton';

export const config: EntityAIOptions = {
  modelOptions: {
    id: MODELS.SKELETON.id,
    scale: new THREE.Vector3(0.012, 0.012, 0.012),
  },
  movementOptions: {
    defaultSpeed: 2.5,
    sprintSpeed: 4,
    walkSpeed: 0.3,
  },
  rigidBodyOptions: {
    ...DEFAULT_RIGID_BODY_OPTIONS,
    mass: 10,
  },
  animationControllerOptions: {
    playbackRates: {
      [ANIMATION_CLIP_NAMES.SKELETON.WALK]: 1.5,
      [ANIMATION_CLIP_NAMES.SKELETON.RUN]: 1.5,
    },
    fadeOutDurations: {
      [ANIMATION_CLIP_NAMES.SKELETON.IDLE]: 0.1,
    },
  },
  detectionRadius: 8,
  enemyTypes: [Player],
  attack: {
    actions: attackActions,
  },
  healthOptions: {
    maxHealthPoints: 20,
  },
  healthBarOptions: {
    offset: new THREE.Vector3(0, 1.5, 0),
  },
  stateMachine: stateMachineSkeleton,
};
