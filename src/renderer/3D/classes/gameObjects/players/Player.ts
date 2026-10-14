import { Input, PlayerInput } from '@tgdf';

import { Entity, EntityOptions } from '../Entity';
import { GameScene } from '../../scenes/GameScene/GameScene';
import { PlayerRegisterableInputSource } from './PlayerRegisterableInputSource';
import { StaminaBarRenderer } from '../../gameObjectComponents/StaminaBarRenderer/StaminaBarRenderer';
import {
  StaminaPointsController,
  StaminaPointsControllerOptions,
} from '../../gameObjectComponents/StaminaPointsController';

export type PlayerOptions = EntityOptions & {
  playerProfileId: string;
  staminaOptions: StaminaPointsControllerOptions;
};

export type PlayerConfig = Omit<PlayerOptions, 'playerProfileId'>;

export class Player extends Entity {
  public isPlayer = true;

  public staminaPointsController: StaminaPointsController;
  public staminaBarRenderer: StaminaBarRenderer;

  constructor(
    scene: GameScene,
    public readonly options: PlayerOptions
  ) {
    super(scene, {
      ...options,
      inputSource: new PlayerRegisterableInputSource(options.inputSource ?? Input),
    });

    this.staminaPointsController = this.addComponent(
      'StaminaPointsController',
      new StaminaPointsController(this, options.staminaOptions)
    );

    this.staminaBarRenderer = this.addComponent(
      'StaminaBarRenderer',
      new StaminaBarRenderer(this, this.staminaPointsController)
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
