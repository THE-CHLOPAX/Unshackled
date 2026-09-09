import * as THREE from 'three';

/** A minimal SkinnedMesh ready to compile with USE_SKINNING — geometry fully
 * weighted to one bone, already bound. Never actually posed. */
export function createSkinnedMesh(material: THREE.Material): THREE.SkinnedMesh {
  const geometry = new THREE.PlaneGeometry(0.2, 0.2);
  const vertexCount = geometry.attributes.position.count;

  const skinIndex = new Uint16Array(vertexCount * 4);
  const skinWeight = new Float32Array(vertexCount * 4);
  for (let i = 0; i < vertexCount; i++) skinWeight[i * 4] = 1;

  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndex, 4));
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeight, 4));

  const mesh = new THREE.SkinnedMesh(geometry, material);
  mesh.bind(new THREE.Skeleton([new THREE.Bone()]));
  return mesh;
}
