import { InputState } from '@tgdf';

import { State } from '3D/classes/states';
import { AIAttackAction } from '3D/types';
import { EntityAI } from '3D/classes/gameObjects/EntityAI';
import { getBestAttack } from '3D/classes/states/utils/getBestAttack';
import { getTargetEnemy } from '3D/classes/states/utils/getTargetEnemy';

export class AIIdleState extends State {
  private _bestAttack: AIAttackAction | null = null;

  constructor(
    public entity: EntityAI,
    private readonly _animationName: string
  ) {
    super(entity);
  }

  public get bestAttack(): AIAttackAction | null {
    return this._bestAttack;
  }

  public override onEnter(): void {
    this.entity.animationController.playAnimation(this._animationName, {
      loop: true,
    });
  }

  public override onExit(): void {}

  public override onInput(_inputState: InputState): void {}

  public override onUpdate(_deltaTime: number): void {
    const targetEnemy = getTargetEnemy(this.entity);
    this._bestAttack = targetEnemy ? getBestAttack(this.entity, targetEnemy) : null;
  }
}
