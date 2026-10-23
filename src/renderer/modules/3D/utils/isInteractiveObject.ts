import * as THREE from 'three';

import { InteractiveObject } from '3D/classes/gameObjects/InteractiveObject/InteractiveObject';

export function isInteractiveObject(object: THREE.Object3D): object is InteractiveObject {
  return (object as InteractiveObject).isInteractiveObject === true;
}
