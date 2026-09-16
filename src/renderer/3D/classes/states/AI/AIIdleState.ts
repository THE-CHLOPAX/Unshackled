import { InputState, randFromRange } from '@tgdf';

import { State } from '..';
import { EntityAI } from '../../gameObjects/EntityAI';
import { getBestAttack } from '../utils/getBestAttack';
import { getTargetEnemy } from '../utils/getTargetEnemy';
import { AIAttackAction, AnimationClipNamesShared } from '../../../types';

export class AIIdleState extends State {
  private _startRoamingTimeout: NodeJS.Timeout | null = null;
  private _shouldTransitionToRoaming: boolean = false;
  private _bestAttack: AIAttackAction | null = null;

  constructor(public entity: EntityAI) {
    super(entity);
  }

  public get shouldTransitionToRoaming(): boolean {
    return this._shouldTransitionToRoaming;
  }

  public get bestAttack(): AIAttackAction | null {
    return this._bestAttack;
  }

  public override onEnter(): void {
    this.entity.animationController.playAnimation(AnimationClipNamesShared.IDLE, { loop: true });

    if (this.entity.roaming) {
      const interval = this.entity.roaming.interval;
      this._startRoamingTimeout = setTimeout(
        () => {
          this._shouldTransitionToRoaming = true;
        },
        randFromRange(interval.min, interval.max)
      );
    }
  }

  public override onExit(): void {
    if (this._startRoamingTimeout) {
      clearTimeout(this._startRoamingTimeout);
      this._startRoamingTimeout = null;
    }
  }

  public override onInput(_inputState: InputState): void {}

  public override onUpdate(_deltaTime: number): void {
    const targetEnemy = getTargetEnemy(this.entity);
    this._bestAttack = targetEnemy ? getBestAttack(this.entity, targetEnemy) : null;
  }
}
