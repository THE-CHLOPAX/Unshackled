import * as THREE from 'three';
import { assert, getModelFromStore, isMesh, Scene } from '@tgdf';

import { WorldObjectArgs } from '3D/types';
import { MODELS, WORLD_CELL_SIZE } from '3D/constants';

import { Flame } from './Flame';
export class DungeonWallTorch extends THREE.Mesh {
  constructor(scene: Scene, { cell }: WorldObjectArgs) {
    const torchModel = getModelFromStore(MODELS.DUNGEON_WALL_TORCH.id);
    assert(isMesh(torchModel));

    const { geometry, material } = torchModel;

    super(geometry, material);
    this.scale.multiplyScalar(0.1 * WORLD_CELL_SIZE);
    if (cell !== undefined) {
      this.rotateY(THREE.MathUtils.degToRad(-cell.rotation));
    }

    const torchFlame = new Flame(scene, { scale: 0.35 * WORLD_CELL_SIZE });
    torchFlame.position.set(0, 0.125 * WORLD_CELL_SIZE, 0.125 * WORLD_CELL_SIZE);

    this.add(torchFlame);
  }
}
