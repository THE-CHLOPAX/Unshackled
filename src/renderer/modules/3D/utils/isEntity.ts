import * as THREE from 'three';

import { Entity } from '3D/classes/gameObjects/Entity';

export function isEntity(object: THREE.Object3D): object is Entity {
  return (object as Entity).isEntity === true;
}
