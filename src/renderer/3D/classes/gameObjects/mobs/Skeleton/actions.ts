import { gsap } from 'gsap';
import * as THREE from 'three';

import { ANIMATION_CLIP_NAMES } from '3D/constants';
import { isEntityAi } from 'renderer/3D/utils/isEntityAi';

import { Entity } from '../../Entity';
import { AIAttackAction } from '../../../../types';
import { FMOD_EVENTS } from '../../../../../FMOD/constants';

const SKELETON_BONES = {
  LEFT_HAND: 'mixamorigLeftHand',
  RIGHT_HAND: 'mixamorigRightHand',
  LEFT_FOOT: 'mixamorigLeftFoot',
  RIGHT_FOOT: 'mixamorigRightFoot',
};

export const attackActions: AIAttackAction[] = [
  {
    action: punch,
    sound: FMOD_EVENTS.SKELETON_ATTACK,
    minRange: 0,
    maxRange: 1,
  },
];

function punch(entity: Entity) {
  return new Promise<void>((resolve) => {
    const HITBOX_DELAY = 0.6; // Delay in seconds before the hitbox is attached
    const HITBOX_DURATION = 0.2; // Duration in seconds for which the hitbox remains active

    entity.damageHitboxController.hitboxTimeline = gsap
      .timeline()
      .call(
        () => {
          entity.fmodSoundController.playSound(FMOD_EVENTS.GENERIC_SWOOSH);
          entity.damageHitboxController.attachDamageHitbox(
            new THREE.Vector3(0.5, 0.5, 0.5),
            10,
            SKELETON_BONES.RIGHT_HAND,
            (other) => isEntityAi(other)
          );
        },
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

    entity.animationController.playAnimation(ANIMATION_CLIP_NAMES.SKELETON.PUNCH, {
      clampWhenFinished: true,
      playbackRate: 1.8,
      onComplete: () => {
        entity.damageHitboxController.clearHitboxEvents();
        resolve();
      },
    });
  });
}
