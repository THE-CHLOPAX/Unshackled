import { randFromRange } from '@tgdf';

import { EntityAI } from '3D/classes/gameObjects/EntityAI';
import { AIIdleState } from '3D/classes/states/AI/AIIdleState';
import { AIRoamingOptions } from '3D/classes/states/AI/AIRoamingState';

export class AIIdleStateRoaming extends AIIdleState {
  private _startRoamingTimeout: NodeJS.Timeout | null = null;
  private _shouldTransitionToRoaming: boolean = false;

  constructor(
    entity: EntityAI,
    animationName: string,
    private _roamingOptions: AIRoamingOptions
  ) {
    super(entity, animationName);
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
