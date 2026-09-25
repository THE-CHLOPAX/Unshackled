import * as THREE from 'three';

import { COLORS } from 'renderer/constants';

import { flashMaterial } from './flashMaterial';
import { Entity } from '../classes/gameObjects/Entity';

export function flashRed(entity: Entity): void {
  flashMaterial({
    entity,
    material: new THREE.MeshBasicMaterial({ color: COLORS.RED }),
    duration: 0.1,
    fadeOut: { duration: 0.15 },
  });
}
