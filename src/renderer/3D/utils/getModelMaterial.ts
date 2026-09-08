import * as THREE from 'three';
import { assert, getModelFromStore, isMesh } from '@tgdf';

import { pixelateModelMaterial } from './pixelateModelMaterial';

export function getModelMaterial(modelId: string): THREE.Material | THREE.Material[] {
  const model = getModelFromStore(modelId);
  assert(isMesh(model), `Source model with id: ${modelId} is not a mesh`);
  pixelateModelMaterial(model.material);
  return model.material;
}
