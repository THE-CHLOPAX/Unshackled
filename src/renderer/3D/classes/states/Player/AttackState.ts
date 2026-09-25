import { gsap } from 'gsap';
import { InputState } from '@tgdf';

import { State } from '..';
import { ChainedAction } from '../../../types';
import { FMODEventInstance } from '../../../../FMOD';
import { Player } from '../../gameObjects/players/Player';

export class AttackState extends State {
  private _attackInProgress = false;
  private _eventInstance: FMODEventInstance | null = null;

  private _awaitingChainInput = false;
  private _chainWindowOpen = false;
  private _chainOpenTimer: gsap.core.Tween | null = null;
  private _chainCloseTimer: gsap.core.Tween | null = null;
  private _freezeTimer: gsap.core.Tween | null = null;

  constructor(
    public entity: Player,
    private _attackAction: ChainedAction
  ) {
    super(entity);
  }

  public get isBusy(): boolean {
    return this._attackInProgress || this._awaitingChainInput;
  }

  public get isChainWindowOpen(): boolean {
    return this._chainWindowOpen;
  }

  public get chain(): ChainedAction['chain'] {
    return this._attackAction.chain;
  }

  public override onEnter(): void {
    if (this._attackAction.soundPath !== undefined) {
      this._eventInstance = this.entity.fmodSoundController.playSound(this._attackAction.soundPath);
    }

    this._attackInProgress = true;

    this._attackAction.action(this.entity).then(() => {
      const freezeDurationMs = this._attackAction.freezeDurationMs ?? 0;

      this._freezeTimer = gsap.delayedCall(freezeDurationMs / 1000, () => {
        this._attackInProgress = false;
        this._startChainWindow();
      });
    });
  }

  public override onExit(): void {
    if (this._eventInstance !== null) {
      this.entity.fmodSoundController.stopSound(this._eventInstance);
      this._eventInstance = null;
    }

    this._freezeTimer?.kill();
    this._chainOpenTimer?.kill();
    this._chainCloseTimer?.kill();
    this.entity.damageHitboxController.clearHitboxEvents();
  }

  public override onInput(_inputState: InputState): void {}

  public override onUpdate(_deltaTime: number): void {
    const controlsStates = this.entity.inputSource.getControls();
    const movementState = controlsStates.find((controlState) => 'direction' in controlState);

    if (!movementState) return;

    const targetPosition = this.entity.position.clone().add(movementState.direction);

    this.entity.movementController.rotateTowardsPosition(targetPosition);
  }

  private _startChainWindow(): void {
    const chain = this._attackAction.chain;
    if (!chain) return;

    this._awaitingChainInput = true;

    this._chainOpenTimer = gsap.delayedCall(chain.windowDelayMs / 1000, () => {
      this._chainWindowOpen = true;

      this._chainCloseTimer = gsap.delayedCall(chain.windowDurationMs / 1000, () => {
        this._chainWindowOpen = false;
        this._awaitingChainInput = false;
      });
    });
  }
}
