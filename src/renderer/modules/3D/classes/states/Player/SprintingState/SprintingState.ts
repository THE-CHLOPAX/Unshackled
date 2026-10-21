import { RunningState } from '3D/classes/states';
import { ANIMATION_CLIP_NAMES } from '3D/constants';
import { Player } from '3D/classes/gameObjects/Player/Player';

const FOOTSTEP_INTERVAL_MS = 300;
const STAMINA_DRAIN_RATE_PER_S = 7;

export class SprintingState extends RunningState {
  constructor(public entity: Player) {
    super(entity);
  }

  public override onEnter(): void {
    this.startFootsteps(FOOTSTEP_INTERVAL_MS);
    this.entity.animationController.playAnimation(ANIMATION_CLIP_NAMES.PLAYER.SPRINT, {
      loop: true,
    });
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
