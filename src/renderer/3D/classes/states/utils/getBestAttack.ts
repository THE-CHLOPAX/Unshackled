import { AIAttackAction } from '../../../types';
import { Entity } from '../../gameObjects/Entity';
import { EntityAI } from '../../gameObjects/EntityAI';

export function getBestAttack(entity: EntityAI, target: Entity): AIAttackAction | null {
  if (!entity.attackOptions) return null;
  const distanceToTarget = entity.position.distanceTo(target.position);

  const attacksInRange = entity.attackOptions.actions.filter((attack) => {
    return distanceToTarget >= attack.minRange && distanceToTarget <= attack.maxRange;
  });

  // If there are some attacks in range, return the first one
  if (attacksInRange.length > 0) {
    return attacksInRange[0];
  }

  // If no attacks are in range, find the attack which is the closest to being in range
  let bestAttack: AIAttackAction | null = null;
  let smallestRangeDifference = Infinity;

  for (const attack of entity.attackOptions.actions) {
    const rangeDifference = Math.max(
      attack.minRange - distanceToTarget,
      distanceToTarget - attack.maxRange
    );

    if (rangeDifference < smallestRangeDifference) {
      smallestRangeDifference = rangeDifference;
      bestAttack = attack;
    }
  }

  return bestAttack;
}
