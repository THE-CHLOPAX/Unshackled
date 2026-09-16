import { RunningState } from '..';
import { AnimationClipNamesShared } from '../../../types';
import { Player } from '../../gameObjects/players/Player';

export class SprintingState extends RunningState {
  constructor(public entity: Player) {
    super(entity);
  }

  public override onEnter(): void {
    this.entity.animationController.playAnimation(AnimationClipNamesShared.SPRINT, { loop: true });
    this.entity.movementController.toggleSprint(true);
  }

  public override onExit(): void {
    this.entity.movementController.toggleSprint(false);
  }
}
