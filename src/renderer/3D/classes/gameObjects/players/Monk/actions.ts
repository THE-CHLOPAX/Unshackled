import { gsap } from 'gsap';
import * as THREE from 'three';

import { FMOD_EVENTS } from 'renderer/FMOD';
import { spawnSwingTrail } from '3D/utils/spawnSwingTrail';

import { Player } from '../Player';
import { Entity } from '../../Entity';
import { ActionWithSound, ChainedAction, PlayerActionType } from '../../../../types';

const PUNCH_CHAIN_WINDOW_DELAY_MS = 150;
const PUNCH_CHAIN_WINDOW_DURATION_MS = 300;

const KICK_IMPULSE_STRENGTH = 0.4;
const PUNCH_IMPULSE_STRENGTH = 0.4;

const KICK_CAMERA_SHAKE = 2;
const PUNCH_CAMERA_SHAKE = 1;

const SWING_TRAIL_WIDTH = 0.3;
const SWING_TRAIL_COLOR = 0xf5f0e6;

function applyForwardImpulse(entity: Entity, strength: number): void {
  const direction = new THREE.Vector3();
  entity.getWorldDirection(direction);
  entity.rigidBody.applyImpulse(direction.multiplyScalar(strength));
}

export const kick: ActionWithSound = {
  soundPath: FMOD_EVENTS.MONK_ATTACK_3,
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
      spawnSwingTrail(entity, 'mixamorigRightFoot', {
        durationMs: (HITBOX_DELAY + HITBOX_DURATION) * 1000 * 0.7,
        color: SWING_TRAIL_COLOR,
        width: SWING_TRAIL_WIDTH,
      });

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
  freezeDurationMs: 100,
};

export const punchLeft: ChainedAction = {
  soundPath: FMOD_EVENTS.GENERIC_SWOOSH,
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
      spawnSwingTrail(entity, 'mixamorigLeftHand', {
        durationMs: (HITBOX_DELAY + HITBOX_DURATION) * 1000,
        color: SWING_TRAIL_COLOR,
        width: SWING_TRAIL_WIDTH,
      });

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
    requiredInput: PlayerActionType.ACTION_LEFT,
    windowDelayMs: PUNCH_CHAIN_WINDOW_DELAY_MS,
    windowDurationMs: PUNCH_CHAIN_WINDOW_DURATION_MS,
  },
};

export const punchRight: ChainedAction = {
  soundPath: FMOD_EVENTS.GENERIC_SWOOSH,
  action: (entity: Entity) =>
    new Promise<void>((resolve) => {
      const HITBOX_DELAY = 0.15;
      const HITBOX_DURATION = 0.25;

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
      spawnSwingTrail(entity, 'mixamorigRightHand', {
        durationMs: (HITBOX_DELAY + HITBOX_DURATION) * 1000,
        width: SWING_TRAIL_WIDTH,
        color: SWING_TRAIL_COLOR,
      });

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
    requiredInput: PlayerActionType.ACTION_LEFT,
    windowDelayMs: PUNCH_CHAIN_WINDOW_DELAY_MS,
    windowDurationMs: PUNCH_CHAIN_WINDOW_DURATION_MS,
  },
};
