import { assert } from '@tgdf';

import { Entity } from '../../gameObjects/Entity';
import { EntityAI } from '../../gameObjects/EntityAI';
import { getEntitiesWithinRadius } from '../../../utils/getEntitiesWithinRadius';

export function getEnemiesInRange(entity: EntityAI): Entity[] {
  if (!entity.detectionRadius) return [];
  const entitiesInRange = getEntitiesWithinRadius(entity, entity.detectionRadius);

  if (entity.enemyTypes === null) return [];

  // Return array of enemies in range
  return entitiesInRange.filter((enemy) => {
    assert(entity.enemyTypes !== null, 'Enemy types are null');
    return entity.enemyTypes.some((enemyType) => {
      return enemy instanceof enemyType;
    });
  });
}
