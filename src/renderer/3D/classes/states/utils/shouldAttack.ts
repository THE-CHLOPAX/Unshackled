import { AIAttackAction } from '../../../types';
import { getTargetEnemy } from './getTargetEnemy';
import { EntityAI } from '../../gameObjects/EntityAI';

export function shouldAttack(entity: EntityAI, attack: AIAttackAction): boolean {
  const targetEnemy = getTargetEnemy(entity);
  if (!targetEnemy) return false;

  const distanceToEnemy = entity.position.distanceTo(targetEnemy.position);
  return distanceToEnemy >= attack.minRange && distanceToEnemy <= attack.maxRange;
}
