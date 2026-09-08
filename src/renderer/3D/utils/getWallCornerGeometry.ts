import * as THREE from 'three';
import { assert, getModelFromStore, isMesh } from '@tgdf';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';

import { MODEL_NATIVE_TILE_SIZE } from '../constants';

export function getWallCornerGeometry(modelId: string): THREE.BufferGeometry {
  const model = getModelFromStore(modelId);
  assert(isMesh(model));

  const HALF = MODEL_NATIVE_TILE_SIZE / 2;
  const { geometry } = model;

  const wallA = geometry.clone();

  const wallB = geometry.clone();
  wallB.rotateZ(-Math.PI / 2);
  wallB.translate(HALF, -HALF, 0);

  return mergeGeometries([wallA, wallB]);
}
