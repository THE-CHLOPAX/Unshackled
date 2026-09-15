import { InputState, throttleWithLastValue } from '@tgdf';

import { EntityAI } from '../../gameObjects/EntityAI';
import { getBestAttack } from './utils/getBestAttack';
import { State, AIIdleState, AIAttackState } from '..';
import { getTargetEnemy } from './utils/getTargetEnemy';
import { AIAttack, AnimationClipNamesShared } from '../../../types';

const UPDATE_THROTTLE_INTERVAL_MS = 250;

export class AIChasingState extends State {
  public static checkCondition(entity: EntityAI, attack: AIAttack): boolean {
    // Check if there is a target enemy
    const targetEnemy = getTargetEnemy(entity);
    if (!targetEnemy) return false;

    // If entity is too far from the target enemy, it should chase it
    const distanceToEnemy = entity.position.distanceTo(targetEnemy.position);
    return distanceToEnemy > attack.maxRange;
  }

  constructor(public entity: EntityAI) {
    super(entity);
  }

  public onEnter(): void {
    this.entity.animationController.playAnimation(AnimationClipNamesShared.RUN, {
      loop: true,
    });
  }

  public onExit(): void {
    this.entity.movementController.resetMoveTo();
  }

  public onInput(_inputState: InputState): State {
    return this;
  }

  public onUpdate(_deltaTime: number): State {
    return this._throttledUpdate();
  }

  private _throttledUpdate = throttleWithLastValue(
    (): State => {
      // If no enemies are in range, transition back to idle
      const targetEnemy = getTargetEnemy(this.entity);
      if (targetEnemy === null) return new AIIdleState(this.entity);

      const bestAttack = getBestAttack(this.entity, targetEnemy);
      if (bestAttack === null) return new AIIdleState(this.entity);

      // Attack conditions met, transition to attack state
      if (bestAttack && AIAttackState.checkCondition(this.entity, bestAttack)) {
        return new AIAttackState(this.entity);
      }

      // Chase target enemy otherwise
      const path = this.entity.navMeshAgent.calculatePath(targetEnemy.position);
      if (path === null || path.length === 0) return new AIIdleState(this.entity);

      this.entity.movementController.moveAlongPath(path);

      return this;
    },
    UPDATE_THROTTLE_INTERVAL_MS,
    this
  );
}
