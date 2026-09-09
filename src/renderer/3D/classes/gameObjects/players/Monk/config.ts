import * as THREE from 'three';

import { PlayerActionType } from '3D/types';
import { MODELS, DEFAULT_RIGID_BODY_OPTIONS } from '3D/constants';

import { Player, PlayerOptions } from '../Player';
import { AttackState, RunningState } from '../../../states';
import { FocusState } from '../../../states/Player/FocusState';
import { kick, summonOrbs, healingAura, dash } from './actions';

enum MonkAnimationClipNames {
  FOCUS_START = 'praying-start',
  FOCUS_PROGRESS = 'praying',
  FOCUS_END = 'spawn',
}

export const config: PlayerOptions = {
  modelOptions: {
    id: MODELS.MONK.id,
  },
  movementOptions: {
    speed: 2.5,
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
      [MonkAnimationClipNames.FOCUS_START]: 1.8,
    },
  },
  healthOptions: {
    initialHealthPoints: 10,
  },
  sequenceSkills: [summonOrbs, healingAura, dash],
  sequenceTimeoutMs: 500,
  actions: {
    [PlayerActionType.ACTION_UP]: (entity: Player) => {
      return new AttackState(entity, kick);
    },
    [PlayerActionType.ACTION_FOCUS]: (entity: Player) => {
      return new FocusState(entity, {
        clips: {
          enter: MonkAnimationClipNames.FOCUS_START,
        },
      });
    },
    [PlayerActionType.RUN]: (entity: Player) => {
      return new RunningState(entity);
    },
  },
};
