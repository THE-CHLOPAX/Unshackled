import * as THREE from 'three';
import { assert, RigidBody, RigidBodyCollisionParams, RigidBodyOptions } from '@tgdf';

import { Entity } from './Entity';
import { GameSceneObject } from './GameSceneObject';
import { GameScene } from '../scenes/GameScene/GameScene';
import { ModelRenderer } from '../gameObjectComponents/ModelRenderer/ModelRenderer';

export type ProjectileOptions = {
  sender: Entity;
  model: THREE.Object3D;
  speed: number;
  maxRange: number;
  rigidBodyOptions?: Partial<RigidBodyOptions>;
};

const DEFAULT_RIGID_OPTIONS: RigidBodyOptions = {
  colliderShape: 'box',
  enableCollisionDetection: true,
  mass: 0.1,
  type: 'kinematic',
  angularDamping: 0,
  friction: 0,
  linearDamping: 0,
  sensor: true,
  restitution: 0,
  lockRotation: true,
};

export class Projectile extends GameSceneObject {
  public rigidBody: RigidBody;

  protected sender: Entity;

  private _speed: number;
  private _maxRange: number;
  private _sentFromPosition: THREE.Vector3 | null = null;
  private _direction: THREE.Vector3 | null = null;
  private _collisionListenerId: string | null = null;

  constructor(scene: GameScene, options: ProjectileOptions) {
    super({ scene });

    this._speed = options.speed;
    this._maxRange = options.maxRange;

    this.addComponent('ModelRenderer', new ModelRenderer(this, { model: options.model }));
    this.rigidBody = this.addComponent(
      'RigidBody',
      new RigidBody(this, { ...DEFAULT_RIGID_OPTIONS, ...options.rigidBodyOptions })
    );

    this.sender = options.sender;
  }

  public sendTowards(direction: THREE.Vector3) {
    this._sentFromPosition = this.getWorldPosition(new THREE.Vector3());

    this._direction = direction.normalize();

    this._collisionListenerId = `projectile-on-collision-listener-${this.name || this.id}`;
    this.rigidBody.addCollisionListener(this._collisionListenerId, (params) => {
      if (this.onCollision(params)) {
        assert(this._collisionListenerId !== null);
        this.rigidBody.removeCollisionListener(this._collisionListenerId);
      }
    });
  }

  protected override onUpdate(deltaTime: number): void {
    super.onUpdate(deltaTime);

    if (this._direction !== null) {
      this.position.addScaledVector(this._direction, this._speed * deltaTime);
    }

    if (
      this._sentFromPosition !== null &&
      this._collisionListenerId !== null &&
      this.position.distanceTo(this._sentFromPosition) > this._maxRange
    ) {
      this.rigidBody.removeCollisionListener(this._collisionListenerId);
      this._collisionListenerId = null;
      this.onMaxRangeReached();
    }
  }

  /**
   * On collision overridable callback.
   * Should return true only if collision terminates the projectile lifecycle.
   * @param _params
   * @returns
   */
  protected onCollision(_params: RigidBodyCollisionParams): boolean {
    return true;
  }

  protected onMaxRangeReached(): void {}
}
