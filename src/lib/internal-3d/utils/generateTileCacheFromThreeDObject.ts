import * as THREE from 'three';
import { isMesh, logger } from '@tgdf';
import { DebugDrawer, threeToTileCache } from '@recast-navigation/three';

export type generateTileCacheFromThreeDObjectOptions = Parameters<typeof threeToTileCache>[1];

export function generateTileCacheFromThreeDObject(
  object: THREE.Object3D,
  options?: generateTileCacheFromThreeDObjectOptions
) {
  object.updateWorldMatrix(true, true);

  const meshChildren: THREE.Mesh[] = [];
  const expandedInstanceMeshes: THREE.Mesh[] = [];

  object.traverse((child) => {
    if (child instanceof THREE.InstancedMesh) {
      const instanceWorldMatrix = new THREE.Matrix4();

      for (let i = 0; i < child.count; i++) {
        child.getMatrixAt(i, instanceWorldMatrix);
        instanceWorldMatrix.premultiply(child.matrixWorld);

        const bakedGeometry = child.geometry.clone().applyMatrix4(instanceWorldMatrix);
        expandedInstanceMeshes.push(new THREE.Mesh(bakedGeometry));
      }
      return;
    }

    if (isMesh(child)) {
      meshChildren.push(child);
    }
  });

  const meshesForTileCache = [...meshChildren, ...expandedInstanceMeshes];

  const { success, navMesh, tileCache } = threeToTileCache(meshesForTileCache, {
    ...options,
    tileSize: options?.tileSize || 16,
  });

  expandedInstanceMeshes.forEach((mesh) => mesh.geometry.dispose());

  if (!success) {
    logger({ message: 'Failed to generate nav mesh from the provided 3D object.', type: 'error' });
    return { navMesh: null, debugNavMesh: null, tileCache: null };
  }

  const debugNavMesh = new DebugDrawer();
  debugNavMesh.drawNavMesh(navMesh);

  return { tileCache, navMesh, debugNavMesh };
}
