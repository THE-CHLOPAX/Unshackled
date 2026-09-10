import * as THREE from 'three';

export type ColliderGeometryEntry = {
  geometry: THREE.BufferGeometry;
  matrix: THREE.Matrix4;
};

export function mergeCollidersIntoTrimeshGeometry(
  entries: ColliderGeometryEntry[]
): THREE.BufferGeometry | null {
  if (entries.length === 0) return null;

  const positions: number[] = [];
  const vertex = new THREE.Vector3();

  entries.forEach(({ geometry, matrix }) => {
    const nonIndexedGeometry = geometry.index ? geometry.toNonIndexed() : geometry;
    const positionAttribute = nonIndexedGeometry.getAttribute('position');

    for (let i = 0; i < positionAttribute.count; i++) {
      vertex.fromBufferAttribute(positionAttribute, i).applyMatrix4(matrix);
      positions.push(vertex.x, vertex.y, vertex.z);
    }

    if (nonIndexedGeometry !== geometry) nonIndexedGeometry.dispose();
  });

  const mergedGeometry = new THREE.BufferGeometry();
  mergedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

  return mergedGeometry;
}
