import type { PlayerConfig } from './Player';

import * as THREE from 'three';

import { MODELS, DEFAULT_RIGID_BODY_OPTIONS } from '3D/constants';

import { stateMachinePlayer } from './stateMachinePlayer';

export const playerConfig: PlayerConfig = {
  modelOptions: {
    id: MODELS.PLAYER.id,
  },
  movementOptions: {
    defaultSpeed: 2.3,
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
      interact: 2.5,
    },
  },
  healthOptions: {
    maxHealthPoints: 100,
  },
  staminaOptions: {
    maxLongTermStamina: 300,
    maxShortTermStamina: 25,
  },
  stateMachine: stateMachinePlayer,
};
