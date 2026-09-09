import * as THREE from 'three';

import { COLORS } from 'renderer/constants';
import { WorldObjectArgs } from 'renderer/3D/types';

import { createFlameParticlesGeometry } from './flameGeometry';
import { createFlameMaterial, updateFlameMaterialTime, FlameMaterial } from './flameMaterial';

export type FlameOptions = WorldObjectArgs & {
  scale?: number;
  color?: THREE.ColorRepresentation;
  particleCount?: number;
  shared?: boolean;
};

export const DEFAULT_FLAME_PARTICLE_COUNT = 64;

let sharedGeometry: THREE.BufferGeometry | null = null;
let sharedMaterial: FlameMaterial | null = null;

function resolveSharedGeometry(particleCount: number): THREE.BufferGeometry {
  if (!sharedGeometry) {
    sharedGeometry = createFlameParticlesGeometry(particleCount);
  }
  return sharedGeometry;
}

function resolveSharedMaterial(): FlameMaterial {
  if (!sharedMaterial) {
    sharedMaterial = createFlameMaterial(COLORS.ORANGE);
  }
  return sharedMaterial;
}

function syncTime(material: FlameMaterial): void {
  updateFlameMaterialTime(material, performance.now() * 0.001);
}

export class Flame extends THREE.Mesh<THREE.BufferGeometry, FlameMaterial> {
  private readonly _ownsResources: boolean;

  constructor(options: FlameOptions = {}) {
    const particleCount = options.particleCount ?? DEFAULT_FLAME_PARTICLE_COUNT;
    const useShared = options.shared ?? options.color === undefined;

    const geometry = useShared
      ? resolveSharedGeometry(particleCount)
      : createFlameParticlesGeometry(particleCount);
    const material = useShared
      ? resolveSharedMaterial()
      : createFlameMaterial(options.color ?? COLORS.ORANGE);

    super(geometry, material);

    this._ownsResources = !useShared;
    this.renderOrder = 10;

    if (options.scale !== undefined) {
      this.scale.setScalar(options.scale);
    }
  }

  override onBeforeRender(): void {
    syncTime(this.material);
  }

  setColor(color: THREE.ColorRepresentation): void {
    this.material.uniforms.uColor.value.set(color);
  }

  dispose(): void {
    if (this._ownsResources) {
      this.geometry.dispose();
      this.material.dispose();
    }
  }
}

export function createFlameInstancedMesh(
  count: number,
  options: Pick<FlameOptions, 'color' | 'particleCount'> = {}
): THREE.InstancedMesh<THREE.BufferGeometry, FlameMaterial> {
  const geometry = createFlameParticlesGeometry(
    options.particleCount ?? DEFAULT_FLAME_PARTICLE_COUNT
  );
  const material = createFlameMaterial(options.color ?? COLORS.ORANGE);

  const mesh = new THREE.InstancedMesh<THREE.BufferGeometry, FlameMaterial>(
    geometry,
    material,
    count
  );
  mesh.frustumCulled = false;
  mesh.onBeforeRender = () => syncTime(material);

  return mesh;
}
