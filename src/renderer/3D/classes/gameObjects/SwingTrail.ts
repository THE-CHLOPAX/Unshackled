import * as THREE from 'three';
import { GameObject, ResourceTracker, Scene } from '@tgdf';

export type SwingTrailOptions = {
  target: THREE.Object3D;
  durationMs: number;
  pointLifetimeMs?: number;
  width?: number;
  color?: THREE.ColorRepresentation;
  maxPoints?: number;
};

const DEFAULT_POINT_LIFETIME_MS = 180;
const DEFAULT_WIDTH = 0.15;
const DEFAULT_COLOR: THREE.ColorRepresentation = 0xffffff;
const DEFAULT_MAX_POINTS = 16;

let sharedMaterial: THREE.MeshBasicMaterial | null = null;

function resolveSharedMaterial(): THREE.MeshBasicMaterial {
  if (!sharedMaterial) {
    sharedMaterial = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    ResourceTracker.markPersistent(sharedMaterial);
  }
  return sharedMaterial;
}

export function createSwingTrailWarmupMesh(): THREE.Mesh {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(12), 4));
  geometry.setIndex([0, 1, 2]);
  return new THREE.Mesh(geometry, resolveSharedMaterial());
}

const _cameraForward = new THREE.Vector3();
const _tangent = new THREE.Vector3();
const _offset = new THREE.Vector3();
const _samplePosition = new THREE.Vector3();

export class SwingTrail extends GameObject {
  private readonly _mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
  private readonly _positionAttribute: THREE.BufferAttribute;
  private readonly _colorAttribute: THREE.BufferAttribute;

  private readonly _target: THREE.Object3D;
  private readonly _width: number;
  private readonly _pointLifetimeMs: number;
  private readonly _maxPoints: number;
  private readonly _samplingEndsAt: number;
  private readonly _color = new THREE.Color();

  private readonly _pointPositions: THREE.Vector3[];
  private readonly _pointTimestamps: Float32Array;
  private _head = 0;
  private _count = 0;

  constructor(scene: Scene, options: SwingTrailOptions) {
    super({ scene });

    this._target = options.target;
    this._width = options.width ?? DEFAULT_WIDTH;
    this._pointLifetimeMs = options.pointLifetimeMs ?? DEFAULT_POINT_LIFETIME_MS;
    this._maxPoints = Math.max(2, options.maxPoints ?? DEFAULT_MAX_POINTS);
    this._samplingEndsAt = performance.now() + options.durationMs;
    this._color.set(options.color ?? DEFAULT_COLOR);

    this._pointPositions = Array.from({ length: this._maxPoints }, () => new THREE.Vector3());
    this._pointTimestamps = new Float32Array(this._maxPoints);

    const geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(this._maxPoints * 2 * 3);
    const colors = new Float32Array(this._maxPoints * 2 * 4);
    const indices = new Uint16Array((this._maxPoints - 1) * 6);

    for (let i = 0; i < this._maxPoints - 1; i++) {
      const a = i * 2;
      const b = i * 2 + 1;
      const c = (i + 1) * 2;
      const d = (i + 1) * 2 + 1;
      const base = i * 6;

      indices[base] = a;
      indices[base + 1] = b;
      indices[base + 2] = c;
      indices[base + 3] = b;
      indices[base + 4] = d;
      indices[base + 5] = c;
    }

    this._positionAttribute = new THREE.BufferAttribute(positions, 3).setUsage(
      THREE.DynamicDrawUsage
    );
    this._colorAttribute = new THREE.BufferAttribute(colors, 4).setUsage(THREE.DynamicDrawUsage);

    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.setAttribute('position', this._positionAttribute);
    geometry.setAttribute('color', this._colorAttribute);
    geometry.setDrawRange(0, 0);

    this._mesh = new THREE.Mesh(geometry, resolveSharedMaterial());
    this._mesh.frustumCulled = false;
    this.add(this._mesh);

    this.toggleInput(false);
  }

  protected override onUpdate(): void {
    const now = performance.now();

    this._pruneExpiredPoints(now);

    if (now <= this._samplingEndsAt) {
      this._target.getWorldPosition(_samplePosition);
      this._pointPositions[this._head].copy(_samplePosition);
      this._pointTimestamps[this._head] = now;
      this._head = (this._head + 1) % this._maxPoints;
      this._count = Math.min(this._count + 1, this._maxPoints);
    }

    this._rebuildGeometry(now);

    if (this._count === 0 && now > this._samplingEndsAt) {
      this.scene.remove(this);
    }
  }

  private _pruneExpiredPoints(now: number): void {
    while (this._count > 0) {
      const oldestIndex = (this._head - this._count + this._maxPoints) % this._maxPoints;
      if (now - this._pointTimestamps[oldestIndex] <= this._pointLifetimeMs) break;
      this._count -= 1;
    }
  }

  private _rebuildGeometry(now: number): void {
    if (this._count < 2) {
      this._mesh.geometry.setDrawRange(0, 0);
      return;
    }

    this.scene.camera.getWorldDirection(_cameraForward);

    const oldestIndex = (this._head - this._count + this._maxPoints) % this._maxPoints;
    const positions = this._positionAttribute.array as Float32Array;
    const colors = this._colorAttribute.array as Float32Array;

    for (let i = 0; i < this._count; i++) {
      const pointIndex = (oldestIndex + i) % this._maxPoints;
      const point = this._pointPositions[pointIndex];
      const age = now - this._pointTimestamps[pointIndex];
      const alpha = Math.max(0, 1 - age / this._pointLifetimeMs);

      const prevIndex = i === 0 ? pointIndex : (oldestIndex + i - 1) % this._maxPoints;
      const nextIndex =
        i === this._count - 1 ? pointIndex : (oldestIndex + i + 1) % this._maxPoints;

      _tangent.subVectors(this._pointPositions[nextIndex], this._pointPositions[prevIndex]);
      if (_tangent.lengthSq() < 1e-8) _tangent.set(1, 0, 0);
      else _tangent.normalize();

      _offset.crossVectors(_cameraForward, _tangent);
      if (_offset.lengthSq() < 1e-8) _offset.set(0, 1, 0);
      else _offset.normalize();
      _offset.multiplyScalar((this._width / 2) * alpha);

      const vertexBase = i * 2 * 3;
      positions[vertexBase] = point.x + _offset.x;
      positions[vertexBase + 1] = point.y + _offset.y;
      positions[vertexBase + 2] = point.z + _offset.z;
      positions[vertexBase + 3] = point.x - _offset.x;
      positions[vertexBase + 4] = point.y - _offset.y;
      positions[vertexBase + 5] = point.z - _offset.z;

      const colorBase = i * 2 * 4;
      colors[colorBase] = this._color.r;
      colors[colorBase + 1] = this._color.g;
      colors[colorBase + 2] = this._color.b;
      colors[colorBase + 3] = alpha;
      colors[colorBase + 4] = this._color.r;
      colors[colorBase + 5] = this._color.g;
      colors[colorBase + 6] = this._color.b;
      colors[colorBase + 7] = alpha;
    }

    this._positionAttribute.needsUpdate = true;
    this._colorAttribute.needsUpdate = true;
    this._mesh.geometry.setDrawRange(0, (this._count - 1) * 6);
  }
}
