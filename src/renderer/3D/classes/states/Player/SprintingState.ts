import { InputState } from '@tgdf';

import { State, IdleState, RunningState } from '..';
import { AnimationClipNamesShared } from '../../../types';
import { Player } from '../../gameObjects/players/Player';
import { mapInputToControls } from '../../../utils/mapInputToControls';

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

  public override onInput(inputState: InputState): State {
    const controlsStates = mapInputToControls(inputState);

    for (const controlState of controlsStates) {
      const newState = this.entity.onAction(controlState.type);
      if (newState) return newState;
    }

    if (controlsStates.some((controlState) => controlState.type === 'idle')) {
      return new IdleState(this.entity);
    }

    if (controlsStates.some((controlState) => controlState.type === 'run')) {
      return new RunningState(this.entity);
    }

    return this;
  }
}
