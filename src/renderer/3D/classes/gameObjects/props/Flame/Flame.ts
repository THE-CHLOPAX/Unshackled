import * as THREE from 'three';
import { GameObject, logger, ResourceTracker, Scene } from '@tgdf';

import { COLORS } from 'renderer/constants';
import { WorldObjectArgs } from 'renderer/3D/types';

import { createFlameParticlesGeometry } from './flameGeometry';
import { createFlameMaterial, updateFlameMaterialTime, FlameMaterial } from './flameMaterial';

export type FlameLightOptions = {
  useLightPool: boolean;
  color: THREE.ColorRepresentation;
  intensity: number;
  distance: number;
  decay: number;
};

export type FlameOptions = WorldObjectArgs & {
  scale?: number;
  color?: THREE.ColorRepresentation;
  particleCount?: number;
  shared?: boolean;
  light?: Partial<FlameLightOptions>;
};

export const DEFAULT_FLAME_PARTICLE_COUNT = 64;

export const DEFAULT_FLAME_LIGHT_OPTIONS: FlameLightOptions = {
  useLightPool: false,
  color: COLORS.ORANGE,
  intensity: 4,
  distance: 15,
  decay: 0.2,
};

const FLAME_RENDER_ORDER = 10;

const TIME_SYNC_MIN_INTERVAL_MS = 4;

let sharedGeometry: THREE.BufferGeometry | null = null;
let sharedMaterial: FlameMaterial | null = null;

const lastTimeSyncMs = new WeakMap<FlameMaterial, number>();

function resolveSharedGeometry(particleCount: number): THREE.BufferGeometry {
  if (!sharedGeometry) {
    sharedGeometry = createFlameParticlesGeometry(particleCount);
    ResourceTracker.markPersistent(sharedGeometry);
  }
  return sharedGeometry;
}

function resolveSharedMaterial(): FlameMaterial {
  if (!sharedMaterial) {
    sharedMaterial = createFlameMaterial(COLORS.ORANGE);
    ResourceTracker.markPersistent(sharedMaterial);
  }
  return sharedMaterial;
}

function syncTime(material: FlameMaterial): void {
  const now = performance.now();
  const last = lastTimeSyncMs.get(material);
  if (last !== undefined && now - last < TIME_SYNC_MIN_INTERVAL_MS) return;
  lastTimeSyncMs.set(material, now);
  updateFlameMaterialTime(material, now * 0.001);
}

function applyLightOptions(light: THREE.PointLight, options: FlameLightOptions): void {
  light.color.set(options.color);
  light.intensity = options.intensity;
  light.distance = options.distance;
  light.decay = options.decay;
}

export class Flame extends GameObject {
  private readonly _mesh: THREE.Mesh<THREE.BufferGeometry, FlameMaterial>;
  private readonly _ownsResources: boolean;
  private readonly _lightOptions: FlameLightOptions;
  private _pooledLight: THREE.PointLight | null = null;
  private _ownLight: THREE.PointLight | null = null;

  constructor(scene: Scene, options: FlameOptions = {}) {
    super({ scene });

    const particleCount = options.particleCount ?? DEFAULT_FLAME_PARTICLE_COUNT;
    const useShared = options.shared ?? options.color === undefined;

    this._ownsResources = !useShared;
    this._lightOptions = { ...DEFAULT_FLAME_LIGHT_OPTIONS, ...options.light };

    const geometry = useShared
      ? resolveSharedGeometry(particleCount)
      : createFlameParticlesGeometry(particleCount);
    const material = useShared
      ? resolveSharedMaterial()
      : createFlameMaterial(options.color ?? COLORS.ORANGE);

    this._mesh = new THREE.Mesh(geometry, material);
    this._mesh.renderOrder = FLAME_RENDER_ORDER;
    this.add(this._mesh);

    this.toggleInput(false);

    if (options.scale !== undefined) {
      this.scale.setScalar(options.scale);
    }

    this.addEventListener('removed', this._handleRemoved);
  }

  private _handleRemoved = (): void => {
    if (this.parent === null) this.destroy();
  };

  protected override onAwake(): void {
    if (this._lightOptions.useLightPool) {
      this._pooledLight = this.scene.lightPool.acquire(this);
      if (this._pooledLight === null) {
        logger({ type: 'warn', message: '[Flame] Unable to acquire light from pool' });
        return;
      }
      applyLightOptions(this._pooledLight, this._lightOptions);
      return;
    }

    this._ownLight = new THREE.PointLight();
    applyLightOptions(this._ownLight, this._lightOptions);
    this.add(this._ownLight);
  }

  protected override onUpdate(): void {
    syncTime(this._mesh.material);
  }

  protected override onDestroyed(): void {
    this.removeEventListener('removed', this._handleRemoved);

    if (this._pooledLight !== null) {
      this.scene.lightPool.release(this._pooledLight);
      this._pooledLight = null;
    }
    this._ownLight = null;

    if (this._ownsResources) {
      this._mesh.geometry.dispose();
      this._mesh.material.dispose();
    }
  }

  setColor(color: THREE.ColorRepresentation): void {
    this._mesh.material.uniforms.uColor.value.set(color);
    this._pooledLight?.color.set(color);
    this._ownLight?.color.set(color);
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
