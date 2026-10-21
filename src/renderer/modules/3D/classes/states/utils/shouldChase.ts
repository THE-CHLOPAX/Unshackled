import { AIAttackAction } from '3D/types';
import { EntityAI } from '3D/classes/gameObjects/EntityAI/EntityAI';
import { getTargetEnemy } from '3D/classes/states/utils/getTargetEnemy';

export function shouldChase(entity: EntityAI, attack: AIAttackAction): boolean {
  const targetEnemy = getTargetEnemy(entity);
  if (!targetEnemy) return false;

  const distanceToEnemy = entity.position.distanceTo(targetEnemy.position);
  return distanceToEnemy > attack.maxRange;
}
