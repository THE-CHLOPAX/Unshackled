import * as THREE from 'three';
import { logger } from '@tgdf/internal-ui/utils/logger';

import { RigidBody } from '../RigidBody';
import { GameObjectComponent } from '../GameObjectComponent';
import { GameObject } from '../../internal-3d/GameObject/GameObject';
import { MOVE_TO_ARRIVAL_THRESHOLD, MOVEMENT_CONTROLLER_MESSAGES } from './constants';

export const ROTATION_LERP_FACTOR = 0.1;
export const DEFAULT_SPRINT_SPEED_MULTIPLIER = 1.5;
export const DEFAULT_WALK_SPEED_MULTIPLIER = 0.5;

export type MovementControllerOptions = {
  defaultSpeed: number;
  sprintSpeed?: number;
  walkSpeed?: number;
};

// Module scoped, allocated once to avoid allocating new vectors
// and eulers every frame, which could cause GC overhead.
// These are used for temporary calculations.
const _tempVector = new THREE.Vector3();
const _tempVelocity = new THREE.Vector3();
const _tempEuler = new THREE.Euler();

export class MovementController extends GameObjectComponent<MovementControllerOptions> {
  private _rigidBody: RigidBody;
  private _defaultSpeed: number;
  private _sprintSpeed: number;
  private _walkSpeed: number;

  private _currentSpeed: number;
  private _movementDisabled: boolean = false;
  private _currentRotation: number = 0;

  private _currentMoveToTarget: THREE.Vector3 | null = null;
  private _currentMoveToSpeed: number;
  private _currentMoveToResolve: (() => void) | null = null;
  private _currentMoveToReject: ((reason?: unknown) => void) | null = null;

  private _currentPath: THREE.Vector3[] | null = null;
  private _currentPathIndex: number = 0;
  private _currentPathResolve: (() => void) | null = null;
  private _currentPathReject: ((reason?: unknown) => void) | null = null;

  constructor(gameObject: GameObject, rigidBody: RigidBody, options: MovementControllerOptions) {
    super(gameObject, options);

    this._rigidBody = rigidBody;
    this._defaultSpeed = options.defaultSpeed;
    this._sprintSpeed =
      options.sprintSpeed ?? options.defaultSpeed * DEFAULT_SPRINT_SPEED_MULTIPLIER;
    this._walkSpeed = options.walkSpeed ?? options.defaultSpeed * DEFAULT_WALK_SPEED_MULTIPLIER;
    this._currentSpeed = this._defaultSpeed;
    this._currentMoveToSpeed = this._defaultSpeed;
  }

  public get currentSpeed(): number {
    return this._currentSpeed;
  }

  public get defaultSpeed(): number {
    return this._defaultSpeed;
  }

  public get sprintSpeed(): number {
    return this._sprintSpeed;
  }

  public get walkSpeed(): number {
    return this._walkSpeed;
  }

  public get velocity(): THREE.Vector3 {
    return this._rigidBody.getLinearVelocity();
  }

  public get isMoving(): boolean {
    return this.velocity.length() > 0.1;
  }

  public get movementDisabled(): boolean {
    return this._movementDisabled;
  }

  public toggleSprint(enabled: boolean): void {
    this._currentSpeed = enabled ? this._sprintSpeed : this._defaultSpeed;
  }

  public toggleMovementDisabled(disabled: boolean): void {
    this._movementDisabled = disabled;
  }

  public move(direction: THREE.Vector3, speed = this._currentSpeed): void {
    if (this._movementDisabled) {
      logger({
        message: MOVEMENT_CONTROLLER_MESSAGES.MOVEMENT_DISABLED,
        type: 'warn',
      });
      return;
    }

    this._moveRigidbody(direction, speed);
  }

  public moveTo(position: THREE.Vector3, speed = this._defaultSpeed): Promise<void> {
    this._rejectMovement();

    const moveToPromise = new Promise<void>((resolve, reject) => {
      this._currentMoveToTarget = position.clone();
      this._currentMoveToSpeed = speed;
      this._currentMoveToResolve = resolve;
      this._currentMoveToReject = reject;
    });

    moveToPromise.catch(() => {});

    return moveToPromise;
  }

  public resetMoveTo(): void {
    this._rejectMovement();
  }

  public moveAlongPath(path: THREE.Vector3[], speed = this._defaultSpeed): Promise<void> {
    if (path.length === 0) {
      logger({
        message: MOVEMENT_CONTROLLER_MESSAGES.PATH_LENGTH_INVALID,
        type: 'warn',
      });
      return Promise.resolve();
    }

    if (this._movementDisabled) {
      logger({
        message: MOVEMENT_CONTROLLER_MESSAGES.MOVEMENT_DISABLED,
        type: 'warn',
      });
      return Promise.resolve();
    }

    this._rejectMovement();

    const moveAlongPathPromise = new Promise<void>((resolve, reject) => {
      this._currentPath = path;
      this._currentPathIndex = 0;
      this._currentPathResolve = resolve;
      this._currentPathReject = reject;

      this._currentMoveToTarget = path[0].clone();
      this._currentMoveToSpeed = speed;
    });

    moveAlongPathPromise.catch(() => {});

    return moveAlongPathPromise;
  }

  public rotate(angle: number): void;
  public rotate(direction: THREE.Vector3): void;
  public rotate(directionOrAngle: THREE.Vector3 | number): void {
    // Argument is a angle in radians
    if (typeof directionOrAngle === 'number') {
      this._currentRotation = directionOrAngle;
      _tempEuler.set(0, this._currentRotation, 0);
      this._rigidBody.setEulerRotation(_tempEuler);
      return;
    }

    // Argument is a direction vector
    const direction = directionOrAngle as THREE.Vector3;
    if (direction.x !== 0 || direction.z !== 0) {
      const targetRotation = Math.atan2(direction.x, direction.z);
      const delta = targetRotation - this._currentRotation;
      const shortestAngle = Math.atan2(Math.sin(delta), Math.cos(delta));
      this._currentRotation += shortestAngle * ROTATION_LERP_FACTOR;
    }
    _tempEuler.set(0, this._currentRotation, 0);
    this._rigidBody.setEulerRotation(_tempEuler);
  }

  public rotateTowardsPosition(position: THREE.Vector3): void {
    _tempVector.copy(position).sub(this.gameObject.position);
    _tempVector.y = 0;
    _tempVector.normalize();

    this.rotate(_tempVector);
  }

  protected override onUpdate(_deltaTime: number): void {
    if (!this._currentMoveToTarget) return;

    if (this._movementDisabled) {
      this._rejectMovement();
      return;
    }

    const distanceToTarget = this._getHorizontalDistanceTo(this._currentMoveToTarget);
    if (distanceToTarget <= MOVE_TO_ARRIVAL_THRESHOLD) {
      this._handleArrival();
      return;
    }

    _tempVector.copy(this._currentMoveToTarget).sub(this.gameObject.position);
    _tempVector.y = 0;
    _tempVector.normalize();

    this.move(_tempVector, this._currentMoveToSpeed);
  }

  private _moveRigidbody(direction: THREE.Vector3, speed = this._currentSpeed): void {
    _tempVelocity.copy(direction).multiplyScalar(speed);
    _tempVelocity.y = this._rigidBody.getLinearVelocity().y;

    this.rotate(direction);

    this._rigidBody.setLinearVelocity(_tempVelocity);
  }

  private _getHorizontalDistanceTo(target: THREE.Vector3): number {
    const dx = this.gameObject.position.x - target.x;
    const dz = this.gameObject.position.z - target.z;

    return Math.sqrt(dx * dx + dz * dz);
  }

  private _handleArrival(): void {
    if (this._currentPath) {
      this._currentPathIndex++;
      if (this._currentPathIndex === this._currentPath.length) {
        this._currentPathResolve?.();
        this._clearPathState();
        this._clearMoveToState();
        this._stopHorizontalMovement();
        return;
      }

      this._currentMoveToTarget = this._currentPath[this._currentPathIndex].clone();
      return;
    }

    this._currentMoveToResolve?.();
    this._clearMoveToState();
    this._stopHorizontalMovement();
  }

  private _rejectMovement(): void {
    const cancelledError = new Error(MOVEMENT_CONTROLLER_MESSAGES.MOVE_TO_CANCELLED);

    if (this._currentPath) {
      this._currentPathReject?.(cancelledError);
      this._clearPathState();
    }

    this._currentMoveToReject?.(cancelledError);
    this._clearMoveToState();
    this._stopHorizontalMovement();
  }

  private _clearMoveToState(): void {
    this._currentMoveToTarget = null;
    this._currentMoveToResolve = null;
    this._currentMoveToReject = null;
    this._currentMoveToSpeed = this._defaultSpeed;
  }

  private _clearPathState(): void {
    this._currentPath = null;
    this._currentPathIndex = 0;
    this._currentPathResolve = null;
    this._currentPathReject = null;
  }

  private _stopHorizontalMovement(): void {
    const velocity = this._rigidBody.getLinearVelocity();
    velocity.x = 0;
    velocity.z = 0;
    this._rigidBody.setLinearVelocity(velocity);
  }
}
