import * as THREE from 'three';
import { assert, getModelFromStore, isMesh } from '@tgdf';

import { MODELS } from '3D/constants';
import { WorldObjectArgs } from '3D/types';

import { Flame } from './Flame';
export class DungeonWallTorch extends THREE.Mesh {
  constructor({ cell }: WorldObjectArgs) {
    const torchModel = getModelFromStore(MODELS.DUNGEON_WALL_TORCH.id);
    assert(isMesh(torchModel));

    const { geometry, material } = torchModel;

    super(geometry, material);
    this.scale.multiplyScalar(0.4);
    if (cell !== undefined) {
      this.rotateY(THREE.MathUtils.degToRad(-cell.rotation));
    }

    const torchFlame = new Flame({ scale: 1.5 });
    torchFlame.position.set(0, 0.5, 0.5);

    this.add(torchFlame);
  }
}
