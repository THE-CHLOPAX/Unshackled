import { Input, PlayerInput } from '@tgdf';

import { Entity, EntityOptions } from '../Entity';
import { GameScene } from '../../scenes/GameScene/GameScene';
import { PlayerRegisterableInputSource } from './PlayerRegisterableInputSource';
import { PlayerProfileController } from '../../gameObjectComponents/PlayerProfileController/PlayerProfileController';

export type PlayerOptions = EntityOptions & {
  playerProfileId: string;
};

export class Player extends Entity {
  public isPlayer = true;

  public playerProfileController: PlayerProfileController;

  constructor(
    scene: GameScene,
    public readonly options: PlayerOptions
  ) {
    super(scene, {
      ...options,
      inputSource: new PlayerRegisterableInputSource(options.inputSource ?? Input),
    });

    this.playerProfileController = this.addComponent(
      'PlayerProfileController',
      new PlayerProfileController(this, options.playerProfileId, this.healthPointsController)
    );
  }

  public get playerProfileId(): string {
    return this.options.playerProfileId;
  }

  public override get inputSource(): PlayerRegisterableInputSource {
    return super.inputSource as PlayerRegisterableInputSource;
  }

  protected override onDestroyed(): void {
    const { source } = this.inputSource;
    this.inputSource.dispose();

    if (source instanceof PlayerInput) {
      source.dispose();
    }

    super.onDestroyed();
  }
}
