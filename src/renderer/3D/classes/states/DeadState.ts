import * as THREE from 'three';
import { InputState } from '@tgdf';

import { State } from '.';
import { Entity } from '../gameObjects/Entity';
import { FMODEventInstance } from '../../../FMOD';
import { AnimationClipNamesShared } from '../../types';

export class DeadState extends State {
  private _eventInstance: FMODEventInstance | null = null;

  constructor(public entity: Entity) {
    super(entity);
  }

  public onEnter(): void {
    this.entity.rigidBody.setSensor(true);
    this.entity.rigidBody.setLinearVelocity(new THREE.Vector3(0, 0, 0));

    this.entity.animationController.playAnimation(AnimationClipNamesShared.FALL, {
      loop: false,
      clampWhenFinished: true,
    });
  }

  public onExit(): void {
    if (this._eventInstance === null) return;
    this._eventInstance = null;
  }

  public onInput(_inputState: InputState): void {}

  public onUpdate(_deltaTime: number): void {}
}
