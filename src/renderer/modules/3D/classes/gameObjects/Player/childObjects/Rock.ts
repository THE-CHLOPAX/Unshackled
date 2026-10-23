import { RigidBodyCollisionParams } from '@tgdf';

import { MODELS } from '3D/constants';
import { isEntity } from '3D/utils/isEntity';
import { getModelClone } from '3D/utils/getModelClone';
import { GameScene } from '3D/classes/scenes/GameScene/GameScene';
import { Projectile, ProjectileOptions } from '3D/classes/gameObjects/Projectile/Projectile';

export class Rock extends Projectile {
  constructor(
    scene: GameScene,
    public readonly options: Omit<ProjectileOptions, 'model'>
  ) {
    const model = getModelClone(MODELS.ROCK.id);
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
