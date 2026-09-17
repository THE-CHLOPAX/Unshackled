import { randFromRange } from '@tgdf';

import { AIIdleState } from './AIIdleState';
import { AIRoamingOptions } from '../../../types';
import { EntityAI } from '../../gameObjects/EntityAI';

export class AIIdleStateRoaming extends AIIdleState {
  private _startRoamingTimeout: NodeJS.Timeout | null = null;
  private _shouldTransitionToRoaming: boolean = false;

  constructor(
    entity: EntityAI,
    private _roamingOptions: AIRoamingOptions
  ) {
    super(entity);
  }

  public get shouldTransitionToRoaming(): boolean {
    return this._shouldTransitionToRoaming;
  }

  public override onEnter(): void {
    super.onEnter();

    const interval = this._roamingOptions.interval;
    this._startRoamingTimeout = setTimeout(
      () => {
        this._shouldTransitionToRoaming = true;
      },
      randFromRange(interval.min, interval.max)
    );
  }

  public override onExit(): void {
    super.onExit();

    if (this._startRoamingTimeout) {
      clearTimeout(this._startRoamingTimeout);
      this._startRoamingTimeout = null;
    }
  }
}
