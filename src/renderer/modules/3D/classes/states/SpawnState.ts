import { InputState } from '@tgdf';

import { State } from '3D/classes/states';
import { Entity } from '3D/classes/gameObjects/Entity';

export class SpawnState extends State {
  private _spawnAnimationEnded: boolean = false;

  constructor(
    public entity: Entity,
    private readonly _animationName: string
  ) {
    super(entity);
  }

  public get hasFinished(): boolean {
    return this._spawnAnimationEnded;
  }

  public onEnter(): void {
    this.entity.animationController.playAnimation(this._animationName, {
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
