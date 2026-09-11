import * as THREE from 'three';
import { GameObject, RigidBody, Scene } from '@tgdf';

import { HealthPointsController } from '../gameObjectComponents/HealthPointsController';

export type DamageHitboxIgnoreCondition = (other: GameObject) => boolean;

export class DamageHitbox extends GameObject {
  public rigidBody: RigidBody;

  private _damage: number;
  private _ignoreCondition?: DamageHitboxIgnoreCondition;

  constructor(
    scene: Scene,
    size: THREE.Vector3,
    damage: number,
    ignoreCondition?: DamageHitboxIgnoreCondition
  ) {
    super({ scene });

    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(size.x, size.y, size.z),
      new THREE.MeshBasicMaterial()
    );

    mesh.visible = false;

    this.add(mesh);

    this.name = 'DamageHitbox';
    this._damage = damage;
    this._ignoreCondition = ignoreCondition;

    this.rigidBody = this.addComponent(
      'RigidBodyComponent',
      new RigidBody(this, {
        type: 'kinematic',
        mass: 0.1,
        friction: 0,
        restitution: 0,
        linearDamping: 0,
        angularDamping: 0,
        lockRotation: true,
        sensor: true,
        enableCollisionDetection: true,
        colliderShape: 'box',
      })
    );
  }

  public get damage(): number {
    return this._damage;
  }

  protected override onAwake(): void {
    super.onAwake();
    this.rigidBody.addCollisionListener(`damage-hitbox-${this.id}`, ({ otherBody, started }) => {
      const otherObject = otherBody.gameObject;
      if (otherObject === undefined || this._ignoreCondition?.(otherObject)) return;
      if (started) {
        const healthController = otherObject.getGameObjectComponentByType(HealthPointsController);
        if (healthController) {
          healthController.inflictDamage(this._damage);
        }
      }
    });
  }
}
