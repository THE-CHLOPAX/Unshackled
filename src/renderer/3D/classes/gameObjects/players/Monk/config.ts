import * as THREE from 'three';

import { MODELS, DEFAULT_RIGID_BODY_OPTIONS } from '3D/constants';

import { PlayerOptions } from '../Player';
import { stateMachineMonk } from './states/stateMachineMonk';

export const config: PlayerOptions = {
  modelOptions: {
    id: MODELS.MONK.id,
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
    },
  },
  healthOptions: {
    initialHealthPoints: 100,
  },
  stateMachine: stateMachineMonk,
};
