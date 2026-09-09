import { Scene } from '@tgdf';
import * as THREE from 'three';

import { WorldObjectArgs } from 'renderer/3D/types';
import { SPAWN_MARKER_NAME } from 'renderer/3D/constants';

export class SpawnMarker extends THREE.Object3D {
  constructor(_scene: Scene, _args: WorldObjectArgs) {
    super();

    this.name = SPAWN_MARKER_NAME;
  }
}
