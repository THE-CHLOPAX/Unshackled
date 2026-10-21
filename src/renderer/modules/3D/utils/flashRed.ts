import * as THREE from 'three';

import { COLORS } from 'renderer/constants';
import { flashMaterial } from '3D/utils/flashMaterial';
import { Entity } from '3D/classes/gameObjects/Entity/Entity';

export function flashRed(entity: Entity): void {
  flashMaterial({
    entity,
    material: new THREE.MeshBasicMaterial({ color: COLORS.RED }),
    duration: 0.1,
    fadeOut: { duration: 0.15 },
  });
}
