import { InputState } from '@tgdf';

import { State } from '..';
import { AIAttackAction } from '../../../types';
import { shouldChase } from '../utils/shouldChase';
import { EntityAI } from '../../gameObjects/EntityAI';
import { getBestAttack } from '../utils/getBestAttack';
import { getTargetEnemy } from '../utils/getTargetEnemy';

export class AIAttackState extends State {
  private _isAttacking: boolean = false;
  private _bestAttack: AIAttackAction | null = null;

  constructor(public entity: EntityAI) {
    super(entity);
  }

  public get isAttacking(): boolean {
    return this._isAttacking;
  }

  public get bestAttack(): AIAttackAction | null {
    return this._bestAttack;
  }

  public onEnter(): void {}

  public onExit(): void {
    this.entity.damageHitboxController.clearHitboxEvents();
  }

  public override onUpdate(_deltaTime: number): void {
    const targetEnemy = getTargetEnemy(this.entity);

    if (this._isAttacking) {
      if (targetEnemy) {
        this.entity.movementController.rotateTowardsPosition(targetEnemy.position);
      }
      return;
    }

    this._bestAttack = targetEnemy ? getBestAttack(this.entity, targetEnemy) : null;
    if (this._bestAttack === null) return;

    if (shouldChase(this.entity, this._bestAttack)) return;

    this._performAttack(this._bestAttack);
  }

  public onInput(_inputState: InputState): void {}

  private _performAttack(bestAttack: AIAttackAction): void {
    this._isAttacking = true;
    bestAttack.action(this.entity).then(() => {
      this._isAttacking = false;
    });
  }
}
