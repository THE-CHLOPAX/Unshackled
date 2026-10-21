import * as THREE from 'three';
import { InputState } from '@tgdf';

import { State } from '3D/classes/states';
import { Entity } from '3D/classes/gameObjects/Entity/Entity';

export class DeadState extends State {
  constructor(
    public entity: Entity,
    private readonly _animationName: string
  ) {
    super(entity);
  }

  public onEnter(): void {
    this.entity.rigidBody.setSensor(true);
    this.entity.rigidBody.setGravityScale(0);
    this.entity.rigidBody.setLinearVelocity(new THREE.Vector3(0, 0, 0));

    this.entity.animationController.playAnimation(this._animationName, {
      loop: false,
      clampWhenFinished: true,
    });
  }

  public onExit(): void {
    this.entity.rigidBody.setSensor(false);
    this.entity.rigidBody.setGravityScale(1);
  }

  public onInput(_inputState: InputState): void {}

  public onUpdate(_deltaTime: number): void {}
}
