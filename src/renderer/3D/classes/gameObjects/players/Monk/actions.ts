import { gsap } from 'gsap';
import * as THREE from 'three';

import { RunningState, SprintingState } from 'renderer/3D/classes/states';

import { Player } from '../Player';
import { Entity } from '../../Entity';
import { DashStateMonk } from './states/DashStateMonk';
import { HealingAura } from './childObjects/HealingAura';
import { FocusState } from '../../../states/Player/FocusState';
import { ActionWithSound, ChainedAction, SequenceSkill, PlayerActionType } from '../../../../types';

const PUNCH_CHAIN_WINDOW_DELAY_MS = 150;
const PUNCH_CHAIN_WINDOW_DURATION_MS = 300;

const KICK_IMPULSE_STRENGTH = 0.4;
const PUNCH_IMPULSE_STRENGTH = 0.4;

const KICK_CAMERA_SHAKE = 2;
const PUNCH_CAMERA_SHAKE = 1;

function applyForwardImpulse(entity: Entity, strength: number): void {
  const direction = new THREE.Vector3();
  entity.getWorldDirection(direction);
  entity.rigidBody.applyImpulse(direction.multiplyScalar(strength));
}

export const kick: ActionWithSound = {
  action: (entity: Entity) =>
    new Promise<void>((resolve) => {
      const HITBOX_DELAY = 0.2; // Delay in seconds before the hitbox is attached
      const HITBOX_DURATION = 0.4; // Duration in seconds for which the hitbox remains active

      entity.damageHitboxController.hitboxTimeline = gsap
        .timeline()
        .call(
          () =>
            entity.damageHitboxController.attachDamageHitbox(
              new THREE.Vector3(0.3, 1, 0.3),
              10,
              'mixamorigRightFoot',
              (other) => other instanceof Player
            ),
          [],
          HITBOX_DELAY
        )
        .call(
          () => {
            entity.damageHitboxController.clearHitboxEvents();
          },
          [],
          HITBOX_DELAY + HITBOX_DURATION
        );

      applyForwardImpulse(entity, KICK_IMPULSE_STRENGTH);

      entity.animationController.playAnimation('kick', {
        clampWhenFinished: true,
        playbackRate: 3,
        onComplete: () => {
          resolve();
          entity.scene.camera.addShake(KICK_CAMERA_SHAKE);
          entity.damageHitboxController.clearHitboxEvents();
        },
      });
    }),
  freezeDurationMs: 200,
};

export const punchLeft: ChainedAction = {
  action: (entity: Entity) =>
    new Promise<void>((resolve) => {
      const HITBOX_DELAY = 0.1;
      const HITBOX_DURATION = 0.2;

      entity.damageHitboxController.hitboxTimeline = gsap
        .timeline()
        .call(
          () =>
            entity.damageHitboxController.attachDamageHitbox(
              new THREE.Vector3(0.3, 1, 0.3),
              10,
              'mixamorigLeftHand',
              (other) => other instanceof Player
            ),
          [],
          HITBOX_DELAY
        )
        .call(
          () => {
            entity.damageHitboxController.clearHitboxEvents();
          },
          [],
          HITBOX_DELAY + HITBOX_DURATION
        );

      applyForwardImpulse(entity, PUNCH_IMPULSE_STRENGTH);

      entity.animationController.playAnimation('punch-left', {
        clampWhenFinished: true,
        playbackRate: 2.5,
        onComplete: () => {
          resolve();
          entity.scene.camera.addShake(PUNCH_CAMERA_SHAKE);
          entity.damageHitboxController.clearHitboxEvents();
        },
      });
    }),
  chain: {
    next: kick,
    windowDelayMs: PUNCH_CHAIN_WINDOW_DELAY_MS,
    windowDurationMs: PUNCH_CHAIN_WINDOW_DURATION_MS,
  },
};

export const punchRight: ChainedAction = {
  action: (entity: Entity) =>
    new Promise<void>((resolve) => {
      const HITBOX_DELAY = 0;
      const HITBOX_DURATION = 0.4;

      entity.damageHitboxController.hitboxTimeline = gsap
        .timeline()
        .call(
          () =>
            entity.damageHitboxController.attachDamageHitbox(
              new THREE.Vector3(0.3, 1, 0.3),
              10,
              'mixamorigRightHand',
              (other) => other instanceof Player
            ),
          [],
          HITBOX_DELAY
        )
        .call(
          () => {
            entity.damageHitboxController.clearHitboxEvents();
          },
          [],
          HITBOX_DELAY + HITBOX_DURATION
        );

      applyForwardImpulse(entity, PUNCH_IMPULSE_STRENGTH);

      entity.animationController.playAnimation('punch-right', {
        clampWhenFinished: true,
        playbackRate: 2,
        onComplete: () => {
          resolve();
          entity.scene.camera.addShake(PUNCH_CAMERA_SHAKE);
          entity.damageHitboxController.clearHitboxEvents();
        },
      });
    }),
  chain: {
    next: punchLeft,
    windowDelayMs: PUNCH_CHAIN_WINDOW_DELAY_MS,
    windowDurationMs: PUNCH_CHAIN_WINDOW_DURATION_MS,
  },
};

export const healingAura: SequenceSkill = {
  sequence: [
    PlayerActionType.ACTION_UP,
    PlayerActionType.ACTION_UP,
    PlayerActionType.ACTION_LEFT,
    PlayerActionType.ACTION_RIGHT,
  ],
  availableIn: [FocusState],
  cooldownMs: 8000,
  callback: (entity) => {
    return new Promise((resolve) => {
      const healingAuraObject = new HealingAura(entity.scene, {
        diameter: 4,
        healAmount: 10,
        durationMs: 5000,
        healIntervalMs: 1000,
      });
      entity.add(healingAuraObject);
      resolve();
    });
  },
};

export const dash: SequenceSkill = {
  sequence: [PlayerActionType.ACTION_RIGHT, PlayerActionType.ACTION_RIGHT],
  availableIn: [RunningState, SprintingState],
  getState: (entity) => new DashStateMonk(entity, { speed: 12, durationMs: 150 }),
  cooldownMs: 1000,
};
