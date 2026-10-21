import type { PlayerConfig } from '3D/classes/gameObjects/players/Player';

import * as THREE from 'three';

import { MODELS, DEFAULT_RIGID_BODY_OPTIONS } from '3D/constants';
import { stateMachinePlayer } from '3D/classes/gameObjects/players/stateMachinePlayer';

export const playerConfig: PlayerConfig = {
  modelOptions: {
    id: MODELS.PLAYER.id,
    scale: new THREE.Vector3(1.4, 1.4, 1.4),
  },
  movementOptions: {
    defaultSpeed: 2.3,
    sprintSpeed: 4,
    walkSpeed: 1,
  },
  rigidBodyOptions: { ...DEFAULT_RIGID_BODY_OPTIONS },
  healthOptions: {
    maxHealthPoints: 100,
  },
  staminaOptions: {
    maxLongTermStamina: 300,
    maxShortTermStamina: 25,
  },
  stateMachine: stateMachinePlayer,
};
