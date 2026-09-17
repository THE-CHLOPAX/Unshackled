import { InputState } from '@tgdf';

import { State } from '..';
import { EntityAI } from '../../gameObjects/EntityAI';
import { getBestAttack } from '../utils/getBestAttack';
import { getTargetEnemy } from '../utils/getTargetEnemy';
import { AIAttackAction, AnimationClipNamesShared } from '../../../types';

export class AIIdleState extends State {
  private _bestAttack: AIAttackAction | null = null;

  constructor(public entity: EntityAI) {
    super(entity);
  }

  public get bestAttack(): AIAttackAction | null {
    return this._bestAttack;
  }

  public override onEnter(): void {
    this.entity.animationController.playAnimation(AnimationClipNamesShared.IDLE, { loop: true });
  }

  public override onExit(): void {}

  public override onInput(_inputState: InputState): void {}

  public override onUpdate(_deltaTime: number): void {
    const targetEnemy = getTargetEnemy(this.entity);
    this._bestAttack = targetEnemy ? getBestAttack(this.entity, targetEnemy) : null;
  }
}
