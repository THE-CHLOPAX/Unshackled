import * as THREE from 'three';
import { assert, getModelFromStore, isMesh } from '@tgdf';

import { pixelateModelMaterial } from './pixelateModelMaterial';

export function getModelMaterial(modelId: string): THREE.Material | THREE.Material[] {
  const model = getModelFromStore(modelId);
  assert(model !== undefined, `Model with id: ${modelId} not found in asset store`);

  const materials: THREE.Material[] = [];
  model.traverse((child) => {
    if (!isMesh(child)) return;
    if (Array.isArray(child.material)) {
      materials.push(...child.material);
    } else {
      materials.push(child.material);
    }
  });

  assert(materials.length > 0, `No mesh materials found in model with id: ${modelId}`);

  const result = materials.length === 1 ? materials[0] : materials;
  pixelateModelMaterial(result);

  return result;
}
