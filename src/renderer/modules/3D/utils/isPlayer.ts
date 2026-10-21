import * as THREE from 'three';

import { Player } from '3D/classes/gameObjects/players/Player';

export function isPlayer(object: THREE.Object3D): object is Player {
  return (object as Player).isPlayer === true;
}
