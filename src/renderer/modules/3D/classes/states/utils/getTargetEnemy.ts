import { Entity } from '3D/classes/gameObjects/Entity/Entity';
import { EntityAI } from '3D/classes/gameObjects/EntityAI/EntityAI';
import { getEnemiesInRange } from '3D/classes/states/utils/getEnemiesInRange';

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
