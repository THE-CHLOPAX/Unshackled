import { InputState } from '@tgdf';

import { State } from '.';
import { Entity } from '../gameObjects/Entity';
import { AnimationClipNamesShared } from '../../types';

export class SpawnState extends State {
  private _spawnAnimationEnded: boolean = false;

  constructor(public entity: Entity) {
    super(entity);
  }

  public get hasFinished(): boolean {
    return this._spawnAnimationEnded;
  }

  public onEnter(): void {
    this.entity.animationController.playAnimation(AnimationClipNamesShared.SPAWN, {
      clampWhenFinished: true,
      onComplete: () => {
        this._spawnAnimationEnded = true;
      },
    });
  }

  public onExit(): void {}

  public onInput(_inputState: InputState): void {}

  public onUpdate(_deltaTime: number): void {}
}
