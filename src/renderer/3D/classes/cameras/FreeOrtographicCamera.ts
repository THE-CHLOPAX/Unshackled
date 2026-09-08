import { Input } from '@tgdf';
import * as THREE from 'three';

import { OrtographicCamera, OrtographicCameraOptions } from './OrtographicCamera';

const WORLD_UP = new THREE.Vector3(0, 1, 0);
const DEFAULT_PAN_SPEED = 18;

export type FreeOrtographicCameraOptions = OrtographicCameraOptions & {
  panSpeed?: number;
};

export class FreeOrtographicCamera extends OrtographicCamera {
  private _panSpeed: number;
  private _forward = new THREE.Vector3();
  private _right = new THREE.Vector3();
  private _panDelta = new THREE.Vector3();

  constructor(options: FreeOrtographicCameraOptions = {}) {
    super(options);
    this._panSpeed = options.panSpeed ?? DEFAULT_PAN_SPEED;
  }

  public override update(deltaTime: number): void {
    this._panFromKeyboard(deltaTime);
    super.update(deltaTime);
  }

  private _panFromKeyboard(deltaTime: number): void {
    const { keyboard } = Input.getState();

    const forwardAxis =
      (keyboard.isKeyPressed('KeyW') ? 1 : 0) - (keyboard.isKeyPressed('KeyS') ? 1 : 0);
    const strafeAxis =
      (keyboard.isKeyPressed('KeyD') ? 1 : 0) - (keyboard.isKeyPressed('KeyA') ? 1 : 0);

    if (forwardAxis === 0 && strafeAxis === 0) return;

    this._forward.set(-this.offset.x, 0, -this.offset.z);
    if (this._forward.lengthSq() === 0) this._forward.set(0, 0, -1);
    this._forward.normalize();
    this._right.crossVectors(this._forward, WORLD_UP).normalize();

    this._panDelta
      .set(0, 0, 0)
      .addScaledVector(this._forward, forwardAxis)
      .addScaledVector(this._right, strafeAxis)
      .normalize()
      .multiplyScalar(this._panSpeed * deltaTime);

    this.moveTo(this.pivotPoint.clone().add(this._panDelta));
  }
}
