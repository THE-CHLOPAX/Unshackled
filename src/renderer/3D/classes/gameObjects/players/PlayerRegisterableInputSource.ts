import * as THREE from 'three';
import {
  Emitter,
  GAMEPAD_MAPPINGS,
  GamepadButton,
  InputNotifiable,
  InputState,
  KEYBOARD_MAPPINGS,
  RegisterableInputSource,
} from '@tgdf';

import { PlayerActionType } from '../../../types';

export type PlayerActionEvent =
  | {
      type: PlayerActionType.RUN | PlayerActionType.SPRINT;
      direction: THREE.Vector3;
    }
  | {
      type:
        | PlayerActionType.IDLE
        | PlayerActionType.ACTION_UP
        | PlayerActionType.ACTION_DOWN
        | PlayerActionType.ACTION_LEFT
        | PlayerActionType.ACTION_RIGHT
        | PlayerActionType.ACTION_FOCUS;
    };

export type PlayerInputEventMap = {
  'player-action': PlayerActionEvent;
};

const AXIS_DEADZONE = 0.15;

const ACTION_MAPPINGS = {
  [PlayerActionType.ACTION_UP]: [KEYBOARD_MAPPINGS.ArrowUp, GAMEPAD_MAPPINGS.Y],
  [PlayerActionType.ACTION_DOWN]: [KEYBOARD_MAPPINGS.ArrowDown, GAMEPAD_MAPPINGS.A],
  [PlayerActionType.ACTION_LEFT]: [KEYBOARD_MAPPINGS.ArrowLeft, GAMEPAD_MAPPINGS.X],
  [PlayerActionType.ACTION_RIGHT]: [KEYBOARD_MAPPINGS.ArrowRight, GAMEPAD_MAPPINGS.B],
  [PlayerActionType.ACTION_FOCUS]: [KEYBOARD_MAPPINGS.Space, GAMEPAD_MAPPINGS.RB],
} as const;

export class PlayerRegisterableInputSource implements RegisterableInputSource, InputNotifiable {
  private readonly _events = new Emitter<PlayerInputEventMap>();
  private _activeActions = new Map<PlayerActionType, PlayerActionEvent>();

  constructor(private readonly _source: RegisterableInputSource) {
    this._source.registerNotifiable(this);
  }

  public get events(): Emitter<PlayerInputEventMap> {
    return this._events;
  }

  public get source(): RegisterableInputSource {
    return this._source;
  }

  public getState(): InputState {
    return this._source.getState();
  }

  public getControls(): PlayerActionEvent[] {
    return this._mapInputToControls(this.getState());
  }

  public registerNotifiable(notifiable: InputNotifiable): void {
    this._source.registerNotifiable(notifiable);
  }

  public unregisterNotifiable(notifiable: InputNotifiable): void {
    this._source.unregisterNotifiable(notifiable);
  }

  public onInputNotify(inputState: InputState): void {
    const controls = this._mapInputToControls(inputState);
    const nextActiveActions = new Map(controls.map((control) => [control.type, control]));

    for (const control of controls) {
      if (this._hasChanged(control)) {
        this._events.trigger('player-action', control);
      }
    }

    this._activeActions = nextActiveActions;
  }

  public dispose(): void {
    this._source.unregisterNotifiable(this);
    this._activeActions.clear();
  }

  private _hasChanged(control: PlayerActionEvent): boolean {
    const previous = this._activeActions.get(control.type);
    if (!previous) return true;
    if (!('direction' in control) || !('direction' in previous)) return false;
    return !previous.direction.equals(control.direction);
  }

  private _mapInputToControls(inputState: InputState): PlayerActionEvent[] {
    const controls: PlayerActionEvent[] = [];

    for (const action of Object.keys(ACTION_MAPPINGS) as Array<keyof typeof ACTION_MAPPINGS>) {
      const isActionPressed = ACTION_MAPPINGS[action].some(
        (key) =>
          inputState.keyboard.isKeyPressed(key) ||
          inputState.gamepad.isButtonPressed(key as GamepadButton)
      );

      if (isActionPressed) {
        controls.push({ type: action });
      }
    }

    const direction = this._getMovementDirection(inputState);

    const isSprintPressed =
      inputState.keyboard.isKeyPressed(KEYBOARD_MAPPINGS.ShiftLeft) ||
      inputState.gamepad.isButtonPressed(GAMEPAD_MAPPINGS.RT);

    if (isSprintPressed) {
      controls.push({ type: PlayerActionType.SPRINT, direction });
    } else if (direction.length() > 0) {
      controls.push({ type: PlayerActionType.RUN, direction });
    }

    if (controls.length === 0) {
      controls.push({ type: PlayerActionType.IDLE });
    }

    return controls;
  }

  private _getMovementDirection(inputState: InputState): THREE.Vector3 {
    const direction = new THREE.Vector3();

    if (inputState.keyboard.isKeyPressed(KEYBOARD_MAPPINGS.KeyW)) direction.z -= 1;
    if (inputState.keyboard.isKeyPressed(KEYBOARD_MAPPINGS.KeyS)) direction.z += 1;
    if (inputState.keyboard.isKeyPressed(KEYBOARD_MAPPINGS.KeyA)) direction.x -= 1;
    if (inputState.keyboard.isKeyPressed(KEYBOARD_MAPPINGS.KeyD)) direction.x += 1;

    const leftStickX = inputState.gamepad.getAxisValue(GAMEPAD_MAPPINGS.LEFT_STICK_X);
    const leftStickY = inputState.gamepad.getAxisValue(GAMEPAD_MAPPINGS.LEFT_STICK_Y);

    if (Math.abs(leftStickY) > AXIS_DEADZONE) {
      direction.z += leftStickY;
    }
    if (Math.abs(leftStickX) > AXIS_DEADZONE) {
      direction.x += leftStickX;
    }

    return direction;
  }
}
