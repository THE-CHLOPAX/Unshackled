import * as THREE from 'three';

const QUAD_CORNERS: ReadonlyArray<readonly [number, number]> = [
  [-0.5, -0.5],
  [0.5, -0.5],
  [0.5, 0.5],
  [-0.5, -0.5],
  [0.5, 0.5],
  [-0.5, 0.5],
];

const VERTICES_PER_PARTICLE = QUAD_CORNERS.length;

export const FLAME_BOUNDING_RADIUS = 4;

export function createFlameParticlesGeometry(
  particleCount: number,
  random: () => number = Math.random
): THREE.BufferGeometry {
  const count = Math.max(1, Math.floor(particleCount));
  const vertexCount = count * VERTICES_PER_PARTICLE;

  const positions = new Float32Array(vertexCount * 3);
  const seeds = new Float32Array(vertexCount);

  for (let particle = 0; particle < count; particle++) {
    const seed = random();

    for (let corner = 0; corner < VERTICES_PER_PARTICLE; corner++) {
      const vertex = particle * VERTICES_PER_PARTICLE + corner;
      const [cornerX, cornerY] = QUAD_CORNERS[corner];

      positions[vertex * 3 + 0] = cornerX;
      positions[vertex * 3 + 1] = cornerY;
      positions[vertex * 3 + 2] = 0;
      seeds[vertex] = seed;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1.5, 0), FLAME_BOUNDING_RADIUS);
  geometry.boundingBox = new THREE.Box3(
    new THREE.Vector3(-FLAME_BOUNDING_RADIUS, -1, -FLAME_BOUNDING_RADIUS),
    new THREE.Vector3(FLAME_BOUNDING_RADIUS, FLAME_BOUNDING_RADIUS, FLAME_BOUNDING_RADIUS)
  );

  return geometry;
}
