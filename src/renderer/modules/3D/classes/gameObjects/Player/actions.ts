import { gsap } from 'gsap';
import * as THREE from 'three';

import { FMOD_EVENTS } from 'FMOD';
import { PlayerActionType } from 'renderer/types';
import { ANIMATION_CLIP_NAMES } from '3D/constants';
import { PlayerAction, ChainedAction } from '3D/types';
import { spawnSwingTrail } from '3D/utils/spawnSwingTrail';
import { Entity } from '3D/classes/gameObjects/Entity/Entity';
import { Player } from '3D/classes/gameObjects/Player/Player';

const PUNCH_CHAIN_WINDOW_DELAY_MS = 150;
const PUNCH_CHAIN_WINDOW_DURATION_MS = 300;

const KICK_IMPULSE_STRENGTH = 0.2;
const PUNCH_IMPULSE_STRENGTH = 0.2;

const KICK_CAMERA_SHAKE = 2;
const PUNCH_CAMERA_SHAKE = 1;

const SWING_TRAIL_WIDTH = 0.3;
const SWING_TRAIL_COLOR = 0xf5f0e6;

const PLAYER_BONES = {
  LEFT_HAND: 'handL',
  RIGHT_HAND: 'handR',
  LEFT_FOOT: 'footL',
  RIGHT_FOOT: 'footR',
};

function applyForwardImpulse(entity: Entity, strength: number): void {
  const direction = new THREE.Vector3();
  entity.getWorldDirection(direction);
  entity.rigidBody.applyImpulse(direction.multiplyScalar(strength));
}

export const kick: PlayerAction = {
  sound: FMOD_EVENTS.PLAYER_GRUNT,
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
              PLAYER_BONES.RIGHT_FOOT,
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
      spawnSwingTrail(entity, PLAYER_BONES.RIGHT_FOOT, {
        durationMs: (HITBOX_DELAY + HITBOX_DURATION) * 1000 * 0.7,
        color: SWING_TRAIL_COLOR,
        width: SWING_TRAIL_WIDTH,
      });

      const playKickReturn = () => {
        entity.animationController.playAnimation(ANIMATION_CLIP_NAMES.PLAYER.KICK_RETURN, {
          clampWhenFinished: true,
          playbackRate: 1,
          onComplete: () => {
            resolve();
          },
        });
      };

      entity.animationController.playAnimation(ANIMATION_CLIP_NAMES.PLAYER.KICK, {
        clampWhenFinished: true,
        playbackRate: 1,
        onComplete: () => {
          entity.scene.camera.addShake(KICK_CAMERA_SHAKE);
          entity.damageHitboxController.clearHitboxEvents();
          playKickReturn();
        },
      });
    }),
  staminaCost: 10,
};

export const punchLeft: ChainedAction = {
  sound: FMOD_EVENTS.GENERIC_SWOOSH,
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
              PLAYER_BONES.LEFT_HAND,
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
      spawnSwingTrail(entity, PLAYER_BONES.LEFT_HAND, {
        durationMs: (HITBOX_DELAY + HITBOX_DURATION) * 1000,
        color: SWING_TRAIL_COLOR,
        width: SWING_TRAIL_WIDTH,
      });

      entity.animationController.playAnimation(ANIMATION_CLIP_NAMES.PLAYER.PUNCH_LEFT, {
        clampWhenFinished: true,
        playbackRate: 2.5,
        onComplete: () => {
          resolve();
          entity.scene.camera.addShake(PUNCH_CAMERA_SHAKE);
          entity.damageHitboxController.clearHitboxEvents();
        },
      });
    }),
  staminaCost: 5,
  chain: {
    next: kick,
    requiredInput: PlayerActionType.ACTION_LEFT,
    windowDelayMs: PUNCH_CHAIN_WINDOW_DELAY_MS,
    windowDurationMs: PUNCH_CHAIN_WINDOW_DURATION_MS,
  },
};

export const punchRight: ChainedAction = {
  sound: FMOD_EVENTS.GENERIC_SWOOSH,
  action: (entity: Entity) =>
    new Promise<void>((resolve) => {
      const HITBOX_DELAY = 0.08;
      const HITBOX_DURATION = 0.25;

      entity.damageHitboxController.hitboxTimeline = gsap
        .timeline()
        .call(
          () =>
            entity.damageHitboxController.attachDamageHitbox(
              new THREE.Vector3(0.3, 1, 0.3),
              10,
              PLAYER_BONES.RIGHT_HAND,
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
      spawnSwingTrail(entity, PLAYER_BONES.RIGHT_HAND, {
        durationMs: (HITBOX_DELAY + HITBOX_DURATION) * 1000,
        width: SWING_TRAIL_WIDTH,
        color: SWING_TRAIL_COLOR,
      });

      entity.animationController.playAnimation(ANIMATION_CLIP_NAMES.PLAYER.PUNCH_RIGHT, {
        clampWhenFinished: true,
        playbackRate: 2,
        onComplete: () => {
          resolve();
          entity.scene.camera.addShake(PUNCH_CAMERA_SHAKE);
          entity.damageHitboxController.clearHitboxEvents();
        },
      });
    }),
  staminaCost: 5,
  chain: {
    next: punchLeft,
    requiredInput: PlayerActionType.ACTION_LEFT,
    windowDelayMs: PUNCH_CHAIN_WINDOW_DELAY_MS,
    windowDurationMs: PUNCH_CHAIN_WINDOW_DURATION_MS,
  },
};
