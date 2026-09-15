import { IdleState, State } from '../../states';
import { Entity, EntityOptions } from '../Entity';
import { GameScene } from '../../scenes/GameScene/GameScene';
import { PlayerActionType } from '../../../../../renderer/3D/types';

export type PlayerActionConfig = {
  getState: (entity: Player) => State;
  cooldownMs?: number;
};

export type PlayerOptions = EntityOptions & {
  actions: {
    [key in PlayerActionType]?: PlayerActionConfig;
  };
};

export class Player extends Entity {
  public isPlayer = true;

  constructor(
    scene: GameScene,
    public options: PlayerOptions
  ) {
    super(scene, options);

    this.stateController.currentState = new IdleState(this);
  }

  public onAction(actionType: PlayerActionType): State | null {
    const action = this.options.actions[actionType];
    if (!action) return null;

    if (action.cooldownMs !== undefined) {
      if (this.cooldownController.isOnCooldown(actionType)) return null;
      this.cooldownController.startCooldown(actionType, action.cooldownMs);
    }

    return action.getState(this);
  }

  protected override onDamageTaken(): void {
    this.scene.camera.addShake(0.5);
  }
}
