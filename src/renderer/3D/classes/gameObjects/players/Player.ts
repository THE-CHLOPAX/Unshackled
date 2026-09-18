import { Entity, EntityOptions } from '../Entity';
import { GameScene } from '../../scenes/GameScene/GameScene';

export type PlayerOptions = EntityOptions;

export class Player extends Entity {
  public isPlayer = true;

  constructor(
    scene: GameScene,
    public options: PlayerOptions
  ) {
    super(scene, options);
  }

  protected override onDamageTaken(): void {
    this.scene.camera.addShake(0.5);
  }

  protected override onDeath(): void {
    this.scene.camera.addShake(3);
  }
}
