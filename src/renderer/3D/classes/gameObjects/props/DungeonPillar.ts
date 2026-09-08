import * as THREE from 'three';
import { assert, getModelFromStore, isMesh } from '@tgdf';

import { MODELS } from '3D/constants';

export class DungeonPillar extends THREE.Mesh {
  constructor() {
    const pillarModel = getModelFromStore(MODELS.DUNGEON_PILLAR.id);
    assert(isMesh(pillarModel));

    const { geometry, material } = pillarModel;

    super(geometry, material);
  }
}
