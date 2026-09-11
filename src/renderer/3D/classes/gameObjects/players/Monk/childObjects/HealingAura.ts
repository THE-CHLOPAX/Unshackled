import * as THREE from 'three';
import { RigidBody, assert, RigidBodyCollisionParams, Scene } from '@tgdf';

import { COLORS } from 'renderer/constants';
import { isPlayer } from 'renderer/3D/utils/isPlayer';

import { ArcaneCircle } from '../../../ArcaneCircle';

export type HealingAuraOptions = {
  diameter: number;
  healAmount: number;
  healIntervalMs: number;
  durationMs: number;
};

const HEALING_AURA_COLOR = COLORS.GOLDEN;
const FADE_DURATION = 1;

export class HealingAura extends ArcaneCircle {
  private _fadeOutTimeout: NodeJS.Timeout | null = null;
  private _rigidBody: RigidBody | null = null;
  private _light: THREE.PointLight | null = null;
  private _collisionUnsubscribe: (() => void) | null = null;
  private _healIntervalsMap: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    scene: Scene,
    public healingOptions: HealingAuraOptions
  ) {
    super(scene, {
      diameter: healingOptions.diameter,
      color: HEALING_AURA_COLOR,
      fadeIn: { duration: FADE_DURATION },
      fadeOut: { duration: FADE_DURATION },
    });

    this._rigidBody = this.addComponent(
      'rigidBody',
      new RigidBody(this, {
        type: 'kinematic',
        colliderShape: 'cylinder',
        colliderSize: new THREE.Vector3(healingOptions.diameter, 1, healingOptions.diameter),
        enableCollisionDetection: true,
        sensor: true,
      })
    );
  }

  protected override onAwake(): void {
    super.onAwake();

    if (!this.parent) {
      throw new Error('HealingAura missing parent');
    }

    const parentBbox = new THREE.Box3().setFromObject(this.parent);
    const parentHeight = parentBbox.max.y - parentBbox.min.y;
    const yOffset = -parentHeight / 2 - 0.3;

    this.position.y = this.parent.position.y + yOffset;

    this._light = this.scene.lightPool.acquire(this);
    if (this._light) {
      this._light.color.set(HEALING_AURA_COLOR);
      this._light.intensity = 0.5;
      this._light.distance = 10;
      this._light.decay = 2;
      this._light.position.set(0, parentHeight, 0);
    }

    this._fadeOutTimeout = setTimeout(() => {
      this.destroy();
    }, this.healingOptions.durationMs);

    const listenerId = `healing-aura-${this.id}-collision-listener`;
    assert(this._rigidBody, 'HealingAura: RigidBody component missing');
    this._collisionUnsubscribe = this._rigidBody.addCollisionListener(
      listenerId,
      this._onCollision
    );
  }

  protected override onDestroyed(): void {
    if (this._fadeOutTimeout) {
      clearTimeout(this._fadeOutTimeout);
      this._fadeOutTimeout = null;
    }

    this._collisionUnsubscribe?.();

    this._healIntervalsMap.forEach((interval) => {
      clearInterval(interval);
    });

    this.scene.lightPool.release(this._light);
    this._light = null;

    super.onDestroyed();
  }

  private _onCollision = ({ otherBody, started }: RigidBodyCollisionParams) => {
    const otherGameObject = otherBody.gameObject;

    if (!isPlayer(otherGameObject)) return;

    if (!started && this._healIntervalsMap.has(otherGameObject.uuid)) {
      const interval = this._healIntervalsMap.get(otherGameObject.uuid);
      clearInterval(interval);
      this._healIntervalsMap.delete(otherGameObject.uuid);
      return;
    }

    this._healIntervalsMap.set(
      otherGameObject.uuid,
      setInterval(() => {
        otherGameObject.healthPointsController.healDamage(this.healingOptions.healAmount);
      }, this.healingOptions.healIntervalMs)
    );
  };
}
