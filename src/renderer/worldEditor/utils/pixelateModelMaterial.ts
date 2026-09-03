import * as THREE from 'three';

import { pixelateTexture } from '3D/utils/pixelateTexture';

export function pixelateModelMaterial(material: THREE.Material | THREE.Material[]): void {
  const materials = Array.isArray(material) ? material : [material];
  materials.forEach((mat) => {
    if ('map' in mat && mat.map instanceof THREE.Texture) {
      pixelateTexture(mat.map);
    }
  });
}
