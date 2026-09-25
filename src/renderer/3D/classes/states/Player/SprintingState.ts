import { RunningState } from '..';
import { AnimationClipNamesShared } from '../../../types';
import { Player } from '../../gameObjects/players/Player';

const FOOTSTEP_INTERVAL_MS = 300;
export class SprintingState extends RunningState {
  constructor(public entity: Player) {
    super(entity);
  }

  public override onEnter(): void {
    this.entity.fmodSoundController.playFootstep();
    this.footstepSoundEventInterval = setInterval(() => {
      this.entity.fmodSoundController.playFootstep();
    }, FOOTSTEP_INTERVAL_MS);
    this.entity.animationController.playAnimation(AnimationClipNamesShared.SPRINT, { loop: true });
    this.entity.movementController.toggleSprint(true);
  }

  public override onExit(): void {
    super.onExit();
    this.entity.movementController.toggleSprint(false);
  }
}
