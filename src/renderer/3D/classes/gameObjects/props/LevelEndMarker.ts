import { Scene } from '@tgdf';
import * as THREE from 'three';

import { WorldObjectArgs } from 'renderer/3D/types';

export class LevelEndMarker extends THREE.Object3D {
  constructor(_scene: Scene, _args: WorldObjectArgs) {
    super();
  }
}
