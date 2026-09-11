import { Input, InputState } from '@tgdf';

import { PlayerActionType, FocusOptions } from '3D/types';
import { mapInputToControls } from '3D/utils/mapInputToControls';

import { IdleState, State } from '../';
import { Player } from '../../gameObjects/players/Player';
import { handleSequenceInput } from './utils/handleSequenceInput';

export class FocusState extends State {
  private _focusInProgress: boolean = false;
  private _exitingFocus: boolean = false;
  private _exitFocusAnimationEnded: boolean = false;

  constructor(
    public entity: Player,
    public options: FocusOptions
  ) {
    super(entity);
  }

  public override onEnter(): void {
    // Discard sequence inputs buffered before entering focus
    this.entity.sequenceTracker.reset();

    this.entity.animationController.playAnimation(this.options.clips.enter, {
      clampWhenFinished: true,
      onComplete: () => {
        this._focusInProgress = true;

        const progressClip = this.options.clips.progress;
        if (progressClip) {
          // If no progress clip is provided, the enter animation stays clamped on its last frame.
          this.entity.animationController.playAnimation(progressClip, { loop: true });
        }
      },
    });
  }

  public override onUpdate(_deltaTime: number): State {
    if (this._exitingFocus) {
      return this._exitFocusAnimationEnded ? new IdleState(this.entity) : this;
    }

    const controlsStates = mapInputToControls(Input.getState());

    const isFocusActionPressed = controlsStates.some(
      (controlState) => controlState.type === PlayerActionType.ACTION_FOCUS
    );

    if (!isFocusActionPressed) {
      if (this._focusInProgress) {
        this._focusInProgress = false;

        const exitClip = this.options.clips.exit;
        if (exitClip) {
          this._exitingFocus = true;
          this.entity.animationController.playAnimation(exitClip, {
            clampWhenFinished: true,
            onComplete: () => {
              this._exitFocusAnimationEnded = true;
            },
          });
        } else {
          return new IdleState(this.entity);
        }
      } else {
        return new IdleState(this.entity);
      }
    }

    return this;
  }

  public override onInput(inputState: InputState): State {
    if (!this._focusInProgress) return this;

    return handleSequenceInput(this, this.entity, inputState) ?? this;
  }

  public override onExit(): void {}
}
