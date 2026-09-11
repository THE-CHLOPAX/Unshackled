import { InputState } from '@tgdf';

import { State } from '..';
import { Player } from '../../gameObjects/players/Player';
import { AnimationClipNamesShared } from '../../../types';
import { handleSequenceInput } from './utils/handleSequenceInput';
import { mapInputToControls } from '../../../utils/mapInputToControls';

export class IdleState extends State {
  constructor(public entity: Player) {
    super(entity);
  }

  public override onEnter(): void {
    this.entity.animationController.playAnimation(AnimationClipNamesShared.IDLE, { loop: true });
  }

  public override onExit(): void {}

  public override onInput(inputState: InputState): State {
    const sequenceState = handleSequenceInput(this, this.entity, inputState);
    if (sequenceState) return sequenceState;

    const controlsStates = mapInputToControls(inputState);

    for (const controlState of controlsStates) {
      const newState = this.entity.onAction(controlState.type);

      if (newState) return newState;
    }

    return this;
  }

  public override onUpdate(_deltaTime: number): State {
    return this;
  }
}
