import { Input, PlayerInput } from '@tgdf';

import { Entity, EntityOptions } from '../Entity';
import { GameScene } from '../../scenes/GameScene/GameScene';
import { PlayerRegisterableInputSource } from './PlayerRegisterableInputSource';

export type PlayerOptions = EntityOptions;

export class Player extends Entity {
  public isPlayer = true;

  constructor(
    scene: GameScene,
    public options: PlayerOptions
  ) {
    super(scene, {
      ...options,
      inputSource: new PlayerRegisterableInputSource(options.inputSource ?? Input),
    });
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
