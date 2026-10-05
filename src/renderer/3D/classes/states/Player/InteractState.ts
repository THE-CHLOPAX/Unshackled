import { gsap } from 'gsap';
import { InputState } from '@tgdf';

import { State } from '..';
import { Player } from '../../gameObjects/players/Player';
import { AnimationClipNamesShared, Interactable } from '../../../types';

export type InteractStateOptions = {
  animationName?: string;
  playbackRate?: number;
  triggerDelayS?: number;
};

export class InteractState extends State {
  private _isComplete = false;
  private _hasTriggered = false;
  private _triggerTimer: gsap.core.Tween | null = null;

  constructor(
    public entity: Player,
    private readonly _target: Interactable,
    private readonly _options: InteractStateOptions = {}
  ) {
    super(entity);
  }

  public get isComplete(): boolean {
    return this._isComplete;
  }

  public override onEnter(): void {
    const {
      animationName = AnimationClipNamesShared.INTERACT,
      playbackRate,
      triggerDelayS,
    } = this._options;

    if (triggerDelayS !== undefined) {
      this._triggerTimer = gsap.delayedCall(triggerDelayS, () => this._trigger());
    }

    this.entity.animationController.playAnimation(animationName, {
      clampWhenFinished: true,
      playbackRate,
      onComplete: () => {
        this._trigger();
        this._isComplete = true;
      },
    });
  }

  public override onExit(): void {
    this._triggerTimer?.kill();
    this._triggerTimer = null;
  }

  public override onInput(_inputState: InputState): void {}

  public override onUpdate(_deltaTime: number): void {}

  private _trigger(): void {
    if (this._hasTriggered) return;
    this._hasTriggered = true;
    this._target.interact(this.entity);
  }
}
