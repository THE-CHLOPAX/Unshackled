import { Entity } from '3D/classes/gameObjects/Entity/Entity';

export function getEntitiesWithinRadius(entity: Entity, radius: number): Entity[] {
  if (!entity.scene) {
    throw new Error('Entity is not part of a scene');
  }

  const nearbyEntities: Entity[] = [];
  const allEntities = entity.scene.children.filter(
    (child): child is Entity => child instanceof Entity && child !== entity
  );

  for (const otherEntity of allEntities) {
    const distance = entity.position.distanceTo(otherEntity.position);
    if (distance <= radius) {
      nearbyEntities.push(otherEntity);
    }
  }

  return nearbyEntities;
}
