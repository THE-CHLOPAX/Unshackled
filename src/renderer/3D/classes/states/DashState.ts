import * as THREE from 'three';
import { MAIN_SOUND_CHANNEL } from '@tgdf';

import { FMOD_EVENTS, FMODAudio } from 'renderer/FMOD';

import { State } from '.';
import { Player } from '../gameObjects/players/Player';

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

  public get isComplete(): boolean {
    return this._dashComplete;
  }

  public onEnter(): void {
    this.entity.rigidBody.setSensor(true);
    // Freeze the dash heading on entry - direction is locked for the whole dash.
    this.entity.getWorldDirection(this._direction);

    FMODAudio.playEventInSoundChannel({
      eventPath: FMOD_EVENTS.GENERIC_DASH,
      channelId: MAIN_SOUND_CHANNEL,
    });

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

  public onInput(): void {}

  public onUpdate(): void {
    if (this._dashComplete) return;

    // Re-applying velocity every frame (rather than a one-off impulse) makes
    // dash distance a function of speed * durationMs, independent of the
    // rigidbody's mass/damping/friction.
    this.entity.movementController.move(this._direction, this.options.speed);
  }
}
