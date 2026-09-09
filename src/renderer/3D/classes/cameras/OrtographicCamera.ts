import * as THREE from 'three';
import { filterBelow, logger, SceneCamera } from '@tgdf';
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise';

import { CameraMoveToOptions } from './types';
import { CAMERA_POSITION_OFFSET } from '../../constants';

const DEFAULT_CAMERA_LERP = 0.025;
const SHAKE_DAMPING_FACTOR = 0.97;
const FRAMERATE_DAMPING_FACTOR = 160; // 0.97 / 0.006s @144Hz
const SHAKE_FREQUENCY = 10;

export type OrtographicCameraOptions = {
  left?: number | undefined;
  right?: number | undefined;
  top?: number | undefined;
  bottom?: number | undefined;
  near?: number | undefined;
  far?: number | undefined;
  offset?: THREE.Vector3;
  zoom?: {
    min: number;
    max: number;
  };
};

/**
 * Ortographic Camera class.
 * Extends THREE.OrthographicCamera.
 *
 * The camera always sits at `pivotPoint + offset` and looks at `pivotPoint` - both are
 * recomputed every frame in update(), so nothing else needs to keep them in sync. Use
 * moveTo() to move the pivot point directly, or follow() to track a target's position.
 * @param {OrtographicCameraOptions} options - The options for the ortographic camera.
 */
export class OrtographicCamera extends THREE.OrthographicCamera implements SceneCamera {
  private _zoom: { min: number; max: number } = { min: 0.1, max: 1 };
  private _pivotPoint: THREE.Vector3 = new THREE.Vector3();
  private _offset: THREE.Vector3;
  private _followTarget: THREE.Object3D | null = null;

  private _noise = new ImprovedNoise();
  private _shakeOffset: THREE.Vector3 = new THREE.Vector3();
  private _shakeIntensity: number = 0;
  private _shakeTime: number = 0;

  constructor(options: OrtographicCameraOptions = {}) {
    super(
      options.left ?? -1,
      options.right ?? 1,
      options.top ?? 1,
      options.bottom ?? -1,
      options.near ?? 0.1,
      options.far ?? 1000
    );

    if (options.zoom) {
      this._zoom = options.zoom;
    }

    this._offset = options.offset?.clone() ?? CAMERA_POSITION_OFFSET.clone();

    this.rotation.order = 'YXZ';
    this.up.set(0, 1, 0);

    this._applyTransform();
  }

  public get pivotPoint(): THREE.Vector3 {
    return this._pivotPoint;
  }

  public set pivotPoint(point: THREE.Vector3) {
    this._pivotPoint.copy(point);
  }

  public get offset(): THREE.Vector3 {
    return this._offset;
  }

  public set offset(offset: THREE.Vector3) {
    this._offset.copy(offset);
  }

  public addShake(intensity: number): void {
    if (intensity <= 0) {
      logger({
        message: `Camera shake intensity must be greater than 0. Received: ${intensity}`,
        type: 'warn',
      });
      return;
    }
    this._shakeIntensity += intensity;
  }

  public setZoomMax(max: number): void {
    this._zoom.max = max;
  }

  public setZoomMin(min: number): void {
    this._zoom.min = min;
  }

  public setZoom(zoom: number): void {
    this.zoom = THREE.MathUtils.clamp(zoom, this._zoom.min, this._zoom.max);
    this.updateProjectionMatrix();
  }

  // Moves the pivot point to the given position (optionally smoothed). The camera itself
  // follows automatically, since it's always positioned at pivotPoint + offset.
  public moveTo(position: THREE.Vector3, options?: CameraMoveToOptions): void {
    if (options?.lerp) {
      this._pivotPoint.lerp(position, options.lerp);
    } else {
      this._pivotPoint.copy(position);
    }
  }

  public follow(target: THREE.Object3D): void {
    this._followTarget = target;
    this._pivotPoint.copy(target.position);
  }

  public stopFollowing(): void {
    this._followTarget = null;
  }

  public update(deltaTime: number): void {
    this._followCameraTarget();
    this._applyCameraShake(deltaTime);
    this._applyTransform();
  }

  // Keeps the camera at pivotPoint + offset (plus any shake) and always looking at the
  // pivot point.
  private _applyTransform(): void {
    this.position.copy(this._pivotPoint).add(this._offset).add(this._shakeOffset);
    this.lookAt(this._pivotPoint);
  }

  private _followCameraTarget(): void {
    if (!this._followTarget) return;

    this.moveTo(this._followTarget.position, { lerp: DEFAULT_CAMERA_LERP });
  }

  private _applyCameraShake(deltaTime: number): void {
    if (this._shakeIntensity <= 0) {
      this._shakeOffset.set(0, 0, 0);
      this._shakeTime = 0;
      return;
    }

    this._shakeTime += deltaTime;

    const shake = this._shakeIntensity;
    const nx = this._noise.noise(this._shakeTime * SHAKE_FREQUENCY, 0, 0);
    const ny = this._noise.noise(this._shakeTime * SHAKE_FREQUENCY, 100, 0);

    this._shakeOffset.set(nx * shake, ny * shake, 0);

    const framerateAdjustedShakeDampingFactor = Math.min(
      SHAKE_DAMPING_FACTOR / (deltaTime * FRAMERATE_DAMPING_FACTOR),
      1
    );

    // Dampen the shake intensity over time
    this._shakeIntensity = filterBelow(
      this._shakeIntensity * framerateAdjustedShakeDampingFactor,
      0.01
    );
  }
}
