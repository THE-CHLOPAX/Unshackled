import { Entity } from '../../gameObjects/Entity';
import { EntityAI } from '../../gameObjects/EntityAI';
import { getEnemiesInRange } from './getEnemiesInRange';

export function getTargetEnemy(entity: EntityAI): Entity | null {
  const enemiesInRange = getEnemiesInRange(entity);
  if (enemiesInRange.length === 0) return null;

  const enemiesAlive = enemiesInRange.filter((enemy) => !enemy.healthPointsController.isDead);

  const enemiesSortedByDistance = enemiesAlive.sort((a, b) => {
    const distanceA = entity.position.distanceTo(a.position);
    const distanceB = entity.position.distanceTo(b.position);
    return distanceA - distanceB;
  });

  return enemiesSortedByDistance[0] ?? null;
}
