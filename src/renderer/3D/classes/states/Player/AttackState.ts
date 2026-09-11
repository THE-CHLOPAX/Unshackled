import { InputState, MAIN_SOUND_CHANNEL } from '@tgdf';

import { ActionWithSound } from '../../../types';
import { State, IdleState, RunningState } from '..';
import { Player } from '../../gameObjects/players/Player';
import { FMODAudio, FMODEventInstance } from '../../../../FMOD';
import { ControlsState, mapInputToControls } from '../../../utils/mapInputToControls';

export class AttackState extends State {
  private _attackInProgress = false;
  private _controlsStates: ControlsState[] = [];
  private _eventInstance: FMODEventInstance | null = null;

  constructor(
    public entity: Player,
    private _attackAction: ActionWithSound
  ) {
    super(entity);
  }

  public override onEnter(): void {
    this._eventInstance = FMODAudio.playEventInSoundChannel({
      eventPath: this._attackAction.soundPath,
      channelId: MAIN_SOUND_CHANNEL,
    });

    this._attackInProgress = true;

    this._attackAction.action(this.entity).then(() => {
      this._attackInProgress = false;
    });
  }

  public override onExit(): void {
    if (this._eventInstance === null) return;
    FMODAudio.stopEvent(this._eventInstance);
    this._eventInstance = null;
  }

  public override onInput(inputState: InputState): State {
    this._controlsStates = mapInputToControls(inputState);
    return this;
  }

  public override onUpdate(_deltaTime: number): State {
    if (this._attackInProgress) return this;

    if (this._controlsStates.some((controlState) => controlState.type === 'idle')) {
      return new IdleState(this.entity);
    }

    if (
      this._controlsStates.some(
        (controlState) => controlState.type === 'run' || controlState.type === 'sprint'
      )
    ) {
      return new RunningState(this.entity);
    }

    return this;
  }
}
