import gsap from 'gsap';
import * as THREE from 'three';
import { clamp, useAssetStore } from '@tgdf';
import { RigidBody, RigidBodyCollisionParams } from '@tgdf';

import { COLORS } from 'renderer/constants';
import { isEntity } from 'renderer/3D/utils/isEntity';
import { EXPLOSION_SPRITESHEET_TEXTURE } from 'renderer/3D/constants';

import { GameSceneObject } from './GameSceneObject';
import { GameScene } from '../scenes/GameScene/GameScene';
import { SpriteFlipbookRenderer } from '../gameObjectComponents/SpriteFlipbookRenderer/SpriteFlipbookRenderer';

export type ExplosionOptions = {
  position: THREE.Vector3;
  size?: THREE.Vector2;
  colliderRadius?: number;
  shakeIntensity?: number;
  damageAmount?: number;
  knockbackAmount?: number;
};

export class Explosion extends GameSceneObject {
  public rigidBody: RigidBody | null = null;

  private _explosionFlash: THREE.PointLight | null = null;
  private _collisionUnsubscribe: (() => void) | null = null;
  private _flashTimeline: gsap.core.Timeline | null = null;

  constructor(
    scene: GameScene,
    public options: ExplosionOptions
  ) {
    super({ scene });

    this.position.copy(options.position);

    const texture = useAssetStore.getState().textureCache.get(EXPLOSION_SPRITESHEET_TEXTURE);

    if (!texture) {
      throw new Error('Explosion sprite sheet texture not found in asset store');
    }

    this.addComponent(
      'SpriteFlipbookRenderer',
      new SpriteFlipbookRenderer(this, {
        columns: 4,
        rows: 2,
        frameCount: 8,
        frameDuration: 0.07,
        texture,
        size: options.size,
        onComplete: () => {
          this.scene.remove(this);
        },
      })
    );

    if (options.colliderRadius !== undefined) {
      const diameter = options.colliderRadius * 2;
      this.rigidBody = this.addComponent(
        'RigidBody',
        new RigidBody(this, {
          type: 'kinematic',
          sensor: true,
          enableCollisionDetection: true,
          colliderShape: 'sphere',
          colliderSize: new THREE.Vector3(diameter, diameter, diameter),
        })
      );
    }
  }

  protected override onAwake(): void {
    super.onAwake();

    if (this.rigidBody && this._onCollision) {
      this._collisionUnsubscribe = this.rigidBody.addCollisionListener(
        `explosion-${this.id}-collision-listener`,
        this._onCollision
      );
    }

    this._explosionFlash = this.scene.lightPool.acquire(this);
    if (this._explosionFlash) {
      this._explosionFlash.color.set(COLORS.ORANGE);
      this._explosionFlash.intensity = 0;
      this._explosionFlash.distance = 20;
      this._explosionFlash.decay = 2;

      this._flashTimeline = gsap.timeline();
      this._flashTimeline.to(this._explosionFlash, { intensity: 10, duration: 0.25 });
      this._flashTimeline.to(this._explosionFlash, { intensity: 0, duration: 0.4 });
    }

    if (this.options.shakeIntensity) {
      const camera = this.scene.camera;
      const distanceFromCameraPivotPoint = Math.max(
        0.1,
        this.position.distanceTo(camera.pivotPoint)
      );

      const shakeAmount =
        clamp(0, 1 / distanceFromCameraPivotPoint, 1) * this.options.shakeIntensity;
      camera.addShake(shakeAmount);
    }
  }

  protected override onDestroyed(): void {
    super.onDestroyed();
    if (this._collisionUnsubscribe !== null) this._collisionUnsubscribe();
    if (this._flashTimeline) {
      this._flashTimeline.kill();
      this._flashTimeline = null;
    }

    this.scene.lightPool.release(this._explosionFlash);
    this._explosionFlash = null;
  }

  // On collision, deal damage to entities and apply knockback force.
  private _onCollision = ({ otherBody, started }: RigidBodyCollisionParams) => {
    if (!started) return;

    if (isEntity(otherBody.gameObject)) {
      const entity = otherBody.gameObject;

      if (this.options.knockbackAmount) {
        const knockbackDirection = new THREE.Vector3()
          .subVectors(entity.position, this.position)
          .normalize();
        const knockbackForce = knockbackDirection.multiplyScalar(this.options.knockbackAmount);
        entity.rigidBody?.applyImpulse(knockbackForce);
      }

      if (this.options.damageAmount) {
        entity.healthPointsController.inflictDamage(this.options.damageAmount);
      }
    }
  };
}
