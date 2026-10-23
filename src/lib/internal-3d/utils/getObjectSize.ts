import * as THREE from 'three';

export function getObjectSize(object: THREE.Object3D): THREE.Vector3 {
  const size = new THREE.Vector3();
  const bbox = new THREE.Box3().setFromObject(object);
  bbox.getSize(size);
  return size;
}
