import { gsap } from 'gsap';
import * as THREE from 'three';

import { isEntityAi } from 'renderer/3D/utils/isEntityAi';

import { Entity } from '../../Entity';
import { AIAttack } from '../../../../types';
import { FMOD_EVENTS } from '../../../../../FMOD/constants';

export enum SkeletonAttackAnimations {
  PUNCH = 'punch',
}

export const attackActions: AIAttack[] = [
  {
    action: punch,
    soundPath: FMOD_EVENTS.ATTACK,
    minRange: 0,
    maxRange: 2,
  },
];

function punch(entity: Entity) {
  return new Promise<void>((resolve) => {
    const HITBOX_DELAY = 0.6; // Delay in seconds before the hitbox is attached
    const HITBOX_DURATION = 0.2; // Duration in seconds for which the hitbox remains active

    entity.damageHitboxController.hitboxTimeline = gsap
      .timeline()
      .call(
        () =>
          entity.damageHitboxController.attachDamageHitbox(
            new THREE.Vector3(0.5, 0.5, 0.5),
            10,
            'mixamorigRightHand',
            (other) => isEntityAi(other)
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

    entity.animationController.playAnimation(SkeletonAttackAnimations.PUNCH, {
      clampWhenFinished: true,
      playbackRate: 1.8,
      onComplete: () => {
        entity.damageHitboxController.clearHitboxEvents();
        resolve();
      },
    });
  });
}
