import * as THREE from 'three';
import { NavMesh, NavMeshQuery } from '@recast-navigation/core';

export function getRandomNavMeshPointInRadius(
  navMesh: NavMesh,
  center: THREE.Vector3,
  radius: number
): THREE.Vector3 | null {
  const navMeshQuery = new NavMeshQuery(navMesh);

  const result = navMeshQuery.findRandomPointAroundCircle(center, radius);

  if (result.success) {
    const randomPoint = result.randomPoint; // { x: number, y: number, z: number }
    // Convert to THREE.Vector3
    const randomVector3 = new THREE.Vector3(randomPoint.x, randomPoint.y, randomPoint.z);
    return randomVector3;
  }

  return null;
}
