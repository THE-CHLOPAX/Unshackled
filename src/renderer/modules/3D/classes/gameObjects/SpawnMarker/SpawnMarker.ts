import { Scene } from '@tgdf';
import * as THREE from 'three';

import { WorldObjectArgs } from 'renderer/types';
import { SPAWN_MARKER_NAME } from '3D/constants';

export class SpawnMarker extends THREE.Object3D {
  constructor(_scene: Scene, _args: WorldObjectArgs) {
    super();

    this.name = SPAWN_MARKER_NAME;
  }
}
