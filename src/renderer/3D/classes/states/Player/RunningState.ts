import * as THREE from 'three';
import { InputState, logger } from '@tgdf';

import { FMOD_EVENTS } from 'renderer/FMOD';

import { State } from '..';
import { AnimationClipNamesShared } from '../../../types';
import { Player } from '../../gameObjects/players/Player';
import { FMODLoopedSound } from '../../gameObjectComponents/FMODSoundController';

const FOOTSTEP_INTERVAL_MS = 400;

export class RunningState extends State {
  private _footsteps: FMODLoopedSound | null = null;

  constructor(public entity: Player) {
    super(entity);
  }

  public override onEnter(): void {
    this.startFootsteps(FOOTSTEP_INTERVAL_MS);

    this.entity.animationController.playAnimation(AnimationClipNamesShared.RUN, { loop: true });
  }

  public override onExit(): void {
    if (this._footsteps) {
      this.entity.fmodSoundController.stopLoopedSound(this._footsteps);
      this._footsteps = null;
    }
  }

  public override onInput(_inputState: InputState): void {}

  public override onUpdate(_deltaTime: number): void {
    const controlsStates = this.entity.inputSource.getControls();
    const movementState = controlsStates.find((controlState) => 'direction' in controlState);

    if (!movementState) return;

    this._moveEntity(movementState.direction);
  }

  protected startFootsteps(intervalMs: number): void {
    this._footsteps = this.entity.fmodSoundController.playLoopedSound(
      FMOD_EVENTS.GENERIC_FOOTSTEP,
      { intervalMs }
    );
  }

  private _moveEntity(direction: THREE.Vector3): void {
    const moveVector = direction.clone();

    moveVector.normalize();

    // Apply only Y-axis rotation from camera using forward/right vectors
    const cameraForward = new THREE.Vector3();

    if (!this.entity.scene || !this.entity.scene.camera) {
      logger({
        message: 'KeyboardControls: No camera found in the scene.',
        type: 'error',
      });
      return;
    }

    this.entity.scene.camera.getWorldDirection(cameraForward);
    cameraForward.y = 0;
    cameraForward.normalize();

    const cameraRight = new THREE.Vector3().crossVectors(cameraForward, new THREE.Vector3(0, 1, 0));

    const rotatedMove = new THREE.Vector3();
    rotatedMove.addScaledVector(cameraRight, moveVector.x);
    rotatedMove.addScaledVector(cameraForward, -moveVector.z);

    this.entity.movementController.move(rotatedMove);
  }
}
