import { InputState } from '@tgdf';

import { State } from '.';
import { Entity } from '../gameObjects/Entity';
import { AnimationClipNamesShared } from '../../types';

export class SpawnState extends State {
  private _spawnAnimationEnded: boolean = false;

  constructor(
    public entity: Entity,
    public nextState: State
  ) {
    super(entity);
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

  public onInput(_inputState: InputState): State {
    return this;
  }

  public onUpdate(_deltaTime: number): State {
    if (this._spawnAnimationEnded) {
      return this.nextState;
    }

    return this;
  }
}
