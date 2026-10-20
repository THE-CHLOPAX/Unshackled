import { Input, PlayerInput, PlayerInputBinding } from '@tgdf';

import { playerConfig } from './config';
import { Entity, EntityOptions } from '../Entity';
import { GameScene } from '../../scenes/GameScene/GameScene';
import { PlayerRegisterableInputSource } from './PlayerRegisterableInputSource';
import { StaminaBarRenderer } from '../../gameObjectComponents/StaminaBarRenderer/StaminaBarRenderer';
import {
  StaminaPointsController,
  StaminaPointsControllerOptions,
} from '../../gameObjectComponents/StaminaPointsController';

export type PlayerConfig = Omit<EntityOptions, 'inputSource'> & {
  staminaOptions: StaminaPointsControllerOptions;
};

export type PlayerOptions = {
  playerProfileId: string;
  inputSource?: PlayerInput;
};

export class Player extends Entity {
  public isPlayer = true;

  public staminaPointsController: StaminaPointsController;
  public staminaBarRenderer: StaminaBarRenderer;

  constructor(
    scene: GameScene,
    public readonly playerOptions: PlayerOptions
  ) {
    super(scene, {
      ...playerConfig,
      inputSource: new PlayerRegisterableInputSource(playerOptions.inputSource ?? Input),
    });

    this.staminaPointsController = this.addComponent(
      'StaminaPointsController',
      new StaminaPointsController(this, playerConfig.staminaOptions)
    );

    this.staminaBarRenderer = this.addComponent(
      'StaminaBarRenderer',
      new StaminaBarRenderer(this, this.staminaPointsController)
    );
  }

  public get playerProfileId(): string {
    return this.playerOptions.playerProfileId;
  }

  public get inputType(): PlayerInputBinding['type'] {
    return this.playerOptions.inputSource?.binding.type ?? 'keyboard';
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
