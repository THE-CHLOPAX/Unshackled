import { InputState } from '@tgdf';

import { AIAttack } from '../../../types';
import { EntityAI } from '../../gameObjects/EntityAI';
import { getBestAttack } from './utils/getBestAttack';
import { getTargetEnemy } from './utils/getTargetEnemy';
import { State, AIIdleState, AIChasingState } from '..';

export class AIAttackState extends State {
  private _isAttacking: boolean = false;

  public static checkCondition(entity: EntityAI, attack: AIAttack): boolean {
    // Check if there's a target enemys
    const targetEnemy = getTargetEnemy(entity);
    if (!targetEnemy) return false;

    // If entity is in range to perform its most preferred attack, it should attack
    const distanceToEnemy = entity.position.distanceTo(targetEnemy.position);

    return distanceToEnemy >= attack.minRange && distanceToEnemy <= attack.maxRange;
  }

  constructor(public entity: EntityAI) {
    super(entity);
  }

  public onEnter(): void {}

  public onExit(): void {}

  public override onUpdate(_deltaTime: number): State {
    // If currently performing an attack, do not transition to another state until the attack is finished
    const targetEnemy = getTargetEnemy(this.entity);

    if (this._isAttacking) {
      if (targetEnemy) {
        this.entity.movementController.rotateTowardsPosition(targetEnemy.position);
      }
      return this;
    }

    if (targetEnemy === null) return new AIIdleState(this.entity);

    const bestAttack = getBestAttack(this.entity, targetEnemy);
    if (bestAttack === null) return new AIIdleState(this.entity);

    if (AIChasingState.checkCondition(this.entity, bestAttack)) {
      return new AIChasingState(this.entity);
    }

    // If no transition conditions are met, perform the attack
    this._performAttack(bestAttack);

    return this;
  }

  public onInput(_inputState: InputState): State {
    return this;
  }

  private _performAttack(bestAttack: AIAttack): void {
    this._isAttacking = true;
    bestAttack.action(this.entity).then(() => {
      this._isAttacking = false;
    });
  }
}
