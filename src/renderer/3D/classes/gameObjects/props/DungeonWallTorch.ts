import * as THREE from 'three';
import { assert, getModelFromStore, isMesh } from '@tgdf';

import { MODELS } from '3D/constants';

export class DungeonWallTorch extends THREE.Mesh {
  constructor() {
    const torchModel = getModelFromStore(MODELS.DUNGEON_WALL_TORCH.id);
    assert(isMesh(torchModel));

    const { geometry, material } = torchModel;

    super(geometry, material);
  }
}
