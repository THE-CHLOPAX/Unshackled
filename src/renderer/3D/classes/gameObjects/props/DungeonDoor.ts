import * as THREE from 'three';
import { assert, getModelFromStore, isMesh, Scene } from '@tgdf';

import { MODELS } from '3D/constants';
import { WorldObjectArgs } from '3D/types';

export class DungeonDoor extends THREE.Mesh {
  constructor(_scene: Scene, _args: WorldObjectArgs) {
    const doorModel = getModelFromStore(MODELS.DUNGEON_DOOR.id);
    assert(isMesh(doorModel), 'Model is not a mesh');

    const { geometry, material } = doorModel;

    super(geometry, material);

    this.rotation.z = -Math.PI / 2;
    this.rotation.x = -Math.PI / 2;
  }
}
