import * as THREE from 'three';

import { EntityAI } from '../classes/gameObjects/EntityAI';

export function isEntityAi(object: THREE.Object3D): object is EntityAI {
  return 'isEntityAi' in object && object.isEntityAi === true;
}
