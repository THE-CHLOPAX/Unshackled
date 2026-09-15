import { Entity } from '../classes/gameObjects/Entity';
import { SwingTrail, SwingTrailOptions } from '../classes/gameObjects/SwingTrail';

export function spawnSwingTrail(
  entity: Entity,
  boneName: string,
  options: Omit<SwingTrailOptions, 'target'>
): void {
  const bone = entity.modelRenderer.getModel()?.getObjectByName(boneName);
  if (!bone) return;

  entity.scene.add(
    new SwingTrail(entity.scene, {
      target: bone,
      ...options,
    })
  );
}
