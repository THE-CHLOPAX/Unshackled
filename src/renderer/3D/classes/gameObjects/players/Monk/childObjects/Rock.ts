import * as THREE from 'three';
import { RigidBodyCollisionParams } from '@tgdf';

import { COLORS } from 'renderer/constants';
import { isEntity } from 'renderer/3D/utils/isEntity';
import { GameScene } from 'renderer/3D/classes/scenes/GameScene/GameScene';

import { Projectile, ProjectileOptions } from '../../../Projectile';

export class Rock extends Projectile {
  constructor(
    scene: GameScene,
    public readonly options: Omit<ProjectileOptions, 'model'>
  ) {
    const geometry = new THREE.BoxGeometry(0.25, 0.25, 0.25);
    const material = new THREE.MeshBasicMaterial({ color: COLORS.LIGHT_KHAKI });
    const model = new THREE.Mesh(geometry, material);

    super(scene, { ...options, model });
  }

  protected override onMaxRangeReached(): void {
    this.scene.remove(this);
  }

  protected override onCollision({ otherBody }: RigidBodyCollisionParams): void {
    const otherObject = otherBody.gameObject;

    if (otherObject !== this.options.sender) {
      if (isEntity(otherObject)) {
        otherObject.healthPointsController.inflictDamage(5);
      }
      this.scene.remove(this);
    }
  }
}
