import { Input } from '@tgdf';
import * as THREE from 'three';

import { mapInputToControls } from '3D/utils/mapInputToControls';

import { Player } from '../gameObjects/players/Player';
import { State, IdleState, RunningState, SprintingState } from '.';

export type DashOptions = {
  speed: number;
  durationMs: number;
};

export class DashState extends State {
  private _durationTimeout: NodeJS.Timeout | null = null;
  private _dashComplete = false;
  private _direction = new THREE.Vector3();

  constructor(
    public entity: Player,
    public options: DashOptions
  ) {
    super(entity);
  }

  public onEnter(): void {
    this.entity.rigidBody.setSensor(true);
    // Freeze the dash heading on entry - direction is locked for the whole dash.
    this.entity.getWorldDirection(this._direction);

    this._durationTimeout = setTimeout(() => {
      this._dashComplete = true;
    }, this.options.durationMs);
  }

  public onExit(): void {
    if (!this._durationTimeout) return;
    this.entity.rigidBody.setSensor(false);
    clearTimeout(this._durationTimeout);
    this._durationTimeout = null;
  }

  public onInput(): State {
    return this;
  }

  public onUpdate(): State {
    if (this._dashComplete) {
      return this._resolveNextState();
    }

    // Re-applying velocity every frame (rather than a one-off impulse) makes
    // dash distance a function of speed * durationMs, independent of the
    // rigidbody's mass/damping/friction.
    this.entity.movementController.move(this._direction, this.options.speed);

    return this;
  }

  /**
   * Mirrors RunningState/IdleState's own input polling so movement continues
   * uninterrupted in whichever direction is currently held, instead of
   * requiring a fresh keypress to resume moving.
   */
  private _resolveNextState(): State {
    const controlsStates = mapInputToControls(Input.getState());

    if (controlsStates.some((controlState) => controlState.type === 'sprint')) {
      return new SprintingState(this.entity);
    }

    if (controlsStates.some((controlState) => controlState.type === 'run')) {
      return new RunningState(this.entity);
    }

    return new IdleState(this.entity);
  }
}
