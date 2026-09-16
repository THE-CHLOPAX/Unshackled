import * as THREE from 'three';
import { InputState, MAIN_SOUND_CHANNEL } from '@tgdf';

import { State } from '.';
import { Entity } from '../gameObjects/Entity';
import { AnimationClipNamesShared } from '../../types';
import { FMODAudio, FMODEventInstance, FMOD_EVENTS } from '../../../FMOD';

export class DeadState extends State {
  private _eventInstance: FMODEventInstance | null = null;

  constructor(public entity: Entity) {
    super(entity);
  }

  public onEnter(): void {
    this.entity.rigidBody.setSensor(true);
    this.entity.rigidBody.setLinearVelocity(new THREE.Vector3(0, 0, 0));
    this._eventInstance = FMODAudio.playEventInSoundChannel({
      eventPath: FMOD_EVENTS.HURT,
      channelId: MAIN_SOUND_CHANNEL,
    });
    this.entity.animationController.playAnimation(AnimationClipNamesShared.FALL, {
      loop: false,
      clampWhenFinished: true,
    });
  }

  public onExit(): void {
    if (this._eventInstance === null) return;
    FMODAudio.stopEvent(this._eventInstance);
    this._eventInstance = null;
  }

  public onInput(_inputState: InputState): void {}

  public onUpdate(_deltaTime: number): void {}
}
