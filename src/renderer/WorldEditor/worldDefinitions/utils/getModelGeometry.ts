import * as THREE from 'three';
import { assert, getModelFromStore, isMesh } from '@tgdf';

export function getModelGeometry(modelId: string): THREE.BufferGeometry {
  const model = getModelFromStore(modelId);
  assert(isMesh(model), `Source model with id: ${modelId} is not a mesh`);

  return model.geometry;
}
