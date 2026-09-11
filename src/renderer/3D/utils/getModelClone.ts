import * as THREE from 'three';
import { assert, getModelFromStore } from '@tgdf';

export function getModelClone(modelId: string): THREE.Object3D {
  const model = getModelFromStore(modelId);
  assert(model !== undefined, `Model with id: ${modelId} is not present in asset store`);

  return model;
}
