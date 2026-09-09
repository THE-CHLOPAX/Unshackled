import * as THREE from 'three';

import { SPAWN_MARKER_NAME } from 'renderer/3D/constants';

export class SpawnMarker extends THREE.Object3D {
  constructor() {
    super();

    this.name = SPAWN_MARKER_NAME;
  }
}
