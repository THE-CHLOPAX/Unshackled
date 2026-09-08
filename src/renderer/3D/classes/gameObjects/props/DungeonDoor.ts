import * as THREE from 'three';
import { assert, getModelFromStore, isMesh } from '@tgdf';

import { MODELS } from '3D/constants';

export class DungeonDoor extends THREE.Mesh {
  constructor() {
    const doorModel = getModelFromStore(MODELS.DUNGEON_DOOR.id);
    assert(isMesh(doorModel));

    const { geometry, material } = doorModel;

    super(geometry, material);
  }
}
