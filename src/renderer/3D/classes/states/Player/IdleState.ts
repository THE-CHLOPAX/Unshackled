import { InputState } from '@tgdf';

import { ANIMATION_CLIP_NAMES } from '3D/constants';

import { State } from '..';
import { Player } from '../../gameObjects/players/Player';

export class IdleState extends State {
  constructor(public entity: Player) {
    super(entity);
  }

  public override onEnter(): void {
    this.entity.animationController.playAnimation(ANIMATION_CLIP_NAMES.PLAYER.IDLE, { loop: true });
  }

  public override onExit(): void {}

  public override onInput(_inputState: InputState): void {}

  public override onUpdate(_deltaTime: number): void {}
}
