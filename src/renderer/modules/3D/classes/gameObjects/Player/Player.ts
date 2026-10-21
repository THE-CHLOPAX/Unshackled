import { Input, PlayerInput, PlayerInputBinding } from '@tgdf';

import { GameScene } from '3D/classes/scenes/GameScene/GameScene';
import { playerConfig } from '3D/classes/gameObjects/Player/config';
import { Entity, EntityOptions } from '3D/classes/gameObjects/Entity/Entity';
import { StaminaBarRenderer } from '3D/classes/gameObjectComponents/StaminaBarRenderer/StaminaBarRenderer';
import { PlayerRegisterableInputSource } from '3D/classes/gameObjects/Player/PlayerRegisterableInputSource';
import {
  StaminaPointsController,
  StaminaPointsControllerOptions,
} from '3D/classes/gameObjectComponents/StaminaPointsController/StaminaPointsController';

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
      new StaminaBarRenderer(this, scene.billboards, this.staminaPointsController)
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
