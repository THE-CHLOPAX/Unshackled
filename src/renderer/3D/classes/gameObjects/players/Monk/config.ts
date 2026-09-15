import * as THREE from 'three';

import { PlayerActionType } from '3D/types';
import { MODELS, DEFAULT_RIGID_BODY_OPTIONS } from '3D/constants';

import { punchRight } from './actions';
import { Rock } from './childObjects/Rock';
import { Player, PlayerOptions } from '../Player';
import { DashStateMonk } from './states/DashStateMonk';
import { AimingState, AttackState, RunningState } from '../../../states';

const ROCK_THROW_SPEED = 12;
const ROCK_THROW_MAX_RANGE = 7.5;
const DASH_COOLDOWN_MS = 1000;

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
  actions: {
    [PlayerActionType.ACTION_LEFT]: {
      getState: (entity: Player) => new AttackState(entity, punchRight),
    },
    [PlayerActionType.ACTION_UP]: {
      getState: (entity: Player) =>
        new AimingState(entity, {
          triggerInput: PlayerActionType.ACTION_UP,
          projectile: {
            ctor: Rock,
            speed: ROCK_THROW_SPEED,
            maxRange: ROCK_THROW_MAX_RANGE,
          },
        }),
    },
    [PlayerActionType.ACTION_RIGHT]: {
      getState: (entity: Player) => new DashStateMonk(entity, { speed: 12, durationMs: 150 }),
      cooldownMs: DASH_COOLDOWN_MS,
    },
    [PlayerActionType.RUN]: {
      getState: (entity: Player) => new RunningState(entity),
    },
  },
};
