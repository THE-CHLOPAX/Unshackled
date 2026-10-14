import { RunningState } from '..';
import { AnimationClipNamesShared } from '../../../types';
import { Player } from '../../gameObjects/players/Player';

const FOOTSTEP_INTERVAL_MS = 300;
const STAMINA_DRAIN_RATE_PER_S = 7;

export class SprintingState extends RunningState {
  constructor(public entity: Player) {
    super(entity);
  }

  public override onEnter(): void {
    this.startFootsteps(FOOTSTEP_INTERVAL_MS);
    this.entity.animationController.playAnimation(AnimationClipNamesShared.SPRINT, { loop: true });
    this.entity.movementController.toggleSprint(true);
  }

  public override onExit(): void {
    super.onExit();
    this.entity.movementController.toggleSprint(false);
  }

  public override onUpdate(deltaTime: number): void {
    super.onUpdate(deltaTime);

    this.entity.staminaPointsController.drainShortTermStamina(STAMINA_DRAIN_RATE_PER_S * deltaTime);
  }
}
