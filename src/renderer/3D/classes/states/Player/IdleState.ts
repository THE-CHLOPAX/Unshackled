import { InputState } from '@tgdf';

import { State } from '..';
import { Player } from '../../gameObjects/players/Player';
import { AnimationClipNamesShared } from '../../../types';

export class IdleState extends State {
  constructor(public entity: Player) {
    super(entity);
  }

  public override onEnter(): void {
    this.entity.animationController.playAnimation(AnimationClipNamesShared.IDLE, { loop: true });
  }

  public override onExit(): void {}

  public override onInput(_inputState: InputState): void {}

  public override onUpdate(_deltaTime: number): void {}
}
